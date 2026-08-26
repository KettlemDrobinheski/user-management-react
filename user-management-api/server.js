const express = require('express')
const pool = require('./db')

const app = express()

app.use(express.json())

const allowedOrigins = [
  'http://localhost:5173',
  'https://kettlemdrobinheski.github.io'
]

app.use((req, res, next) => {
  const origin = req.headers.origin

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('API funcionando!')
})

app.get('/usuarios', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM usuarios')

    res.json(resultado.rows)
  } catch (erro) {
    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao buscar usuários'
    })
  }
})

app.post('/usuarios', async (req, res) => {
  try {
    const {
      nome,
      cpf,
      email,
      idade,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado
    } = req.body

    const resultado = await pool.query(
      `INSERT INTO usuarios
      (nome, cpf, email, idade, cep, rua, numero, bairro, cidade, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [nome, cpf, email, idade, cep, rua, numero, bairro, cidade, estado]
    )

    res.status(201).json(resultado.rows[0])

  } catch (erro) {
    console.error(erro)

    res.status(500).json({
      erro: 'Erro ao cadastrar usuário'
    })
  }
})

app.put('/usuarios/:id', async (req, res) => {
  try {
  const { id } = req.params

  const {
  nome,
  cpf,
  email,
  idade,
  cep,
  rua,
  numero,
  bairro,
  cidade,
  estado
} = req.body

const resultado = await pool.query(
  `UPDATE usuarios
  SET
    nome = $1,
    cpf = $2,
    email = $3,
    idade = $4,
    cep = $5,
    rua = $6,
    numero = $7,
    bairro = $8,
    cidade = $9,
    estado = $10
  WHERE id = $11
  RETURNING *`,
[
  nome,
  cpf,
  email,
  idade,
  cep,
  rua,
  numero,
  bairro,
  cidade,
  estado,
  id
]
)
res.json(resultado.rows[0])

} catch (erro) {
  console.error(erro)

  res.status(500).json({
    erro: 'Erro ao atualizar usuário'
  })
}
})

app.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params

    const resultado = await pool.query(
      `DELETE FROM usuarios
       WHERE id = $1
       RETURNING *`,
      [id]
    )

    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' })
    }

    res.json({
      mensagem: 'Usuário excluído com sucesso',
      usuario: resultado.rows[0]
    })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao excluir usuário' })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})