export function validarCpf(cpf) {
  const cpfLimpo = cpf.replace(/\D/g, '');

  if (cpfLimpo.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(cpfLimpo[i]) * (10 - i);
  }

  let resto = soma % 11;
  let primeiroDigito = resto < 2 ? 0 : 11 - resto;

  if (primeiroDigito !== Number(cpfLimpo[9])) {
    return false;
  }

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(cpfLimpo[i]) * (11 - i);
  }

  resto = soma % 11;
  const segundoDigito = resto < 2 ? 0 : 11 - resto;

  if (segundoDigito !== Number(cpfLimpo[10])) {
    return false;
  }

  return true;
}