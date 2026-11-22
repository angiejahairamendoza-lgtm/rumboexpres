import { beforeEach, describe, expect, it, vi } from "vitest";
import { contextoRuta } from "@/components/rumbo/Flow";
import { estadoInicial } from "@/lib/rumbo-store";
import { generarRuta, traducirHabilidades } from "@/lib/rumbo-ai.functions";
import { contextoEstudios, datosEstudios } from "@/lib/rumbo-studies";

const ai = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@lovable.dev/ai-gateway", () => ({ generateResponse: ai.generate, GatewayError: class extends Error {} }));
vi.mock("@tanstack/react-start", () => ({
  useServerFn: (fn: unknown) => fn,
  createServerFn: () => ({ inputValidator: (validate: (d: unknown) => unknown) => ({
    handler: (handle: (args: { data: unknown }) => unknown) => (args: { data: unknown }) => handle({ data: validate(args.data) }),
  }) }),
}));

const ruta = {
  area_nueva: { nombre: "Planificación de personal", que_se_hace: "Organizar turnos.", por_que_encaja: "Usas tu organización.", primer_paso: "Puedes leer sobre planificación." },
  pasos: Array.from({ length: 4 }, () => ({ titulo: "Explorar", proposito: "Conocer opciones.", accion: "Puedes revisar una vacante.", tiempo: "5 min", subpasos: ["Puedes abrir el portal.", "Puedes leer una vacante.", "Puedes guardar su enlace."] })),
  preguntas: ["¿Qué necesitas para decidir?", "¿Qué te gustaría conocer?"],
};
beforeEach(() => {
  ai.generate.mockReset();
  ai.generate.mockResolvedValue({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(ruta) }] }] });
});
const contexto = (crecerEmpresa: string | null, situacion = 0) => contextoRuta({ ...estadoInicial(), situacion, crecerEmpresa, necesidad: 1, marcha: 1, anio: 0 }, "prueba");
const instrucciones = () => String(ai.generate.mock.calls[0]?.[0]?.instructions ?? "");

describe("contexto neutral de crecimiento", () => {
  it("distingue el enlace de empresa del público sin enviar el nombre de la empresa", () => {
    expect(contexto("Sí")).toMatchObject({ enlaceEmpresa: true, crecerEmpresa: "Sí", perfil: "B" });
    expect(contextoRuta(estadoInicial(), null)).toMatchObject({ enlaceEmpresa: false, crecerEmpresa: "" });
    expect(contexto("Sí")).not.toHaveProperty("empresa");
  });
  it.each(["Sí", "No", "Todavía no lo sé"])("envía %s solo para las dos situaciones con empleo", (respuesta) => {
    for (const situacion of [0, 1]) expect(contexto(respuesta, situacion).crecerEmpresa).toBe(respuesta);
    for (const situacion of [2, 3]) expect(contexto(respuesta, situacion).crecerEmpresa).toBe("");
  });
  it("la función recibe ambos datos y exige área y dos pasos internos para Sí o B", async () => {
    await generarRuta({ data: contexto("Sí") });
    const request = ai.generate.mock.calls[0]?.[0];
    expect(JSON.parse(String(request?.input[0]?.content).split("\n").slice(1).join("\n"))).toMatchObject({ enlaceEmpresa: true, crecerEmpresa: "Sí", perfil: "B" });
    expect(instrucciones()).toContain('Si crecerEmpresa="Sí" o perfil="B"');
    expect(instrucciones()).toContain("al menos 2 pasos se orientan a crecer dentro");
    expect(instrucciones()).toContain("elige un área dentro de su industria");
  });
  it("la indecisión exige explorar dentro y fuera, también para B", async () => {
    await generarRuta({ data: contexto("Todavía no lo sé") });
    expect(instrucciones()).toContain('Si crecerEmpresa="Todavía no lo sé": un paso explora una opción dentro');
    expect(instrucciones()).toContain("y otro una opción fuera");
    expect(instrucciones()).toContain("Si también es perfil B, conserva el área interna y al menos 2 pasos internos, además del paso externo");
  });
  it("conserva exploración para No y no deduce preferencia por el enlace", async () => {
    await generarRuta({ data: contexto("No") });
    expect(instrucciones()).toContain('Si crecerEmpresa="No": conserva las reglas de exploración anteriores');
    expect(instrucciones()).toContain("no significa que deba quedarse, ni sustituye su respuesta");
    expect(instrucciones()).toContain('Nunca uses expresiones como "salir del call center"');
  });
  it("el crecimiento respeta descanso inicial y contactos conocidos sin exposición en frío", async () => {
    await generarRuta({ data: { ...contexto("Sí"), energia: "baja" } });
    expect(instrucciones()).toContain("la semana 1 con energía baja se enfoca en recuperar energía y buscar enfoque y claridad");
    expect(instrucciones()).toContain("invitaciones opcionales con contactos conocidos y canales internos habituales");
  });
  it("el traductor solicita exactamente dos puestos internos no agentes y dos externos", async () => {
    ai.generate.mockResolvedValueOnce({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ habilidades: [1, 2, 3].map((n) => ({ habilidad: `Habilidad ${n}`, para_que: "Organizar información.", puestos: ["Analista de calidad", "Auxiliar de planificación", "Auxiliar administrativo", "Asistente de inventario"] })) }) }] }] });
    const habilidades = await traducirHabilidades({ data: { tareas: ["Reviso reportes", "Resuelvo casos", "Capacito compañeros"], situacion: "Trabajo en un call center", ...contextoEstudios(estadoInicial()) } });
    expect(habilidades.every((h) => h.puestos.length === 4)).toBe(true);
    expect(instrucciones()).toContain("2 dentro de la industria de contact center que no sean de agente");
    expect(instrucciones()).toContain("y 2 fuera de la industria");
  });
});

describe("estudios, avances y profundidad", () => {
  const persona = () => ({ ...estadoInicial(), nivelEstudios: "Licenciatura" as const, estudiaActualmente: "No estoy estudiando" as const, carrera: "Psicología", avances: "Ya tengo página web y redes sociales", proyecto: "Clínica propia", necesidad: 0, marcha: 0, anio: 0 });
  it("envía los cuatro datos al contexto compartido y conserva solo categorías en el registro anónimo", () => {
    expect(contextoRuta(persona(), null)).toMatchObject({ nivelEstudios: "Licenciatura", estudiaActualmente: "No estoy estudiando", titulo: "Psicología", estudiando: "", avances: "Ya tengo página web y redes sociales" });
    expect(datosEstudios(persona())).toEqual({ nivel_estudios: "Licenciatura", estudia_actualmente: "No estoy estudiando" });
  });
  it("el traductor recibe estudios, carrera y avances y excluye asistentes y auxiliares para grados universitarios", async () => {
    ai.generate.mockResolvedValueOnce({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ habilidades: [1, 2, 3].map((n) => ({ habilidad: `Habilidad ${n}`, para_que: "Organizar información.", puestos: ["Analista de calidad", "Capacitador", "Psicóloga organizacional", "Coordinadora de formación"] })) }) }] }] });
    await traducirHabilidades({ data: { tareas: ["Reviso reportes", "Resuelvo casos", "Capacito compañeros"], situacion: "Trabajo en un call center", ...contextoEstudios(persona()) } });
    expect(JSON.parse(String(ai.generate.mock.calls[0]?.[0]?.input[0]?.content).split("\n").slice(1).join("\n"))).toMatchObject(contextoEstudios(persona()));
    expect(instrucciones()).toContain("Para Licenciatura o Maestría o más, nunca propongas puestos de asistente o auxiliar");
  });
  it("el área aplica la carrera y complementa el proyecto propio", async () => {
    await generarRuta({ data: contextoRuta(persona(), null) });
    expect(instrucciones()).toContain("el área nueva es una especialización o aplicación de esa carrera, no un cambio de profesión");
    expect(instrucciones()).toContain("Si es Trampolín (perfil A) con proyecto propio, el área nueva complementa su proyecto");
  });
  it("parte de avances previos sin repetir acciones", async () => {
    await generarRuta({ data: contextoRuta(persona(), null) });
    expect(instrucciones()).toContain("nunca propongas pasos ni subpasos que repitan lo que la persona dice que ya hizo");
    expect(instrucciones()).toContain("trabaja con lo que existe en vez de volver a crearlas");
  });
  it("cualquier cálculo ocupa como máximo dos frases incluyendo los subpasos", async () => {
    await generarRuta({ data: contextoRuta(persona(), null) });
    expect(instrucciones()).toContain("Cualquier cálculo se explica en 2 frases como máximo, contando la acción y los subpasos");
  });
  it("la primera semana de energía baja incluye pausas y reflexión sin dinero ni búsqueda", async () => {
    await generarRuta({ data: { ...contextoRuta(persona(), null), energia: "baja" } });
    expect(instrucciones()).toContain("pausas de descanso y a reflexionar sobre qué es importante para la persona y qué quiere lograr, sin dinero, cifras ni búsqueda de empleo");
    expect(instrucciones()).not.toContain("SOLO descanso");
  });
  it("el tiempo cubre todos los subpasos y mantiene el primer paso de cinco minutos", async () => {
    await generarRuta({ data: contextoRuta(persona(), null) });
    expect(instrucciones()).toContain("El tiempo es el total de la acción CON todos sus subpasos");
    expect(instrucciones()).toContain("de 5 minutos o menos en total");
    expect(instrucciones()).toContain('Cada subpaso empieza con una invitación explícita como "Puedes…"');
  });
});

describe("puestos según situación y estudios separados", () => {
  it("envía título y lo que estudia por separado solo si estudia", () => {
    const base = { ...estadoInicial(), carrera: "Chef", estudiando: "Posgrado en emprendimiento" };
    expect(contextoEstudios({ ...base, estudiaActualmente: "Sí" })).toMatchObject({ titulo: "Chef", estudiando: "Posgrado en emprendimiento" });
    expect(contextoEstudios({ ...base, estudiaActualmente: "No estoy estudiando" })).toMatchObject({ titulo: "Chef", estudiando: "" });
  });
  it("la regla 2 dentro y 2 fuera aplica solo a quien trabaja en call center", async () => {
    ai.generate.mockResolvedValueOnce({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ habilidades: [1, 2, 3].map((n) => ({ habilidad: `H ${n}`, para_que: "x.", puestos: ["a", "b", "c", "d"] })) }) }] }] });
    await traducirHabilidades({ data: { tareas: ["Reviso reportes", "Resuelvo casos", "Capacito compañeros"], situacion: "Dejé el call center y tengo otro empleo", ...contextoEstudios(estadoInicial()) } });
    expect(String(ai.generate.mock.calls.at(-1)?.[0]?.input[0]?.content)).toContain("Dejé el call center y tengo otro empleo");
    expect(instrucciones()).toContain('Si situacion="Trabajo en un call center": 2 dentro de la industria');
    expect(instrucciones()).toContain("sin ningún puesto de contact center");
  });
});
