import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Habilidad = { tarea: string; habilidad: string; frase_cv: string; puestos: string[] };
export type PasoRuta = { titulo: string; como: string[]; listo: string; tiempo: string };
export type Semana = { titulo: string; pasos: PasoRuta[] };

async function pedirJSON<T>(sistema: string, usuario: string, nombre: string, schema: Record<string, unknown>): Promise<T> {
  const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
  try {
    const res = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions: sistema,
      input: [{ role: "user", content: usuario }],
      text: { format: { type: "json_schema", name: nombre, strict: true, schema } },
    });
    let texto = "";
    for (const item of res.output ?? []) {
      if (item.type === "message") {
        for (const c of item.content) if (c.type === "output_text") texto += c.text;
      }
    }
    return JSON.parse(texto) as T;
  } catch (e) {
    if (e instanceof GatewayError) console.error("AI gateway", e.code, e.message);
    else console.error(e);
    throw new Error("No pudimos completar este paso ahora. Intenta de nuevo en un momento.");
  }
}

const str = (max: number) => z.string().trim().max(max);

export const traducirHabilidades = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ tareas: z.array(str(200).min(2)).min(3).max(5) }).parse(d))
  .handler(async ({ data }) => {
    const sistema = `Eres orientadora vocacional en Guatemala (Programa RUMBO). Traduces tareas de call center al lenguaje del mercado laboral.
Por cada tarea devuelve:
- habilidad: nombre de la habilidad en lenguaje del mercado, en español; puede incluir entre paréntesis el término en inglés si es el usual (ej. "Coordinación de servicios de salud y acompañamiento al paciente (patient advocate)").
- frase_cv: frase para el CV en primera persona, concreta, sin exagerar ni inventar cifras.
- puestos: 2 o 3 puestos donde se usa; al menos uno dentro de la industria (back-office, calidad, capacitación, soporte, análisis) y al menos uno fuera de ella.
Español neutro de Guatemala. Sin lenguaje clínico. Mantén el campo tarea igual al texto recibido.`;
    const out = await pedirJSON<{ habilidades: Habilidad[] }>(
      sistema,
      `Tareas:\n${data.tareas.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
      "habilidades",
      {
        type: "object", additionalProperties: false, required: ["habilidades"],
        properties: {
          habilidades: {
            type: "array",
            items: {
              type: "object", additionalProperties: false, required: ["tarea", "habilidad", "frase_cv", "puestos"],
              properties: {
                tarea: { type: "string" }, habilidad: { type: "string" }, frase_cv: { type: "string" },
                puestos: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    );
    return out.habilidades;
  });

const RutaInput = z.object({
  perfil: z.enum(["A", "B", "C"]),
  perfilNombre: str(40),
  economico: z.boolean(),
  situacion: str(120),
  edad: str(20),
  necesidad: str(120),
  proyecto: str(200),
  energia: z.enum(["baja", "suficiente"]),
  energiaJornada: str(20),
  claridad: z.number().min(0).max(10),
  intereses: z.array(str(30)).max(2),
  interesTexto: str(400),
  valores: z.array(str(60)).max(3),
  condiciones: z.array(str(60)).max(2),
  favoritas: z.array(str(200)).max(3),
  frase: str(300),
  margen: z.object({ ingreso: z.number(), gastos: z.number(), ahorros: z.number(), margen: z.number(), meses: z.number() }).nullable(),
});

export const generarRuta = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RutaInput.parse(d))
  .handler(async ({ data }) => {
    const sistema = `Eres la voz del Programa RUMBO (Licda. Angie Mendoza, psicóloga clínica y orientadora vocacional, Guatemala). Generas una ruta de 30 días para una persona que trabaja o trabajó en call center.
Formato: exactamente 4 semanas; cada semana con título y 1 o 2 pasos. Cada paso: titulo; como (2 a 4 instrucciones concretas); listo (señal clara de que está listo, sin el prefijo "Listo cuando"); tiempo (30 min o menos, ej. "20 min").
Reglas obligatorias:
- Concreto: cada paso dice qué hacer, con qué y dónde. Mal: "Lleva un registro". Bien: "Lleva un registro semanal de tus sesiones e ingresos: por cada sesión anota fecha, iniciales del cliente, si ya pagó y el monto; cada viernes suma sesiones e ingresos."
- Baja exposición: nada de escribir a desconocidos ni pedir favores en frío. Prefiere preguntas abiertas en grupos de Facebook de su área, cálculos, revisión de ofertas, ajustes al CV, materiales propios.
- Si energia="baja": la semana 1 se titula "Recuperar energía antes de decidir", con descanso y cuidado del cuerpo, e incluye como opción sin presionar la frase: "Si quieres, puedes conversar con una psicóloga".
- Si el margen es negativo: la semana 1 se enfoca en saber cuánto falta y en opciones de ingreso puente que usen sus habilidades favoritas y respeten sus condiciones. (Si además la energía es baja, combina ambos con cuidado en la semana 1.)
- Si tiene proyecto o meta con números o que genere ingresos: incluye un paso para calcular cuántos clientes o ventas necesita por semana.
- Usa sus valores y condiciones (ej.: si eligió "Equilibrio con mi vida personal", la revisión de la semana 4 lo incluye).
- Perfil A: sostener el proyecto sin agotarse; ingresos y orden. Perfil B: identificar roles o condiciones mejores en su área y preparar el movimiento. Perfil C: pasos muy pequeños que devuelvan la sensación de avance.
- Respeta su energía al terminar la jornada: si es "Casi nada", pasos de 15 minutos o menos.
- Nunca recomiendes renunciar impulsivamente. Nunca prometas empleo ni ingresos. No des asesoría financiera profesional.
- Tono de invitación, no de orden ("Te propongo…", "Puedes…"). Tutea. Español de Guatemala, neutro. Sin lenguaje clínico, sin puntajes.
- No incluyas la fecha de revisión; la app la agrega.`;
    const usuario = `Datos de la persona (JSON):\n${JSON.stringify(
      { ...data, margen_negativo: data.margen ? data.margen.margen < 0 : null },
      null, 2,
    )}`;
    const out = await pedirJSON<{ semanas: Semana[] }>(sistema, usuario, "ruta_30_dias", {
      type: "object", additionalProperties: false, required: ["semanas"],
      properties: {
        semanas: {
          type: "array",
          items: {
            type: "object", additionalProperties: false, required: ["titulo", "pasos"],
            properties: {
              titulo: { type: "string" },
              pasos: {
                type: "array",
                items: {
                  type: "object", additionalProperties: false, required: ["titulo", "como", "listo", "tiempo"],
                  properties: {
                    titulo: { type: "string" }, como: { type: "array", items: { type: "string" } },
                    listo: { type: "string" }, tiempo: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    });
    return out.semanas;
  });
