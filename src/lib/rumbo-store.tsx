import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Finanzas } from "./rumbo-data";
import { RutaSchema, HabilidadSchema, type Habilidad, type RutaResultado } from "./rumbo-output";

export type Estado = {
  pantalla: string;
  who5: (number | null)[];
  jornada: number | null;
  edad: number | null;
  situacion: number | null;
  crecerEmpresa: string | null;
  necesidad: number | null;
  marcha: number | null;
  proyecto: string;
  anio: number | null;
  claridad: number;
  actividades: number[];
  valores: number[];
  condiciones: number[];
  tareas: string[];
  habilidades: Habilidad[] | null;
  favoritas: number[];
  frase: string;
  finanzas: Finanzas | null;
  finanzasSaltado: boolean;
  ruta: RutaResultado | null;
  rutaFecha: string | null;
  calificacion: number | null;
};

export const estadoInicial = (): Estado => ({
  pantalla: "bienvenida", who5: [null, null, null, null, null], jornada: null, edad: null, situacion: null, crecerEmpresa: null,
  necesidad: null, marcha: null, proyecto: "", anio: null, claridad: 5, actividades: [], valores: [],
  condiciones: [], tareas: ["", "", ""], habilidades: null, favoritas: [], frase: "", finanzas: null,
  finanzasSaltado: false, ruta: null, rutaFecha: null, calificacion: null,
});

const KEY = "rumbo-expres";
/** El avance vence a las 24 horas. */
export const VENCE_MS = 24 * 60 * 60 * 1000;

export function leerGuardado(raw: string | null, ahora = Date.now()): Partial<Estado> | null {
  if (!raw) return null;
  try {
    const g = JSON.parse(raw) as { t?: number; s?: Partial<Estado> };
    if (typeof g.t !== "number" || !g.s || ahora - g.t > VENCE_MS) return null;
    const guardado = { ...g.s };
    // Keep answers and the editable phrase; only recompute outputs from the old format.
    if (guardado.ruta && !RutaSchema.safeParse(guardado.ruta).success) {
      guardado.ruta = null;
      if (guardado.pantalla === "cierre") guardado.pantalla = "ruta";
    }
    if (guardado.habilidades?.some((h) => !HabilidadSchema.safeParse(h).success)) {
      guardado.habilidades = null;
      guardado.ruta = null;
      if (["habilidades", "finanzas", "finanzasRes", "ruta", "cierre"].includes(guardado.pantalla ?? "")) guardado.pantalla = "tareas";
    }
    return guardado;
  } catch { return null; }
}
type Ctx = { s: Estado; set: (p: Partial<Estado>) => void; reset: () => void; listo: boolean };
const C = createContext<Ctx | null>(null);

export function RumboProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Estado>(estadoInicial);
  const [listo, setListo] = useState(false);
  useEffect(() => {
    try {
      const g = leerGuardado(localStorage.getItem(KEY));
      if (g) setS({ ...estadoInicial(), ...g });
      else localStorage.removeItem(KEY);
    } catch { /* almacenamiento no disponible */ }
    setListo(true);
  }, []);
  useEffect(() => {
    if (!listo) return;
    try {
      if (s.pantalla === "bienvenida") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), s }));
    } catch { /* almacenamiento no disponible */ }
  }, [s, listo]);
  return (
    <C.Provider value={{ s, listo, set: (p) => setS((prev) => ({ ...prev, ...p })), reset: () => setS(estadoInicial()) }}>
      {children}
    </C.Provider>
  );
}
export function useRumbo() {
  const c = useContext(C);
  if (!c) throw new Error("RumboProvider faltante");
  return c;
}
