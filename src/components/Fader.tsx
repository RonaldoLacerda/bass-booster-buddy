import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  sublabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
};

export function Fader({ label, sublabel, value, min, max, step = 0.5, onChange, format }: Props) {
  const display = format ? format(value) : `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
  const active = Math.abs(value) > 0.05;

  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className={cn(
          "font-mono text-xs tabular-nums transition-colors",
          active ? "text-accent" : "text-muted-foreground",
        )}
      >
        {display}
      </span>
      <SliderPrimitive.Root
        orientation="vertical"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0]!)}
        className="relative flex h-44 w-8 touch-none select-none flex-col items-center justify-center"
      >
        <SliderPrimitive.Track className="relative h-full w-2 grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute w-full bg-accent/60" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={label}
          className="block h-6 w-8 cursor-grab rounded-sm border border-border bg-card shadow-[var(--shadow-knob)] transition-colors after:absolute after:inset-x-1.5 after:top-1/2 after:h-px after:-translate-y-1/2 after:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        />
      </SliderPrimitive.Root>
      <div className="text-center">
        <p className="text-[11px] font-medium leading-tight text-foreground">{label}</p>
        {sublabel && <p className="font-mono text-[10px] text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  );
}
