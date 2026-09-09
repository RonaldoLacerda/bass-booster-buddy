import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = { title: string; text: string };

const STEPS: Record<string, Step[]> = {
  studio: [
    {
      title: "Bem-vindo ao AudioMix",
      text: "Esta é a mesa completa. Você começa carregando um áudio do seu computador ou ligando o microfone — nada é enviado para a internet.",
    },
    {
      title: "Ajuste o som",
      text: "Use os presets prontos como ponto de partida e depois mexa nas 10 faixas de frequência. O botão “Comparar original” mostra o antes e o depois na hora.",
    },
    {
      title: "Grave e exporte",
      text: "Você pode gravar o som já tratado e baixar em WAV sem perdas ou MP3 até 320 kbps. Uma faixa do seu plano só é usada quando você exporta.",
    },
    {
      title: "Com pressa? Use o modo simplificado",
      text: "No topo da tela existe o modo simplificado: ele analisa sua gravação, aponta os problemas e corrige o volume, o grave e a clareza automaticamente.",
    },
  ],
  master: [
    {
      title: "Modo simplificado",
      text: "Envie a gravação e nós medimos volume, picos, graves e clareza para dizer exatamente o que está errado.",
    },
    {
      title: "Escolha onde vai ser ouvido",
      text: "Cada destino (WhatsApp, YouTube, redes, ao vivo) tem um volume ideal diferente — a correção se adapta a ele.",
    },
    {
      title: "Compare e baixe",
      text: "Ouça antes e depois com as medições reais e exporte no formato que precisar. Para controle total, use a mesa avançada.",
    },
  ],
};

export function Onboarding({ id }: { id: keyof typeof STEPS }) {
  const key = `audiomix.onboarding.${id}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(key)) setOpen(true);
  }, [key]);

  const close = () => {
    window.localStorage.setItem(key, "1");
    setOpen(false);
  };

  if (!open) return null;
  const steps = STEPS[id]!;
  const current = steps[step]!;
  const last = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="panel w-full max-w-md rounded-b-none border border-accent/40 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-b-xl sm:p-6 sm:pb-6">
        <div className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <Sparkles className="h-4 w-4 shrink-0" /> Primeiros passos
          </span>
          <button
            onClick={close}
            aria-label="Fechar"
            className="-mr-2 -mt-2 shrink-0 p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 className="mt-3 text-lg font-semibold sm:text-xl">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.text}</p>
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex justify-center gap-1.5">
            {steps.map((s, i) => (
              <span
                key={s.title}
                className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-accent" : "bg-border"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="flex-1" onClick={close}>
              Pular
            </Button>
            <Button className="flex-[2]" onClick={() => (last ? close() : setStep(step + 1))}>
              {last ? "Começar" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
