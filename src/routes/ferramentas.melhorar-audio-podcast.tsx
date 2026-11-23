import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding, seoHead } from "@/components/SeoLanding";
import { seoPageBySlug } from "@/lib/seo-pages";

const page = seoPageBySlug("melhorar-audio-podcast");

export const Route = createFileRoute("/ferramentas/melhorar-audio-podcast")({
  staticData: { sitemap: true },
  head: () => seoHead(page),
  component: MelhorarPodcast,
});

function MelhorarPodcast() {
  return <SeoLanding page={page} />;
}
