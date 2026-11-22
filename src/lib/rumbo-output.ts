import { z } from "zod";

const texto = z.string().trim().min(1);
export const HabilidadSchema = z.object({
  habilidad: texto, para_que: texto, puestos: z.array(texto).length(4),
});
export type Habilidad = z.infer<typeof HabilidadSchema>;
export const RutaSchema = z.object({
  area_nueva: z.object({ nombre: texto, que_se_hace: texto, por_que_encaja: texto, primer_paso: texto }),
  pasos: z.array(z.object({ titulo: texto, proposito: texto, accion: texto,
    tiempo: texto.refine((v) => /^(?:[1-9]|1\d|20)\s*min$/.test(v), "El tiempo debe ser de 20 min o menos"),
  })).length(4),
  preguntas: z.array(texto).length(2),
});
export type RutaResultado = z.infer<typeof RutaSchema>;
export function validarRuta(salida: unknown, energiaJornada: string): RutaResultado {
  const ruta = RutaSchema.parse(salida);
  const limite = energiaJornada === "Casi nada" ? 15 : 20;
  if (ruta.pasos.some((p) => Number.parseInt(p.tiempo, 10) > limite) || Number.parseInt(ruta.pasos[0]?.tiempo ?? "0", 10) > 5) {
    throw new Error("No pudimos completar este paso ahora. Intenta de nuevo en un momento.");
  }
  return ruta;
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