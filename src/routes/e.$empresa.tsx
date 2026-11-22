import { createFileRoute } from "@tanstack/react-router";
import { Flow } from "@/components/rumbo/Flow";
import { RumboProvider } from "@/lib/rumbo-store";

export const Route = createFileRoute("/e/$empresa")({
  head: ({ params }) => ({
    meta: [
      { title: "RUMBO Exprés — Beneficio para colaboradores" },
      { name: "description", content: "Conoce tus habilidades, intereses y valores, y crea tu plan de crecimiento profesional." },
      { property: "og:title", content: "RUMBO Exprés" },
      { property: "og:description", content: "Conoce tus habilidades, intereses y valores, y crea tu plan de crecimiento profesional." },
      { property: "og:image", content: "https://rumboexpres.lovable.app/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:url", content: `https://rumboexpres.lovable.app/e/${encodeURIComponent(params.empresa)}` },
      { name: "twitter:title", content: "RUMBO Exprés" },
      { name: "twitter:description", content: "Conoce tus habilidades, intereses y valores, y crea tu plan de crecimiento profesional." },
      { name: "twitter:image", content: "https://rumboexpres.lovable.app/og-image.png" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmpresaPage,
});

function EmpresaPage() {
  const { empresa } = Route.useParams();
  const id = empresa.toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 80) || null;
  return <RumboProvider><Flow empresa={id} /></RumboProvider>;
}
