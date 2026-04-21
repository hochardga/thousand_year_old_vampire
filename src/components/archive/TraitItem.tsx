import { cn } from "@/lib/utils";

type TraitItemProps = {
  description: string;
  label: string;
  metaLabels?: string[];
  state: "active" | "checked" | "lost" | "dead" | "dormant";
};

function stateLabel(state: TraitItemProps["state"]) {
  switch (state) {
    case "checked":
      return "Checked";
    case "dead":
      return "Dead";
    case "dormant":
      return "Dormant";
    case "lost":
      return "Lost";
    default:
      return "Active";
  }
}

export function TraitItem({
  description,
  label,
  metaLabels = [],
  state,
}: TraitItemProps) {
  return (
    <article
      className={cn(
        "rounded-panel border px-5 py-4 transition-colors duration-160 ease-ritual",
        state === "lost" || state === "dead"
          ? "border-ink/12 bg-surface-muted/60"
          : state === "checked"
            ? "border-gold/24 bg-gold/6"
            : "border-ink/10 bg-surface/88",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-heading text-3xl leading-tight text-ink">{label}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-ink/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-ink-muted">
              {stateLabel(state)}
            </span>
            {metaLabels.map((metaLabel) => (
              <span
                key={metaLabel}
                className="rounded-full border border-ink/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-ink-muted"
              >
                {metaLabel}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-base leading-relaxed text-ink">{description}</p>
    </article>
  );
}
