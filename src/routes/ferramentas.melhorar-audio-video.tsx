import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding, seoHead } from "@/components/SeoLanding";
import { seoPageBySlug } from "@/lib/seo-pages";

const page = seoPageBySlug("melhorar-audio-video");

export const Route = createFileRoute("/ferramentas/melhorar-audio-video")({
  staticData: { sitemap: true },
  head: () => seoHead(page),
  component: MelhorarVideo,
});

function MelhorarVideo() {
  return <SeoLanding page={page} />;
}
