import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock, RotateCcw, Sliders, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/components/AppNav";
import { GoalPicker } from "@/components/master/GoalPicker";
import { DiagnosisCard } from "@/components/master/DiagnosisCard";
import { AbPlayer } from "@/components/master/AbPlayer";
import { ExportCard } from "@/components/master/ExportCard";
import { analyzeBuffer, type AudioMetrics } from "@/lib/analysis";
import { diagnose, focusInsight, type Diagnosis } from "@/lib/diagnosis";
import { FOCUS, type FocusId, type GoalId, goalById } from "@/lib/goals";
import { masterAudio, type MasterResult } from "@/lib/mastering";
import { formatClock } from "@/lib/recorder";
import { consumeTrack, getAccount } from "@/lib/account.functions";
import { Onboarding } from "@/components/Onboarding";

export const Route = createFileRoute("/_authenticated/master")({
  head: () => ({
    meta: [
      { title: "Masterizar áudio | AudioMix" },
      {
        name: "description",
        content:
          "Envie sua gravação — música, ensaio, podcast, aula ou evento — e receba um diagnóstico técnico real (LUFS, picos, graves) com correção automática de volume, grave e clareza. Tudo no seu navegador.",
      },
      { property: "og:title", content: "Masterizar áudio | AudioMix" },
      {
        property: "og:description",
        content:
          "Diagnóstico automático e masterização de qualquer gravação — volume, graves e clareza corrigidos em segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Master,
});

type Stage = "upload" | "goal" | "diagnosis" | "result";

function Master() {
  const queryClient = useQueryClient();
  const { data: account } = useQuery({ queryKey: ["account"], queryFn: () => getAccount() });
  const spendTrack = useServerFn(consumeTrack);

  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState("");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [metrics, setMetrics] = useState<AudioMetrics | null>(null);
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [focus, setFocus] = useState<FocusId>("none");
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [master, setMaster] = useState<MasterResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [paid, setPaid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);

  const blocked = account ? account.remaining <= 0 && !paid : false;

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const reset = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setOriginalUrl(null);
    setBuffer(null);
    setMetrics(null);
    setDiagnosis(null);
    setMaster(null);
    setGoal(null);
    setFocus("none");
    setFileName("");
    setError(null);
    setPaid(false);
    setStage("upload");
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setAnalyzing(true);
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    try {
      const ab = await file.arrayBuffer();
      const ctx = new OfflineAudioContext(2, 1, 48000);
      const decoded = await ctx.decodeAudioData(ab);
      const m = await analyzeBuffer(decoded);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(file);
      urlRef.current = url;
      setOriginalUrl(url);
      setBuffer(decoded);
      setMetrics(m);
      setStage("goal");
    } catch {
      setError("Não conseguimos ler esse arquivo. Tente um MP3, WAV, M4A ou OGG.");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const chooseGoal = (id: GoalId) => {
    setGoal(id);
    if (metrics) {
      setDiagnosis(diagnose(metrics, goalById(id)));
      setMaster(null);
      setStage("diagnosis");
    }
  };

  const process = async () => {
    if (!buffer || !metrics || !goal) return;
    setProcessing(true);
    setError(null);
    try {
      if (!paid) {
        const credit = await spendTrack({ data: { fileName, goalId: goal } });
        void queryClient.invalidateQueries({ queryKey: ["account"] });
        if (!credit.ok) {
          setError(credit.reason ?? "Limite de faixas atingido.");
          return;
        }
        setPaid(true);
      }
      const result = await masterAudio(buffer, metrics, goal, focus, fileName);
      setMaster(result);
      setStage("result");
    } catch {
      setError("Falha ao processar o áudio. Tente novamente com um arquivo menor.");
    } finally {
      setProcessing(false);
    }
  };

  const changeFocus = async (id: FocusId) => {
    setFocus(id);
    if (!buffer || !metrics || !goal) return;
    setProcessing(true);
    try {
      setMaster(await masterAudio(buffer, metrics, goal, id, fileName));
    } finally {
      setProcessing(false);
    }
  };

  const insight = metrics ? focusInsight(metrics, focus) : null;

  return (
    <>
      <AppNav />
      <Onboarding id="master" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-[var(--font-display,inherit)] text-2xl font-bold tracking-tight sm:text-4xl">
              Modo simplificado — a IA cuida de tudo
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Música, ensaio, podcast, aula, evento ao vivo. Analisamos seu arquivo, mostramos o que está
              errado e corrigimos volume, grave e clareza — tudo dentro do seu navegador, sem enviar nada.
            </p>
          </div>
          <div className="flex gap-2">
            {stage !== "upload" && (
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Novo áudio
              </Button>
            )}
            <Button variant="ghost" size="sm" className="flex-1 sm:flex-none" asChild>
              <Link to="/studio">
                <Sliders className="mr-2 h-4 w-4" />
                Mesa completa
              </Link>
            </Button>
          </div>
        </header>

        {account && (
          <p className="mt-4 text-xs text-muted-foreground">
            Plano <span className="font-semibold text-foreground">{account.planName}</span> ·{" "}
            {account.remaining} de {account.limit} faixas disponíveis {account.periodLabel}
          </p>
        )}

        {blocked && (
          <section className="panel mt-6 flex flex-col items-start gap-3 border border-accent/50 p-4 sm:p-5">
            <Lock className="h-6 w-6 text-accent" />
            <h2 className="text-lg font-semibold">Seu limite de faixas acabou</h2>
            <p className="text-sm text-muted-foreground">
              {account?.planId === "free"
                ? "Você já usou sua faixa gratuita. Escolha um plano para continuar masterizando."
                : "Você usou todas as faixas do seu plano neste mês. Faça upgrade para liberar mais."}
            </p>
            <Button className="w-full sm:w-auto" asChild>
              <Link to="/planos">Ver planos</Link>
            </Button>
          </section>
        )}

        {error && (
          <p className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {stage === "upload" && !blocked && (
          <section className="mt-6 sm:mt-8">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) void handleFile(f);
              }}
              onClick={() => inputRef.current?.click()}
              className={`panel flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed p-8 text-center transition-colors sm:p-14 ${
                dragging ? "border-accent bg-accent/10" : "border-border"
              }`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="font-semibold">Analisando seu áudio...</p>
                  <p className="text-xs text-muted-foreground">
                    Medindo volume, picos, graves, dinâmica e estéreo
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-accent" />
                  <p className="font-semibold sm:hidden">Toque para escolher seu áudio</p>
                  <p className="hidden font-semibold sm:block">
                    Arraste seu áudio aqui ou clique para escolher
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP3, WAV, M4A ou OGG — processado no seu aparelho
                  </p>
                  <span className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground sm:hidden">
                    <Upload className="h-4 w-4" /> Enviar áudio
                  </span>
                </>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </section>
        )}

        {metrics && stage !== "upload" && (
          <p className="mt-6 break-words text-xs text-muted-foreground sm:mt-8">
            <span className="font-semibold text-foreground">{fileName}</span> ·{" "}
            {formatClock(metrics.duration)} · {metrics.channels > 1 ? "estéreo" : "mono"} ·{" "}
            {(metrics.sampleRate / 1000).toFixed(1)} kHz
          </p>
        )}


        {stage !== "upload" && (
          <section className="mt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              🎯 Onde esse áudio vai ser ouvido?
            </h2>
            <div className="mt-3">
              <GoalPicker value={goal} onChange={chooseGoal} />
            </div>
          </section>
        )}

        {diagnosis && metrics && stage !== "upload" && stage !== "goal" && (
          <div className="mt-6 sm:mt-8">
            <DiagnosisCard
              diagnosis={diagnosis}
              metrics={metrics}
              onProcess={process}
              processing={processing}
            />
          </div>
        )}

        {stage === "result" && master && metrics && originalUrl && (
          <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-6">
            <AbPlayer
              originalUrl={originalUrl}
              processed={master.buffer}
              before={metrics}
              after={master.metrics}
            />

            <section className="panel p-4 sm:p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                🎸 Destacar um instrumento
              </h2>
              <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                {FOCUS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => void changeFocus(f.id)}
                    disabled={processing}
                    className={`shrink-0 rounded-full border px-3.5 py-2 text-sm transition-colors ${
                      focus === f.id
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/60"
                    }`}
                  >
                    {f.emoji} {f.name}
                  </button>
                ))}
              </div>

              {insight && (
                <div className="mt-4 space-y-2 rounded-lg bg-[var(--surface-sunken)] p-4 text-sm">
                  <p>
                    <span className="font-semibold">O que encontramos:</span> {insight.finding}
                  </p>
                  <p className="text-muted-foreground">{insight.suggestion}</p>
                  <p className="text-xs text-muted-foreground">
                    {FOCUS.find((f) => f.id === focus)?.explanation}
                  </p>
                </div>
              )}
              {processing && (
                <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reprocessando com o novo foco...
                </p>
              )}
            </section>

            <ExportCard buffer={master.buffer} baseName={fileName || "audio-masterizado"} />

            <p className="text-xs text-muted-foreground">
              Ganho aplicado na normalização: {master.gainApplied >= 0 ? "+" : ""}
              {master.gainApplied.toFixed(1)} dB · Alvo do objetivo:{" "}
              {goal ? goalById(goal).targetLufs : 0} LUFS · Teto: {goal ? goalById(goal).ceiling : 0} dBTP
            </p>
          </div>
        )}
      </main>
    </>
  );
}
