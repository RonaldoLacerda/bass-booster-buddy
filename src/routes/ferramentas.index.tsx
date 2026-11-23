import { createFileRoute } from "@tanstack/react-router";

import { ToolsHub } from "@/components/SeoLanding";

const TITLE = "Ferramentas para melhorar áudio e vídeo | AudioMix";
const DESCRIPTION =
  "Guias e ferramentas para aumentar volume, reforçar graves, normalizar loudness e melhorar o áudio de vídeos, podcasts e músicas direto no navegador.";

export const Route = createFileRoute("/ferramentas/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://audiomix.app/ferramentas" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomix.app/ferramentas" }],
  }),
  component: ToolsHub,
});
