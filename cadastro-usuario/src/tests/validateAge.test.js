import { describe, test, expect } from "vitest";
import { validateAge } from "../utils/validateAge";

describe("Validação de idade", () => {

  test("deve aceitar idade igual ou maior que 18 anos", () => {
    expect(validateAge("18")).toBe(true);
  });

  test("não deve aceitar idade menor que 18 anos", () => {
  expect(validateAge("17")).toBe(false);
});

test("não deve aceitar idade vazia", () => {
  expect(validateAge("")).toBe(false);
});

test("não deve aceitar texto como idade", () => {
  expect(validateAge("abc")).toBe(false);
});

});