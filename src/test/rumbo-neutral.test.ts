import { beforeEach, describe, expect, it, vi } from "vitest";
import { contextoRuta } from "@/components/rumbo/Flow";
import { estadoInicial } from "@/lib/rumbo-store";
import { generarRuta, traducirHabilidades } from "@/lib/rumbo-ai.functions";

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
  pasos: Array.from({ length: 4 }, () => ({ titulo: "Explorar", proposito: "Conocer opciones.", accion: "Puedes revisar una vacante.", tiempo: "5 min" })),
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
    expect(instrucciones()).toContain("la semana 1 con energía baja sigue siendo SOLO descanso y cuidado");
    expect(instrucciones()).toContain("invitaciones opcionales con contactos conocidos y canales internos habituales");
  });
  it("el traductor solicita exactamente dos puestos internos no agentes y dos externos", async () => {
    ai.generate.mockResolvedValueOnce({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ habilidades: [1, 2, 3].map((n) => ({ habilidad: `Habilidad ${n}`, para_que: "Organizar información.", puestos: ["Analista de calidad", "Auxiliar de planificación", "Auxiliar administrativo", "Asistente de inventario"] })) }) }] }] });
    const habilidades = await traducirHabilidades({ data: { tareas: ["Reviso reportes", "Resuelvo casos", "Capacito compañeros"] } });
    expect(habilidades.every((h) => h.puestos.length === 4)).toBe(true);
    expect(instrucciones()).toContain("2 dentro de la industria de contact center que no sean de agente");
    expect(instrucciones()).toContain("y 2 fuera de la industria");
  });
});