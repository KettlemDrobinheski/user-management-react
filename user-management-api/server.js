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