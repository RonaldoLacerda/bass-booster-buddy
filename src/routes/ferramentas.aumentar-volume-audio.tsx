import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding, seoHead } from "@/components/SeoLanding";
import { seoPageBySlug } from "@/lib/seo-pages";

const page = seoPageBySlug("aumentar-volume-audio");

export const Route = createFileRoute("/ferramentas/aumentar-volume-audio")({
  staticData: { sitemap: true },
  head: () => seoHead(page),
  component: AumentarVolume,
});

function AumentarVolume() {
  return <SeoLanding page={page} />;
}
