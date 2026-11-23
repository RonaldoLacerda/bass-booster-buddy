import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding, seoHead } from "@/components/SeoLanding";
import { seoPageBySlug } from "@/lib/seo-pages";

const page = seoPageBySlug("audio-whatsapp");

export const Route = createFileRoute("/ferramentas/audio-whatsapp")({
  staticData: { sitemap: true },
  head: () => seoHead(page),
  component: AudioWhatsapp,
});

function AudioWhatsapp() {
  return <SeoLanding page={page} />;
}
