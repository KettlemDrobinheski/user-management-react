import { demoUsers } from './demoUsers'

const storageKey = 'user-management:demo:v1'

function saveUsers(users) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(users))
  } catch {
    throw new Error('Não foi possível salvar os dados da demonstração neste navegador.')
  }
}

function readUsers() {
  let savedUsers
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored === null) {
      return demoUsers.map((user) => ({ ...user }))
    }
    savedUsers = JSON.parse(stored)
  } catch {
    throw new Error('Não foi possível ler os dados da demonstração neste navegador.')
  }

  if (!Array.isArray(savedUsers) || !savedUsers.every((user) =>
    user && Number.isSafeInteger(user.id) && typeof user.name === 'string' &&
    typeof user.cpf === 'string' && typeof user.email === 'string'
  )) {
    throw new Error('Os dados locais da demonstração estão inválidos. Use o botão de redefinição.')
  }
  return savedUsers
}

export async function listUsers() {
  return readUsers()
}

export async function createUser(userData) {
  const users = readUsers()
  const id = users.reduce((highestId, user) => Math.max(highestId, user.id), demoUsers.length) + 1
  const user = { ...userData, id }
  saveUsers([...users, user])
  return user
}

export async function updateUser(id, userData) {
  const users = readUsers()
  const index = users.findIndex((user) => user.id === id)
  if (index === -1) {
    throw new Error('Usuário não encontrado')
  }
  const user = { ...userData, id }
  users[index] = user
  saveUsers(users)
  return user
}

export async function removeUser(id) {
  const users = readUsers()
  const remainingUsers = users.filter((user) => user.id !== id)
  if (remainingUsers.length === users.length) {
    throw new Error('Usuário não encontrado')
  }
  saveUsers(remainingUsers)
}

export async function resetUsers() {
  const users = demoUsers.map((user) => ({ ...user }))
  saveUsers(users)
  return users
}

export default { listUsers, createUser, updateUser, removeUser, resetUsers }
