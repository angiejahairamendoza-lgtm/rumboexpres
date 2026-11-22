import { describe, expect, it } from "vitest";
import { HabilidadSchema, RutaSchema, validarRuta } from "@/lib/rumbo-output";
import { seleccionarFoco } from "@/lib/rumbo-data";
import { leerGuardado } from "@/lib/rumbo-store";

const ruta = () => ({
  area_nueva: { nombre: "Gestión documental", que_se_hace: "Organizar archivos.", por_que_encaja: "Usas tu capacidad de organizar.", primer_paso: "Puedes revisar un archivo." },
  pasos: Array.from({ length: 4 }, (_, i) => ({ titulo: `Explorar ${i + 1}`, proposito: "Conocer una opción.", accion: "Puedes anotar una idea en tu celular.", tiempo: i === 0 ? "5 min" : "20 min" })),
  preguntas: ["¿Qué te detiene al elegir?", "¿Qué necesitarías para decidir?"],
});

describe("contratos de resultados", () => {
  it("cada habilidad requiere uso y exactamente cuatro puestos", () => {
    const habilidad = { habilidad: "Soporte técnico", para_que: "Resolver fallas en oficinas.", puestos: ["Soporte técnico", "Auxiliar de informática", "Asistente de sistemas", "Agente de soporte"] };
    expect(HabilidadSchema.safeParse(habilidad).success).toBe(true);
    expect(HabilidadSchema.safeParse({ ...habilidad, puestos: habilidad.puestos.slice(0, 3) }).success).toBe(false);
    expect(HabilidadSchema.safeParse({ ...habilidad, puestos: [...habilidad.puestos, "Otro"] }).success).toBe(false);
    expect(HabilidadSchema.safeParse({ ...habilidad, para_que: undefined }).success).toBe(false);
    expect(HabilidadSchema.parse({ ...habilidad, frase_cv: "Vieja frase" })).not.toHaveProperty("frase_cv");
  });
  it("la ruta requiere área nueva, exactamente cuatro pasos y dos preguntas", () => {
    expect(RutaSchema.safeParse(ruta()).success).toBe(true);
    expect(RutaSchema.safeParse({ ...ruta(), area_nueva: undefined }).success).toBe(false);
    for (const n of [3, 5]) expect(RutaSchema.safeParse({ ...ruta(), pasos: Array.from({ length: n }, () => ruta().pasos[0]) }).success).toBe(false);
    for (const preguntas of [["Una"], ["Una", "Dos", "Tres"]]) expect(RutaSchema.safeParse({ ...ruta(), preguntas }).success).toBe(false);
  });
  it("los pasos duran como máximo 20 minutos", () => {
    expect(validarRuta(ruta(), "Media").pasos).toHaveLength(4);
    const r = ruta(); r.pasos[1] = { titulo: "Explorar", proposito: "Conocer", accion: "Puedes anotar.", tiempo: "21 min" };
    expect(() => validarRuta(r, "Media")).toThrow();
  });
  it("con Casi nada el máximo sigue siendo 15 minutos", () => {
    const r = ruta(); r.pasos = r.pasos.map((p, i) => ({ ...p, tiempo: i === 0 ? "5 min" : "15 min" }));
    expect(validarRuta(r, "Casi nada").pasos).toHaveLength(4);
    r.pasos[1] = { titulo: "Explorar", proposito: "Conocer", accion: "Puedes anotar.", tiempo: "16 min" };
    expect(() => validarRuta(r, "Casi nada")).toThrow();
  });
  it("el primer paso es muy fácil, de cinco minutos o menos", () => {
    const r = ruta(); r.pasos[0] = { titulo: "Empezar", proposito: "Avanzar", accion: "Puedes anotar.", tiempo: "6 min" };
    expect(() => validarRuta(r, "Mucha")).toThrow();
  });
});

describe("foco de acompañamiento elegido por la app", () => {
  it("energía baja tiene prioridad sobre los tres perfiles", () => {
    for (const perfil of ["A", "B", "C"] as const) expect(seleccionarFoco("baja", perfil)).toBe("energia");
  });
  it("perfil C con energía suficiente enfoca decisiones", () => {
    expect(seleccionarFoco("suficiente", "C")).toBe("decision");
  });
  it("perfiles A y B con energía suficiente enfocan el plan", () => {
    expect(seleccionarFoco("suficiente", "A")).toBe("plan");
    expect(seleccionarFoco("suficiente", "B")).toBe("plan");
  });
});

describe("avance existente", () => {
  it("preserva respuestas al recalcular una ruta con formato anterior", () => {
    const raw = JSON.stringify({ t: 0, s: { pantalla: "cierre", crecerEmpresa: "Sí", claridad: 7, frase: "Mi frase", ruta: [{ titulo: "Anterior", pasos: [] }] } });
    expect(leerGuardado(raw, 1)).toEqual({ pantalla: "ruta", crecerEmpresa: "Sí", claridad: 7, frase: "Mi frase", ruta: null });
  });
  it("actualiza habilidades anteriores sin perder tareas ni frase editable", () => {
    const raw = JSON.stringify({ t: 0, s: { pantalla: "cierre", tareas: ["Resuelvo fallas"], frase: "Mi frase", habilidades: [{ tarea: "Resuelvo fallas", habilidad: "Soporte", frase_cv: "Anterior", puestos: [] }] } });
    expect(leerGuardado(raw, 1)).toEqual({ pantalla: "tareas", tareas: ["Resuelvo fallas"], frase: "Mi frase", habilidades: null, ruta: null });
  });
});