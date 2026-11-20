import { createFileRoute } from "@tanstack/react-router";
import { Flow } from "@/components/rumbo/Flow";
import { RumboProvider } from "@/lib/rumbo-store";

export const Route = createFileRoute("/e/$empresa")({
  head: () => ({
    meta: [
      { title: "RUMBO Exprés — Beneficio para colaboradores" },
      { name: "description", content: "Un beneficio de tu empresa: descubre tus habilidades y sal con una ruta de 30 días. Anónimo, sin cuenta." },
      { property: "og:title", content: "RUMBO Exprés — Beneficio para colaboradores" },
      { property: "og:description", content: "Tus habilidades de call center, traducidas, y una ruta de 30 días. Anónimo y sin cuenta." },
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
