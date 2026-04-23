import Link from "next/link";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  body: string;
  className?: string;
  eyebrow: string;
  title: string;
};

export function EmptyState({
  actionHref,
  actionLabel,
  body,
  className,
  eyebrow,
  title,
}: EmptyStateProps) {
  return (
    <SurfacePanel className={cn("max-w-reading px-6 py-8 sm:px-8", className)}>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-heading text-3xl text-ink">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-ink-muted">{body}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92"
        >
          {actionLabel}
        </Link>
      ) : null}
    </SurfacePanel>
  );
}
