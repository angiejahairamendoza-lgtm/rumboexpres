export const FRECUENCIA = [
  { label: "Todo el tiempo", value: 5 },
  { label: "Casi todos los días", value: 4 },
  { label: "Bastantes días", value: 3 },
  { label: "Algunos días", value: 2 },
  { label: "Pocas veces", value: 1 },
  { label: "Nunca", value: 0 },
];

export const WHO5 = [
  "Me he sentido alegre y de buen humor.",
  "Me he sentido tranquilo/a y relajado/a.",
  "Me he sentido activo/a y con energía.",
  "Me he despertado fresco/a y descansado/a.",
  "Mi vida diaria ha tenido cosas que me interesan.",
];

export const ENERGIA_JORNADA = ["Mucha", "Media", "Casi nada"];
export const EDADES = ["18–24", "25–29", "30–34", "35–39", "40 o más"];
export const SITUACIONES = [
  "Trabajo en un call center",
  "Dejé el call center y tengo otro empleo",
  "Dejé el call center y trabajo por mi cuenta (servicios, negocio propio)",
  "Dejé el call center y estoy buscando trabajo",
];

export type Perfil = "A" | "B" | "C";

export const NECESIDADES: { label: string; perfil: Perfil; economico?: boolean }[] = [
  { label: "Avanzar hacia una meta que ya tengo", perfil: "A" },
  { label: "Un mejor puesto, horario o menos desgaste en el trabajo que ya tengo", perfil: "B" },
  { label: "Que lo que hago me dé suficientes ingresos", perfil: "A", economico: true },
  { label: "Descubrir qué quiero hacer", perfil: "C" },
];
export const EN_MARCHA: { label: string; perfil: Perfil }[] = [
  { label: "Sí: estudio o tengo un proyecto propio", perfil: "A" },
  { label: "Sé qué área o puesto me interesa, pero no he avanzado", perfil: "B" },
  { label: "Todavía nada", perfil: "C" },
];
export const UN_ANIO: { label: string; perfil: Perfil }[] = [
  { label: "Tranquilo/a, si mi proyecto avanzó", perfil: "A" },
  { label: "Con ganas de moverme a otra área", perfil: "B" },
  { label: "Estancado/a, sin avanzar nada", perfil: "C" },
  { label: "No lo he pensado", perfil: "C" },
];

export const PERFIL_NOMBRE: Record<Perfil, string> = {
  A: "Trampolín",
  B: "Crecer aquí",
  C: "Buscando rumbo",
};

export function perfilTexto(p: Perfil, economico: boolean) {
  if (p === "A")
    return economico
      ? "Ya tienes algo en marcha y lo estás impulsando. Tu reto es que lo que haces se sostenga económicamente, sin agotarte en el camino."
      : "Ya tienes algo en marcha y lo estás impulsando. Tu reto es que se sostenga, sin agotarte en el camino.";
  if (p === "B") return "Quieres seguir en tu área, en un rol o con condiciones que te desgasten menos.";
  return "Todavía no ves con claridad tu siguiente paso, y está bien empezar desde aquí. Tu ruta va a ir con pasos pequeños que te devuelvan la sensación de avance.";
}

/** Perfil con más puntos; empate: gana la pregunta 3 (necesidad). */
export function calcularPerfil(necesidad: number, marcha: number, anio: number): Perfil {
  const q3 = NECESIDADES[necesidad]?.perfil ?? "C";
  const votos = [q3, EN_MARCHA[marcha]?.perfil ?? "C", UN_ANIO[anio]?.perfil ?? "C"];
  const cuenta: Record<Perfil, number> = { A: 0, B: 0, C: 0 };
  votos.forEach((v) => (cuenta[v] += 1));
  const max = Math.max(cuenta.A, cuenta.B, cuenta.C);
  const empatados = (["A", "B", "C"] as Perfil[]).filter((p) => cuenta[p] === max);
  if (empatados.length === 1) return empatados[0]!;
  return empatados.includes(q3) ? q3 : empatados[0]!;
}

export function calcularEnergia(who5: number[]): "baja" | "suficiente" {
  const suma = who5.reduce((a, b) => a + b, 0);
  return suma < 13 ? "baja" : "suficiente";
}

export type Tipo = "Práctico" | "Investigador" | "Creativo" | "Social" | "Emprendedor" | "Organizador";
export const TIPOS: Tipo[] = ["Práctico", "Investigador", "Creativo", "Social", "Emprendedor", "Organizador"];

export const ACTIVIDADES: { label: string; tipo: Tipo }[] = [
  { label: "Arreglar o configurar equipos y aparatos", tipo: "Práctico" },
  { label: "Trabajar con las manos o con herramientas", tipo: "Práctico" },
  { label: "Investigar por qué pasa un problema hasta encontrar la causa", tipo: "Investigador" },
  { label: "Analizar datos o números para sacar conclusiones", tipo: "Investigador" },
  { label: "Escribir, diseñar o crear contenido", tipo: "Creativo" },
  { label: "Proponer ideas nuevas o formas distintas de hacer las cosas", tipo: "Creativo" },
  { label: "Explicarle a alguien cómo resolver un problema", tipo: "Social" },
  { label: "Acompañar a personas en momentos difíciles", tipo: "Social" },
  { label: "Convencer, negociar o vender una idea", tipo: "Emprendedor" },
  { label: "Coordinar a un equipo y tomar decisiones", tipo: "Emprendedor" },
  { label: "Revisar que un proceso se haga sin errores", tipo: "Organizador" },
  { label: "Llevar registros, archivos o agendas en orden", tipo: "Organizador" },
];

const VERBO: Record<Tipo, string> = {
  Práctico: "hacer con las manos",
  Investigador: "investigar",
  Creativo: "crear",
  Social: "ayudar",
  Emprendedor: "influir",
  Organizador: "organizar",
};
const GUSTO: Record<Tipo, string> = {
  Práctico: "hacer que las cosas funcionen",
  Investigador: "entender a fondo por qué pasan las cosas",
  Creativo: "imaginar formas nuevas de hacer o expresar algo",
  Social: "apoyar y acompañar a otras personas",
  Emprendedor: "convencer y mover a otros hacia una meta",
  Organizador: "poner orden en datos, procesos y detalles",
};
const AREAS: Record<string, string> = {
  "Práctico|Investigador": "soporte técnico de segundo nivel, mantenimiento de sistemas y redes, control de calidad técnico, diagnóstico y reparación de equipos",
  "Práctico|Creativo": "producción audiovisual, fotografía, diseño de espacios, productos artesanales o gastronómicos",
  "Práctico|Social": "soporte técnico en sitio, instrucción técnica práctica, auxiliar de enfermería o terapia física, servicio técnico al cliente",
  "Práctico|Emprendedor": "negocio propio de servicios técnicos, ventas técnicas, coordinación de instalaciones, supervisión de cuadrillas",
  "Práctico|Organizador": "control de inventarios, administración de bodegas, logística y despacho, control de procesos operativos",
  "Investigador|Creativo": "investigación de usuarios (UX research), diseño de experiencia (UX), análisis y visualización de datos, redacción técnica",
  "Investigador|Social": "investigación social, análisis de experiencia del cliente (CX), asesoría especializada, educación en salud",
  "Investigador|Emprendedor": "análisis de negocio, inteligencia comercial, consultoría, planificación estratégica",
  "Investigador|Organizador": "aseguramiento de calidad (QA), análisis de datos y reportes, investigación aplicada, auditoría de procesos",
  "Creativo|Social": "capacitación, diseño de contenidos educativos, comunicación interna, gestión de comunidades",
  "Creativo|Emprendedor": "marketing, creación de contenido como negocio, ventas creativas, desarrollo de marca",
  "Creativo|Organizador": "gestión de redes sociales, calendario y producción de contenido, diseño instruccional, bases de conocimiento",
  "Social|Emprendedor": "liderazgo de equipos, reclutamiento, ventas consultivas, éxito del cliente (customer success)",
  "Social|Organizador": "recursos humanos, administración educativa, coordinación de servicios, gestión de casos",
  "Emprendedor|Organizador": "supervisión de operaciones, gestión de proyectos, administración, planificación de personal (workforce management)",
};

export function topTipos(marcadas: number[]): [Tipo, Tipo] {
  const cuenta = new Map<Tipo, number>(TIPOS.map((t) => [t, 0]));
  marcadas.forEach((i) => {
    const t = ACTIVIDADES[i]?.tipo;
    if (t) cuenta.set(t, (cuenta.get(t) ?? 0) + 1);
  });
  const orden = [...TIPOS].sort((a, b) => (cuenta.get(b)! - cuenta.get(a)!) || TIPOS.indexOf(a) - TIPOS.indexOf(b));
  return [orden[0]!, orden[1]!];
}

/** "e" en lugar de "y" cuando la palabra siguiente suena "i" (i-, hi-). */
export function conjuncion(siguiente: string) {
  return /^(hi|i)/i.test(siguiente.trim()) ? "e" : "y";
}

/** Combinaciones poco frecuentes: intereses que se contraponen. */
const OPUESTOS = new Set(["Práctico|Social", "Investigador|Emprendedor", "Creativo|Organizador"]);

export function interesTexto(a: Tipo, b: Tipo) {
  const [x, y] = TIPOS.indexOf(a) < TIPOS.indexOf(b) ? [a, b] : [b, a];
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const clave = `${x}|${y}`;
  const puente = OPUESTOS.has(clave)
    ? " Tienes intereses que pocas personas combinan; eso puede ser una ventaja en roles puente."
    : "";
  return (
    `${cap(VERBO[x])} ${conjuncion(VERBO[y])} ${VERBO[y]}: ` +
    `te atrae ${GUSTO[x]} ${conjuncion(GUSTO[y])} ${GUSTO[y]}. ` +
    `Se combinan en ${AREAS[clave]}.${puente} ` +
    "Estos son ejemplos, no un destino. Tu combinación puede vivirse en muchos trabajos distintos."
  );
}

export const VALORES = [
  "Logro", "Independencia", "Reconocimiento", "Relaciones", "Apoyo", "Condiciones de trabajo",
];
export const VALORES_DESCRIPCIONES = [
  "usar tus capacidades y sentir que logras algo.",
  "trabajar con autonomía y tomar tus propias decisiones.",
  "crecer, avanzar y que se valore tu trabajo.",
  "buen ambiente con tus compañeros y ayudar a otras personas.",
  "una empresa y jefes que respaldan y tratan bien a su personal.",
  "seguridad laboral, buen salario y un horario adecuado.",
];
export const MAX_VALORES = 3;
export const CRECER_EMPRESA = ["Sí", "No", "Todavía no lo sé"];
export function aplicaCrecerEmpresa(situacion: number | null) {
  return situacion === 0 || situacion === 1;
}
export function respuestaCrecerEmpresa(situacion: number | null, respuesta: string | null) {
  return aplicaCrecerEmpresa(situacion) && respuesta !== null && CRECER_EMPRESA.includes(respuesta) ? respuesta : null;
}
export function elegirValor(elegidos: number[], indice: number) {
  return elegidos.includes(indice) ? elegidos.filter((i) => i !== indice)
    : elegidos.length < MAX_VALORES && VALORES[indice] ? [...elegidos, indice] : elegidos;
}
export const FUENTES = {
  bienestar: "Basado en el Índice de Bienestar WHO-5 de la Organización Mundial de la Salud (OMS).",
  intereses: "Basado en el modelo de intereses vocacionales de Holland (RIASEC).",
  valores: "Basado en los valores de trabajo de O*NET.",
  investigacion: "Basado en la investigación «Supervivencia o autorrealización: permanencia, transición y proyecto de vida en trabajadores de call center», Licda. Angie Mendoza (2026).",
};
export const CONDICIONES = [
  "Libertad y privacidad", "Horario fijo", "Trabajo remoto", "Menos llamadas", "Un espacio tranquilo",
  "Ingresos más altos aunque sean variables",
];
export const EJEMPLOS_TAREAS = ["Calmo a clientes molestos", "Atiendo en inglés"];

/** Frase para presentarse: con las favoritas si las hay; si no, con las primeras habilidades. */
export function frasePresentacion(habilidades: string[], favoritas: number[]) {
  const idx = favoritas.length ? favoritas : habilidades.slice(0, 3).map((_, i) => i);
  const n = idx.map((i) => habilidades[i]?.trim() ?? "").filter(Boolean).map((h) => h.charAt(0).toLowerCase() + h.slice(1));
  if (!n.length) return "";
  const ultima = n[n.length - 1]!;
  const conY = n.length > 2 && n.some((h) => /\s(y|e)\s/.test(h));
  const lista = n.length === 1 ? ultima : `${n.slice(0, -1).join(", ")}${conY ? "," : ""} ${conjuncion(ultima)} ${ultima}`;
  return `Tengo experiencia en ${lista}.`;
}

/** Quita el prefijo "Semana N:" / "Semana N -" que a veces trae el título de la IA. */
export function tituloSemana(t: string) {
  return t.replace(/^\s*semana\s*\d+\s*[:.\-–—·]?\s*/i, "").trim() || t.trim();
}

export type Finanzas = { ingreso: number; gastos: number; ahorros: number };
export function calcularMargen(f: Finanzas) {
  const margen = f.ingreso - f.gastos;
  const meses = f.gastos > 0 ? f.ahorros / f.gastos : 0;
  return { margen, meses };
}
const q = (n: number) => Math.round(n).toLocaleString("es-GT");
export function margenTexto(f: Finanzas) {
  const { margen, meses } = calcularMargen(f);
  if (margen >= 0)
    return `Cada mes te quedan unos Q${q(margen)} después de tus gastos fijos, y tus ahorros te darían unos ${meses.toLocaleString("es-GT", { maximumFractionDigits: 1 })} meses de respaldo.`;
  return `Hoy tus gastos fijos superan tus ingresos por unos Q${q(Math.abs(margen))} al mes${f.ahorros <= 0 ? ", y no hay ahorro de respaldo" : ""}. Esto no habla de tu capacidad; habla de por dónde conviene empezar tu ruta.`;
}

export function fechaRevision(hoy = new Date()) {
  const d = new Date(hoy);
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });
}

export const WHATSAPP = "https://wa.me/50254372899?text=" + encodeURIComponent("Hola, Licda. Angie. Hice la ruta de RUMBO Exprés y me gustaría seguir el proceso con usted.");
export const WEB = "https://angiemendoza.lovable.app";
