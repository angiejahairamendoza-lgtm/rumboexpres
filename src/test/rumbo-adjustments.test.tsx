import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Flow } from "@/components/rumbo/Flow";
import { RumboProvider, estadoInicial } from "@/lib/rumbo-store";
import { aplicaCrecerEmpresa, elegirValor, respuestaCrecerEmpresa, VALORES, WHATSAPP } from "@/lib/rumbo-data";
import { registrarClicWhatsApp } from "@/lib/rumbo-results";

const mocks = vi.hoisted(() => ({ insert: vi.fn(), from: vi.fn(), pdf: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
vi.mock("@/lib/rumbo-pdf", () => ({ descargarPDF: mocks.pdf }));

function abrir(pantalla: string, situacion = 0) {
  localStorage.setItem("rumbo-expres", JSON.stringify({ t: Date.now(), s: {
    ...estadoInicial(), pantalla, situacion, necesidad: 0, marcha: 0, anio: 0,
    valores: [0, 1, 2], frase: "Tengo experiencia en soporte técnico.", ruta: [],
  } }));
  render(<RumboProvider><Flow empresa="prueba" /></RumboProvider>);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.insert.mockResolvedValue({ error: null });
  mocks.pdf.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("reglas de los seis ajustes", () => {
  it("crecimiento solo aplica a empleo actual y conserva las tres respuestas", () => {
    expect([0, 1, 2, 3, null].map(aplicaCrecerEmpresa)).toEqual([true, true, false, false, false]);
    for (const respuesta of ["Sí", "No", "Todavía no lo sé"]) {
      expect(respuestaCrecerEmpresa(0, respuesta)).toBe(respuesta);
      expect(respuestaCrecerEmpresa(1, respuesta)).toBe(respuesta);
      expect(respuestaCrecerEmpresa(2, respuesta)).toBeNull();
      expect(respuestaCrecerEmpresa(3, respuesta)).toBeNull();
    }
    expect(respuestaCrecerEmpresa(0, null)).toBeNull();
  });

  it("ofrece los seis valores O*NET y permite como máximo tres", () => {
    expect(VALORES).toEqual(["Logro", "Independencia", "Reconocimiento", "Relaciones", "Apoyo", "Condiciones de trabajo"]);
    expect(elegirValor([0, 1], 5)).toEqual([0, 1, 5]);
    expect(elegirValor([0, 1, 5], 3)).toEqual([0, 1, 5]);
    expect(elegirValor([0, 1, 5], 1)).toEqual([0, 5]);
  });

  it("WhatsApp abre el número solicitado con el mensaje completo", () => {
    const url = new URL(WHATSAPP);
    expect(url.origin + url.pathname).toBe("https://wa.me/50254372899");
    expect(url.searchParams.get("text")).toBe("Hola, Licda. Angie. Hice la ruta de RUMBO Exprés y me gustaría seguir el proceso con usted.");
  });

  it("cada clic inserta solo empresa y perfil y tolera fallos", async () => {
    await registrarClicWhatsApp("prueba", "B");
    await registrarClicWhatsApp(null, "A");
    expect(mocks.from).toHaveBeenCalledWith("clics_whatsapp");
    expect(mocks.insert.mock.calls).toEqual([[{ empresa: "prueba", perfil: "B" }], [{ empresa: null, perfil: "A" }]]);
    mocks.insert.mockRejectedValueOnce(new Error("Sin conexión"));
    await expect(registrarClicWhatsApp(null, "C")).resolves.toBeUndefined();
  });
});

describe("recorrido y confirmaciones", () => {
  it("cancelar conserva el avance y confirmar lo borra", async () => {
    abrir("situacion");
    fireEvent.click(await screen.findByRole("button", { name: "Empezar de nuevo" }));
    expect(JSON.parse(localStorage.getItem("rumbo-expres") ?? "{}").s.pantalla).toBe("situacion");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(JSON.parse(localStorage.getItem("rumbo-expres") ?? "{}").s.pantalla).toBe("situacion");
    fireEvent.click(screen.getByRole("button", { name: "Empezar de nuevo" }));
    fireEvent.click(screen.getByRole("button", { name: /^Sí$/ }));
    await waitFor(() => expect(localStorage.getItem("rumbo-expres")).toBeNull());
  });

  it("descargar desde la confirmación de cierre no reinicia", async () => {
    abrir("cierre");
    const botones = await screen.findAllByRole("button", { name: "Empezar de nuevo" });
    const boton = botones.at(-1);
    if (!boton) throw new Error("Falta el botón de cierre");
    fireEvent.click(boton);
    fireEvent.click(screen.getByRole("button", { name: /^Descargar PDF$/ }));
    await waitFor(() => expect(mocks.pdf).toHaveBeenCalledTimes(1));
    expect(JSON.parse(localStorage.getItem("rumbo-expres") ?? "{}").s.pantalla).toBe("cierre");
    fireEvent.click(boton);
    fireEvent.click(screen.getByRole("button", { name: "Sí, empezar de nuevo" }));
    await waitFor(() => expect(localStorage.getItem("rumbo-expres")).toBeNull());
  });

  it.each([0, 1, 2, 3])("situación %i muestra o salta crecimiento y registra la respuesta", async (situacion) => {
    abrir("situacion", situacion);
    fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
    const guardado = () => JSON.parse(localStorage.getItem("rumbo-expres") ?? "{}").s;
    if (situacion <= 1) {
      expect(guardado().pantalla).toBe("crecerEmpresa");
      fireEvent.click(screen.getByRole("button", { name: "Todavía no lo sé" }));
      expect(guardado().crecerEmpresa).toBe("Todavía no lo sé");
      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    } else {
      expect(guardado().crecerEmpresa).toBeNull();
    }
    expect(guardado().pantalla).toBe("necesidad");
  });

  it("la calificación guarda crecimiento y el enlace cuenta un clic sin datos personales", async () => {
    abrir("cierre");
    const enlace = await screen.findByRole("link", { name: "Escribir por WhatsApp" });
    fireEvent.click(enlace);
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledWith({ empresa: "prueba", perfil: "A" }));
    fireEvent.click(screen.getByRole("button", { name: "5 estrellas" }));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledWith({
      empresa: "prueba", rango_edad: "18–24", situacion: "Trabajo en un call center", perfil: "A",
      energia: "suficiente", interes_1: "Práctico", interes_2: "Investigador", calificacion: 5, crecer_empresa: null,
    }));
  });
});