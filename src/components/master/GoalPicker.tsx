import { GOALS, type GoalId } from "@/lib/goals";

type Props = {
  value: GoalId | null;
  onChange: (id: GoalId) => void;
};

export function GoalPicker({ value, onChange }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {GOALS.map((g) => {
        const active = value === g.id;
        return (
          <button
            key={g.id}
            onClick={() => onChange(g.id)}
            className={`rounded-xl border p-4 text-left transition-all ${
              active
                ? "border-accent bg-accent/10 shadow-[0_0_0_1px_var(--accent)]"
                : "border-border bg-[var(--surface-sunken)] hover:border-accent/60"
            }`}
          >
            <span className="text-2xl">{g.emoji}</span>
            <h3 className="mt-2 font-semibold">{g.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{g.tagline}</p>
          </button>
        );
      })}
    </div>
  );
}
