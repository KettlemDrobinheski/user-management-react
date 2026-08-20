export function validateAge(age) {
  const idade = Number(age)

  if (!age || isNaN(idade)) {
    return false
  }

  if (idade < 18) {
    return false
  }

  return true
}