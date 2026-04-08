import { describe, expect, it } from "vitest";
import { classifyNro, computeNro } from "@/lib/domain/risk-matrix/engine";

describe("risk matrix engine", () => {
  it("computes NRO as probability times severity", () => {
    expect(computeNro({ probability: 4, severity: 5 })).toBe(20);
  });

  it("rejects invalid score inputs", () => {
    expect(() => computeNro({ probability: 0 as 1, severity: 5 })).toThrow(/probability must be between 1 and 5/i);
    expect(() => computeNro({ probability: 3.5 as 1, severity: 5 })).toThrow(/probability must be an integer between 1 and 5/i);
    expect(() => classifyNro(Number.NaN)).toThrow(/nro must be a positive integer/i);
  });

  it("classifies low NRO values", () => {
    expect(classifyNro(4)).toEqual({ label: "Baixo", colorToken: "green" });
  });

  it("classifies NRO boundary values", () => {
    expect(classifyNro(5)).toEqual({ label: "Medio", colorToken: "yellow" });
    expect(classifyNro(10)).toEqual({ label: "Alto", colorToken: "orange" });
    expect(classifyNro(15)).toEqual({ label: "Critico", colorToken: "red" });
  });
});
