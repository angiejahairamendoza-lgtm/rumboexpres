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
  })).length(4),
  preguntas: z.array(texto).length(2),
});
export type RutaResultado = z.infer<typeof RutaSchema>;
export function validarRuta(salida: unknown, energiaJornada: string): RutaResultado {
  const ruta = RutaSchema.parse(salida);
  const limite = energiaJornada === "Casi nada" ? 15 : 20;
  return { ...ruta, pasos: ruta.pasos.map((p, i) => {
    const maximo = i === 0 ? 5 : limite;
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
      type: "object", additionalProperties: false, required: ["titulo", "proposito", "accion", "tiempo"],
      properties: { titulo: { type: "string" }, proposito: { type: "string" }, accion: { type: "string" }, tiempo: { type: "string" } },
    } },
    preguntas: { type: "array", minItems: 2, maxItems: 2, items: { type: "string" } },
  },
};