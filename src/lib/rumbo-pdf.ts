import type { Habilidad, Semana } from "./rumbo-ai.functions";

export type DatosPDF = {
  perfilNombre: string; perfilTexto: string; frase: string; interes: string; valores: string[];
  condiciones: string[]; habilidades: Habilidad[]; favoritas: number[]; margen: string | null;
  ruta: Semana[]; fechaRevision: string;
};

const NAVY: [number, number, number] = [11, 31, 75];
const TURQ: [number, number, number] = [43, 227, 229];
const CLARO: [number, number, number] = [232, 248, 249];
const limpiar = (t: string) => t.replace(/[^\u0000-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/g, "").trim();

export async function descargarPDF(d: DatosPDF) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18, ANCHO = W - M * 2;
  let y = 0;

  const encabezado = () => {
    doc.setFillColor(...NAVY); doc.rect(0, 0, W, 22, "F");
    doc.setFillColor(...TURQ); doc.rect(0, 22, W, 1.5, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text("RUMBO Exprés", M, 14);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text("Programa RUMBO · Licda. Angie Mendoza", W - M, 14, { align: "right" });
    y = 34;
  };
  const espacio = (h: number) => { if (y + h > 280) { doc.addPage(); encabezado(); } };
  const titulo = (t: string) => {
    espacio(14); doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text(limpiar(t), M, y); y += 2;
    doc.setDrawColor(...TURQ); doc.setLineWidth(0.8); doc.line(M, y, M + 20, y); y += 6;
  };
  const parrafo = (t: string, o: { bold?: boolean; size?: number; indent?: number } = {}) => {
    doc.setTextColor(40, 50, 70); doc.setFont("helvetica", o.bold ? "bold" : "normal"); doc.setFontSize(o.size ?? 10.5);
    const lineas = doc.splitTextToSize(limpiar(t), ANCHO - (o.indent ?? 0));
    for (const l of lineas) { espacio(6); doc.text(l, M + (o.indent ?? 0), y); y += 5.2; }
    y += 1.5;
  };

  encabezado();
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  doc.text("Mi plan de 30 días", M, y); y += 10;

  titulo(`Tu perfil: ${d.perfilNombre}`); parrafo(d.perfilTexto);
  if (d.frase) {
    const lineas = doc.splitTextToSize(limpiar(d.frase), ANCHO - 10);
    const h = lineas.length * 5.5 + 8; espacio(h);
    doc.setFillColor(...CLARO); doc.roundedRect(M, y - 5, ANCHO, h, 3, 3, "F");
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text(lineas, M + 5, y + 1); y += h + 2;
  }
  titulo("Tus intereses"); parrafo(d.interes);
  titulo("Lo que más valoras"); parrafo(d.valores.join(" · "));
  if (d.condiciones.length) parrafo(`Condiciones que te harían falta: ${d.condiciones.join(" · ")}`);
  if (d.habilidades.length) {
    titulo("Tus habilidades, traducidas");
    d.habilidades.forEach((h, i) => {
      parrafo(`${d.favoritas.includes(i) ? "* " : ""}${h.habilidad}`, { bold: true });
      parrafo(`"${h.frase_cv}"`, { indent: 4 });
      parrafo(`Puestos: ${h.puestos.join(", ")}`, { indent: 4, size: 9.5 });
    });
  }
  if (d.margen) { titulo("Tu margen de estabilidad económica"); parrafo(d.margen); }
  titulo("Tu ruta de 30 días");
  d.ruta.forEach((s, i) => {
    espacio(16); parrafo(`Semana ${i + 1}: ${s.titulo}`, { bold: true, size: 11.5 });
    s.pasos.forEach((p) => {
      parrafo(`${p.titulo} (${p.tiempo})`, { bold: true, indent: 3 });
      parrafo("Cómo hacerlo:", { indent: 3, size: 9.5 });
      p.como.forEach((c) => parrafo(`• ${c}`, { indent: 6, size: 10 }));
      parrafo(`Listo cuando: ${p.listo}`, { indent: 3, size: 10 });
    });
  });
  espacio(14); y += 2;
  parrafo(`Fecha para revisar tu ruta: ${d.fechaRevision}`, { bold: true });
  y += 4;
  parrafo("Si quieres acompañamiento para avanzar, son 4 sesiones contigo y para ti. WhatsApp: +502 5437 2899 · angiemendoza.lovable.app", { size: 9 });
  parrafo("Esta herramienta no reemplaza un proceso terapéutico.", { size: 9 });
  doc.save("mi-plan-rumbo.pdf");
}
