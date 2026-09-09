import { GOALS, type GoalId } from "@/lib/goals";

type Props = {
  value: GoalId | null;
  onChange: (id: GoalId) => void;
};

export function GoalPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
      {GOALS.map((g) => {
        const active = value === g.id;
        return (
          <button
            key={g.id}
            onClick={() => onChange(g.id)}
            className={`rounded-xl border p-3 text-left transition-all sm:p-4 ${
              active
                ? "border-accent bg-accent/10 shadow-[0_0_0_1px_var(--accent)]"
                : "border-border bg-[var(--surface-sunken)] hover:border-accent/60"
            }`}
          >
            <span className="text-xl sm:text-2xl">{g.emoji}</span>
            <h3 className="mt-1.5 text-sm font-semibold sm:mt-2 sm:text-base">{g.name}</h3>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs sm:leading-relaxed">
              {g.tagline}
            </p>
          </button>
        );
      })}

    </div>
  );
}
