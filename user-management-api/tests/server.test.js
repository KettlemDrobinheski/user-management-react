const assert = require('node:assert/strict')
const { once } = require('node:events')
const { randomUUID } = require('node:crypto')
const { test } = require('node:test')
const { Pool } = require('pg')
const { createApp } = require('../server')

const sample = {
  nome: 'Pessoa Exemplo',
  cpf: '529.982.247-25',
  email: 'pessoa@example.com',
  idade: '28',
  cep: '01001-000',
  rua: 'Rua Fictícia',
  numero: '10',
  bairro: 'Bairro Fictício',
  cidade: 'Cidade Exemplo',
  estado: 'SP'
}

const second = { ...sample, nome: 'Outro Exemplo', cpf: '111.444.777-35', email: 'outro@example.com' }
const testPort = process.env.USER_MANAGEMENT_TEST_PG_PORT

async function startApi(t, pool) {
  const server = createApp(pool).listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  }))
  return 'http://127.0.0.1:' + server.address().port
}

function send(base, method, path = '/usuarios', body) {
  return fetch(base + path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
}

async function errorResponse(response, status, message) {
  assert.equal(response.status, status)
  const body = await response.json()
  assert.deepEqual(Object.keys(body), ['erro'])
  assert.match(body.erro, message)
}

test('POST e PUT rejeitam campos inválidos ou ausentes antes de consultar o banco', async (t) => {
  const unexpected = () => assert.fail('Dados inválidos chegaram ao banco')
  const base = await startApi(t, { connect: unexpected, query: unexpected })
  const cases = [
    ['nome', '  ', /nome/i],
    ['cpf', '11111111111', /CPF/],
    ['email', 'email-invalido', /e-mail/],
    ['idade', 17, /idade/],
    ['idade', '18.5', /idade/],
    ['idade', true, /idade/],
    ['cep', '11111-111', /CEP/],
    ['cep', '01001', /CEP/],
    ['rua', undefined, /rua/],
    ['numero', {}, /número/],
    ['bairro', ' ', /bairro/],
    ['cidade', undefined, /cidade/],
    ['estado', 'SP1', /UF/]
  ]
  for (const [field, value, message] of cases) {
    const data = { ...sample, [field]: value }
    await errorResponse(await send(base, 'POST', '/usuarios', data), 400, message)
    await errorResponse(await send(base, 'PUT', '/usuarios/1', data), 400, message)
  }
  await errorResponse(await send(base, 'POST'), 400, /dados do usuário/)
  await errorResponse(await send(base, 'POST', '/usuarios', []), 400, /dados do usuário/)
})

test('JSON malformado e IDs inválidos são erros HTTP 400 em JSON', async (t) => {
  const unexpected = () => assert.fail('Requisição inválida chegou ao banco')
  const base = await startApi(t, { connect: unexpected, query: unexpected })
  const malformed = await fetch(base + '/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: '{'
  })
  assert.equal(malformed.headers.get('access-control-allow-origin'), 'http://localhost:5173')
  await errorResponse(malformed, 400, /JSON inválido/)
  const unsupported = await fetch(base + '/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=iso-8859-1' },
    body: '{}'
  })
  await errorResponse(unsupported, 415, /não suportada/)
  for (const id of ['abc', '0', '-1', '9007199254740992']) {
    await errorResponse(await send(base, 'PUT', '/usuarios/' + id, sample), 400, /ID/)
    await errorResponse(await send(base, 'DELETE', '/usuarios/' + id), 400, /ID/)
  }
})

test('falhas do servidor retornam HTTP 500 sem detalhes internos', async (t) => {
  const fail = async () => { throw new Error('detalhe interno fictício') }
  const base = await startApi(t, { query: fail, connect: fail })
  await errorResponse(await send(base, 'GET'), 500, /^Erro ao buscar usuários$/)
  await errorResponse(await send(base, 'POST', '/usuarios', sample), 500, /^Erro ao cadastrar usuário$/)
  await errorResponse(await send(base, 'PUT', '/usuarios/1', sample), 500, /^Erro ao atualizar usuário$/)
  await errorResponse(await send(base, 'DELETE', '/usuarios/1'), 500, /^Erro ao excluir usuário$/)
})

test('CRUD no PostgreSQL descartável, duplicidades e compatibilidade com React', {
  skip: !testPort && 'Defina USER_MANAGEMENT_TEST_PG_PORT para um PostgreSQL descartável.'
}, async (t) => {
  assert.match(testPort, /^\d+$/)
  assert.ok(Number(testPort) > 0 && Number(testPort) <= 65535 && Number(testPort) !== 5432)
  const config = {
    host: '127.0.0.1',
    port: Number(testPort),
    user: 'user_management_test',
    database: 'user_management_test',
    password: '',
    connectionTimeoutMillis: 3000
  }
  const admin = new Pool(config)
  t.after(() => admin.end())
  const { rows: [identity] } = await admin.query('SELECT current_user AS role, current_database() AS database')
  assert.deepEqual(identity, { role: config.user, database: config.database })

  const schema = 'users_test_' + randomUUID().replaceAll('-', '')
  await admin.query('CREATE SCHEMA ' + schema)
  const pool = new Pool({ ...config, options: '-c search_path=' + schema })
  t.after(async () => {
    await pool.end()
    const cleanup = new Pool(config)
    try {
      await cleanup.query('DROP SCHEMA ' + schema + ' CASCADE')
    } finally {
      await cleanup.end()
    }
  })
  await pool.query(`CREATE TABLE usuarios (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome text, cpf text, email text, idade integer, cep text, rua text,
    numero text, bairro text, cidade text, estado text
  )`)
  const base = await startApi(t, pool)

  const response = await send(base, 'POST', '/usuarios', sample)
  assert.equal(response.status, 201)
  const created = await response.json()
  assert.deepEqual(created, { ...sample, id: created.id, idade: 28 })
  assert.ok(Number.isInteger(created.id))
  const path = '/usuarios/' + created.id
  await errorResponse(await send(base, 'POST', '/usuarios', { ...second, cpf: '52998224725' }), 409, /CPF/)
  await errorResponse(await send(base, 'POST', '/usuarios', { ...second, email: 'PESSOA@example.com' }), 409, /email/)

  const concurrent = await Promise.all([
    send(base, 'POST', '/usuarios', second),
    send(base, 'POST', '/usuarios', second)
  ])
  assert.deepEqual(concurrent.map((result) => result.status).sort(), [201, 409])
  await Promise.all(concurrent.map((result) => result.json()))
  await errorResponse(await send(base, 'PUT', path, { ...sample, email: second.email }), 409, /email/)
  await errorResponse(await send(base, 'PUT', path, { ...sample, cpf: second.cpf }), 409, /CPF/)
  await errorResponse(await send(base, 'PUT', '/usuarios/9999', sample), 404, /encontrado/)
  await errorResponse(await send(base, 'PUT', path, { ...sample, rua: '' }), 400, /rua/)
  assert.equal((await send(base, 'GET').then((result) => result.json())).find(({ id }) => id === created.id).rua, sample.rua)

  const updated = await send(base, 'PUT', path, { ...sample, cep: '01001000', numero: '20' })
  assert.equal(updated.status, 200)
  assert.deepEqual(await updated.json(), { ...created, cep: '01001000', numero: '20' })
  const removed = await send(base, 'DELETE', path)
  assert.equal(removed.status, 200)
  assert.deepEqual(await removed.json(), {
    mensagem: 'Usuário excluído com sucesso',
    usuario: { ...created, cep: '01001000', numero: '20' }
  })
  await errorResponse(await send(base, 'DELETE', path), 404, /encontrado/)

  const reactApi = await import('../../cadastro-usuario/src/data/usersApi.js')
  const originalFetch = globalThis.fetch
  t.mock.method(globalThis, 'fetch', (url, init) => {
    assert.match(url, /^http:\/\/localhost:3000\/usuarios(?:\/\d+)?$/)
    return originalFetch(url.replace('http://localhost:3000', base), init)
  })
  const { nome, idade, ...addressAndContact } = sample
  const data = { ...addressAndContact, name: nome, age: idade }
  const card = await reactApi.createUser(data)
  assert.deepEqual(card, { ...data, id: card.id, age: 28 })
  await assert.rejects(reactApi.createUser(data), /CPF/)
  const edited = await reactApi.updateUser(card.id, { ...data, name: 'Pessoa Editada' })
  assert.deepEqual(edited, { ...card, name: 'Pessoa Editada' })
  assert.deepEqual((await reactApi.listUsers()).find(({ id }) => id === card.id), edited)
  await reactApi.removeUser(card.id)
  await assert.rejects(reactApi.removeUser(card.id), /encontrado/)
})
