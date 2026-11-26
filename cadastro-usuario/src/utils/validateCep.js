export function validateCep(value) {
  if (typeof value !== 'string' || !/^\d{5}-?\d{3}$/.test(value)) return false
  return !/^(\d)\1{7}$/.test(value.replace('-', ''))
}

export function formatCep(value) {
  return value.replace(/^(\d{5})(\d)/, '$1-$2')
}
