const pool = require('./db')

async function testarConexao() {
  try {
    const resultado = await pool.query('SELECT NOW()')

    console.log('Banco conectado com sucesso! 🐘')
    console.log(resultado.rows)
  } catch (erro) {
    console.error('Erro ao conectar com o banco:')
    console.error(erro.message)
  } finally {
    await pool.end()
  }
}

testarConexao()