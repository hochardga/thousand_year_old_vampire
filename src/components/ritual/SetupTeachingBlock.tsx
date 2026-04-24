"use client";

import { SurfacePanel } from "@/components/ui/SurfacePanel";

type SetupTeachingBlockProps = {
  body: string;
  label?: string;
};

export function SetupTeachingBlock({
  body,
  label = "How this works",
}: SetupTeachingBlockProps) {
  return (
    <SurfacePanel className="border-gold/20 bg-gold/5 px-5 py-4">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
        {label}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
    </SurfacePanel>
  );
}
