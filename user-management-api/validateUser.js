function cpfValido(value) {
  if (typeof value !== 'string' || !/^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(value)) return false
  const cpf = value.replace(/\D/g, '')
  if (/^(\d)\1{10}$/.test(cpf)) return false

  for (const length of [9, 10]) {
    const sum = [...cpf.slice(0, length)].reduce(
      (total, digit, index) => total + Number(digit) * (length + 1 - index), 0
    )
    const remainder = sum % 11
    if (Number(cpf[length]) !== (remainder < 2 ? 0 : 11 - remainder)) return false
  }
  return true
}

function textoPreenchido(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function validateUser(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Informe os dados do usuário.'
  const { nome, cpf, email, idade, cep, rua, numero, bairro, cidade, estado } = body

  if (!textoPreenchido(nome) || !/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) return 'Digite um nome válido.'
  if (!cpfValido(cpf)) return 'Digite um CPF válido.'
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Digite um e-mail válido.'
  const age = typeof idade === 'number' || (typeof idade === 'string' && /^\d+$/.test(idade))
    ? Number(idade)
    : NaN
  if (!Number.isInteger(age) || age < 18 || age > 2147483647) return 'Informe uma idade inteira válida a partir de 18 anos.'
  if (typeof cep !== 'string' || !/^\d{5}-?\d{3}$/.test(cep) || /^(\d)\1{7}$/.test(cep.replace('-', ''))) {
    return 'Digite um CEP válido com oito dígitos.'
  }
  if (![rua, bairro, cidade].every(textoPreenchido) ||
      !(textoPreenchido(numero) || (Number.isSafeInteger(numero) && numero >= 0)) ||
      typeof estado !== 'string' || !/^[A-Za-z]{2}$/.test(estado.trim())) {
    return 'Preencha rua, número, bairro, cidade e estado (UF).'
  }
  return null
}

module.exports = { validateUser }
