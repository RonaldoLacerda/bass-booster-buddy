import { AlertTriangle, Check, CircleAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Diagnosis, Severity } from "@/lib/diagnosis";
import type { AudioMetrics } from "@/lib/analysis";

const dot: Record<Severity, string> = {
  high: "text-destructive",
  medium: "text-[var(--warning,#f0a020)]",
  ok: "text-emerald-400",
};

const Icon = ({ s }: { s: Severity }) =>
  s === "high" ? (
    <CircleAlert className={`h-4 w-4 shrink-0 ${dot.high}`} />
  ) : s === "medium" ? (
    <AlertTriangle className={`h-4 w-4 shrink-0 ${dot.medium}`} />
  ) : (
    <Check className={`h-4 w-4 shrink-0 ${dot.ok}`} />
  );

type Props = {
  diagnosis: Diagnosis;
  metrics: AudioMetrics;
  onProcess: () => void;
  processing: boolean;
};

export function DiagnosisCard({ diagnosis, metrics, onProcess, processing }: Props) {
  const scoreColor =
    diagnosis.score >= 80 ? "text-emerald-400" : diagnosis.score >= 60 ? "text-accent" : "text-destructive";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="panel p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          🔎 Diagnóstico do áudio
        </h2>
        <div className="mt-3 flex items-end gap-3">
          <span className={`font-mono text-5xl font-bold ${scoreColor}`}>{diagnosis.score}</span>
          <span className="pb-2 text-sm text-muted-foreground">/100</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{diagnosis.summary}</p>

        <ul className="mt-4 space-y-3">
          {diagnosis.issues.map((i) => (
            <li key={i.id} className="flex gap-3 rounded-lg bg-[var(--surface-sunken)] p-3">
              <Icon s={i.severity} />
              <div>
                <p className="text-sm font-semibold">{i.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{i.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {[
            ["LUFS", `${metrics.lufs.toFixed(1)}`],
            ["Pico real", `${metrics.truePeak.toFixed(1)} dBTP`],
            ["Dinâmica", `${metrics.dynamicRange.toFixed(1)} dB`],
            ["Estéreo", metrics.channels < 2 ? "mono" : `${Math.round(metrics.stereoWidth * 100)}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-border/60 p-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-mono font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="panel flex flex-col p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          ✨ O que vamos melhorar
        </h2>
        <ul className="mt-4 flex-1 space-y-2">
          {diagnosis.plan.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <Button size="lg" className="mt-5 w-full" onClick={onProcess} disabled={processing}>
          <Sparkles className="mr-2 h-4 w-4" />
          {processing ? "Melhorando seu áudio..." : "Melhorar meu áudio"}
        </Button>
      </section>
    </div>
  );
}
