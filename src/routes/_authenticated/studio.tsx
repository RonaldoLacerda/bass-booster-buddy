import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  Download,
  Film,
  Loader2,
  Mic,
  Music,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Save,
  SlidersHorizontal,
  Square,
  Trash2,
  Upload,
  Waves,
} from "lucide-react";
import { toast } from "sonner";

import { AppNav } from "@/components/AppNav";
import { consumeTrack, getAccount } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  addCustomPreset,
  loadCustomPresets,
  removeCustomPreset,
  type CustomPreset,
} from "@/lib/custom-presets";
import { decodeBlob, formatClock, pickRecorderMime } from "@/lib/recorder";
import { Onboarding } from "@/components/Onboarding";
import { downloadBlob, exportVideoWithAudio } from "@/lib/video-export";
import { isVideoFile, playMediaPair } from "@/lib/media-playback";


type InputMode = "file" | "mic";

export const Route = createFileRoute("/_authenticated/studio")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Equalizador e gravador de áudio e vídeo | AudioMix" },
      {
        name: "description",
        content:
          "Equalize qualquer gravação com EQ de 10 bandas, presets prontos e personalizados, grave o som já mixado do microfone ou de um arquivo e exporte em WAV ou MP3 320 kbps.",
      },
      { property: "og:title", content: "Equalizador e gravador de áudio e vídeo | AudioMix" },
      {
        property: "og:description",
        content:
          "EQ de 10 bandas, presets salvos por você, compressor, normalização e gravação ao vivo do áudio já mixado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [settings, setSettings] = useState<EqSettings>(DEFAULT_SETTINGS);
  const [fileName, setFileName] = useState("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isVideo, setIsVideo] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bypass, setBypass] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [videoExporting, setVideoExporting] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [activePreset, setActivePreset] = useState("culto");
  const [inputPeak, setInputPeak] = useState<number | null>(null);
  const [format, setFormat] = useState<ExportFormat>("wav");
  const [bitrate, setBitrate] = useState<number>(320);
  const [paid, setPaid] = useState(false);
  const [takePaid, setTakePaid] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [sourceVersion, setSourceVersion] = useState(0);
  const sourceRef = useRef(0);
  const exportLockRef = useRef(false);
  const mountedRef = useRef(true);
  const previewBufferRef = useRef<AudioBuffer | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ownedUrlRef = useRef("");
  const takeUrlRef = useRef<string | null>(null);

  const {
    data: account,
    refetch: refetchAccount,
  } = useQuery({ queryKey: ["account"], queryFn: () => getAccount() });
  const spendTrack = useServerFn(consumeTrack);
  const blocked = account ? account.remaining <= 0 && !paid : false;

  const ensureQuota = async (take = false) => {
    if (take ? takePaid : paid) return true;
    const source = sourceRef.current;
    if (account && account.remaining <= 0) {
      toast.error("Seu limite de faixas acabou. Escolha um plano para continuar.");
      return false;
    }
    const res = await spendTrack({ data: { fileName, goalId: "studio" } });
    void refetchAccount();
    if (!res.ok) {
      toast.error(res.reason ?? "Limite de faixas atingido.");
      return false;
    }
    if (!mountedRef.current || source !== sourceRef.current) return false;
    if (take) setTakePaid(true);
    else setPaid(true);
    return true;
  };


  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [presetName, setPresetName] = useState("");

  const [mode, setMode] = useState<InputMode>("file");
  const [monitor, setMonitor] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [takeUrl, setTakeUrl] = useState<string | null>(null);
  const [takeExporting, setTakeExporting] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const chainRef = useRef<Chain | null>(null);
  const inputBusRef = useRef<GainNode | null>(null);
  const dryRef = useRef<GainNode | null>(null);
  const masterOutRef = useRef<GainNode | null>(null);
  const recDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const fileSrcRef = useRef<MediaElementAudioSourceNode | null>(null);
  const micSrcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const takeBufferRef = useRef<AudioBuffer | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    const initial = PRESETS.find((p) => p.id === "culto");
    if (initial) setSettings((s) => initial.apply(s));
    setCustomPresets(loadCustomPresets());
  }, []);

  const ensureGraph = useCallback(() => {
    const el = audioRef.current;
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const chain = buildChain(ctx, settings);
      const inputBus = ctx.createGain();
      const dry = ctx.createGain();
      const mixBus = ctx.createGain();
      const masterOut = ctx.createGain();
      const recDest = ctx.createMediaStreamDestination();
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      an.smoothingTimeConstant = 0.8;

      inputBus.connect(chain.input);
      inputBus.connect(dry);
      dry.gain.value = mode === "file" || bypass ? 1 : 0;
      if (mode === "file" || bypass) chain.gain.gain.value = 0;
      masterOut.gain.value = mode === "file" || monitor ? 1 : 0;
      chain.output.connect(mixBus);
      dry.connect(mixBus);
      mixBus.connect(an);
      an.connect(masterOut);
      masterOut.connect(ctx.destination);
      mixBus.connect(recDest);

      if (el) {
        const src = ctx.createMediaElementSource(el);
        src.connect(inputBus);
        fileSrcRef.current = src;
      }

      ctxRef.current = ctx;
      chainRef.current = chain;
      inputBusRef.current = inputBus;
      dryRef.current = dry;
      masterOutRef.current = masterOut;
      recDestRef.current = recDest;
      setAnalyser(an);
    }
    return ctxRef.current;
  }, [settings, mode, bypass, monitor]);

  useEffect(() => {
    const chain = chainRef.current;
    const ctx = ctxRef.current;
    if (chain && ctx) {
      updateChain(chain, settings, ctx);
      if (mode === "file" || bypass) chain.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
    }
  }, [settings, mode, bypass]);

  useEffect(() => {
    const chain = chainRef.current;
    const dry = dryRef.current;
    const ctx = ctxRef.current;
    if (!chain || !dry || !ctx) return;
    chain.gain.gain.setTargetAtTime(
      mode === "file" || bypass ? 0 : Math.pow(10, settings.outputGain / 20),
      ctx.currentTime,
      0.02,
    );
    dry.gain.setTargetAtTime(mode === "file" || bypass ? 1 : 0, ctx.currentTime, 0.02);
  }, [bypass, settings.outputGain, mode]);

  // silencia as caixas no modo microfone sem monitoração (evita microfonia)
  useEffect(() => {
    const ctx = ctxRef.current;
    const out = masterOutRef.current;
    if (!ctx || !out) return;
    const audible = mode === "file" || monitor;
    out.gain.setTargetAtTime(audible ? 1 : 0, ctx.currentTime, 0.03);
  }, [mode, monitor]);

  // decodifica o arquivo para exportação e medição
  useEffect(() => {
    let cancelled = false;
    setInputPeak(null);
    bufferRef.current = null;
    if (!audioUrl) return;
    (async () => {
      try {
        const res = await fetch(audioUrl);

        const ab = await res.arrayBuffer();
        const ctx = new OfflineAudioContext(1, 1, 48000);
        const buf = await ctx.decodeAudioData(ab);
        if (cancelled) return;
        bufferRef.current = buf;
        setInputPeak(peakDb(buf));
        setSourceVersion((v) => v + 1);
      } catch {
        if (!cancelled) toast.error("Não conseguimos ler esse arquivo. Tente outro formato.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  useEffect(() => {
    let cancelled = false;
    let url = "";
    previewBufferRef.current = null;
    setPreviewUrl("");
    const buf = bufferRef.current;
    if (!buf) return;
    setPreviewBusy(true);
    const timer = window.setTimeout(() => {
      void renderProcessed(buf, settings).then((rendered) => {
        if (cancelled) return;
        previewBufferRef.current = rendered;
        url = URL.createObjectURL(encodeWav(rendered));
        setPreviewUrl(url);
      }).catch(() => {
        if (!cancelled) toast.error("Não foi possível preparar a prévia do áudio.");
      }).finally(() => { if (!cancelled) setPreviewBusy(false); });
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [sourceVersion, settings, audioUrl]);

  useEffect(() => {
    audioRef.current?.pause();
    videoRef.current?.pause();
    setPlaying(false);
  }, [previewUrl, bypass, audioUrl]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sourceRef.current += 1;
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        recorder.ondataavailable = null;
        if (recorder.state !== "inactive") recorder.stop();
      }
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      recDestRef.current?.stream.getTracks().forEach((track) => track.stop());
      micSrcRef.current?.disconnect();
      fileSrcRef.current?.disconnect();
      audioRef.current?.pause();
      if (ctxRef.current && ctxRef.current.state !== "closed") void ctxRef.current.close();
      if (ownedUrlRef.current) URL.revokeObjectURL(ownedUrlRef.current);
      if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const t = window.setInterval(() => setRecSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [recording]);

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    const ctx = ensureGraph();
    if (ctx?.state === "suspended") await ctx.resume();
    if (el.paused) {
      try {
        await playMediaPair(el, videoRef.current);
        setPlaying(true);
      } catch {
        el.pause();
        videoRef.current?.pause();
        setPlaying(false);
        toast.error("Não foi possível tocar o arquivo. Tente novamente.");
      }
    } else {
      el.pause();
      videoRef.current?.pause();
      setPlaying(false);
    }
  };

  const enableMic = async () => {
    const ctx = ensureGraph();
    if (!ctx) return;
    if (ctx.state === "suspended") await ctx.resume();
    if (micSrcRef.current) {
      setMode("mic");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const bus = inputBusRef.current;
      if (!mountedRef.current || !bus || ctx.state === "closed") {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      audioRef.current?.pause();
      videoRef.current?.pause();
      setPlaying(false);
      const src = ctx.createMediaStreamSource(stream);
      src.connect(bus);
      micStreamRef.current = stream;
      micSrcRef.current = src;
      setMode("mic");
      toast.success("Microfone conectado à mesa.");
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  };

  const disableMic = () => {
    micSrcRef.current?.disconnect();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micSrcRef.current = null;
    micStreamRef.current = null;
    setMode("file");
  };

  const startRecording = async () => {
    if (exportLockRef.current || recording || (mode === "file" && (!previewUrl || previewBusy))) return;
    const ctx = ensureGraph();
    if (!ctx || !recDestRef.current) return;
    if (ctx.state === "suspended") await ctx.resume();
    const mimeType = pickRecorderMime();
    if (!mimeType) {
      toast.error("Seu navegador não suporta gravação de áudio.");
      return;
    }
    try {
      const rec = new MediaRecorder(recDestRef.current.stream, { mimeType });
      const takeSession = ++sourceRef.current;
      setTakePaid(false);
      takeBufferRef.current = null;
      const chunks: Blob[] = [];
      chunksRef.current = chunks;
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        try {
          const decoded = await decodeBlob(blob);
          if (!mountedRef.current || takeSession !== sourceRef.current) return;
          takeBufferRef.current = decoded;
        } catch {
          if (!mountedRef.current || takeSession !== sourceRef.current) return;
          takeBufferRef.current = null;
        }
        if (!mountedRef.current || takeSession !== sourceRef.current) return;
        setTakeUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          const url = URL.createObjectURL(blob);
          takeUrlRef.current = url;
          return url;
        });
        toast.success("Gravação finalizada — já mixada e pronta para exportar.");
      };
      rec.start(500);
      recorderRef.current = rec;
      if (mode === "file") {
        const el = audioRef.current;
        if (el) {
          await playMediaPair(el, videoRef.current);
          setPlaying(true);
        }
      }
      setRecSeconds(0);
      setRecording(true);
    } catch {
      toast.error("Não foi possível iniciar a gravação.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const onFile = (file: File) => {
    if (exportLockRef.current || recording) return;
    sourceRef.current += 1;
    setPaid(false);
    setTakePaid(false);
    setTakeUrl(null);
    takeBufferRef.current = null;
    if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    takeUrlRef.current = null;
    bufferRef.current = null;
    previewBufferRef.current = null;
    audioRef.current?.pause();
    videoRef.current?.pause();
    disableMic();
    setDuration(0);
    setBypass(false);
    const url = URL.createObjectURL(file);
    setAudioUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });
    ownedUrlRef.current = url;
    setFileName(file.name);
    setIsVideo(isVideoFile(file));
    setPlaying(false);
    setCurrent(0);
    setMode("file");
  };

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setSettings((s) => p.apply(s));
    setActivePreset(id);
  };

  const applyCustom = (p: CustomPreset) => {
    setSettings(structuredClone(p.settings));
    setActivePreset(p.id);
  };

  const savePreset = () => {
    setCustomPresets(addCustomPreset(presetName, settings));
    setPresetName("");
    toast.success("Preset salvo neste navegador.");
  };

  const deletePreset = (id: string) => {
    setCustomPresets(removeCustomPreset(id));
    if (activePreset === id) setActivePreset("");
  };

  const setBandGain = (id: string, gain: number) => {
    setSettings((s) => ({ ...s, bands: s.bands.map((b) => (b.id === id ? { ...b, gain } : b)) }));
    setActivePreset("");
  };

  const download = async (buf: AudioBuffer, suffix: string) => {
    const blob = format === "mp3" ? await encodeMp3(buf, bitrate) : encodeWav(buf);
    downloadBlob(blob, `${fileName.replace(/\.[^.]+$/, "")} - ${suffix}.${format}`);
  };

  const handleExport = async () => {
    const buf = previewBufferRef.current;
    if (!buf || previewBusy) {
      toast.error("Áudio ainda carregando, tente em alguns segundos.");
      return;
    }
    if (exportLockRef.current) return;
    exportLockRef.current = true;
    setExporting(true);
    try {
      if (!(await ensureQuota())) return;
      await download(buf, "tratado");
      toast.success(
        format === "mp3"
          ? `Áudio tratado exportado em MP3 ${bitrate} kbps.`
          : "Áudio tratado exportado em WAV 16 bits.",
      );
    } catch {
      toast.error("Não foi possível processar este arquivo.");
    } finally {
      exportLockRef.current = false;
      setExporting(false);
    }
  };

  const handleVideoExport = async () => {
    const buf = previewBufferRef.current;
    if (!buf || previewBusy || !audioUrl || !isVideo) {
      toast.error("Vídeo ainda carregando, tente em alguns segundos.");
      return;
    }
    if (exportLockRef.current) return;
    exportLockRef.current = true;
    setVideoExporting(true);
    setVideoProgress(0);
    try {
      if (!(await ensureQuota())) return;
      const blob = await exportVideoWithAudio(audioUrl, buf, setVideoProgress);
      downloadBlob(blob, `${fileName.replace(/\.[^.]+$/, "")} - tratado.${blob.type === "video/mp4" ? "mp4" : "webm"}`);
      toast.success("Vídeo exportado com o áudio tratado.");
    } catch {
      toast.error("Não foi possível gerar o vídeo. Tente usar Chrome ou Edge atualizado.");
    } finally {
      exportLockRef.current = false;
      setVideoExporting(false);
    }
  };

  const exportTake = async () => {
    const buf = takeBufferRef.current;
    if (!buf) {
      toast.error("Grave algo antes de exportar.");
      return;
    }
    if (exportLockRef.current) return;
    exportLockRef.current = true;
    setTakeExporting(true);
    try {
      if (!(await ensureQuota(true))) return;
      await download(buf, "gravacao");
      toast.success("Gravação exportada.");
    } catch {
      toast.error("Não foi possível exportar a gravação.");
    } finally {
      exportLockRef.current = false;
      setTakeExporting(false);
    }
  };

  const gainSum = useMemo(
    () => settings.bands.reduce((acc, b) => acc + b.gain, 0),
    [settings.bands],
  );

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" />
      <Onboarding id="studio" />
      <audio
        ref={audioRef}
        src={(bypass ? audioUrl : previewUrl) || undefined}

        crossOrigin="anonymous"
        onPause={() => { videoRef.current?.pause(); setPlaying(false); }}
        onTimeUpdate={(e) => {
          setCurrent(e.currentTarget.currentTime);
          const video = videoRef.current;
          if (video && Math.abs(video.currentTime - e.currentTarget.currentTime) > 0.2) video.currentTime = e.currentTarget.currentTime;
        }}
        onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); e.currentTarget.currentTime = Math.min(current, e.currentTarget.duration || 0); }}
        onEnded={() => { setPlaying(false); videoRef.current?.pause(); }}
        className="hidden"
      />

      <AppNav />

      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
              <Waves className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold">Mesa de Masterização</h1>
              <p className="text-xs text-muted-foreground">
                Equalize, grave e exporte seu áudio
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/master">
                <Sparkles className="mr-2 h-4 w-4" /> Modo simplificado (IA)
              </Link>
            </Button>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="audio/*,video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) onFile(file); e.target.value = ""; }}
              />
              <span className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                <Upload className="h-4 w-4" /> Carregar áudio ou vídeo
              </span>
            </label>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        {account && (
          <section className="panel flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <span>
              Plano <span className="font-semibold">{account.planName}</span> ·{" "}
              {account.remaining} de {account.limit} faixas disponíveis {account.periodLabel}
            </span>
            {blocked ? (
              <Button size="sm" asChild>
                <Link to="/planos">Escolher um plano</Link>
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                {paid
                  ? "Faixa em uso — ajuste e exporte quantas versões quiser."
                  : "Uma faixa é usada apenas quando você exporta."}
              </span>
            )}
          </section>
        )}
        {blocked && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            Seu limite de faixas acabou. Assine um plano para continuar exportando.
          </p>
        )}
        {/* Fonte de áudio */}
        <section className="panel flex flex-wrap items-center gap-3 p-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Fonte</span>
          <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/50 p-1">
            <button
              onClick={() => mode === "mic" && disableMic()}
              className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === "file"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Music className="h-3.5 w-3.5" /> Arquivo
            </button>
            <button
              onClick={enableMic}
              className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === "mic"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mic className="h-3.5 w-3.5" /> Microfone
            </button>
          </div>
          {mode === "mic" && (
            <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Monitorar nas caixas (use fone p/ evitar microfonia)
              </span>
              <Switch checked={monitor} onCheckedChange={setMonitor} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {!recording ? (
              <Button
                onClick={startRecording}
                disabled={exporting || videoExporting || takeExporting || (mode === "file" && (!previewUrl || previewBusy))}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Circle className="mr-2 h-3.5 w-3.5 fill-current" /> Gravar mixado
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="secondary">
                <Square className="mr-2 h-3.5 w-3.5 fill-current" /> Parar ({formatClock(recSeconds)})
              </Button>
            )}
            {takeUrl && !recording && (
              <>
                <audio src={takeUrl} controls className="h-9 max-w-[260px]" />
                <Button variant="outline" onClick={exportTake} disabled={takeExporting || exporting || videoExporting || (account ? account.remaining <= 0 && !takePaid : false)}>
                  {takeExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Baixar gravação
                </Button>
              </>
            )}
          </div>
        </section>

        {/* Nenhum áudio carregado */}
        {!audioUrl && (
          <section className="panel flex flex-col items-center gap-3 border border-dashed border-border p-12 text-center">
            <Upload className="h-8 w-8 text-accent" />
            <h2 className="font-semibold">Carregue um áudio ou vídeo para começar</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Escolha MP3, WAV, M4A, OGG, MP4 ou WebM do seu aparelho, ou mude a fonte para
              microfone e grave direto na mesa. Tudo fica no seu navegador.
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="audio/*,video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) onFile(file); e.target.value = ""; }}
              />
              <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                <Upload className="h-4 w-4" /> Escolher arquivo
              </span>
            </label>
          </section>
        )}

        {/* Transporte */}
        <section className="panel p-5">
          {isVideo && audioUrl && (
            <video
              ref={videoRef}
              src={audioUrl}
              muted
              playsInline
              preload="auto"
              className="mb-5 aspect-video w-full rounded-lg bg-surface-sunken object-contain"
            />
          )}
          <div className="flex flex-wrap items-center gap-4">
            <Button
              size="icon"
              onClick={togglePlay}
              disabled={!audioUrl || (!bypass && (previewBusy || !previewUrl)) || mode === "mic"}
              className="h-14 w-14 rounded-full bg-[image:var(--gradient-accent)] text-accent-foreground hover:opacity-90"
              aria-label={playing ? "Pausar" : "Tocar"}
            >
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <div className="min-w-[220px] flex-1">
              <p className="truncate text-sm font-medium">
                {fileName || "Nenhum áudio carregado"}
              </p>

              <div className="mt-2 flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">
                  {formatTime(current)}
                </span>
                <Slider
                  value={[current]}
                  max={duration || 1}
                  step={0.1}
                  onValueChange={(v) => {
                    const position = v[0] ?? 0;
                    if (audioRef.current) audioRef.current.currentTime = position;
                    if (videoRef.current) videoRef.current.currentTime = position;
                    setCurrent(position);
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
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 p-1">
              {(["wav", "mp3"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold uppercase transition-colors ${
                    format === f
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
              {format === "mp3" && (
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(Number(e.target.value))}
                  className="rounded bg-transparent px-1 py-1.5 font-mono text-xs text-foreground outline-none"
                  aria-label="Qualidade do MP3"
                >
                  {MP3_BITRATES.map((b) => (
                    <option key={b} value={b} className="bg-secondary text-foreground">
                      {b} kbps
                    </option>
                  ))}
                </select>
              )}
            </div>
            <Button
              onClick={handleExport}
              disabled={exporting || videoExporting || takeExporting || previewBusy || blocked || !previewUrl}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exportar {format === "mp3" ? `MP3 ${bitrate}` : "WAV"}
            </Button>
            {isVideo && (
              <Button
                variant="secondary"
                onClick={handleVideoExport}
                disabled={videoExporting || exporting || takeExporting || previewBusy || blocked || !previewUrl}
              >
                {videoExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Film className="mr-2 h-4 w-4" />
                )}
                {videoExporting ? `Gerando vídeo ${Math.round(videoProgress)}%` : "Exportar vídeo"}
              </Button>
            )}
          </div>
          {isVideo && (
            <p className="mt-3 text-xs text-muted-foreground">
              A imagem original será mantida e o vídeo tratado será salvo em WebM. A geração acompanha a duração do vídeo.
            </p>
          )}
          {inputPeak !== null && (
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Pico do original: {inputPeak.toFixed(1)} dBFS
              {inputPeak < -6 && (
                <span className="ml-2 text-accent">
                  → gravação baixa, a normalização vai subir ~
                  {Math.abs(inputPeak + 0.5).toFixed(1)} dB
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

          <div className="mt-6 border-t border-border/60 pt-5">
            <h3 className="text-sm font-semibold">Meus presets</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Nome do preset (ex: Vigília baixo forte)"
                className="max-w-xs"
              />
              <Button variant="secondary" onClick={savePreset}>
                <Save className="mr-2 h-4 w-4" /> Salvar ajustes atuais
              </Button>
            </div>
            {customPresets.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {customPresets.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border p-3 ${
                      activePreset === p.id
                        ? "border-accent bg-accent/10"
                        : "border-border bg-secondary/40"
                    }`}
                  >
                    <button onClick={() => applyCustom(p)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </button>
                    <button
                      onClick={() => deletePreset(p.id)}
                      aria-label={`Excluir ${p.name}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Ajuste as bandas como quiser e salve — os presets ficam guardados neste navegador.
              </p>
            )}
          </div>
        </section>

        {/* EQ */}
        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Equalizador de {settings.bands.length} bandas
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

          <div className="mt-6 flex flex-wrap justify-between gap-5">
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
                <p className="text-sm font-medium">Normalizar volume</p>
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
              <strong>700 Hz a 2,5 kHz</strong>. Reforce o Grave (150 Hz) para peso, corte o
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
