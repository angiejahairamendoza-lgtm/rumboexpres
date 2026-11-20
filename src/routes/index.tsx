import { createFileRoute } from "@tanstack/react-router";
import { Flow } from "@/components/rumbo/Flow";
import { RumboProvider } from "@/lib/rumbo-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RUMBO Exprés — Tu ruta de 30 días después del call center" },
      { name: "description", content: "En 25 minutos descubre lo que sí sabes hacer y sal con una ruta de 30 días. Sin cuenta y sin nombre." },
      { property: "og:title", content: "RUMBO Exprés — Tu ruta de 30 días" },
      { property: "og:description", content: "Tus habilidades de call center, traducidas al mercado, y una ruta de 30 días. Programa RUMBO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RumboProvider><Flow empresa={null} /></RumboProvider>,
});
