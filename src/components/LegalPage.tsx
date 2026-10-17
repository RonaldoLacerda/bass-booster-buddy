import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export const SELLER_NAME = "Ronaldo Lacerda da Silva";
export const SUPPORT_EMAIL = "ronaldolacerdadasilva@gmail.com";

export function PolicyLinks() {
  return <nav aria-label="Políticas" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
    <Link to="/termos" className="underline underline-offset-4">Termos de uso</Link>
    <Link to="/reembolso" className="underline underline-offset-4">Reembolso</Link>
    <Link to="/privacidade" className="underline underline-offset-4">Privacidade</Link>
  </nav>;
}

export function policyHead(path: string, title: string, description: string) {
  return {
    meta: [
      { title: `${title} | AudioMix` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | AudioMix` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `https://audiomix.app${path}` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `https://audiomix.app${path}` }],
  };
}

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border px-4 py-5">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold"><img src="/favicon.png" alt="" className="h-7 w-7" />AudioMix</Link>
        <Button asChild variant="outline" size="sm"><Link to="/">Voltar ao início</Link></Button>
      </div>
    </header>
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">{title}</h1>
      <div className="space-y-8 text-sm leading-7 text-muted-foreground [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_a]:text-accent [&_a]:underline [&_p+p]:mt-3">{children}</div>
      <section className="mt-10 border-t border-border pt-6 text-sm leading-7">
        <h2 className="font-semibold">Contato</h2>
        <p className="text-muted-foreground">{SELLER_NAME} · <a className="break-all text-accent underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      </section>
    </main>
    <footer className="border-t border-border px-4 py-6"><PolicyLinks /></footer>
  </div>;
}