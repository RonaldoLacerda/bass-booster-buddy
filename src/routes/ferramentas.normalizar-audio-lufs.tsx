import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding, seoHead } from "@/components/SeoLanding";
import { seoPageBySlug } from "@/lib/seo-pages";

const page = seoPageBySlug("normalizar-audio-lufs");

export const Route = createFileRoute("/ferramentas/normalizar-audio-lufs")({
  staticData: { sitemap: true },
  head: () => seoHead(page),
  component: NormalizarLufs,
});

function NormalizarLufs() {
  return <SeoLanding page={page} />;
}
