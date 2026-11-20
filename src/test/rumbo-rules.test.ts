import { describe, it, expect } from "vitest";
import { calcularEnergia, calcularPerfil, calcularMargen, margenTexto, topTipos } from "@/lib/rumbo-data";

describe("reglas RUMBO", () => {
  it("energía baja cuando la suma es menor a 13", () => {
    expect(calcularEnergia([3, 3, 3, 3, 0])).toBe("baja");
    expect(calcularEnergia([3, 3, 3, 3, 1])).toBe("suficiente");
  });
  it("perfil con más puntos", () => {
    expect(calcularPerfil(1, 1, 0)).toBe("B");
  });
  it("empate: gana la pregunta 3", () => {
    expect(calcularPerfil(3, 0, 1)).toBe("C");
  });
  it("margen y meses de respaldo", () => {
    expect(calcularMargen({ ingreso: 5000, gastos: 4000, ahorros: 8000 })).toEqual({ margen: 1000, meses: 2 });
  });
  it("margen negativo sin ahorro", () => {
    expect(margenTexto({ ingreso: 3000, gastos: 3500, ahorros: 0 })).toContain("y no hay ahorro de respaldo");
  });
  it("los 2 tipos con más marcas", () => {
    expect(topTipos([2, 3, 10, 11])).toEqual(["Investigador", "Organizador"]);
  });
});
