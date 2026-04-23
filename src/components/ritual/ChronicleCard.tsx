import Link from "next/link";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { cn } from "@/lib/utils";

type ChronicleCardProps = {
  actionLabel: string;
  createdAt: string;
  highlight?: boolean;
  href: string;
  lastPlayedAt?: string | null;
  status: "draft" | "active" | "completed" | "archived";
  title: string;
  vampireName?: string | null;
};

const statusLabels: Record<ChronicleCardProps["status"], string> = {
  active: "Active",
  archived: "Archived",
  completed: "Completed",
  draft: "Draft",
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not yet returned to";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function ChronicleCard({
  actionLabel,
  createdAt,
  highlight = false,
  href,
  lastPlayedAt,
  status,
  title,
  vampireName,
}: ChronicleCardProps) {
  return (
    <Link href={href} className="block rounded-panel">
      <SurfacePanel
        className={cn(
          "px-5 py-5 transition-colors duration-160 ease-ritual hover:border-gold/40 hover:bg-gold/5 sm:px-6 sm:py-6",
          highlight && "border-gold/40 bg-gold/5",
        )}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">
              {statusLabels[status]}
            </p>
            <h2 className="mt-3 font-heading text-3xl leading-tight text-ink">
              {title}
            </h2>
            <p className="mt-2 text-base text-ink-muted">
              {vampireName
                ? `Known in the night as ${vampireName}.`
                : "The name of the vampire has not yet been written."}
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.22em] text-gold">
              {actionLabel}
            </p>
          </div>
          <div className="space-y-2 font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
            <p>Begun {formatDate(createdAt)}</p>
            <p>Last played {formatDate(lastPlayedAt)}</p>
          </div>
        </div>
      </SurfacePanel>
    </Link>
  );
}
