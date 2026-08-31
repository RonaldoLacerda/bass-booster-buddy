import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { encodeWav } from "@/lib/audio-engine";
import { formatClock } from "@/lib/recorder";
import type { AudioMetrics } from "@/lib/analysis";

type Props = {
  originalUrl: string;
  processed: AudioBuffer;
  before: AudioMetrics;
  after: AudioMetrics;
};

export function AbPlayer({ originalUrl, processed, before, after }: Props) {
  const [side, setSide] = useState<"before" | "after">("after");
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const aRef = useRef<HTMLAudioElement>(null);
  const bRef = useRef<HTMLAudioElement>(null);

  const processedUrl = useMemo(() => URL.createObjectURL(encodeWav(processed)), [processed]);
  useEffect(() => () => URL.revokeObjectURL(processedUrl), [processedUrl]);

  const active = () => (side === "before" ? aRef.current : bRef.current);
  const idle = () => (side === "before" ? bRef.current : aRef.current);

  useEffect(() => {
    const el = active();
    const other = idle();
    if (!el) return;
    if (other) {
      el.currentTime = Math.min(other.currentTime, el.duration || other.currentTime);
      other.pause();
    }
    if (playing) void el.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  const toggle = () => {
    const el = active();
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  };

  const seek = (v: number) => {
    const el = active();
    if (!el) return;
    el.currentTime = v;
    setPos(v);
  };

  const rows: Array<[string, string, string]> = [
    ["Volume (LUFS)", before.lufs.toFixed(1), after.lufs.toFixed(1)],
    ["Pico real (dBTP)", before.truePeak.toFixed(1), after.truePeak.toFixed(1)],
    ["Dinâmica (dB)", before.dynamicRange.toFixed(1), after.dynamicRange.toFixed(1)],
    ["Graves", `${Math.round((before.subEnergy + before.bassEnergy) * 100)}%`, `${Math.round((after.subEnergy + after.bassEnergy) * 100)}%`],
    ["Presença da voz", `${Math.round(before.presenceEnergy * 100)}%`, `${Math.round(after.presenceEnergy * 100)}%`],
  ];

  return (
    <section className="panel p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        🎧 Antes x Depois
      </h2>

      <div className="mt-4 flex gap-2">
        {(["before", "after"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              side === s ? "border-accent bg-accent/15 text-accent" : "border-border text-muted-foreground"
            }`}
          >
            {s === "before" ? "Original" : "Melhorado"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button size="icon" onClick={toggle} aria-label={playing ? "Pausar" : "Tocar"}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">{formatClock(pos)}</span>
        <Slider value={[pos]} min={0} max={dur || 1} step={0.1} onValueChange={([v]) => seek(v ?? 0)} />
        <span className="w-12 shrink-0 text-right font-mono text-xs text-muted-foreground">
          {formatClock(dur)}
        </span>
      </div>

      <audio
        ref={aRef}
        src={originalUrl}
        preload="metadata"
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => side === "before" && setPos(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
      />
      <audio
        ref={bRef}
        src={processedUrl}
        preload="metadata"
        onTimeUpdate={(e) => side === "after" && setPos(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
      />

      <table className="mt-5 w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-2 text-left font-medium">Medida</th>
            <th className="pb-2 text-right font-medium">Antes</th>
            <th className="pb-2 text-right font-medium">Depois</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map(([label, b, a]) => (
            <tr key={label} className="border-t border-border/50">
              <td className="py-2 font-sans text-muted-foreground">{label}</td>
              <td className="py-2 text-right">{b}</td>
              <td className="py-2 text-right font-semibold text-accent">{a}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
