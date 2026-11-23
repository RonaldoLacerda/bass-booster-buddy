import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding, seoHead } from "@/components/SeoLanding";
import { seoPageBySlug } from "@/lib/seo-pages";

const page = seoPageBySlug("masterizar-musica-online");

export const Route = createFileRoute("/ferramentas/masterizar-musica-online")({
  staticData: { sitemap: true },
  head: () => seoHead(page),
  component: MasterizarMusica,
});

function MasterizarMusica() {
  return <SeoLanding page={page} />;
}
