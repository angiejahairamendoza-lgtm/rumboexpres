import { describe, it, expect } from "vitest";
import { calcularEnergia, calcularPerfil, calcularMargen, margenTexto, topTipos, interesTexto, TIPOS } from "@/lib/rumbo-data";

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

describe("texto de intereses", () => {
  const todas = TIPOS.flatMap((a, i) => TIPOS.slice(i + 1).map((b) => [a, b] as [typeof a, typeof b]));

  it("usa 'e' antes de una palabra con sonido i", () => {
    expect(interesTexto("Práctico", "Investigador")).toMatch(/^Hacer con las manos e investigar:/);
    expect(interesTexto("Creativo", "Emprendedor")).toContain("Crear e influir:");
    expect(interesTexto("Social", "Emprendedor")).toContain("Ayudar e influir:");
    expect(interesTexto("Práctico", "Creativo")).toContain("funcionen e imaginar");
  });
  it("nunca deja 'y' antes de una palabra con sonido i", () => {
    expect(interesTexto("Práctico", "Investigador")).not.toContain(" y investigar");
    expect(interesTexto("Social", "Emprendedor")).not.toContain(" y influir");
  });
  it("las 3 combinaciones opuestas suman la frase de roles puente, antes de los ejemplos", () => {
    const opuestas: ["Práctico" | "Investigador" | "Creativo", "Social" | "Emprendedor" | "Organizador"][] = [
      ["Práctico", "Social"],
      ["Investigador", "Emprendedor"],
      ["Creativo", "Organizador"],
    ];
    for (const [a, b] of opuestas) {
      const t = interesTexto(a, b);
      const puente = t.indexOf(" Tienes intereses que pocas personas combinan; eso puede ser una ventaja en roles puente.");
      expect(puente).toBeGreaterThan(-1);
      expect(puente).toBeLessThan(t.indexOf(" Estos son ejemplos, no un destino."));
    }
  });
  it("las demás combinaciones no llevan la frase de roles puente", () => {
    const t = interesTexto("Práctico", "Investigador");
    expect(t).not.toContain("roles puente");
    expect(t).toContain("Estos son ejemplos, no un destino. Tu combinación puede vivirse en muchos trabajos distintos.");
  });
  it("las 15 combinaciones tienen áreas y caben en el límite de la función de la ruta", () => {
    expect(todas.length).toBe(15);
    for (const [a, b] of todas) {
      const t = interesTexto(a, b);
      expect(t).not.toContain("undefined");
      expect(t.length).toBeLessThanOrEqual(500);
    }
  });
});

import { frasePresentacion, tituloSemana, ENERGIA_JORNADA, EJEMPLOS_TAREAS } from "@/lib/rumbo-data";
import { leerGuardado, VENCE_MS } from "@/lib/rumbo-store";

describe("ajustes de la prueba en celular", () => {
  it("energía de jornada: Mucha, Media, Casi nada", () => {
    expect(ENERGIA_JORNADA).toEqual(["Mucha", "Media", "Casi nada"]);
  });
  it("solo 2 ejemplos de tareas", () => {
    expect(EJEMPLOS_TAREAS).toEqual(["Calmo a clientes molestos", "Atiendo en inglés"]);
  });
  it("frase sin favoritas usa las primeras habilidades", () => {
    expect(frasePresentacion(["Manejo de conflictos", "Multitarea", "Inglés", "Otra"], [])).toBe("Tengo experiencia en manejo de conflictos, multitarea e inglés.");
  });
  it("frase con 1 favorita usa solo esa", () => {
    expect(frasePresentacion(["A", "Liderazgo"], [1])).toBe("Tengo experiencia en liderazgo.");
  });
  it("frase: nombres completos, ', y' cuando ya hay 'y', solo la primera letra en minúscula", () => {
    expect(frasePresentacion(["Soporte técnico y resolución de problemas", "Facilitación de la comunicación y acompañamiento a personas mayores", "Atención al cliente y comunicación en inglés"], []))
      .toBe("Tengo experiencia en soporte técnico y resolución de problemas, facilitación de la comunicación y acompañamiento a personas mayores, y atención al cliente y comunicación en inglés.");
    expect(frasePresentacion(["Reportes en Excel (reporting)", "Inglés"], [])).toBe("Tengo experiencia en reportes en Excel (reporting) e inglés.");
  });
  it("quita el prefijo 'Semana N' del título de la IA", () => {
    expect(tituloSemana("Semana 1: Explorar opciones")).toBe("Explorar opciones");
    expect(tituloSemana("Semana 2 - Ordenar")).toBe("Ordenar");
    expect(tituloSemana("Explorar opciones")).toBe("Explorar opciones");
  });
  it("el avance guardado vence a las 24 horas", () => {
    const raw = JSON.stringify({ t: 0, s: { pantalla: "valores" } });
    expect(leerGuardado(raw, VENCE_MS - 1)).toEqual({ pantalla: "valores" });
    expect(leerGuardado(raw, VENCE_MS + 1)).toBeNull();
    expect(leerGuardado("{roto", 0)).toBeNull();
  });
});
