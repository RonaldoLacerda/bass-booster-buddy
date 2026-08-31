import { useEffect, useRef } from "react";
import { responseCurve, type EqSettings } from "@/lib/audio-engine";

type Props = {
  settings: EqSettings;
  analyser?: AnalyserNode | null;
};

const MIN_F = 20;
const MAX_F = 20000;
const RANGE_DB = 18;

export function EqCurve({ settings, analyser }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;

    const css = getComputedStyle(document.documentElement);
    const c = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const accent = c("--accent", "#f0a020");
    const grid = c("--border", "#2a2a2a");
    const muted = c("--muted-foreground", "#888");
    const spec = c("--primary", "#4fd1c5");

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const xOf = (f: number) => (Math.log10(f / MIN_F) / Math.log10(MAX_F / MIN_F)) * w;
      const yOf = (db: number) => h / 2 - (db / RANGE_DB) * (h / 2 - 8);

      // grid
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillStyle = muted;
      for (const f of [50, 100, 200, 500, 1000, 2000, 5000, 10000]) {
        const x = xOf(f);
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x + 3, h - 4);
      }
      for (const db of [-12, -6, 0, 6, 12]) {
        const y = yOf(db);
        ctx.globalAlpha = db === 0 ? 0.9 : 0.35;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // live spectrum
      if (analyser) {
        const bins = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(bins);
        const nyquist = analyser.context.sampleRate / 2;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let i = 1; i < bins.length; i++) {
          const f = (i / bins.length) * nyquist;
          if (f < MIN_F || f > MAX_F) continue;
          const x = xOf(f);
          const y = h - (bins[i]! / 255) * h * 0.9;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = spec;
        ctx.globalAlpha = 0.18;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // eq curve
      const N = 200;
      const freqs = new Float32Array(N) as Float32Array<ArrayBuffer>;
      for (let i = 0; i < N; i++) freqs[i] = MIN_F * Math.pow(MAX_F / MIN_F, i / (N - 1));
      const curve = responseCurve(settingsRef.current, freqs);

      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = xOf(freqs[i]!);
        const y = yOf(Math.max(-RANGE_DB, Math.min(RANGE_DB, curve[i]!)));
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  return <canvas ref={canvasRef} className="h-52 w-full rounded-lg bg-[var(--surface-sunken)]" />;
}
