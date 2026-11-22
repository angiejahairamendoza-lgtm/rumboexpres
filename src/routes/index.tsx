import { createFileRoute } from "@tanstack/react-router";
import { Flow } from "@/components/rumbo/Flow";
import { RumboProvider } from "@/lib/rumbo-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RUMBO Exprés — Tu ruta de próximos pasos después del call center" },
      { name: "description", content: "Conoce tus habilidades, intereses y valores, y crea tu plan de crecimiento profesional." },
      { property: "og:title", content: "RUMBO Exprés" },
      { property: "og:description", content: "Conoce tus habilidades, intereses y valores, y crea tu plan de crecimiento profesional." },
      { property: "og:image", content: "https://rumboexpres.lovable.app/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:url", content: "https://rumboexpres.lovable.app" },
      { name: "twitter:title", content: "RUMBO Exprés" },
      { name: "twitter:description", content: "Conoce tus habilidades, intereses y valores, y crea tu plan de crecimiento profesional." },
      { name: "twitter:image", content: "https://rumboexpres.lovable.app/og-image.png" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RumboProvider><Flow empresa={null} /></RumboProvider>,
});
