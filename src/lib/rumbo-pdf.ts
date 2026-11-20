import type { Habilidad, Semana } from "./rumbo-ai.functions";

export type DatosPDF = {
  energiaBaja: boolean;
  perfilNombre: string; perfilTexto: string; frase: string; interes: string; valores: string[];
  condiciones: string[]; habilidades: Habilidad[]; favoritas: number[]; margen: string | null;
  ruta: Semana[]; fechaRevision: string;
};

type RGB = [number, number, number];
const NAVY: RGB = [11, 31, 75];
const TURQ: RGB = [43, 227, 229];
const CLARO: RGB = [232, 248, 249];
const TEXTO: RGB = [40, 50, 70];
const GRIS: RGB = [120, 128, 140];
const limpiar = (t: string) => t.replace(/[^\u0000-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/g, "").trim();

export async function descargarPDF(d: DatosPDF) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, H = 297, M = 20, ANCHO = W - M * 2, BASE = H - 22;
  const PT = 0.3528; // mm por punto
  const lh = (size: number) => size * PT * 1.5; // interlineado 1.5
  let y = M;

  const nuevaPagina = () => { doc.addPage(); y = M + 4; };
  const asegurar = (h: number) => { if (y + h > BASE) nuevaPagina(); };
  const lineas = (t: string, size: number, ancho: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    return doc.splitTextToSize(limpiar(t), ancho) as string[];
  };
  const escribir = (ls: string[], x: number, size: number, bold = false, color: RGB = TEXTO) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(...color);
    for (const l of ls) { doc.text(l, x, y); y += lh(size); }
  };
  const parrafo = (t: string, o: { size?: number; bold?: boolean; indent?: number; color?: RGB } = {}) => {
    const size = o.size ?? 11, ls = lineas(t, size, ANCHO - (o.indent ?? 0), o.bold);
    for (const l of ls) { asegurar(lh(size)); escribir([l], M + (o.indent ?? 0), size, o.bold, o.color); }
    y += 1.5;
  };
  const seccion = (t: string, sigue = 20) => {
    y += 9; asegurar(14 + sigue);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...NAVY);
    doc.text(limpiar(t), M, y); y += 2.5;
    doc.setDrawColor(...TURQ); doc.setLineWidth(0.4); doc.line(M, y, W - M, y); y += 7;
  };
  const recuadro = (titulo: string | null, cuerpo: string, o: { tituloSize?: number; cuerpoSize?: number; cuerpoBold?: boolean } = {}) => {
    const P = 6, ts = o.tituloSize ?? 16, cs = o.cuerpoSize ?? 11;
    const tl = titulo ? lineas(titulo, ts, ANCHO - P * 2, true) : [];
    const cl = lineas(cuerpo, cs, ANCHO - P * 2, o.cuerpoBold);
    const h = P * 2 + tl.length * lh(ts) + (tl.length ? 2 : 0) + cl.length * lh(cs);
    asegurar(h);
    doc.setFillColor(...CLARO); doc.roundedRect(M, y, ANCHO, h, 3, 3, "F");
    doc.setFillColor(...TURQ); doc.rect(M, y, 1.5, h, "F");
    y += P + ts * PT;
    if (tl.length) { escribir(tl, M + P, ts, true, NAVY); y += 2; }
    escribir(cl, M + P, cs, o.cuerpoBold, o.cuerpoBold ? NAVY : TEXTO);
    y += P - cs * PT + 2;
  };

  // Encabezado
  doc.setFillColor(...CLARO); doc.rect(0, 0, W, 38, "F");
  doc.setFillColor(...TURQ); doc.rect(0, 38, W, 1, "F");
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text("RUMBO Exprés", M, 18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(13);
  doc.text("Tu ruta de próximos pasos", M, 27);
  doc.setFontSize(10); doc.setTextColor(...GRIS);
  doc.text(new Date().toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }), W - M, 27, { align: "right" });
  y = 44;

  seccion("Tu resultado", 30);
  recuadro(d.perfilNombre, d.perfilTexto);

  seccion("Tu energía");
  parrafo(d.energiaBaja
    ? "En estas semanas tu energía está baja. Es muy común en este trabajo y no es falta de voluntad. Por eso, tu ruta empieza por recuperar energía."
    : "Tienes energía para empezar a moverte, paso a paso y a tu ritmo.");

  seccion("Tus intereses");
  parrafo(d.interes);

  seccion("Valores y condiciones que prefieres");
  parrafo(`Lo que más valoras: ${d.valores.join(" · ")}`);
  if (d.condiciones.length) parrafo(`Condiciones de trabajo que prefieres: ${d.condiciones.join(" · ")}`);

  if (d.habilidades.length) {
    seccion("Tus habilidades traducidas");
    d.habilidades.forEach((h, i) => {
      const fav = d.favoritas.includes(i);
      const tl = lineas(h.habilidad, 11, ANCHO - 6, true), cl = lineas(`"${h.frase_cv}"`, 10.5, ANCHO - 6);
      const pl = lineas(`Puestos: ${h.puestos.join(", ")}`, 9.5, ANCHO - 6);
      asegurar((tl.length + cl.length) * lh(11) + pl.length * lh(9.5) + 4);
      if (fav) {
        // estrella dibujada (la fuente estándar no tiene ★)
        const cx = M + 1.8, cy = y - 1.4, R = 1.9, r = 0.8, pts: [number, number][] = [];
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r : R; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
        doc.setFillColor(...TURQ);
        doc.lines(pts.slice(1).map((p, k) => [p[0] - pts[k]![0], p[1] - pts[k]![1]]), pts[0]![0], pts[0]![1], [1, 1], "F", true);
      } else { doc.setFillColor(...NAVY); doc.circle(M + 1.8, y - 1.4, 0.8, "F"); }
      escribir(tl, M + 6, 11, true, NAVY);
      escribir(cl, M + 6, 10.5);
      escribir(pl, M + 6, 9.5, false, GRIS);
      y += 3;
    });
  }

  if (d.frase) { seccion("Tu frase para presentarte", 24); recuadro(null, d.frase, { cuerpoSize: 13, cuerpoBold: true }); }

  if (d.margen) { seccion("Tu margen de estabilidad económica"); parrafo(d.margen); }

  seccion("Tu ruta de próximos pasos", 40);
  parrafo("Pasos pequeños para el próximo mes, a tu ritmo.", { color: GRIS, size: 10.5 });
  let n = 0;
  d.ruta.forEach((s, i) => {
    s.pasos.forEach((p, j) => {
      n += 1;
      const X = M + 12, A = ANCHO - 12;
      const sem = j === 0 ? lineas(`Semana ${i + 1} · ${s.titulo}`, 9.5, A, true) : [];
      const tl = lineas(`${p.titulo} (${p.tiempo})`, 11.5, A, true);
      const cl = p.como.map((c) => lineas(`•  ${c}`, 10.5, A - 3));
      const ll = lineas(`Listo cuando: ${p.listo}`, 10.5, A, false);
      const h = sem.length * lh(9.5) + tl.length * lh(11.5) + cl.flat().length * lh(10.5) + ll.length * lh(10.5) + 10;
      asegurar(h);
      y += 3;
      doc.setFillColor(...NAVY); doc.circle(M + 4, y - 1.5, 4, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(String(n), M + 4, y - 0.1, { align: "center" });
      if (sem.length) escribir(sem, X, 9.5, true, GRIS);
      escribir(tl, X, 11.5, true, NAVY);
      cl.forEach((c) => escribir(c, X + 3, 10.5));
      escribir(ll, X, 10.5);
      y += 4;
    });
  });

  seccion("Fecha de revisión", 10);
  parrafo(`Vuelve a mirar tu ruta el ${d.fechaRevision}.`, { bold: true, color: NAVY });

  seccion("Si quieres recorrer esta ruta acompañado/a", 30);
  parrafo("Este es un primer paso. En el Programa RUMBO trabajas tu ruta con la Licda. Angie Mendoza, psicóloga y orientadora vocacional, en 4 sesiones en línea.");
  parrafo("WhatsApp 5437-2899 · angiemendoza.lovable.app");
  parrafo("Programa completo: Q1,000.", { size: 9, color: GRIS });
  parrafo("Esta herramienta no reemplaza un proceso terapéutico.", { size: 9, color: GRIS });

  // Pie de página en todas las páginas
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 226, 232); doc.setLineWidth(0.2); doc.line(M, H - 15, W - M, H - 15);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GRIS);
    doc.text("Licda. Angie Mendoza · Psicóloga y orientadora vocacional · Colegiada 6959 · WhatsApp 5437-2899", M, H - 10);
    doc.text(`${i} / ${total}`, W - M, H - 10, { align: "right" });
  }
  doc.save("mi-ruta-rumbo.pdf");
}
