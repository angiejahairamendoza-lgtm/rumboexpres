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

export const ENERGIA_JORNADA = ["Mucha", "Algo", "Casi nada"];
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
  { label: "Mejores condiciones en lo que ya hago (rol, horario, desgaste)", perfil: "B" },
  { label: "Que lo que hago me dé suficientes ingresos", perfil: "A", economico: true },
  { label: "Descubrir qué quiero hacer", perfil: "C" },
];
export const EN_MARCHA: { label: string; perfil: Perfil }[] = [
  { label: "Sí: estudio o tengo un proyecto propio", perfil: "A" },
  { label: "Sé qué área o puesto me interesa, pero no he empezado", perfil: "B" },
  { label: "Todavía nada", perfil: "C" },
];
export const UN_ANIO: { label: string; perfil: Perfil }[] = [
  { label: "Tranquilo/a, si mi otro proyecto avanzó", perfil: "A" },
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
  Práctico: "resolver con las manos",
  Investigador: "investigar",
  Creativo: "crear",
  Social: "ayudar",
  Emprendedor: "liderar",
  Organizador: "organizar",
};
const GUSTO: Record<Tipo, string> = {
  Práctico: "hacer que las cosas funcionen",
  Investigador: "entender las cosas a fondo",
  Creativo: "imaginar formas nuevas de hacerlas",
  Social: "apoyar a otras personas",
  Emprendedor: "mover a otros hacia una meta",
  Organizador: "ponerlas en orden",
};
const AREAS: Record<string, string> = {
  "Práctico|Investigador": "soporte técnico de segundo nivel, mantenimiento de sistemas, control de calidad técnico y diagnóstico de equipos",
  "Práctico|Creativo": "producción audiovisual, fotografía, diseño de espacios y elaboración de productos artesanales",
  "Práctico|Social": "soporte técnico en sitio, capacitación práctica, servicios de salud y atención técnica a clientes",
  "Práctico|Emprendedor": "servicios técnicos por cuenta propia, ventas técnicas, coordinación de instalaciones y logística",
  "Práctico|Organizador": "inventarios, logística, administración de bodegas y control de procesos operativos",
  "Investigador|Creativo": "investigación de usuarios (UX research), análisis de contenido, marketing digital y redacción técnica",
  "Investigador|Social": "gestión de casos, investigación social, orientación a usuarios y análisis de experiencia del cliente",
  "Investigador|Emprendedor": "análisis de negocio, inteligencia comercial, consultoría y planificación estratégica",
  "Investigador|Organizador": "análisis de calidad, gestión de casos, investigación aplicada y administración de servicios",
  "Creativo|Social": "capacitación, diseño de contenidos educativos, comunicación interna y gestión de comunidades",
  "Creativo|Emprendedor": "marketing, emprendimiento de contenido, ventas creativas y desarrollo de marca",
  "Creativo|Organizador": "gestión de redes sociales, producción de contenido, diseño de procesos y documentación",
  "Social|Emprendedor": "liderazgo de equipos, reclutamiento, ventas consultivas y experiencia del cliente",
  "Social|Organizador": "recursos humanos, administración educativa, coordinación de servicios y atención a pacientes",
  "Emprendedor|Organizador": "supervisión de operaciones, gestión de proyectos, administración y workforce management",
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

export function interesTexto(a: Tipo, b: Tipo) {
  const [x, y] = TIPOS.indexOf(a) < TIPOS.indexOf(b) ? [a, b] : [b, a];
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(VERBO[x])} y ${VERBO[y]}: te atrae ${GUSTO[x]} y ${GUSTO[y]}. Se combinan en ${AREAS[`${x}|${y}`]}.`;
}

export const VALORES = [
  "Estabilidad económica", "Autonomía", "Ayudar a otros", "Aprender y crecer", "Reconocimiento",
  "Equilibrio con mi vida personal", "Crear cosas nuevas", "Trabajar en equipo", "Prestaciones y seguridad",
];
export const CONDICIONES = [
  "Sin monitoreo constante", "Horario fijo", "Trabajo remoto", "Menos llamadas", "Un espacio tranquilo",
  "Ingresos más altos aunque sean variables",
];
export const EJEMPLOS_TAREAS = [
  "Calmo a clientes molestos", "Manejo varios sistemas a la vez", "Cumplo metas de tiempo y calidad",
  "Atiendo en inglés", "Capacito a compañeros nuevos",
];

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

export const WHATSAPP = "https://wa.me/50254372899";
export const WEB = "https://angiemendoza.lovable.app";
