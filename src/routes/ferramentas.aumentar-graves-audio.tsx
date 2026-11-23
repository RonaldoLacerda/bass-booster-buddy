import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding, seoHead } from "@/components/SeoLanding";
import { seoPageBySlug } from "@/lib/seo-pages";

const page = seoPageBySlug("aumentar-graves-audio");

export const Route = createFileRoute("/ferramentas/aumentar-graves-audio")({
  staticData: { sitemap: true },
  head: () => seoHead(page),
  component: AumentarGraves,
});

function AumentarGraves() {
  return <SeoLanding page={page} />;
}
