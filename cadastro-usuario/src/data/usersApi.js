const usersUrl = 'http://localhost:3000/usuarios'

function fromApiUser({ id, nome, cpf, email, idade, cep, rua, numero, bairro, cidade, estado }) {
  return { id, name: nome, cpf, email, age: idade, cep, rua, numero, bairro, cidade, estado }
}

function userRequest(method, { name, cpf, email, age, cep, rua, numero, bairro, cidade, estado }) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: name, cpf, email, idade: age, cep, rua, numero, bairro, cidade, estado })
  }
}

async function checkMutationResponse(response, fallbackMessage) {
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.erro || fallbackMessage)
  }
}

export async function listUsers() {
  const response = await fetch(usersUrl)

  if (!response.ok) {
    throw new Error('Erro ao buscar usuários')
  }

  const users = await response.json()
  return users.map(fromApiUser)
}

export async function createUser(user) {
  const response = await fetch(usersUrl, userRequest('POST', user))
  await checkMutationResponse(response, 'Erro ao cadastrar usuário')
  return fromApiUser(await response.json())
}

export async function updateUser(id, user) {
  const response = await fetch(`${usersUrl}/${id}`, userRequest('PUT', user))
  await checkMutationResponse(response, 'Erro ao atualizar usuário')
  return fromApiUser(await response.json())
}

export async function removeUser(id) {
  const response = await fetch(`${usersUrl}/${id}`, { method: 'DELETE' })
  await checkMutationResponse(response, 'Não foi possível excluir o usuário')
}

export default { listUsers, createUser, updateUser, removeUser }
