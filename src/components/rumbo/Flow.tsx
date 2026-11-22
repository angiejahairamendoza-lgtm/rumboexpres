import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Download, Loader2, MessageCircle, RotateCcw, Star, Globe, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useRumbo, type Estado } from "@/lib/rumbo-store";
import * as D from "@/lib/rumbo-data";
import { traducirHabilidades, generarRuta } from "@/lib/rumbo-ai.functions";
import { descargarPDF } from "@/lib/rumbo-pdf";
import { supabase } from "@/integrations/supabase/client";
import { datosCrecimiento, registrarClicWhatsApp } from "@/lib/rumbo-results";

type Id =
  | "bienvenida" | "energia" | "jornada" | "energiaBaja" | "edad" | "situacion" | "crecerEmpresa" | "necesidad" | "marcha"
  | "anio" | "claridad" | "perfil" | "actividades" | "interesRes" | "valores" | "condiciones" | "tareas"
  | "habilidades" | "finanzas" | "finanzasRes" | "ruta" | "cierre";

const PASO: Record<Id, number> = {
  bienvenida: 0, energia: 1, jornada: 1, energiaBaja: 1, edad: 2, situacion: 2, crecerEmpresa: 2, necesidad: 2, marcha: 2,
  anio: 2, claridad: 2, perfil: 2, actividades: 3, interesRes: 3, valores: 3, condiciones: 3, tareas: 4,
  habilidades: 4, finanzas: 5, finanzasRes: 5, ruta: 6, cierre: 7,
};

function pantallas(s: Estado): Id[] {
  const energia = s.who5.every((v) => v !== null) ? D.calcularEnergia(s.who5 as number[]) : null;
  const l: Id[] = ["bienvenida", "energia", "jornada"];
  if (energia === "baja") l.push("energiaBaja");
  l.push("edad", "situacion");
  if (D.aplicaCrecerEmpresa(s.situacion)) l.push("crecerEmpresa");
  l.push("necesidad", "marcha", "anio", "claridad", "perfil", "actividades", "interesRes",
    "valores", "condiciones", "tareas", "habilidades", "finanzas");
  if (s.finanzas) l.push("finanzasRes");
  l.push("ruta", "cierre");
  return l;
}

export function derivados(s: Estado) {
  const energia = s.who5.every((v) => v !== null) ? D.calcularEnergia(s.who5 as number[]) : "suficiente";
  const perfil = D.calcularPerfil(s.necesidad ?? 3, s.marcha ?? 2, s.anio ?? 3);
  const economico = !!D.NECESIDADES[s.necesidad ?? -1]?.economico;
  const [t1, t2] = D.topTipos(s.actividades);
  return { energia, perfil, economico, t1, t2, interes: D.interesTexto(t1, t2) };
}

export function Flow({ empresa }: { empresa: string | null }) {
  const { s, set, listo, reset } = useRumbo();
  const [confirmarReset, setConfirmarReset] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const onWhatsApp = () => { void registrarClicWhatsApp(empresa, derivados(s).perfil); };
  const descargarAntes = async () => {
    setDescargando(true);
    try { await descargarResumen(s); setConfirmarReset(false); }
    finally { setDescargando(false); }
  };
  const lista = useMemo(() => pantallas(s), [s]);
  const id = (lista.includes(s.pantalla as Id) ? s.pantalla : "bienvenida") as Id;
  const idx = lista.indexOf(id);
  const ir = (to: Id) => { set({ pantalla: to }); window.scrollTo({ top: 0 }); };
  const siguiente = (desde?: Partial<Estado>) => {
    const nuevo = { ...s, ...desde };
    const l = pantallas(nuevo);
    const n = l[l.indexOf(id) + 1];
    set({ ...desde, pantalla: n ?? id });
    window.scrollTo({ top: 0 });
  };
  const atras = () => { const p = lista[idx - 1]; if (p) ir(p); };
  const paso = PASO[id];

  if (!listo) return <div className="min-h-dvh" />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5">
      <header className="pt-5">
        <div className="flex items-center justify-between gap-3">
          {idx > 0 ? (
            <Button variant="quiet" size="sm" onClick={atras} className="-ml-2"><ArrowLeft /> Atrás</Button>
          ) : <span className="text-sm font-extrabold tracking-wide">RUMBO <span className="text-primary">Exprés</span></span>}
          {paso >= 1 && paso <= 6 && <span className="text-xs font-bold text-muted-foreground">Paso {paso} de 6</span>}
        </div>
        {idx > 0 && (
          <div className="mt-1 text-right">
            <Button variant="quiet" size="sm" onClick={() => setConfirmarReset(true)} className="h-auto p-0 text-xs font-normal text-muted-foreground underline underline-offset-4">Empezar de nuevo</Button>
          </div>
        )}
        {paso >= 1 && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-field" role="progressbar" aria-valuemin={0} aria-valuemax={6} aria-valuenow={Math.min(paso, 6)}>
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(Math.min(paso, 6) / 6) * 100}%` }} />
          </div>
        )}
      </header>
      <main key={id} className="screen-in flex-1 py-7">
        <Pantalla id={id} siguiente={siguiente} empresa={empresa} onReset={() => setConfirmarReset(true)} onWhatsApp={onWhatsApp} />
      </main>
      <PieAyuda onWhatsApp={onWhatsApp} />
      <Dialog open={confirmarReset} onOpenChange={setConfirmarReset}>
        <DialogContent className="max-w-sm rounded-2xl" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{id === "cierre" ? "¿Ya descargaste tu PDF? Si empiezas de nuevo, se borra tu resultado." : "¿Quieres empezar de nuevo?"}</DialogTitle></DialogHeader>
          {id === "cierre" ? <Button variant="soft" onClick={descargarAntes} disabled={descargando}>{descargando ? <Loader2 className="animate-spin" /> : <Download />} Descargar PDF</Button>
            : <Button variant="soft" onClick={() => setConfirmarReset(false)}>Cancelar</Button>}
          <Button variant="hero" disabled={descargando} onClick={() => { reset(); setConfirmarReset(false); window.scrollTo({ top: 0 }); }}>{id === "cierre" ? "Sí, empezar de nuevo" : "Sí"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Titulo({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-extrabold leading-tight">{children}</h1>
      {sub && <p className="mt-2 text-muted-foreground">{sub}</p>}
    </div>
  );
}
function Opcion({ on, onClick, children, multi }: { on: boolean; onClick: () => void; children: ReactNode; multi?: boolean }) {
  return (
    <button type="button" className="option" data-on={on} onClick={onClick} aria-pressed={on}>
      <span className={`grid size-5 shrink-0 place-items-center border-2 border-primary ${multi ? "rounded-md" : "rounded-full"} ${on ? "bg-primary" : "bg-background"}`}>
        {on && <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </button>
  );
}
function Continuar({ disabled, onClick, children = "Continuar" }: { disabled?: boolean; onClick: () => void; children?: ReactNode }) {
  return <div className="mt-8"><Button variant="hero" size="xl" disabled={disabled} onClick={onClick}>{children}</Button></div>;
}
function UnaOpcion({ titulo, sub, opciones, valor, onPick }: { titulo: ReactNode; sub?: string; opciones: string[]; valor: number | null; onPick: (i: number) => void }) {
  return (
    <>
      <Titulo sub={sub}>{titulo}</Titulo>
      <div className="space-y-3">
        {opciones.map((o, i) => <Opcion key={o} on={valor === i} onClick={() => onPick(i)}>{o}</Opcion>)}
      </div>
    </>
  );
}
const toggle = (arr: number[], i: number, max: number) =>
  arr.includes(i) ? arr.filter((x) => x !== i) : arr.length < max ? [...arr, i] : arr;

function Fuente({ texto }: { texto: string }) {
  return <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{texto}</p>;
}

function Pantalla({ id, siguiente, empresa, onReset, onWhatsApp }: { id: Id; siguiente: (p?: Partial<Estado>) => void; empresa: string | null; onReset: () => void; onWhatsApp: () => void }) {
  const { s, set } = useRumbo();
  const d = derivados(s);

  switch (id) {
    case "bienvenida":
      return (
        <>
          <p className="mb-4 inline-block rounded-full bg-field px-3 py-1 text-xs font-bold">RUMBO Exprés · unos 25 minutos</p>
          <h1 className="text-[1.7rem] font-extrabold leading-tight">Las habilidades que usas en tu trabajo de call center son muy valiosas en muchas industrias.</h1>
          <p className="mt-4 text-lg">En unos 25 minutos vas a ver lo que sí sabes hacer y vas a salir con tu ruta de próximos pasos. No necesitas cuenta. No guardamos tu nombre.</p>
          <p className="mt-3 font-bold">Es gratis y es tuya. No te pediremos datos de pago.</p>
          <div className="mt-6 rounded-2xl border-l-4 border-primary bg-field p-4 text-sm text-muted-foreground">
            Tus resultados se basan en el Programa RUMBO, creado por una psicóloga clínica. Usamos inteligencia artificial solo para redactarlos. Tu avance se guarda solo en este dispositivo por 24 horas y no se envía a nadie. Esta herramienta no reemplaza un proceso terapéutico.
          </div>
          <Continuar onClick={() => siguiente()}>Empezar</Continuar>
        </>
      );

    case "energia":
      return (
        <>
          <Titulo sub="Elige lo que más se parezca a cómo te has sentido.">¿Cómo está tu energía?</Titulo>
          <p className="mb-4 font-bold">En las últimas dos semanas…</p>
          <div className="space-y-6">
            {D.WHO5.map((frase, i) => (
              <fieldset key={frase}>
                <legend className="mb-2 font-semibold">{i + 1}. {frase}</legend>
                <div className="grid grid-cols-2 gap-2">
                  {D.FRECUENCIA.map((f) => {
                    const on = s.who5[i] === f.value;
                    return (
                      <button key={f.label} type="button" data-on={on} aria-pressed={on} className="option justify-center px-2 py-2.5 text-center text-sm"
                        onClick={() => { const w = [...s.who5]; w[i] = f.value; set({ who5: w }); }}>{f.label}</button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <Fuente texto={D.FUENTES.bienestar} />
          <Continuar disabled={s.who5.some((v) => v === null)} onClick={() => siguiente()} />
        </>
      );

    case "jornada":
      return (
        <>
          <UnaOpcion titulo="Al terminar tu jornada, ¿cuánta energía te queda para tus propios planes?" opciones={D.ENERGIA_JORNADA} valor={s.jornada} onPick={(i) => set({ jornada: i })} />
          <Continuar disabled={s.jornada === null} onClick={() => siguiente()} />
        </>
      );

    case "energiaBaja":
      return (
        <>
          <div className="rounded-3xl bg-field p-6">
            <p className="text-xl font-bold leading-snug">Lo que sientes es muy común en este trabajo y tiene sentido. No es falta de voluntad: es cansancio acumulado. Por eso, tu ruta empieza por recuperar energía.</p>
          </div>
          <Continuar onClick={() => siguiente()} />
        </>
      );

    case "edad":
      return (<><UnaOpcion titulo="Tu situación y tu punto de partida" sub="¿Qué edad tienes?" opciones={D.EDADES} valor={s.edad} onPick={(i) => set({ edad: i })} /><Continuar disabled={s.edad === null} onClick={() => siguiente()} /></>);
    case "situacion":
      return (<><UnaOpcion titulo="¿Cuál es tu situación hoy?" opciones={D.SITUACIONES} valor={s.situacion} onPick={(i) => set({ situacion: i, crecerEmpresa: null })} /><Continuar disabled={s.situacion === null} onClick={() => siguiente()} /></>);
    case "crecerEmpresa":
      return (<><UnaOpcion titulo="¿Te gustaría crecer dentro de la empresa donde trabajas?" opciones={D.CRECER_EMPRESA} valor={s.crecerEmpresa === null ? null : D.CRECER_EMPRESA.indexOf(s.crecerEmpresa)} onPick={(i) => set({ crecerEmpresa: D.CRECER_EMPRESA[i] ?? null })} /><Continuar disabled={s.crecerEmpresa === null} onClick={() => siguiente()} /></>);
    case "necesidad":
      return (<><UnaOpcion titulo="¿Qué es lo que más necesitas ahora?" opciones={D.NECESIDADES.map((n) => n.label)} valor={s.necesidad} onPick={(i) => set({ necesidad: i })} /><Continuar disabled={s.necesidad === null} onClick={() => siguiente()} /></>);
    case "marcha":
      return (
        <>
          <UnaOpcion titulo="¿Tienes algo en marcha para crecer profesionalmente?" opciones={D.EN_MARCHA.map((n) => n.label)} valor={s.marcha} onPick={(i) => set({ marcha: i })} />
          {s.marcha === 0 && (
            <label className="mt-5 block">
              <span className="mb-2 block font-semibold">¿Cuál es tu proyecto o meta? (en una línea)</span>
              <input className="field" maxLength={160} value={s.proyecto} onChange={(e) => set({ proyecto: e.target.value })} placeholder="Ej.: Terminar mi técnico en enfermería" />
            </label>
          )}
          <Continuar disabled={s.marcha === null} onClick={() => siguiente(s.marcha === 0 ? {} : { proyecto: "" })} />
        </>
      );
    case "anio":
      return (<><UnaOpcion titulo="Si en un año siguieras igual que hoy, te sentirías…" opciones={D.UN_ANIO.map((n) => n.label)} valor={s.anio} onPick={(i) => set({ anio: i })} /><Continuar disabled={s.anio === null} onClick={() => siguiente()} /></>);
    case "claridad":
      return (
        <>
          <Titulo>Del 0 al 10, ¿qué tan claro tienes tu siguiente paso para crecer profesionalmente?</Titulo>
          <div className="rounded-2xl bg-field p-6">
            <p className="mb-5 text-center text-5xl font-extrabold">{s.claridad}</p>
            <Slider min={0} max={10} step={1} value={[s.claridad]} onValueChange={(v) => set({ claridad: v[0] ?? 0 })} aria-label="Claridad del 0 al 10" />
            <div className="mt-3 flex justify-between text-xs font-bold text-muted-foreground"><span>Nada claro</span><span>Muy claro</span></div>
          </div>
          <Continuar onClick={() => siguiente()} />
        </>
      );
    case "perfil":
      return (
        <>
          <section className="rounded-3xl border-2 border-primary bg-field p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tu resultado</p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-foreground">{D.PERFIL_NOMBRE[d.perfil]}</h1>
            <p className="mt-4 text-lg leading-relaxed">{D.perfilTexto(d.perfil, d.economico)}</p>
          </section>
          <Continuar onClick={() => siguiente()} />
        </>
      );

    case "actividades":
      return (
        <>
          <Titulo sub={`${s.actividades.length} de 4`}>Marca las 4 actividades que más disfrutarías hacer.</Titulo>
          <div className="space-y-2.5">
            {D.ACTIVIDADES.map((a, i) => <Opcion multi key={a.label} on={s.actividades.includes(i)} onClick={() => set({ actividades: toggle(s.actividades, i, 4) })}>{a.label}</Opcion>)}
          </div>
          <Continuar disabled={s.actividades.length !== 4} onClick={() => siguiente()} />
        </>
      );
    case "interesRes":
      return (
        <>
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tus intereses</p>
          <h1 className="mt-1 text-3xl font-extrabold">{d.t1} + {d.t2}</h1>
          <p className="mt-4 rounded-2xl bg-field p-5 text-lg">{d.interes}</p>
          <Fuente texto={D.FUENTES.intereses} />
          <Continuar onClick={() => siguiente()} />
        </>
      );
    case "valores":
      return (
        <>
          <Titulo sub={`${s.valores.length} de 3`}>¿Qué es lo que más valoras en un trabajo? Elige 3.</Titulo>
          <div className="space-y-2.5">{D.VALORES.map((v, i) => <Opcion multi key={v} on={s.valores.includes(i)} onClick={() => set({ valores: D.elegirValor(s.valores, i) })}><span className="block font-semibold">{v}</span><span className="mt-1 block text-sm text-muted-foreground">{D.VALORES_DESCRIPCIONES[i]}</span></Opcion>)}</div>
          <Fuente texto={D.FUENTES.valores} />
          <Continuar disabled={s.valores.length !== 3} onClick={() => siguiente()} />
        </>
      );
    case "condiciones":
      return (
        <>
          <Titulo>¿Qué condiciones de trabajo prefieres? Elige hasta 2.</Titulo>
          <div className="space-y-2.5">{D.CONDICIONES.map((v, i) => <Opcion multi key={v} on={s.condiciones.includes(i)} onClick={() => set({ condiciones: toggle(s.condiciones, i, 2) })}>{v}</Opcion>)}</div>
          <Continuar disabled={s.condiciones.length === 0} onClick={() => siguiente()} />
        </>
      );

    case "tareas": return <Tareas siguiente={siguiente} />;
    case "habilidades": return <Habilidades siguiente={siguiente} />;
    case "finanzas": return <FinanzasPaso siguiente={siguiente} />;
    case "finanzasRes":
      return (
        <>
          <Titulo>Tu margen de estabilidad económica</Titulo>
          {s.finanzas && <p className="rounded-2xl bg-field p-5 text-lg">{D.margenTexto(s.finanzas)}</p>}
          <Continuar onClick={() => siguiente()} />
        </>
      );
    case "ruta": return <Ruta siguiente={siguiente} />;
    case "cierre": return <Cierre empresa={empresa} onReset={onReset} onWhatsApp={onWhatsApp} />;
  }
}

function Tareas({ siguiente }: { siguiente: (p?: Partial<Estado>) => void }) {
  const { s, set } = useRumbo();
  const traducir = useServerFn(traducirHabilidades);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const llenas = s.tareas.map((t) => t.trim()).filter((t) => t.length >= 2);
  const usarEjemplo = (ej: string) => {
    const i = s.tareas.findIndex((t) => !t.trim());
    if (i >= 0) { const t = [...s.tareas]; t[i] = ej; set({ tareas: t }); }
    else if (s.tareas.length < 5) set({ tareas: [...s.tareas, ej] });
  };
  const enviar = async () => {
    setCargando(true); setError(null);
    try {
      const h = await traducir({ data: { tareas: llenas } });
      siguiente({ habilidades: h, favoritas: [], frase: "" });
    } catch (e) { setError(e instanceof Error ? e.message : "Intenta de nuevo."); }
    finally { setCargando(false); }
  };
  return (
    <>
      <Titulo sub="Escribe con tus propias palabras de 3 a 5 cosas que haces o hacías en tu turno. Incluye también tareas extra o especiales: si capacitas, reportas o resuelves casos difíciles. No hay respuestas correctas.">Tus habilidades, traducidas</Titulo>
      <p className="mb-2 text-sm text-muted-foreground">Por ejemplo:</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {D.EJEMPLOS_TAREAS.map((ej) => (
          <button key={ej} type="button" onClick={() => usarEjemplo(ej)} className="rounded-full border-2 border-primary/60 px-3 py-1.5 text-sm font-semibold hover:bg-field">+ {ej}</button>
        ))}
      </div>
      <div className="space-y-3">
        {s.tareas.map((t, i) => (
          <input key={i} className="field" maxLength={180} value={t} placeholder={`Tarea ${i + 1}`}
            onChange={(e) => { const n = [...s.tareas]; n[i] = e.target.value; set({ tareas: n }); }} />
        ))}
      </div>
      {s.tareas.length < 5 && <Button variant="quiet" className="mt-2" onClick={() => set({ tareas: [...s.tareas, ""] })}>+ Agregar otra</Button>}
      {error && <p className="mt-4 rounded-xl bg-field p-3 text-sm">{error}</p>}
      <Continuar disabled={llenas.length < 3 || cargando} onClick={enviar}>
        {cargando ? <><Loader2 className="animate-spin" /> Traduciendo…</> : "Traducir mis habilidades"}
      </Continuar>
    </>
  );
}

function Habilidades({ siguiente }: { siguiente: (p?: Partial<Estado>) => void }) {
  const { s, set } = useRumbo();
  const hs = s.habilidades ?? [];
  const [copiado, setCopiado] = useState(false);
  const sugerida = () => D.frasePresentacion(hs.map((h) => h.habilidad), s.favoritas);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(s.frase); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sin portapapeles */ }
  };
  useEffect(() => {
    if (!s.frase) set({ frase: sugerida() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.favoritas]);
  return (
    <>
      <Titulo sub="Si quieres, marca con estrella hasta 3 que más disfrutes usar.">Así se llaman tus habilidades en el mercado</Titulo>
      <div className="space-y-4">
        {hs.map((h, i) => {
          const on = s.favoritas.includes(i);
          return (
            <article key={i} className={`rounded-2xl border-2 p-4 ${on ? "border-primary bg-field" : "border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">“{s.tareas[i]}”</p>
                  <h2 className="mt-1 text-lg font-extrabold leading-snug">{h.habilidad}</h2>
                </div>
                <button type="button" aria-label={on ? "Quitar estrella" : "Marcar como favorita"} aria-pressed={on}
                  onClick={() => set({ favoritas: toggle(s.favoritas, i, 3), frase: "" })}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-background">
                  <Star className={`size-6 ${on ? "fill-star text-star" : "text-muted-foreground"}`} />
                </button>
              </div>
              <p className="mt-2 text-sm">{h.para_que}</p>
              <p className="mt-2 text-sm text-muted-foreground"><span className="font-bold">Puestos:</span> {h.puestos.join(" · ")}</p>
            </article>
          );
        })}
      </div>
      <section className="mt-8 rounded-3xl border-2 border-primary bg-field p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tu frase para presentarte</p>
          <Button variant="soft" size="sm" onClick={copiar} disabled={!s.frase.trim()}>{copiado ? <><Check /> Copiada</> : <><Copy /> Copiar</>}</Button>
        </div>
        <textarea aria-label="Tu frase para presentarte (puedes editarla)" className="mt-3 min-h-24 w-full resize-none bg-transparent text-xl font-bold leading-snug outline-none" value={s.frase} onChange={(e) => set({ frase: e.target.value })} />
        <p className="text-xs text-muted-foreground">Puedes editarla.</p>
      </section>
      <Continuar disabled={!s.frase.trim()} onClick={() => siguiente()} />
    </>
  );
}

function FinanzasPaso({ siguiente }: { siguiente: (p?: Partial<Estado>) => void }) {
  const { s } = useRumbo();
  const [v, setV] = useState({
    ingreso: s.finanzas ? String(s.finanzas.ingreso) : "",
    gastos: s.finanzas ? String(s.finanzas.gastos) : "",
    ahorros: s.finanzas ? String(s.finanzas.ahorros) : "",
  });
  const num = (x: string) => Math.max(0, Number(x.replace(/[^\d.]/g, "")) || 0);
  const valido = v.ingreso !== "" && num(v.gastos) > 0;
  const campos: [keyof typeof v, string][] = [["ingreso", "Ingreso mensual aproximado"], ["gastos", "Gastos fijos indispensables al mes"], ["ahorros", "Ahorros disponibles"]];
  return (
    <>
      <Titulo sub="No es para decidir si renuncias. Es para saber con qué cuentas hoy. Puedes usar números aproximados, en quetzales.">Tu margen de estabilidad económica</Titulo>
      <div className="space-y-4">
        {campos.map(([k, label]) => (
          <label key={k} className="block">
            <span className="mb-2 block font-semibold">{label}</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">Q</span>
              <input className="field pl-9" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} placeholder="0" />
            </div>
          </label>
        ))}
      </div>
      <Continuar disabled={!valido} onClick={() => siguiente({ finanzas: { ingreso: num(v.ingreso), gastos: num(v.gastos), ahorros: num(v.ahorros) }, finanzasSaltado: false, ruta: null })}>Ver mi margen</Continuar>
      <Button variant="quiet" className="mt-3 w-full" onClick={() => siguiente({ finanzas: null, finanzasSaltado: true, ruta: null })}>Saltar este paso</Button>
    </>
  );
}

function contextoRuta(s: Estado) {
  const d = derivados(s);
  const m = s.finanzas ? { ...s.finanzas, ...D.calcularMargen(s.finanzas) } : null;
  return {
    perfil: d.perfil, perfilNombre: D.PERFIL_NOMBRE[d.perfil], economico: d.economico,
    situacion: D.SITUACIONES[s.situacion ?? 0] ?? "", edad: D.EDADES[s.edad ?? 0] ?? "",
    necesidad: D.NECESIDADES[s.necesidad ?? 3]?.label ?? "", proyecto: s.proyecto.trim(),
    energia: d.energia, energiaJornada: D.ENERGIA_JORNADA[s.jornada ?? 1] ?? "", claridad: s.claridad,
    intereses: [d.t1, d.t2], interesTexto: d.interes,
    valores: s.valores.map((i) => D.VALORES[i]!), condiciones: s.condiciones.map((i) => D.CONDICIONES[i]!),
    favoritas: (s.favoritas.length ? s.favoritas : (s.habilidades ?? []).slice(0, 3).map((_, i) => i)).map((i) => s.habilidades?.[i]?.habilidad ?? "").filter(Boolean), frase: s.frase,
    margen: m,
  };
}

function Ruta({ siguiente }: { siguiente: (p?: Partial<Estado>) => void }) {
  const { s, set } = useRumbo();
  const generar = useServerFn(generarRuta);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const pedir = async () => {
    setCargando(true); setError(null);
    try {
      const r = await generar({ data: contextoRuta(s) });
      set({ ruta: r, rutaFecha: D.fechaRevision() });
    } catch (e) { setError(e instanceof Error ? e.message : "Intenta de nuevo."); }
    finally { setCargando(false); }
  };
  useEffect(() => { if (!s.ruta && !cargando) void pedir(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  if (!s.ruta)
    return (
      <div className="py-16 text-center">
        {error ? (
          <>
            <p className="text-lg font-bold">{error}</p>
            <Continuar onClick={pedir}>Intentar de nuevo</Continuar>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-10 animate-spin text-primary" />
            <p className="mt-5 text-lg font-bold">Estamos armando tu ruta de próximos pasos…</p>
            <p className="mt-1 text-muted-foreground">Toma unos segundos.</p>
          </>
        )}
      </div>
    );
  return (
    <>
      <Titulo sub="Pasos pequeños para el próximo mes, a tu ritmo.">Tu ruta de próximos pasos</Titulo>
      <RutaVista ruta={s.ruta} fecha={s.rutaFecha ?? D.fechaRevision()} />
      <Continuar onClick={() => siguiente()}>Ver mi resumen</Continuar>
    </>
  );
}

function RutaVista({ ruta, fecha }: { ruta: NonNullable<Estado["ruta"]>; fecha: string }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border-2 border-border p-4">
        <h2 className="text-xl font-extrabold">Un área que quizá no conocías</h2>
        <h3 className="mt-3 text-lg font-extrabold">{ruta.area_nueva.nombre}</h3>
        <p className="mt-2">{ruta.area_nueva.que_se_hace}</p>
        <p className="mt-2">{ruta.area_nueva.por_que_encaja}</p>
        <p className="mt-2"><span className="font-bold">Primer paso:</span> {ruta.area_nueva.primer_paso}</p>
      </section>
      {ruta.pasos.map((p, i) => (
        <section key={i} className="rounded-2xl border-2 border-border p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Semana {i + 1}</p>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-extrabold leading-snug">{D.tituloSemana(p.titulo)}</h2>
            <span className="shrink-0 rounded-full bg-field px-2 py-0.5 text-xs font-bold">{p.tiempo}</span>
          </div>
          <p className="mt-3 text-sm"><span className="font-bold">Propósito:</span> {p.proposito}</p>
          <p className="mt-2 text-sm"><span className="font-bold">Acción:</span> {p.accion}</p>
        </section>
      ))}
      <p className="rounded-2xl bg-primary/20 p-4 font-extrabold">📅 Fecha para revisar tu ruta: {fecha}</p>
    </div>
  );
}

async function descargarResumen(s: Estado) {
  const d = derivados(s);
  await descargarPDF({
    energiaBaja: d.energia === "baja",
    perfilNombre: D.PERFIL_NOMBRE[d.perfil], perfilTexto: D.perfilTexto(d.perfil, d.economico), frase: s.frase,
    interes: d.interes, valores: s.valores.flatMap((i) => D.VALORES[i] ? [D.VALORES[i]] : []), condiciones: s.condiciones.flatMap((i) => D.CONDICIONES[i] ? [D.CONDICIONES[i]] : []),
    habilidades: s.habilidades ?? [], favoritas: s.favoritas, margen: s.finanzas ? D.margenTexto(s.finanzas) : null,
    ruta: s.ruta, foco: D.focoAcompanamiento(d.energia, d.perfil), claridad: s.claridad, fechaRevision: s.rutaFecha ?? D.fechaRevision(),
  });
}

function Cierre({ empresa, onReset, onWhatsApp }: { empresa: string | null; onReset: () => void; onWhatsApp: () => void }) {
  const { s, set } = useRumbo();
  const d = derivados(s);
  const [guardando, setGuardando] = useState(false);
  const [pdf, setPdf] = useState(false);
  const fecha = s.rutaFecha ?? D.fechaRevision();

  const calificar = async (n: number) => {
    if (s.calificacion !== null || guardando) return;
    setGuardando(true);
    const { error } = await supabase.from("resultados").insert({
      empresa, rango_edad: D.EDADES[s.edad ?? 0]!, situacion: D.SITUACIONES[s.situacion ?? 0]!,
      perfil: d.perfil, energia: d.energia, interes_1: d.t1, interes_2: d.t2, calificacion: n,
      ...datosCrecimiento(s.situacion, s.crecerEmpresa),
    });
    setGuardando(false);
    if (!error) set({ calificacion: n });
  };
  const bajar = async () => {
    setPdf(true);
    try {
      await descargarResumen(s);
    } finally { setPdf(false); }
  };

  return (
    <>
      <Titulo>Tu plan RUMBO</Titulo>
      <div className="space-y-4">
        <Bloque t={`Perfil: ${D.PERFIL_NOMBRE[d.perfil]}`}>{D.perfilTexto(d.perfil, d.economico)}</Bloque>
        {s.frase && <p className="rounded-2xl bg-primary/20 p-4 text-lg font-extrabold">{s.frase}</p>}
        <Bloque t="Intereses">{d.interes}<Fuente texto={D.FUENTES.intereses} /></Bloque>
        <Bloque t="Valores">{s.valores.map((i) => D.VALORES[i]).join(" · ")}<Fuente texto={D.FUENTES.valores} /></Bloque>
        <Bloque t="Habilidades traducidas">
          <ul className="space-y-2">
            {(s.habilidades ?? []).map((h, i) => (
              <li key={i}><span className="font-bold">{s.favoritas.includes(i) && "★ "}{h.habilidad}</span><br /><span className="text-sm text-muted-foreground">{h.para_que}</span><p className="mt-1 text-sm text-muted-foreground">Puestos: {h.puestos.join(" · ")}</p></li>
            ))}
          </ul>
        </Bloque>
        {s.finanzas && <Bloque t="Tu margen">{D.margenTexto(s.finanzas)}</Bloque>}
      </div>
      {s.ruta && <div className="mt-6"><h2 className="mb-3 text-xl font-extrabold">Tu ruta de próximos pasos</h2><RutaVista ruta={s.ruta} fecha={fecha} /></div>}

      <section className="mt-8 rounded-3xl border-2 border-primary bg-field p-6">
        <h2 className="text-xl font-extrabold leading-snug">Si quieres recorrer esta ruta acompañado/a</h2>
        <p className="mt-3 leading-relaxed">Este es un primer paso. En el Programa RUMBO trabajas tu ruta con la Licda. Angie Mendoza, psicóloga y orientadora vocacional, en 4 sesiones en línea.</p>
        <p className="mt-2 text-sm text-muted-foreground">Programa completo: Q1,000.</p>
        <div className="mt-5 grid gap-2">
          <Button variant="hero" size="xl" asChild><a href={D.WHATSAPP} onClick={onWhatsApp} target="_blank" rel="noreferrer"><MessageCircle /> Escribir por WhatsApp</a></Button>
          <a href={D.WEB} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 py-2 text-sm font-bold underline decoration-primary decoration-2 underline-offset-4"><Globe className="size-4" /> Conocer el Programa RUMBO</a>
        </div>
      </section>

      <div className="mt-6"><Button variant="soft" size="xl" onClick={bajar} disabled={pdf}>{pdf ? <Loader2 className="animate-spin" /> : <Download />} Descargar mi ruta (PDF)</Button></div>

      <section className="mt-8 rounded-3xl border-2 border-primary bg-field p-6">
        <h2 className="text-xl font-extrabold">Lo que puedes trabajar con acompañamiento</h2>
        <p className="mt-3 leading-relaxed">{D.focoAcompanamiento(d.energia, d.perfil)}</p>
        <ul className="mt-4 list-disc space-y-3 pl-5">{s.ruta?.preguntas.map((pregunta, i) => <li key={i}>{pregunta}</li>)}</ul>
        <p className="mt-4 leading-relaxed">Hoy marcaste tu claridad en {s.claridad} de 10. En el Programa RUMBO trabajamos juntos para que tengas más claridad sobre tus metas y decisiones.</p>
        <Button variant="hero" size="xl" className="mt-5" asChild><a href={D.WHATSAPP} onClick={onWhatsApp} target="_blank" rel="noreferrer"><MessageCircle /> Escribir por WhatsApp</a></Button>
      </section>

      <div className="mt-8 rounded-2xl bg-field p-5 text-center">
        <p className="font-extrabold">¿Te fue útil?</p>
        <div className="mt-3 flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-label={`${n} estrellas`} disabled={s.calificacion !== null || guardando} onClick={() => calificar(n)} className="p-1">
              <Star className={`size-9 ${(s.calificacion ?? 0) >= n ? "fill-star text-star" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        {s.calificacion !== null && <p className="mt-2 text-sm text-muted-foreground">Gracias por contarnos.</p>}
      </div>

      <Fuente texto={D.FUENTES.investigacion} />
      <Button variant="quiet" className="mt-6 w-full" onClick={onReset}><RotateCcw /> Empezar de nuevo</Button>
    </>
  );
}

function Bloque({ t, children }: { t: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-field p-4">
      <h2 className="text-sm font-extrabold uppercase tracking-wider">{t}</h2>
      <div className="mt-1">{children}</div>
    </section>
  );
}

function PieAyuda({ onWhatsApp }: { onWhatsApp: () => void }) {
  return (
    <footer className="border-t py-4 text-center">
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="text-sm font-bold underline decoration-primary decoration-2 underline-offset-4">¿Necesitas hablar con alguien ahora?</button>
        </DialogTrigger>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>¿Necesitas hablar con alguien ahora?</DialogTitle>
            <DialogDescription>Puedes escribirle a la Licda. Angie Mendoza, psicóloga clínica.</DialogDescription>
          </DialogHeader>
          <Button variant="hero" size="xl" asChild><a href={D.WHATSAPP} onClick={onWhatsApp} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp Licda. Angie Mendoza</a></Button>
          <p className="text-sm font-semibold">Si estás en peligro, llama a los servicios de emergencia de tu país.</p>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
