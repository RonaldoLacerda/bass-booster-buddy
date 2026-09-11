import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BadgeCheck,
  Check,
  Gauge,
  Mic,
  Music,
  ShieldCheck,
  Sliders,
  Sparkles,
  Upload,
  Waves,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FREE_TRACKS, PLANS, formatBRL } from "@/lib/plans";

const TITLE = "AudioMix — grave, equalize, processe e exporte seu áudio";
const DESCRIPTION =
  "Analise e equalize uma gravação pronta ou processe seu áudio em tempo real enquanto grava. O AudioMix ajuda a corrigir volume, graves, dinâmica e clareza e permite comparar e exportar o resultado. 1 faixa grátis, sem instalar nada.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AudioMix",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Web",
          description: DESCRIPTION,
          offers: PLANS.map((p) => ({
            "@type": "Offer",
            name: p.name,
            price: p.price.toFixed(2),
            priceCurrency: "BRL",
          })),
        }),
      },
    ],
  }),
  component: Landing,
});

const USE_CASES = [
  "Áudio ao vivo",
  "Música e demo de banda",
  "Ensaio e show",
  "Podcast e entrevista",
  "Aula e narração",
  "Culto e evento",
  "Vídeos e redes sociais",
];

const STEPS = [
  {
    icon: Mic,
    title: "1. Grave ao vivo ou envie um áudio",
    text: "Use uma entrada de áudio para processar e gravar em tempo real ou envie um WAV, MP3 ou M4A já gravado.",
  },
  {
    icon: Activity,
    title: "2. Analise o seu som",
    text: "Veja LUFS, pico real, clipping, graves, dinâmica e estéreo para entender exatamente o que precisa melhorar.",
  },
  {
    icon: Sliders,
    title: "3. Equalize e processe",
    text: "Ajuste EQ, volume e dinâmica com controles manuais ou configurações prontas para diferentes objetivos.",
  },
  {
    icon: BadgeCheck,
    title: "4. Compare, grave e exporte",
    text: "Ouça o antes e depois, grave o áudio já processado no modo ao vivo e exporte o resultado em WAV ou MP3.",
  },
];

const FEATURES = [
  {
    icon: Activity,
    title: "Diagnóstico real, não chute",
    text: "Análise de LUFS, picos, clipping, energia de graves, dinâmica e imagem estéreo antes de tocar no seu áudio.",
  },
  {
    icon: Gauge,
    title: "Correção automática",
    text: "EQ, compressor, limiter e normalização por loudness ajustados ao destino final da faixa.",
  },
  {
    icon: Waves,
    title: "Antes e depois",
    text: "Player comparativo sincronizado, com as métricas reais das duas versões.",
  },
  {
    icon: Mic,
    title: "Foco de instrumento",
    text: "Destaque baixo, voz, bateria, teclado ou guitarra sem perder o equilíbrio da mix.",
  },
  {
    icon: Sliders,
    title: "Gravação ao vivo processada",
    text: "Receba uma entrada de áudio, aplique EQ e processamento em tempo real, grave o resultado e exporte depois.",
  },
  {
    icon: ShieldCheck,
    title: "Privacidade total",
    text: "Todo o processamento acontece no seu navegador. Seu áudio nunca sai do seu computador.",
  },
];

const FAQ = [
  {
    q: "Preciso instalar algum programa?",
    a: "Não. O AudioMix roda no navegador (Chrome, Edge, Safari ou Firefox atualizados), no computador ou no celular.",
  },
  {
    q: "Meu áudio é enviado para a nuvem?",
    a: "Não. Toda a análise e o processamento acontecem localmente, no seu navegador. O arquivo não sai do seu dispositivo.",
  },
  {
    q: "O AudioMix funciona com áudio ao vivo?",
    a: "Sim. Você pode receber uma entrada de áudio, ajustar o processamento em tempo real, gravar o resultado já tratado e depois exportar o arquivo.",
  },
  {
    q: "O AudioMix serve apenas para masterização?",
    a: "Não. Ele também permite analisar e equalizar gravações prontas e trabalhar com áudio ao vivo, processando e gravando o sinal em tempo real antes de exportar.",
  },
  {
    q: "Como funciona o teste grátis?",
    a: `Ao criar a conta você usa ${FREE_TRACKS} faixa gratuitamente, sem cartão de crédito. Depois basta escolher um plano pelo número de faixas por mês.`,
  },
  {
    q: "Em quais formatos posso exportar?",
    a: "WAV 16 bits sem perdas ou MP3 em 128, 192, 256 e 320 kbps, com alvo de volume por plataforma.",
  },
];

function Landing() {
  return (
    <div>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 font-semibold">
            <Music className="h-5 w-5 text-accent" /> AudioMix
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

      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Áudio profissional, do ao vivo à gravação final
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            Grave. Equalize. Melhore. Exporte.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            Analise e equalize uma gravação que já existe ou processe seu áudio em tempo real enquanto grava. O AudioMix
            ajuda a corrigir{" "}
            <strong className="font-semibold text-foreground">volume, graves, dinâmica e clareza</strong>e permite
            comparar e exportar o resultado — tudo direto no navegador.
          </p>
          <div className="mx-auto mt-7 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
            <div className="panel p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Mic className="h-5 w-5 text-accent" />
                Áudio ao vivo
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Processe, equalize, grave e exporte o áudio já tratado.
              </p>
            </div>
            <div className="panel p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Upload className="h-5 w-5 text-accent" />
                Gravação pronta
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Analise, equalize, compare e exporte seu arquivo.</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth">Começar grátis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#como-funciona">Ver como funciona</a>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {FREE_TRACKS} faixa gratuita por conta · sem cartão de crédito · seu áudio não sai do seu dispositivo
          </p>
          <ul className="mx-auto mt-7 flex max-w-4xl flex-wrap justify-center gap-2">
            {USE_CASES.map((u) => (
              <li key={u} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {u}
              </li>
            ))}
          </ul>
        </section>

        <section id="como-funciona" className="mx-auto max-w-5xl px-4 pb-16">
          <h2 className="text-2xl font-bold tracking-tight">Do áudio bruto ao resultado final</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Um fluxo completo para trabalhar com áudio pronto ou fazer processamento e gravação em tempo real.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <article key={s.title} className="panel p-5">
                <s.icon className="h-5 w-5 text-accent" />
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <h2 className="text-2xl font-bold tracking-tight">Recursos</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="panel p-5">
                <f.icon className="h-5 w-5 text-accent" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="planos" className="mx-auto max-w-5xl px-4 pb-16">
          <h2 className="text-2xl font-bold tracking-tight">Planos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece grátis com {FREE_TRACKS} faixa. Depois escolha o plano pelo número de faixas por mês — cancele quando
            quiser.
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

        <section className="mx-auto max-w-3xl px-4 pb-20">
          <h2 className="text-2xl font-bold tracking-tight">Perguntas frequentes</h2>
          <dl className="mt-6 space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="panel p-5">
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 text-center">
            <Button size="lg" asChild>
              <Link to="/auth">Começar agora, grátis</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        AudioMix · processamento local no navegador · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
