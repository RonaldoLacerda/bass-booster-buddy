import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BadgeCheck, Check, Gauge, Music, ShieldCheck, Sliders, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FREE_TRACKS, PLANS, formatBRL } from "@/lib/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Audio Master — masterize gravações de culto com IA" },
      {
        name: "description",
        content:
          "Envie a gravação do culto, pregação ou louvor e receba diagnóstico técnico real (LUFS, picos, graves) com correção automática de volume, grave e clareza. 1 faixa grátis.",
      },
      { property: "og:title", content: "Audio Master — masterize gravações de culto com IA" },
      {
        property: "og:description",
        content:
          "Diagnóstico automático e masterização de áudio direto no navegador. Comece com 1 faixa grátis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Activity,
    title: "Diagnóstico real",
    text: "Medimos LUFS, picos, clipping, energia de graves, dinâmica e estéreo antes de tocar no seu áudio.",
  },
  {
    icon: Gauge,
    title: "Correção automática",
    text: "EQ, compressor, limiter e normalização por loudness ajustados ao destino: culto, YouTube, WhatsApp.",
  },
  {
    icon: Waves,
    title: "Antes e depois",
    text: "Player comparativo sincronizado com as métricas reais das duas versões.",
  },
  {
    icon: Sliders,
    title: "Modo avançado",
    text: "EQ de 10 bandas, presets prontos e personalizados, gravação ao vivo já processada.",
  },
  {
    icon: ShieldCheck,
    title: "Privacidade total",
    text: "Todo o processamento acontece no seu navegador. O áudio nunca sai do seu computador.",
  },
  {
    icon: BadgeCheck,
    title: "Exportação pronta",
    text: "WAV sem perdas ou MP3 até 320 kbps, com alvo por plataforma.",
  },
];

function Landing() {
  return (
    <main>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 font-semibold">
            <Music className="h-5 w-5 text-accent" /> Audio Master
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Criar conta grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Para músicos e equipes de mídia de igreja
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Seu áudio de culto alto, com grave firme e voz clara
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Gravou o culto e ficou baixo, sem corpo ou embolado? O Audio Master analisa a gravação, mostra o que
          está errado e corrige volume, graves e clareza em segundos — direto no navegador.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/auth">Masterizar 1 faixa grátis</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#planos">Ver planos</a>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {FREE_TRACKS} faixa gratuita por conta · sem cartão de crédito
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          O que o app faz
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="panel p-5">
              <f.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="text-2xl font-bold tracking-tight">Planos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Comece grátis com 1 faixa. Depois escolha o plano pelo número de faixas por mês.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`panel flex flex-col p-6 ${plan.highlight ? "border border-accent" : ""}`}
            >
              {plan.highlight && (
                <span className="mb-2 self-start rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                  Mais escolhido
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold">{formatBRL(plan.price)}</p>
              <p className="text-xs text-muted-foreground">por mês · até {plan.tracks} faixas</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-muted-foreground">{perk}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-6" variant={plan.highlight ? "default" : "outline"} asChild>
                <Link to="/auth">Contratar</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Audio Master · processamento local no navegador · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
