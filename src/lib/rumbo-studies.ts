import type { Estado } from "./rumbo-store";

export const NIVELES_ESTUDIOS = ["Diversificado", "Técnico", "Licenciatura", "Maestría o más"] as const;
export const ESTUDIA_ACTUALMENTE = ["Sí", "No estoy estudiando"] as const;

export function contextoEstudios(s: Estado) {
  return {
    nivelEstudios: s.nivelEstudios ?? "",
    estudiaActualmente: s.estudiaActualmente ?? "",
    titulo: s.carrera.trim(),
    estudiando: s.estudiaActualmente === "Sí" ? s.estudiando.trim() : "",
    avances: s.avances.trim(),
  };
}

/** Only categorical education answers may enter the anonymous result. */
export function datosEstudios(s: Pick<Estado, "nivelEstudios" | "estudiaActualmente">) {
  return { nivel_estudios: s.nivelEstudios, estudia_actualmente: s.estudiaActualmente };
}