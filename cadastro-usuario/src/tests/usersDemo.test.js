import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { demoUsers } from '../data/demoUsers'
import { createUser, listUsers, removeUser, resetUsers, updateUser } from '../data/usersDemo'
import { validateCPF } from '../utils/validateCPF'

const storageKey = 'user-management:demo:v1'
const { id: exampleId, ...exampleFields } = demoUsers[0]
const newUser = {
  ...exampleFields,
  name: 'Cadastro Fictício',
  cpf: '111.444.777-35',
  email: 'cadastro@example.com'
}

let contents
let storage
let fetch

beforeEach(() => {
  contents = new Map([['users', 'cache-do-full-stack']])
  storage = {
    getItem: vi.fn((key) => contents.get(key) ?? null),
    setItem: vi.fn((key, value) => contents.set(key, value))
  }
  fetch = vi.fn(() => { throw new Error('O CRUD demo tentou acessar a rede') })
  vi.stubGlobal('localStorage', storage)
  vi.stubGlobal('fetch', fetch)
})

afterEach(() => {
  try {
    expect(fetch).not.toHaveBeenCalled()
    expect(contents.get('users')).toBe('cache-do-full-stack')
  } finally {
    vi.unstubAllGlobals()
  }
})

describe('Armazenamento do Modo Demonstração', () => {
  test('lista os exemplos na primeira visita com CPFs que passam na validação', async () => {
    expect(await listUsers()).toEqual(demoUsers)
    expect(demoUsers.every(({ cpf }) => validateCPF(cpf))).toBe(true)
    expect(storage.getItem).toHaveBeenCalledWith(storageKey)
  })

  test('cadastra, lista, edita e exclui um usuário fictício', async () => {
    const created = await createUser(newUser)
    expect(created.id).not.toBe(exampleId)
    expect(await listUsers()).toEqual([...demoUsers, { ...newUser, id: created.id }])

    const updated = await updateUser(created.id, { ...newUser, name: 'Exemplo Atualizado' })
    expect(updated).toEqual({ ...created, name: 'Exemplo Atualizado' })
    expect(await listUsers()).toEqual([...demoUsers, updated])

    await removeUser(created.id)
    expect(await listUsers()).toEqual(demoUsers)
    await expect(updateUser(created.id, newUser)).rejects.toThrow('Usuário não encontrado')
    await expect(removeUser(created.id)).rejects.toThrow('Usuário não encontrado')
  })

  test('lê os dados gravados após recarregar o módulo com o mesmo armazenamento', async () => {
    const created = await createUser(newUser)
    await updateUser(created.id, { ...newUser, numero: '99' })

    vi.resetModules()
    const reloaded = await import('../data/usersDemo')
    expect(await reloaded.listUsers()).toEqual([...demoUsers, { ...created, numero: '99' }])
  })

  test('preserva uma lista salva sem registros', async () => {
    for (const { id } of demoUsers) await removeUser(id)
    expect(contents.get(storageKey)).toBe('[]')

    vi.resetModules()
    const reloaded = await import('../data/usersDemo')
    expect(await reloaded.listUsers()).toEqual([])
  })

  test('redefine os dados e restaura os exemplos iniciais', async () => {
    await removeUser(exampleId)
    await createUser(newUser)
    expect(await resetUsers()).toEqual(demoUsers)
    expect(await listUsers()).toEqual(demoUsers)
    expect(JSON.parse(contents.get(storageKey))).toEqual(demoUsers)
  })

  test('informa falha de leitura e impede gravação sobre dados inacessíveis', async () => {
    storage.getItem.mockImplementation(() => { throw new Error('SecurityError') })
    await expect(listUsers()).rejects.toThrow('Não foi possível ler')
    await expect(createUser(newUser)).rejects.toThrow('Não foi possível ler')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  test('informa falha de gravação e mantém a lista anterior', async () => {
    await resetUsers()
    storage.setItem.mockImplementation(() => { throw new Error('QuotaExceededError') })
    await expect(createUser(newUser)).rejects.toThrow('Não foi possível salvar')
    await expect(updateUser(exampleId, newUser)).rejects.toThrow('Não foi possível salvar')
    await expect(removeUser(exampleId)).rejects.toThrow('Não foi possível salvar')
    await expect(resetUsers()).rejects.toThrow('Não foi possível salvar')
    expect(await listUsers()).toEqual(demoUsers)
  })

  test('permite recuperar uma lista local inválida pela redefinição', async () => {
    contents.set(storageKey, '[null]')
    await expect(listUsers()).rejects.toThrow('Use o botão de redefinição')
    contents.set(storageKey, '{')
    await expect(listUsers()).rejects.toThrow('Não foi possível ler')
    await resetUsers()
    expect(await listUsers()).toEqual(demoUsers)
  })
})
