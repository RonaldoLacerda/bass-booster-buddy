import { Activity, Film, Play, SlidersHorizontal, Sparkles, Waves } from "lucide-react";

const WAVE = [28, 42, 66, 38, 78, 54, 88, 46, 72, 34, 60, 82, 48, 70, 40, 62, 30, 74, 52, 86, 44, 68, 36, 58];
const EQ = [42, 56, 68, 48, 62, 76, 58, 46, 38, 30];

export function ProductPreview() {
  return (
    <div className="landing-product-shell" aria-label="Prévia dos recursos do AudioMix">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-2.5 sm:px-4">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-destructive/60" />
          <span className="h-2 w-2 rounded-full bg-accent/70" />
          <span className="h-2 w-2 rounded-full bg-primary/70" />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground sm:text-[10px]">
          AudioMix · projeto em processamento
        </span>
        <div className="h-2 w-8 rounded-full bg-secondary" />
      </div>

      <div className="grid min-h-[390px] lg:grid-cols-[1.55fr_0.75fr]">
        <div className="flex flex-col border-border/70 lg:border-r">
          <div className="relative flex min-h-[230px] flex-1 items-center justify-center overflow-hidden bg-surface-sunken p-5 sm:min-h-[300px]">
            <div className="landing-video-frame">
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
                <span className="rounded bg-background/80 px-2 py-1 font-mono text-[9px] uppercase text-muted-foreground">
                  vídeo original
                </span>
                <span className="flex items-center gap-1 rounded bg-primary/15 px-2 py-1 text-[9px] font-semibold text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> áudio tratado
                </span>
              </div>
              <div className="flex h-full items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-primary shadow-[var(--shadow-signal)]">
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                </span>
              </div>
              <div className="absolute inset-x-3 bottom-3 flex h-10 items-center gap-0.5 rounded bg-background/80 px-2">
                {WAVE.map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-full bg-primary/70"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute bottom-4 right-4 hidden w-44 border border-border bg-card/95 p-3 shadow-[var(--shadow-panel)] sm:block">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Diagnóstico</span>
                <Activity className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="mt-2 flex items-end gap-2">
                <strong className="font-mono text-3xl text-primary">84</strong>
                <span className="pb-1 text-[10px] text-muted-foreground">/100</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] text-muted-foreground">
                <span>LUFS <b className="text-foreground">-14.0</b></span>
                <span>Pico <b className="text-foreground">-1.0</b></span>
              </div>
            </div>
          </div>

          <div className="border-t border-border/70 bg-background/45 p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase text-muted-foreground">
              <span>Original</span><span className="text-primary">Melhorado</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
              </span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-2/3 rounded-full bg-primary" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">02:41</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border/70 lg:grid-cols-1">
          <div className="bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Equalizador</span>
              <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="mt-5 flex h-28 items-end justify-between gap-1.5">
              {EQ.map((height, index) => (
                <div key={index} className="flex h-full flex-1 flex-col justify-end gap-1">
                  <span className="w-full rounded-t bg-accent/80" style={{ height: `${height}%` }} />
                  <span className="text-center font-mono text-[7px] text-muted-foreground">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Saída pronta</span>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 border border-border bg-secondary/35 p-2 text-[10px]">
                <Waves className="h-3.5 w-3.5 text-accent" /> WAV ou MP3 320
              </div>
              <div className="flex items-center gap-2 border border-primary/30 bg-primary/10 p-2 text-[10px] text-primary">
                <Film className="h-3.5 w-3.5" /> Vídeo em WebM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}