import { Headphones, VolumeX } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  STEM_DEFS,
  type OutputMode,
  type StemSettings,
} from "@/lib/stems-engine";

const OUTPUTS: { id: OutputMode; label: string }[] = [
  { id: "stereo", label: "Geral" },
  { id: "mono", label: "Mono" },
  { id: "left", label: "L" },
  { id: "right", label: "R" },
];

type Props = {
  stems: StemSettings[];
  onChange: (id: string, patch: Partial<StemSettings>) => void;
};

export function StemMixer({ stems, onChange }: Props) {
  const anySolo = stems.some((s) => s.solo);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {STEM_DEFS.map((def) => {
        const s = stems.find((x) => x.id === def.id);
        if (!s) return null;
        const dimmed = s.mute || (anySolo && !s.solo);
        return (
          <div
            key={def.id}
            className={`rounded-lg border p-4 transition-opacity ${
              s.solo ? "border-accent bg-accent/5" : "border-border bg-secondary/30"
            } ${dimmed ? "opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{def.name}</p>
                <p className="text-xs text-muted-foreground">{def.hint}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => onChange(s.id, { mute: !s.mute })}
                  aria-label={`Silenciar ${def.name}`}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded border text-xs ${
                    s.mute
                      ? "border-destructive bg-destructive/20 text-destructive-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <VolumeX className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onChange(s.id, { solo: !s.solo })}
                  aria-label={`Solo ${def.name}`}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded border text-xs ${
                    s.solo
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Headphones className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <Row label="Volume" value={`${s.volume > 0 ? "+" : ""}${s.volume.toFixed(1)} dB`}>
              <Slider
                value={[s.volume]}
                min={-24}
                max={12}
                step={0.5}
                onValueChange={(v) => onChange(s.id, { volume: v[0]! })}
              />
            </Row>

            <div className="mt-3 flex items-center gap-2 rounded border border-border bg-background/40 p-1">
              {OUTPUTS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onChange(s.id, { output: o.id })}
                  className={`flex-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${
                    s.output === o.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <Row
              label="Panorama"
              value={
                Math.abs(s.pan) < 0.05
                  ? "centro"
                  : `${s.pan < 0 ? "L" : "R"} ${Math.round(Math.abs(s.pan) * 100)}%`
              }
            >
              <Slider
                value={[s.pan]}
                min={-1}
                max={1}
                step={0.05}
                disabled={s.output !== "stereo"}
                onValueChange={(v) => onChange(s.id, { pan: v[0]! })}
              />
            </Row>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {(
                [
                  ["eqLow", "Grave"],
                  ["eqMid", "Médio"],
                  ["eqHigh", "Agudo"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-muted-foreground">{label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {s[key] > 0 ? "+" : ""}
                      {s[key].toFixed(0)}
                    </span>
                  </div>
                  <Slider
                    className="mt-1"
                    value={[s[key]]}
                    min={-15}
                    max={15}
                    step={0.5}
                    onValueChange={(v) => onChange(s.id, { [key]: v[0]! })}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded border border-border bg-background/40 px-3 py-2">
              <span className="text-xs font-medium">Compressor da faixa</span>
              <Switch
                checked={s.compressor}
                onCheckedChange={(v) => onChange(s.id, { compressor: v })}
              />
            </div>
            {s.compressor && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Row label="Limiar" value={`${s.threshold} dB`} tight>
                  <Slider
                    value={[s.threshold]}
                    min={-48}
                    max={0}
                    step={1}
                    onValueChange={(v) => onChange(s.id, { threshold: v[0]! })}
                  />
                </Row>
                <Row label="Ratio" value={`${s.ratio}:1`} tight>
                  <Slider
                    value={[s.ratio]}
                    min={1}
                    max={12}
                    step={0.5}
                    onValueChange={(v) => onChange(s.id, { ratio: v[0]! })}
                  />
                </Row>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Row({
  label,
  value,
  children,
  tight,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
  tight?: boolean;
}) {
  return (
    <div className={tight ? "" : "mt-3"}>
      <div className="flex justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="font-mono text-[11px] text-muted-foreground">{value}</span>
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
