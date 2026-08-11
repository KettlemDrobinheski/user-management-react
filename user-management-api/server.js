const express = require('express')
const pool = require('./db')

const app = express()

app.use(express.json())

const PORT = 3000

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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
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