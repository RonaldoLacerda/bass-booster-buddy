import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Upload,
  Waves,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { Fader } from "@/components/Fader";
import { EqCurve } from "@/components/EqCurve";
import {
  DEFAULT_SETTINGS,
  MP3_BITRATES,
  PRESETS,
  buildChain,
  encodeMp3,
  encodeWav,
  formatTime,
  peakDb,
  renderProcessed,
  updateChain,
  type Chain,
  type EqSettings,
  type ExportFormat,
} from "@/lib/audio-engine";
import demoAudio from "@/assets/vigilia.mp3.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Equalizador de Áudio Profissional | Estúdio de Culto" },
      {
        name: "description",
        content:
          "Equalize gravações de culto no navegador: reforce o grave, aumente o volume com compressão e normalização, e baixe o áudio tratado em WAV.",
      },
      { property: "og:title", content: "Equalizador de Áudio Profissional" },
      {
        property: "og:description",
        content:
          "EQ de 7 bandas, compressor e normalização para deixar gravações baixas altas, encorpadas e claras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [settings, setSettings] = useState<EqSettings>(DEFAULT_SETTINGS);
  const [fileName, setFileName] = useState("VIGÍLIA ON FLAMES 28/08/2026.mp3");
  const [audioUrl, setAudioUrl] = useState<string>(demoAudio.url);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bypass, setBypass] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activePreset, setActivePreset] = useState("culto");
  const [inputPeak, setInputPeak] = useState<number | null>(null);
  const [format, setFormat] = useState<ExportFormat>("wav");
  const [bitrate, setBitrate] = useState<number>(320);

  const audioRef = useRef<HTMLAudioElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const chainRef = useRef<Chain | null>(null);
  const srcRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dryRef = useRef<GainNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  // aplica o preset inicial
  useEffect(() => {
    setSettings((s) => PRESETS.find((p) => p.id === "culto")!.apply(s));
  }, []);

  const ensureGraph = useCallback(() => {
    const el = audioRef.current;
    if (!el) return null;
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const src = ctx.createMediaElementSource(el);
      const chain = buildChain(ctx, settings);
      const dry = ctx.createGain();
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      an.smoothingTimeConstant = 0.8;

      src.connect(chain.input);
      src.connect(dry);
      dry.gain.value = 0;
      chain.output.connect(an);
      dry.connect(an);
      an.connect(ctx.destination);

      ctxRef.current = ctx;
      chainRef.current = chain;
      srcRef.current = src;
      dryRef.current = dry;
      setAnalyser(an);
    }
    return ctxRef.current;
  }, [settings]);

  useEffect(() => {
    if (chainRef.current && ctxRef.current) updateChain(chainRef.current, settings, ctxRef.current);
  }, [settings]);

  useEffect(() => {
    const chain = chainRef.current;
    const dry = dryRef.current;
    const ctx = ctxRef.current;
    if (!chain || !dry || !ctx) return;
    chain.gain.gain.setTargetAtTime(
      bypass ? 0 : Math.pow(10, settings.outputGain / 20),
      ctx.currentTime,
      0.02,
    );
    dry.gain.setTargetAtTime(bypass ? 1 : 0, ctx.currentTime, 0.02);
  }, [bypass, settings.outputGain]);

  // decodifica o arquivo para exportação e medição
  useEffect(() => {
    let cancelled = false;
    setInputPeak(null);
    bufferRef.current = null;
    (async () => {
      try {
        const res = await fetch(audioUrl);
        const ab = await res.arrayBuffer();
        const ctx = new OfflineAudioContext(1, 1, 48000);
        const buf = await ctx.decodeAudioData(ab);
        if (cancelled) return;
        bufferRef.current = buf;
        setInputPeak(peakDb(buf));
      } catch {
        /* ignora — o player continua funcionando */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    const ctx = ensureGraph();
    if (ctx?.state === "suspended") await ctx.resume();
    if (el.paused) {
      await el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const onFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setFileName(file.name);
    setPlaying(false);
    setCurrent(0);
  };

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setSettings((s) => p.apply(s));
    setActivePreset(id);
  };

  const setBandGain = (id: string, gain: number) => {
    setSettings((s) => ({ ...s, bands: s.bands.map((b) => (b.id === id ? { ...b, gain } : b)) }));
    setActivePreset("");
  };

  const handleExport = async () => {
    const buf = bufferRef.current;
    if (!buf) {
      toast.error("Áudio ainda carregando, tente em alguns segundos.");
      return;
    }
    setExporting(true);
    try {
      const rendered = await renderProcessed(buf, settings);
      const blob = format === "mp3" ? await encodeMp3(rendered, bitrate) : encodeWav(rendered);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName.replace(/\.[^.]+$/, "")} - tratado.${format}`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(
        format === "mp3"
          ? `Áudio tratado exportado em MP3 ${bitrate} kbps.`
          : "Áudio tratado exportado em WAV 16 bits.",
      );
    } catch {
      toast.error("Não foi possível processar este arquivo.");
    } finally {
      setExporting(false);
    }
  };

  const gainSum = useMemo(
    () => settings.bands.reduce((acc, b) => acc + b.gain, 0),
    [settings.bands],
  );

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" />
      <audio
        ref={audioRef}
        src={audioUrl}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />

      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
              <Waves className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold">Mesa de Masterização</h1>
              <p className="text-xs text-muted-foreground">
                Equalizador profissional para gravações de culto
              </p>
            </div>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
              <Upload className="h-4 w-4" /> Carregar áudio
            </span>
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        {/* Transporte */}
        <section className="panel p-5">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              size="icon"
              onClick={togglePlay}
              className="h-14 w-14 rounded-full bg-[image:var(--gradient-accent)] text-accent-foreground hover:opacity-90"
              aria-label={playing ? "Pausar" : "Tocar"}
            >
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <div className="min-w-[220px] flex-1">
              <p className="truncate text-sm font-medium">{fileName}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">
                  {formatTime(current)}
                </span>
                <Slider
                  value={[current]}
                  max={duration || 1}
                  step={0.1}
                  onValueChange={(v) => {
                    if (audioRef.current) audioRef.current.currentTime = v[0]!;
                    setCurrent(v[0]!);
                  }}
                  className="flex-1"
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">Comparar original</span>
              <Switch checked={bypass} onCheckedChange={setBypass} />
            </div>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exportar WAV
            </Button>
          </div>
          {inputPeak !== null && (
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Pico do original: {inputPeak.toFixed(1)} dBFS
              {inputPeak < -6 && (
                <span className="ml-2 text-accent">
                  → gravação baixa, a normalização vai subir ~{Math.abs(inputPeak + 0.5).toFixed(1)} dB
                </span>
              )}
            </p>
          )}
        </section>

        {/* Presets */}
        <section className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Presets</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  activePreset === p.id
                    ? "border-accent bg-accent/10"
                    : "border-border bg-secondary/40 hover:bg-secondary"
                }`}
              >
                <p className="text-sm font-medium">{p.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* EQ */}
        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Equalizador de 7 bandas
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyPreset("flat")}
              className="text-muted-foreground"
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" /> Zerar
            </Button>
          </div>

          <EqCurve settings={settings} analyser={analyser} />

          <div className="mt-6 flex flex-wrap justify-between gap-6">
            {settings.bands.map((b) => (
              <Fader
                key={b.id}
                label={b.label}
                sublabel={b.freq >= 1000 ? `${b.freq / 1000} kHz` : `${b.freq} Hz`}
                value={b.gain}
                min={-18}
                max={18}
                onChange={(v) => setBandGain(b.id, v)}
              />
            ))}
            <Fader
              label="Volume"
              sublabel="saída"
              value={settings.outputGain}
              min={-12}
              max={12}
              onChange={(v) => setSettings((s) => ({ ...s, outputGain: v }))}
            />
          </div>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Soma das bandas: {gainSum > 0 ? "+" : ""}
            {gainSum.toFixed(1)} dB
          </p>
        </section>

        {/* Dinâmica */}
        <section className="panel grid gap-6 p-5 md:grid-cols-2">
          <div className="space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider">Dinâmica e limpeza</h2>

            <Control
              label="Filtro de graves indesejados (high-pass)"
              value={`${settings.highpass} Hz`}
            >
              <Slider
                value={[settings.highpass]}
                min={20}
                max={120}
                step={1}
                onValueChange={(v) => setSettings((s) => ({ ...s, highpass: v[0]! }))}
              />
            </Control>

            <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
              <div>
                <p className="text-sm font-medium">Compressor</p>
                <p className="text-xs text-muted-foreground">Deixa o áudio mais alto e constante</p>
              </div>
              <Switch
                checked={settings.compressor}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, compressor: v }))}
              />
            </div>

            <Control label="Limiar (threshold)" value={`${settings.threshold} dB`}>
              <Slider
                value={[settings.threshold]}
                min={-48}
                max={0}
                step={1}
                disabled={!settings.compressor}
                onValueChange={(v) => setSettings((s) => ({ ...s, threshold: v[0]! }))}
              />
            </Control>

            <Control label="Proporção (ratio)" value={`${settings.ratio}:1`}>
              <Slider
                value={[settings.ratio]}
                min={1}
                max={12}
                step={0.5}
                disabled={!settings.compressor}
                onValueChange={(v) => setSettings((s) => ({ ...s, ratio: v[0]! }))}
              />
            </Control>
          </div>

          <div className="space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider">Volume final</h2>
            <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
              <div>
                <p className="text-sm font-medium">Normalizar na exportação</p>
                <p className="text-xs text-muted-foreground">
                  Sobe o áudio até o pico alvo, sem distorcer
                </p>
              </div>
              <Switch
                checked={settings.normalize}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, normalize: v }))}
              />
            </div>
            <Control
              label="Pico alvo"
              value={`${(20 * Math.log10(settings.targetPeak)).toFixed(1)} dBFS`}
            >
              <Slider
                value={[settings.targetPeak]}
                min={0.5}
                max={1}
                step={0.01}
                disabled={!settings.normalize}
                onValueChange={(v) => setSettings((s) => ({ ...s, targetPeak: v[0]! }))}
              />
            </Control>

            <div className="rounded-lg border border-border bg-secondary/30 p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-2 text-sm font-medium text-foreground">Dica para baixista</p>
              A fundamental do baixo de 4 cordas vive entre <strong>41 e 200 Hz</strong>; o ataque
              que faz o instrumento aparecer em caixinha de celular está em{" "}
              <strong>700 Hz a 2,5 kHz</strong>. Reforce o Grave (120 Hz) para peso, corte o
              Médio-grave (300 Hz) para tirar o abafado e suba um pouco o Médio-agudo para definição.
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Processamento 100% no seu navegador — nenhum arquivo é enviado para servidores.
      </footer>
    </div>
  );
}

function Control({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="font-mono text-xs text-accent">{value}</span>
      </div>
      {children}
    </div>
  );
}
