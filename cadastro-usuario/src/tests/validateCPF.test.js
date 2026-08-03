import { describe, test, expect } from "vitest";
import { validateCPF } from "../utils/validateCPF";

describe("Validação de CPF", () => {

  test("deve aceitar um CPF válido", () => {
    expect(validateCPF("529.982.247-25")).toBe(true);
  });

  test("não deve aceitar CPF inválido", () => {
    expect(validateCPF("111.111.111-11")).toBe(false);
  });

  test("não deve aceitar CPF com quantidade errada de números", () => {
    expect(validateCPF("123")).toBe(false);
  });

});