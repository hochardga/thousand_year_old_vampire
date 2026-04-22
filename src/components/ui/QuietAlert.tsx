import { SurfacePanel } from "@/components/ui/SurfacePanel";

type QuietAlertProps = {
  actionLabel?: string;
  body: string;
  onAction?: () => void;
  title: string;
  tone?: "error" | "info" | "warning";
};

export function QuietAlert({
  actionLabel,
  body,
  onAction,
  title,
  tone = "error",
}: QuietAlertProps) {
  const toneClasses =
    tone === "warning"
      ? "border-warning/25 bg-warning/10"
      : tone === "info"
        ? "border-info/25 bg-info/10"
        : "border-error/20 bg-error/10";

  return (
    <SurfacePanel className={`space-y-3 px-5 py-4 ${toneClasses}`}>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
        Quiet alert
      </p>
      <h2 className="font-heading text-2xl leading-tight text-ink">{title}</h2>
      <p className="text-sm leading-relaxed text-ink">{body}</p>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-4 py-2 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92"
        >
          {actionLabel}
        </button>
      ) : null}
    </SurfacePanel>
  );
}
