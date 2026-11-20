import { createFileRoute } from "@tanstack/react-router";
import { Flow } from "@/components/rumbo/Flow";
import { RumboProvider } from "@/lib/rumbo-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RUMBO Exprés — Tu ruta de próximos pasos después del call center" },
      { name: "description", content: "En 25 minutos descubre lo que sí sabes hacer y sal con tu ruta de próximos pasos. Sin cuenta y sin nombre." },
      { property: "og:title", content: "RUMBO Exprés — Tu ruta de próximos pasos" },
      { property: "og:description", content: "Tus habilidades de call center, traducidas al mercado, y tu ruta de próximos pasos. Programa RUMBO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RumboProvider><Flow empresa={null} /></RumboProvider>,
});
