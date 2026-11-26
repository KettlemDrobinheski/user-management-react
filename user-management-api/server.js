const express = require('express')
const { validateUser } = require('./validateUser')

const allowedOrigins = [
  'http://localhost:5173',
  'https://kettlemdrobinheski.github.io'
]

function validId(id) {
  return /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0
}

async function saveUser(pool, body, id = null) {
  const { nome, cpf, email, idade, cep, rua, numero, bairro, cidade, estado } = body
  const fields = [nome, cpf, email, idade, cep, rua, numero, bairro, cidade, estado]
  const client = await pool.connect()
  let connectionError

  try {
    await client.query('BEGIN')
    // Serializa gravações enquanto a verificação de duplicidade é executada.
    await client.query('LOCK TABLE usuarios IN SHARE ROW EXCLUSIVE MODE')

    if (id !== null) {
      const existing = await client.query('SELECT id FROM usuarios WHERE id = $1', [id])
      if (existing.rowCount === 0) {
        await client.query('COMMIT')
        return { status: 404, body: { erro: 'Usuário não encontrado' } }
      }
    }

    const { rows: [duplicates] } = await client.query(
      `SELECT
         COALESCE(bool_or(regexp_replace(cpf, '[^0-9]', '', 'g') = $1), false) AS cpf,
         COALESCE(bool_or(lower(trim(email)) = lower($2)), false) AS email
       FROM usuarios
       WHERE (id <> $3 OR $3 IS NULL)`,
      [cpf.replace(/\D/g, ''), email, id]
    )
    if (duplicates.cpf || duplicates.email) {
      await client.query('COMMIT')
      return { status: 409, body: { erro: duplicates.cpf ? 'Esse CPF já está cadastrado' : 'Esse email já está cadastrado' } }
    }

    const result = id === null
      ? await client.query(
        `INSERT INTO usuarios (nome, cpf, email, idade, cep, rua, numero, bairro, cidade, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`, fields
      )
      : await client.query(
        `UPDATE usuarios
         SET nome = $1, cpf = $2, email = $3, idade = $4, cep = $5,
             rua = $6, numero = $7, bairro = $8, cidade = $9, estado = $10
         WHERE id = $11
         RETURNING *`, [...fields, id]
      )

    await client.query('COMMIT')
    return { status: id === null ? 201 : 200, body: result.rows[0] }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      connectionError = rollbackError
    }
    throw error
  } finally {
    client.release(connectionError)
  }
}

function sendDatabaseError(res, error, message) {
  if (error.code === '23505') return res.status(409).json({ erro: 'Já existe um registro com esses dados.' })
  if (error.code === '22003') return res.status(400).json({ erro: 'Valor numérico fora do intervalo permitido.' })
  return res.status(500).json({ erro: message })
}

function createApp(pool) {
  const app = express()

  app.use((req, res, next) => {
    const origin = req.headers.origin
    if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
  })
  app.use(express.json())

  app.get('/', (req, res) => {
    res.send('API funcionando!')
  })

  app.get('/usuarios', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM usuarios')
      res.json(result.rows)
    } catch (error) {
      sendDatabaseError(res, error, 'Erro ao buscar usuários')
    }
  })

  app.post('/usuarios', async (req, res) => {
    const error = validateUser(req.body)
    if (error) return res.status(400).json({ erro: error })

    try {
      const result = await saveUser(pool, req.body)
      res.status(result.status).json(result.body)
    } catch (error) {
      sendDatabaseError(res, error, 'Erro ao cadastrar usuário')
    }
  })

  app.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params
    if (!validId(id)) return res.status(400).json({ erro: 'ID de usuário inválido.' })
    const error = validateUser(req.body)
    if (error) return res.status(400).json({ erro: error })

    try {
      const result = await saveUser(pool, req.body, id)
      res.status(result.status).json(result.body)
    } catch (error) {
      sendDatabaseError(res, error, 'Erro ao atualizar usuário')
    }
  })

  app.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params
    if (!validId(id)) return res.status(400).json({ erro: 'ID de usuário inválido.' })

    try {
      const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id])
      if (result.rowCount === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado' })
      }

      res.json({
        mensagem: 'Usuário excluído com sucesso',
        usuario: result.rows[0]
      })
    } catch (error) {
      sendDatabaseError(res, error, 'Erro ao excluir usuário')
    }
  })

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)
    if (error.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' })
    if (error.status === 400) return res.status(400).json({ erro: 'Requisição inválida.' })
    if (error.status === 413) return res.status(413).json({ erro: 'Corpo da requisição muito grande.' })
    if (error.status === 415) return res.status(415).json({ erro: 'Codificação da requisição não suportada.' })
    res.status(500).json({ erro: 'Erro interno do servidor.' })
  })

  return app
}

if (require.main === module) {
  const pool = require('./db')
  const port = process.env.PORT || 3000
  createApp(pool).listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`)
  })
}

module.exports = { createApp }
