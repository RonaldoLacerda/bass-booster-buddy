import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Download,
  Film,
  Gauge,
  Headphones,
  LockKeyhole,
  Mic,
  MonitorPlay,
  Play,
  ShieldCheck,
  Sliders,
  Sparkles,
  Upload,
  Video,
  Waves,
} from "lucide-react";

import { ProductPreview } from "@/components/landing/ProductPreview";
import { Button } from "@/components/ui/button";
import { FREE_TRACKS, PLANS, formatBRL } from "@/lib/plans";

const TITLE = "AudioMix — masterize áudio e vídeo direto no navegador";
const DESCRIPTION =
  "Melhore volume, graves, clareza e dinâmica de áudios e vídeos. Compare antes e depois, use o equalizador profissional e exporte no seu formato. 1 faixa grátis.";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://audiomix.app/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://audiomix.app/" }],
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

const FORMATS = ["MP3", "WAV", "M4A", "OGG", "MP4", "WebM"];

const STEPS = [
  {
    number: "01",
    icon: Upload,
    title: "Envie seu arquivo",
    text: "Escolha um áudio ou vídeo do celular ou computador. Nada é enviado para servidores.",
  },
  {
    number: "02",
    icon: Activity,
    title: "Receba o diagnóstico",
    text: "Veja volume, picos, graves, dinâmica e estéreo, com uma nota clara para a gravação.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Melhore o som",
    text: "A correção equilibra volume, grave, clareza e dinâmica para o destino escolhido.",
  },
  {
    number: "04",
    icon: Download,
    title: "Compare e exporte",
    text: "Ouça o original e o melhorado. Baixe o áudio ou mantenha a imagem original do vídeo.",
  },
];

const FAQ = [
  {
    q: "O AudioMix aceita vídeo?",
    a: "Sim. Você pode enviar MP4, WebM e outros vídeos compatíveis com o navegador, melhorar a trilha de áudio e baixar o vídeo em WebM mantendo a imagem original.",
  },
  {
    q: "Meu arquivo é enviado para a internet?",
    a: "Não. A análise, a equalização e a exportação acontecem no seu próprio aparelho. Seu áudio e seu vídeo não são enviados para um servidor.",
  },
  {
    q: "Preciso entender de equalização?",
    a: "Não. O modo simplificado analisa o arquivo, mostra o diagnóstico e aplica a correção. Quem quiser controle total pode usar o modo avançado.",
  },
  {
    q: "Posso comparar antes de baixar?",
    a: "Sim. O player Antes x Depois permite alternar entre o original e o áudio melhorado no mesmo ponto da gravação.",
  },
  {
    q: "Quais formatos de áudio posso baixar?",
    a: "Você pode exportar WAV sem perdas ou MP3 em 128, 192, 256 e 320 kbps. Vídeos tratados são exportados em WebM.",
  },
  {
    q: "Como funciona o teste grátis?",
    a: `Ao criar a conta você pode processar ${FREE_TRACKS} faixa gratuitamente, sem cartão. Depois escolha um plano conforme a quantidade mensal que precisa.`,
  },
];

function Landing() {
  return (
    <div className="landing-page min-h-screen overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-display text-base font-bold">
            <img src="/favicon.png" alt="" className="h-7 w-7" /> AudioMix
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Navegação principal">
            <a href="#recursos" className="transition-colors hover:text-foreground">Recursos</a>
            <a href="#como-funciona" className="transition-colors hover:text-foreground">Como funciona</a>
            <a href="#planos" className="transition-colors hover:text-foreground">Planos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/auth">Testar grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
          <div className="landing-grid-bg absolute inset-0 -z-10" aria-hidden="true" />
          <div className="mx-auto max-w-7xl text-center">
            <p className="mx-auto inline-flex items-center gap-2 border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Agora para áudio e vídeo
            </p>
            <h1 className="mx-auto mt-6 max-w-5xl text-4xl font-extrabold leading-[1.08] sm:text-6xl lg:text-7xl">
              Som profissional para seu <span className="landing-signal-text">áudio e vídeo</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Corrija volume baixo, falta de grave e pouca clareza. O AudioMix analisa, masteriza e permite comparar o
              resultado antes de baixar — sem instalar nada e sem enviar seu arquivo para a nuvem.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 px-7" asChild>
                <Link to="/auth">Melhorar meu arquivo grátis <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7" asChild>
                <a href="#produto"><Play className="mr-2 h-4 w-4 fill-current" /> Ver o AudioMix</a>
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-primary" /> 1 faixa grátis</span>
              <span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-primary" /> Sem cartão</span>
              <span className="flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-primary" /> Arquivo privado</span>
            </div>

            <div id="produto" className="mx-auto mt-12 max-w-6xl text-left sm:mt-16">
              <ProductPreview />
            </div>

            <div className="mt-7 flex flex-col items-center justify-between gap-4 border-y border-border/70 py-5 sm:flex-row">
              <p className="text-sm font-medium">Envie praticamente qualquer gravação</p>
              <ul className="flex flex-wrap justify-center gap-2" aria-label="Formatos aceitos">
                {FORMATS.map((format) => (
                  <li key={format} className="border border-border bg-secondary/45 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                    {format}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="recursos" className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="landing-eyebrow">Duas formas de trabalhar</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Simples quando você quer rapidez. Completo quando quer controle.</h2>
              <p className="mt-4 text-muted-foreground">Comece com a correção guiada e abra a mesa profissional sempre que quiser ajustar cada detalhe.</p>
            </div>

            <div className="mt-10 grid auto-rows-[minmax(190px,auto)] gap-4 lg:grid-cols-12">
              <article className="landing-bento relative overflow-hidden p-6 sm:p-8 lg:col-span-7 lg:row-span-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="landing-icon"><Sparkles className="h-5 w-5" /></span>
                    <h3 className="mt-5 text-2xl font-bold">Masterização simplificada</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Escolha o destino, receba uma nota técnica e aplique uma correção equilibrada de volume, grave, clareza e dinâmica.</p>
                  </div>
                  <span className="border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">Automático</span>
                </div>
                <div className="mt-8 grid grid-cols-[auto_1fr] gap-4 border-t border-border pt-6">
                  <div className="flex h-20 w-20 items-center justify-center border border-primary/25 bg-primary/10 font-mono text-3xl font-bold text-primary">84</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[['Volume', '-14 LUFS'], ['Pico real', '-1.0 dBTP'], ['Dinâmica', '10.4 dB'], ['Estéreo', '72%']].map(([label, value]) => (
                      <div key={label} className="border border-border bg-secondary/30 p-2.5"><span className="block text-muted-foreground">{label}</span><b className="mt-1 block font-mono">{value}</b></div>
                    ))}
                  </div>
                </div>
              </article>

              <article className="landing-bento p-6 lg:col-span-5">
                <span className="landing-icon"><Video className="h-5 w-5" /></span>
                <h3 className="mt-5 text-xl font-bold">Vídeo com áudio melhorado</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">O AudioMix mantém a imagem original e cria uma nova versão em WebM com a trilha sonora tratada.</p>
                <div className="mt-5 flex items-center gap-2 text-xs text-primary"><Film className="h-4 w-4" /> MP4 ou WebM → WebM tratado</div>
              </article>

              <article className="landing-bento p-6 lg:col-span-5">
                <span className="landing-icon accent"><Headphones className="h-5 w-5" /></span>
                <h3 className="mt-5 text-xl font-bold">Antes x Depois de verdade</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Alterne entre as versões no mesmo trecho e confira a mudança também nas métricas.</p>
                <div className="mt-5 grid grid-cols-2 gap-2 text-center text-xs"><span className="border border-border p-2 text-muted-foreground">Original</span><span className="border border-accent/40 bg-accent/10 p-2 text-accent">Melhorado</span></div>
              </article>

              <article className="landing-bento p-6 lg:col-span-5">
                <span className="landing-icon accent"><Sliders className="h-5 w-5" /></span>
                <h3 className="mt-5 text-xl font-bold">EQ profissional de 10 bandas</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Presets, compressor, limiter, normalização, filtros e controles manuais para quem quer precisão.</p>
              </article>

              <article className="landing-bento p-6 lg:col-span-3">
                <span className="landing-icon"><Mic className="h-5 w-5" /></span>
                <h3 className="mt-5 text-xl font-bold">Grave já tratado</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Use microfone ou arquivo e grave o resultado do processamento ao vivo.</p>
              </article>

              <article className="landing-bento p-6 lg:col-span-4">
                <span className="landing-icon"><ShieldCheck className="h-5 w-5" /></span>
                <h3 className="mt-5 text-xl font-bold">Privado por natureza</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">O processamento acontece no navegador. Seu conteúdo continua no seu aparelho.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-border/70 bg-surface-sunken/65 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="landing-eyebrow">Do arquivo ao resultado</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Seu melhor som em quatro passos</h2>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <article key={step.number} className="bg-background p-6 sm:p-7">
                  <div className="flex items-center justify-between"><step.icon className="h-5 w-5 text-primary" /><span className="font-mono text-xs text-muted-foreground">{step.number}</span></div>
                  <h3 className="mt-8 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="landing-eyebrow">Para cada gravação</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Um estúdio que cabe na sua rotina</h2>
              <p className="mt-4 leading-7 text-muted-foreground">Música, ensaio, podcast, aula, narração, evento, apresentação ou vídeo para redes sociais. Escolha o objetivo e trabalhe no celular ou computador.</p>
              <Button className="mt-7" variant="outline" asChild><Link to="/auth">Experimentar agora <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [Waves, "Música e ensaio", "Mais peso, presença e equilíbrio para a banda."],
                [Mic, "Podcast e voz", "Volume constante e fala mais clara."],
                [MonitorPlay, "Vídeos e redes", "Imagem preservada com uma trilha mais forte."],
                [Gauge, "Eventos e aulas", "Gravações baixas recuperadas para ouvir melhor."],
              ].map(([Icon, title, text]) => {
                const ItemIcon = Icon as typeof Waves;
                return <article key={title as string} className="landing-bento p-5"><ItemIcon className="h-5 w-5 text-accent" /><h3 className="mt-4 font-bold">{title as string}</h3><p className="mt-1 text-sm text-muted-foreground">{text as string}</p></article>;
              })}
            </div>
          </div>
        </section>

        <section id="planos" className="border-y border-border/70 bg-surface-sunken/65 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="landing-eyebrow">Planos acessíveis</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Comece grátis. Cresça quando precisar.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Uma faixa gratuita, sem cartão. Depois escolha apenas a quantidade que combina com sua rotina.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {PLANS.map((plan) => (
                <article key={plan.id} className={`landing-price flex flex-col p-6 ${plan.highlight ? "is-featured" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    {plan.highlight && <span className="bg-accent/15 px-2 py-1 text-[10px] font-bold uppercase text-accent">Mais escolhido</span>}
                  </div>
                  <p className="mt-5 text-4xl font-bold">{formatBRL(plan.price)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">por mês · até {plan.tracks} faixas</p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {plan.perks.map((perk) => <li key={perk} className="flex gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span className="text-muted-foreground">{perk}</span></li>)}
                    <li className="flex gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span className="text-muted-foreground">Áudio e vídeo</span></li>
                  </ul>
                  <Button className="mt-7 w-full" variant={plan.highlight ? "default" : "outline"} asChild><Link to="/auth">Escolher {plan.name}</Link></Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="landing-eyebrow">Dúvidas comuns</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Tudo claro antes de começar</h2>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold"><span>{item.q}</span><ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" /></summary>
                  <p className="max-w-2xl pt-3 text-sm leading-6 text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
          <div className="landing-cta mx-auto max-w-7xl px-6 py-12 text-center sm:px-12 sm:py-16">
            <p className="landing-eyebrow">Seu arquivo pode soar melhor</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold sm:text-5xl">Ouça a diferença no seu próprio áudio ou vídeo.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">Crie sua conta, envie uma faixa e teste todos os passos sem informar cartão.</p>
            <Button size="lg" className="mt-7 h-12 px-7" asChild><Link to="/auth">Começar com 1 faixa grátis <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2 font-semibold text-foreground"><img src="/favicon.png" alt="" className="h-5 w-5" /> AudioMix</span>
          <p>Áudio e vídeo processados no seu aparelho · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
