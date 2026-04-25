"use client";

import { SurfacePanel } from "@/components/ui/SurfacePanel";

type ConsequencePanelProps = {
  chronicleId: string;
  nextPromptNumber: number;
  summary: string;
};

export function ConsequencePanel({
  chronicleId,
  nextPromptNumber,
  summary,
}: ConsequencePanelProps) {
  const playHref = `/chronicles/${chronicleId}/play`;

  return (
    <SurfacePanel className="space-y-4 border-gold/30 bg-gold/10 px-5 py-5">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
        Immediate consequence
      </p>
      <p className="text-base leading-relaxed text-ink">{summary}</p>
      <a
        href={playHref}
        onClick={(event) => {
          event.preventDefault();
          window.location.assign(playHref);
        }}
        className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92"
      >
        Continue to prompt {nextPromptNumber}
      </a>
    </SurfacePanel>
  );
}
