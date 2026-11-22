import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Flow } from "@/components/rumbo/Flow";
import { RumboProvider, estadoInicial } from "@/lib/rumbo-store";

afterEach(() => { cleanup(); localStorage.clear(); });
describe("respuestas de estudios obligatorias", () => {
  it("no permite continuar sin nivel ni estudios actuales y acepta carrera vacía", async () => {
    localStorage.setItem("rumbo-expres", JSON.stringify({ t: Date.now(), s: { ...estadoInicial(), pantalla: "nivelEstudios", situacion: 2 } }));
    render(<RumboProvider><Flow empresa={null} /></RumboProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
    const guardado = () => JSON.parse(localStorage.getItem("rumbo-expres") ?? "{}").s;
    expect(guardado().pantalla).toBe("nivelEstudios");
    fireEvent.click(screen.getByRole("button", { name: "Licenciatura" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(guardado().pantalla).toBe("estudiaActualmente");
    fireEvent.click(screen.getByRole("button", { name: "No estoy estudiando" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(guardado()).toMatchObject({ pantalla: "necesidad", nivelEstudios: "Licenciatura", estudiaActualmente: "No estoy estudiando", carrera: "" });
  });
  it("permite omitir avances o conservarlos en el estado local", async () => {
    localStorage.setItem("rumbo-expres", JSON.stringify({ t: Date.now(), s: { ...estadoInicial(), pantalla: "marcha", marcha: 0, situacion: 2 } }));
    render(<RumboProvider><Flow empresa={null} /></RumboProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
    const guardado = () => JSON.parse(localStorage.getItem("rumbo-expres") ?? "{}").s;
    expect(guardado()).toMatchObject({ pantalla: "anio", avances: "" });
    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Avances hacia tus metas (opcional)" }), { target: { value: "Ya tengo mi página web y redes sociales" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(guardado()).toMatchObject({ pantalla: "anio", avances: "Ya tengo mi página web y redes sociales" });
  });
});