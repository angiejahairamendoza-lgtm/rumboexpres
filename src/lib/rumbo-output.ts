import { z } from "zod";

const texto = z.string().trim().min(1);
export const HabilidadSchema = z.object({
  habilidad: texto, para_que: texto, puestos: z.array(texto).length(4),
});
export type Habilidad = z.infer<typeof HabilidadSchema>;
export const RutaSchema = z.object({
  area_nueva: z.object({ nombre: texto, que_se_hace: texto, por_que_encaja: texto, primer_paso: texto }),
  pasos: z.array(z.object({ titulo: texto, proposito: texto, accion: texto,
    tiempo: z.string(),
    subpasos: z.array(texto).min(3).max(4),
    listo: texto,
    preguntas_guia: z.array(texto).min(1).max(2),
  })).length(4),
  preguntas: z.array(texto).length(2),
});
export type RutaResultado = z.infer<typeof RutaSchema>;
/** Límite semanal por paso: 45 min con energía suficiente, 20 con energía baja, 15 con "Casi nada". */
export function limiteMinutos(energia: string, energiaJornada: string, semana: number) {
  if (energia === "baja" && semana === 0) return 5;
  if (energiaJornada === "Casi nada") return 15;
  return energia === "baja" ? 20 : 45;
}
export function validarRuta(salida: unknown, energia: string, energiaJornada: string): RutaResultado {
  const ruta = RutaSchema.parse(salida);
  return { ...ruta, pasos: ruta.pasos.map((p, i) => {
    const maximo = limiteMinutos(energia, energiaJornada, i);
    const numero = Number(p.tiempo.match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(",", "."));
    const minutos = Number.isFinite(numero) && numero > 0 ? Math.min(maximo, Math.max(1, Math.round(numero))) : maximo;
    return { ...p, tiempo: `${minutos} min` };
  }) };
}

export const HabilidadesJSONSchema = {
  type: "object", additionalProperties: false, required: ["habilidades"],
  properties: { habilidades: { type: "array", items: {
    type: "object", additionalProperties: false, required: ["habilidad", "para_que", "puestos"],
    properties: { habilidad: { type: "string" }, para_que: { type: "string" },
      puestos: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } } },
  } } },
};
export const RutaJSONSchema = {
  type: "object", additionalProperties: false, required: ["area_nueva", "pasos", "preguntas"],
  properties: {
    area_nueva: { type: "object", additionalProperties: false,
      required: ["nombre", "que_se_hace", "por_que_encaja", "primer_paso"],
      properties: { nombre: { type: "string" }, que_se_hace: { type: "string" }, por_que_encaja: { type: "string" }, primer_paso: { type: "string" } } },
    pasos: { type: "array", minItems: 4, maxItems: 4, items: {
      type: "object", additionalProperties: false, required: ["titulo", "proposito", "accion", "tiempo", "subpasos", "listo", "preguntas_guia"],
      properties: { titulo: { type: "string" }, proposito: { type: "string" }, accion: { type: "string" }, tiempo: { type: "string" }, subpasos: { type: "array", minItems: 3, maxItems: 4, items: { type: "string" } }, listo: { type: "string" }, preguntas_guia: { type: "array", minItems: 1, maxItems: 2, items: { type: "string" } } },
    } },
    preguntas: { type: "array", minItems: 2, maxItems: 2, items: { type: "string" } },
  },
};