import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";

import { PolicyLinks } from "@/components/LegalPage";
import { Button } from "@/components/ui/button";
import { SEO_PAGES, seoPageBySlug, type SeoPage } from "@/lib/seo-pages";

const ORIGIN = "https://audiomix.app";

/** Cabeçalho da rota (title, description, canonical, Open Graph e dados estruturados). */
export function seoHead(page: SeoPage) {
  const title = `${page.title} | AudioMix`;
  const url = `${ORIGIN}${page.path}`;
  return {
    meta: [
      { title },
      { name: "description", content: page.description },
      { property: "og:title", content: title },
      { property: "og:description", content: page.description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: page.description },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "AudioMix", item: `${ORIGIN}/` },
            { "@type": "ListItem", position: 2, name: "Ferramentas", item: `${ORIGIN}/ferramentas` },
            { "@type": "ListItem", position: 3, name: page.h1, item: url },
          ],
        }),
      },
    ],
  };
}

function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-background/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-display text-base font-bold">
          <img src="/favicon.png" alt="" className="h-7 w-7" /> AudioMix
        </Link>
        <nav className="flex items-center gap-2" aria-label="Navegação principal">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/ferramentas">Ferramentas</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/master">Testar grátis</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
        <span className="font-semibold text-foreground">AudioMix</span>
        <p>Áudio e vídeo processados no seu aparelho</p>
        <PolicyLinks />
      </div>
    </footer>
  );
}

export function SeoLanding({ page }: { page: SeoPage }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <nav aria-label="Trilha" className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">AudioMix</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/ferramentas" className="hover:text-foreground">Ferramentas</Link>
        </nav>

        <p className="landing-eyebrow">{page.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">{page.h1}</h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">{page.intro}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="h-12 px-7" asChild>
            <Link to="/master">
              {page.cta} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Teste sem cadastro · 1 faixa grátis para baixar · Sem cartão · Arquivo não sai do seu aparelho
        </p>

        {page.sections.map((section) => (
          <section key={section.heading} className="mt-12">
            <h2 className="text-2xl font-bold">{section.heading}</h2>
            {section.paragraphs.map((text) => (
              <p key={text} className="mt-3 leading-7 text-muted-foreground">{text}</p>
            ))}
            {section.bullets && (
              <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
                {section.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Como fazer no AudioMix</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground">
            {page.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Perguntas frequentes</h2>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {page.faq.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  <span>{item.q}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="pt-3 text-sm leading-6 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="landing-cta mt-14 px-6 py-10 text-center">
          <h2 className="text-2xl font-bold">Ouça a diferença no seu próprio arquivo</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Envie, compare antes e depois e só crie conta se quiser baixar.
          </p>
          <Button size="lg" className="mt-6 h-12 px-7" asChild>
            <Link to="/master">
              {page.cta} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-bold">Veja também</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {page.related.map((slug) => {
              const rel = seoPageBySlug(slug);
              return (
                <li key={slug}>
                  <a href={rel.path} className="text-accent underline underline-offset-4">{rel.h1}</a>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export function ToolsHub() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="landing-eyebrow">Guias e ferramentas</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">Resolva o problema do seu áudio</h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
          Escolha o que está errado com a sua gravação e veja como corrigir direto no navegador, sem instalar nada e sem enviar o arquivo.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {SEO_PAGES.map((p) => (
            <li key={p.slug} className="landing-bento p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">{p.eyebrow}</p>
              <h2 className="mt-2 text-lg font-bold">
                <a href={p.path} className="hover:underline">{p.h1}</a>
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.intro}</p>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
