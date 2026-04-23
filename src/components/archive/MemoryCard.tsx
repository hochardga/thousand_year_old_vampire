import { cn } from "@/lib/utils";

type MemoryCardProps = {
  defaultOpen?: boolean;
  entries: Array<{
    entry_text: string;
    id: string;
    position: number;
  }>;
  location: "mind" | "diary" | "forgotten";
  slotIndex: number | null;
  title: string;
};

function describeMemoryLocation(
  location: MemoryCardProps["location"],
  slotIndex: number | null,
) {
  if (location === "mind" && slotIndex) {
    return `Held in mind, slot ${slotIndex}`;
  }

  if (location === "diary") {
    return "Kept in the diary";
  }

  return "Given over to forgetting";
}

export function MemoryCard({
  defaultOpen = true,
  entries,
  location,
  slotIndex,
  title,
}: MemoryCardProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "overflow-hidden rounded-panel border px-4 py-4 text-ink transition-colors duration-160 ease-ritual sm:px-5",
        location === "forgotten"
          ? "border-ink/12 bg-surface-muted/60"
          : "border-ink/10 bg-surface/90",
      )}
    >
      <summary className="min-h-11 cursor-pointer list-none rounded-soft px-1 py-1 focus-visible:outline-none">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
          {describeMemoryLocation(location, slotIndex)}
        </p>
        <h3 className="mt-3 font-heading text-2xl leading-tight text-ink sm:text-3xl">
          {title}
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          {entries.length === 1
            ? "1 entry kept here"
            : `${entries.length} entries kept here`}
        </p>
        <span className="sr-only">
          Press Enter or Space to expand or collapse this memory.
        </span>
      </summary>

      <div className="mt-5 space-y-3 border-t border-ink/8 pt-5">
        {entries.length === 0 ? (
          <p className="text-sm leading-relaxed text-ink-muted">
            No entry has been preserved in this memory yet.
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-soft border border-ink/8 bg-bg/55 px-3 py-3 sm:px-4"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
                Entry {entry.position}
              </p>
              <p className="mt-2 text-base leading-relaxed text-ink">
                {entry.entry_text}
              </p>
            </div>
          ))
        )}
      </div>
    </details>
  );
}
