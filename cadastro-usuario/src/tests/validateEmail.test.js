import { describe, test, expect } from "vitest";
import { validateEmail } from "../utils/validateEmail";

describe("Validação de e-mail", () => {

  test("deve aceitar um e-mail válido", () => {
    expect(validateEmail("teste@email.com")).toBe(true);
  });

  test("não deve aceitar e-mail vazio", () => {
    expect(validateEmail("")).toBe(false);
  });

  test("não deve aceitar e-mail sem @", () => {
    expect(validateEmail("testeemail.com")).toBe(false);
  });

  test("não deve aceitar e-mail sem domínio", () => {
    expect(validateEmail("teste@")).toBe(false);
  });

});