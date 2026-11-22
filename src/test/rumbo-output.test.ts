import { describe, expect, it } from "vitest";
import { HabilidadSchema, RutaSchema, validarRuta } from "@/lib/rumbo-output";
import { seleccionarFoco, frasePresentacion, programaPrecio } from "@/lib/rumbo-data";
import { leerGuardado } from "@/lib/rumbo-store";

const ruta = () => ({
  area_nueva: { nombre: "Gestión documental", que_se_hace: "Organizar archivos.", por_que_encaja: "Usas tu capacidad de organizar.", primer_paso: "Puedes revisar un archivo." },
  pasos: Array.from({ length: 4 }, (_, i) => ({ titulo: `Explorar ${i + 1}`, proposito: "Conocer una opción.", accion: "Puedes anotar una idea en tu celular.", tiempo: i === 0 ? "5 min" : "20 min", listo: "Ya tengo una nota guardada.", preguntas_guia: ["¿Qué harás con esto?"], subpasos: ["Puedes abrir una nota.", "Puedes escribir tu idea.", "Puedes guardar la nota."] })),
  preguntas: ["¿Qué te detiene al elegir?", "¿Qué necesitarías para decidir?"],
});

describe("contratos de resultados", () => {
  it("cada paso exige tres o cuatro subpasos completos", () => {
    for (const n of [0, 2, 3, 4, 5]) {
      const r = ruta();
      r.pasos = r.pasos.map((p) => ({ ...p, subpasos: Array.from({ length: n }, () => "Puedes abrir una nota.") }));
      expect(RutaSchema.safeParse(r).success).toBe(n === 3 || n === 4);
    }
  });
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
  it("con energía suficiente cada paso dura hasta 45 minutos, incluido el primero", () => {
    const r = ruta(); r.pasos = r.pasos.map((p) => ({ ...p, tiempo: "60 min" })); r.pasos[0]!.tiempo = "30 min";
    expect(validarRuta(r, "suficiente", "Media").pasos.map((p) => p.tiempo)).toEqual(["30 min", "45 min", "45 min", "45 min"]);
  });
  it("con energía baja el máximo es 20 minutos y la semana 1 cinco", () => {
    const r = ruta(); r.pasos = r.pasos.map((p) => ({ ...p, tiempo: "30 min" }));
    expect(validarRuta(r, "baja", "Media").pasos.map((p) => p.tiempo)).toEqual(["5 min", "20 min", "20 min", "20 min"]);
  });
  it("con Casi nada el máximo es 15 minutos", () => {
    const r = ruta(); r.pasos = r.pasos.map((p) => ({ ...p, tiempo: "30 minutos" })); r.pasos[3]!.tiempo = "sin dato";
    expect(validarRuta(r, "suficiente", "Casi nada").pasos.map((p) => p.tiempo)).toEqual(["15 min", "15 min", "15 min", "15 min"]);
    expect(() => validarRuta({ ...r, pasos: [{ titulo: "Falta estructura" }] }, "suficiente", "Media")).toThrow();
  });
  it("cada paso exige señal de listo y una o dos preguntas guía", () => {
    for (const [cambio, ok] of [[{ listo: "" }, false], [{ preguntas_guia: [] }, false], [{ preguntas_guia: ["a", "b", "c"] }, false], [{ preguntas_guia: ["a", "b"] }, true]] as const) {
      const r = ruta(); r.pasos[1] = { ...r.pasos[1]!, ...cambio } as never;
      expect(RutaSchema.safeParse(r).success).toBe(ok);
    }
  });
  it("elimina habilidades repetidas sin distinguir mayúsculas", () => {
    expect(frasePresentacion(["Soporte técnico", "SOPORTE TÉCNICO", "Reportes en Excel"], [])).toBe("Tengo experiencia en soporte técnico y reportes en Excel.");
    expect(frasePresentacion(["Inglés", "inglés", "Organización"], [0, 1])).toBe("Tengo experiencia en inglés.");
  });
  it("el precio público es USD 140 / Q1,000 y los enlaces de empresa no llevan precio", () => {
    expect(programaPrecio(null)).toBe("Programa RUMBO: 4 sesiones en línea · USD 140 / Q1,000");
    expect(programaPrecio("empresa")).toBe("Programa RUMBO: 4 sesiones en línea");
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
  it("recalcula rutas sin subpasos sin perder estudios ni avances", () => {
    const anterior = ruta();
    const raw = JSON.stringify({ t: 0, s: { pantalla: "cierre", carrera: "Psicología", avances: "Ya tengo mi web", ruta: { ...anterior, pasos: anterior.pasos.map(({ subpasos: _subpasos, ...p }) => p) } } });
    expect(leerGuardado(raw, 1)).toEqual({ pantalla: "ruta", carrera: "Psicología", avances: "Ya tengo mi web", ruta: null });
  });
  it("preserva respuestas al recalcular una ruta con formato anterior", () => {
    const raw = JSON.stringify({ t: 0, s: { pantalla: "cierre", crecerEmpresa: "Sí", claridad: 7, frase: "Mi frase", ruta: [{ titulo: "Anterior", pasos: [] }] } });
    expect(leerGuardado(raw, 1)).toEqual({ pantalla: "ruta", crecerEmpresa: "Sí", claridad: 7, frase: "Mi frase", ruta: null });
  });
  it("actualiza habilidades anteriores sin perder tareas ni frase editable", () => {
    const raw = JSON.stringify({ t: 0, s: { pantalla: "cierre", tareas: ["Resuelvo fallas"], frase: "Mi frase", habilidades: [{ tarea: "Resuelvo fallas", habilidad: "Soporte", frase_cv: "Anterior", puestos: [] }] } });
    expect(leerGuardado(raw, 1)).toEqual({ pantalla: "tareas", tareas: ["Resuelvo fallas"], frase: "Mi frase", habilidades: null, ruta: null });
  });
});