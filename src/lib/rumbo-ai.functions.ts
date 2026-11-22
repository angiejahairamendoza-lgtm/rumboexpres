import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { HabilidadSchema, validarRuta, HabilidadesJSONSchema, RutaJSONSchema, type Habilidad, type RutaResultado } from "./rumbo-output";
export type { Habilidad, RutaResultado } from "./rumbo-output";

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
- para_que: una sola línea que explique para qué sirve la habilidad y dónde se usa.
- habilidad: usa el nombre completo, como se nombra en el mercado laboral real, sin acortarlo.
- Cada habilidad debe ser distinta. Si dos tareas se parecen, identifica una faceta diferente de la experiencia y dale un nombre distinto, sin repetir habilidades.
- puestos: exactamente 4 puestos donde se usa: 2 dentro de la industria de contact center que no sean de agente (por ejemplo, calidad, capacitación, planificación de personal, back office, soporte de segundo nivel o supervisión) y 2 fuera de la industria (empresas, comercios, salud, educación, oficinas, etc.). Puestos reales y alcanzables en Guatemala con su experiencia.
Español neutro de Guatemala. Sin lenguaje clínico. Devuelve las habilidades en el mismo orden que las tareas recibidas, una por tarea.`;
    const out = await pedirJSON<{ habilidades: Habilidad[] }>(
      sistema,
      `Tareas:\n${data.tareas.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
      "habilidades",
      HabilidadesJSONSchema,
    );
    return z.array(HabilidadSchema).length(data.tareas.length).parse(out.habilidades);
  });

const RutaInput = z.object({
  enlaceEmpresa: z.boolean(),
  crecerEmpresa: z.enum(["Sí", "No", "Todavía no lo sé", ""]),
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
  interesTexto: str(500),
  valores: z.array(str(60)).max(3),
  condiciones: z.array(str(60)).max(2),
  favoritas: z.array(z.string().trim()).max(3),
  frase: z.string().trim(),
  margen: z.object({ ingreso: z.number(), gastos: z.number(), ahorros: z.number(), margen: z.number(), meses: z.number() }).nullable(),
});

export const generarRuta = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RutaInput.parse(d))
  .handler(async ({ data }) => {
    const sistema = `Eres la voz del Programa RUMBO (Licda. Angie Mendoza, psicóloga clínica y orientadora vocacional, Guatemala). Generas una ruta de próximos pasos para el próximo mes (nunca la llames "ruta de 30 días" ni "plan de 30 días") para una persona que trabaja o trabajó en call center.
Formato: devuelve tres partes:
- area_nueva: un área de trabajo poco conocida, real y alcanzable en Guatemala, que encaje con interesTexto, valores y habilidades favoritas. Si crecerEmpresa="Sí" o perfil="B", elige un área dentro de su industria que quizá no conocía (por ejemplo, calidad, capacitación, planificación de personal o análisis de datos). En los demás casos conserva la exploración de un área nueva como hasta ahora. Elige un área distinta de TODAS las áreas ya mencionadas en interesTexto, no una variante o sinónimo. También debe ser realmente distinta de sus tareas actuales: un cambio de industria haciendo la misma atención de reclamos no es un área nueva, pero una función diferente dentro de su industria sí puede serlo. Campos: nombre; que_se_hace (una frase); por_que_encaja (una frase que conecte explícitamente con intereses o habilidades); primer_paso (una frase para conocerla leyendo de qué trata o viendo un video corto, sin imaginar casos ni hacer ejercicios).
- pasos: exactamente 4, uno por semana. Cada paso tiene titulo (foco, sin prefijo Semana ni número), proposito (una línea), accion (una sola instrucción concreta), tiempo (20 min o menos, formato "10 min"). El primer paso es muy fácil, de 5 minutos o menos, incluso cuando hay margen negativo o energía baja.
- preguntas: exactamente 2 preguntas abiertas y personalizadas, en segunda persona, de 20 palabras o menos cada una, sobre un solo tema. Tono cálido, sobre lo que te detiene o necesitarías para decidir con acompañamiento; sin alarmar, lenguaje clínico ni dar la respuesta. No repitas sus cifras de dinero ni menciones su nivel de energía.

Reglas obligatorias:
- Neutralidad: crecer dentro y crecer fuera son igual de válidos. Nunca uses expresiones como "salir del call center" ni presentes quedarse como algo negativo. enlaceEmpresa indica únicamente que llegó por un enlace de empresa; no significa que deba quedarse, ni sustituye su respuesta.
- Si crecerEmpresa="Sí" o perfil="B" (Crecer aquí): al menos 2 pasos se orientan a crecer dentro de su empresa o industria, como identificar un puesto interno que use sus habilidades, conversar con su supervisor sobre su desarrollo o preguntar en Recursos Humanos por vacantes y capacitaciones internas. El área nueva también es interna, como se indicó arriba.
- Si crecerEmpresa="Todavía no lo sé": un paso explora una opción dentro de su empresa o industria y otro una opción fuera, para comparar sin presionar. Si también es perfil B, conserva el área interna y al menos 2 pasos internos, además del paso externo.
- Si crecerEmpresa="No": conserva las reglas de exploración anteriores; si es perfil B también respeta las reglas de ese perfil, sin presionar para quedarse.
- Las reglas de crecimiento respetan las de energía baja y baja exposición: la semana 1 con energía baja sigue siendo SOLO descanso y cuidado; reserva la exploración y las conversaciones para semanas posteriores. Las conversaciones con supervisor o Recursos Humanos son invitaciones opcionales con contactos conocidos y canales internos habituales, nunca mensajes en frío ni pedidos de favores a desconocidos.
- Concreto: cada paso dice qué hacer, con qué y dónde. Mal: "Lleva un registro". Bien: "Lleva un registro semanal de tus sesiones e ingresos: por cada sesión anota fecha, iniciales del cliente, si ya pagó y el monto; cada viernes suma sesiones e ingresos."
- Baja exposición: nada de escribir a desconocidos ni pedir favores en frío. Prefiere preguntas abiertas en grupos de Facebook de su área, cálculos, revisión de ofertas, ajustes al CV, materiales propios.
- Si energia="baja": la semana 1 se titula "Recuperar energía antes de decidir" y es SOLO descanso y cuidado del cuerpo, sin dinero, cifras ni tareas de búsqueda; incluye como opción sin presionar "Si quieres, puedes conversar con una psicóloga".
- Si el margen es negativo y la energía suficiente: la semana 1 empieza por saber cuánto falta y opciones de ingreso puente que usen sus habilidades favoritas y respeten sus condiciones. Si la energía es baja, lo económico empieza en la semana 2, en palabras sencillas; nunca en la semana 1.
- Perfil C con energía baja: las semanas 1 y 2 devuelven la sensación de logro, por ejemplo reconociendo algo que ya hace bien; la semana 1 sigue siendo solo descanso y cuidado. Explorar ofertas de trabajo solo en semanas 3 o 4.
- Números: sin fórmulas ni símbolos matemáticos; explica cualquier cálculo en palabras sencillas y usa solo las cifras que dio la persona. Nunca inventes montos, sueldos ni metas. Tampoco escribas nuevos montos numéricos calculados: invita a comparar sus ingresos y gastos en palabras, sin completar el resultado por ella. Si faltan precios, costos o metas, invita a identificar datos reales antes de calcular. Los tiempos en minutos y el orden de semanas son etiquetas de organización, no cifras financieras.
- Si tiene proyecto o meta con números o que genere ingresos: incluye un paso para calcular cuántos clientes o ventas necesita por semana.
- Usa sus valores y condiciones (ej.: si eligió "Condiciones de trabajo", la revisión de la semana 4 lo incluye).
- Perfil A: sostener el proyecto sin agotarse; ingresos y orden. Perfil B: identificar roles o condiciones mejores en su área y preparar el movimiento. Perfil C: pasos muy pequeños que devuelvan la sensación de avance.
- Respeta su energía al terminar la jornada: si es "Casi nada", pasos de 15 minutos o menos.
- Nunca recomiendes renunciar impulsivamente. Nunca prometas empleo ni ingresos. No des asesoría financiera profesional.
- Al menos un paso relaciona de forma explícita su combinación de intereses (interesTexto) con su meta o con las opciones que explora. Ej.: intereses práctico y organizador con meta de veterinaria: "En veterinaria también hay tareas prácticas y de orden, como el manejo de una clínica o el inventario de medicamentos."
- Voz de psicóloga, en tono de invitación ("Te propongo…", "Puedes…"). Redacta todo en positivo: nada de órdenes en negativo como "No inventes…" o "No hagas…". Si hace falta un cuidado, dilo en positivo (ej.: "Usa solo ejemplos y datos reales de tu experiencia."). Evita aclaraciones que suenen a corrección, como "sin confundirla con…". Tutea. Español de Guatemala, neutro. Sin lenguaje clínico, sin puntajes.
- No incluyas la fecha de revisión; la app la agrega.`;
    const usuario = `Datos de la persona (JSON):\n${JSON.stringify(
      { ...data, margen_negativo: data.margen ? data.margen.margen < 0 : null },
      null, 2,
    )}`;
    const out = await pedirJSON<RutaResultado>(sistema, usuario, "ruta_proximos_pasos", RutaJSONSchema);
    return validarRuta(out, data.energiaJornada);
  });
