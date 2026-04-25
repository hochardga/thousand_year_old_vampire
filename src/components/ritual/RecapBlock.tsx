"use client";

import { useState } from "react";
import { EventTimeline } from "@/components/archive/EventTimeline";
import { FeedbackForm } from "@/components/ui/FeedbackForm";
import Link from "next/link";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type RecapBlockProps = {
  currentPromptEncounter?: number;
  currentPromptNumber: number;
  chronicleId?: string;
  latestEvents: Array<{
    created_at: string;
    event_type: string;
    id: string;
    summary: string;
  }>;
  recapMarkdown: string;
  resumeHref: string;
};

export function RecapBlock({
  currentPromptNumber,
  chronicleId,
  latestEvents,
  recapMarkdown,
  resumeHref,
}: RecapBlockProps) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <div className="space-y-4">
      <SurfacePanel className="space-y-5 px-6 py-6 sm:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Session recap
          </p>
          <h2 className="mt-3 font-heading text-4xl leading-tight text-ink">
            Return with the thread still in hand.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Current place: Prompt {currentPromptNumber}
          </p>
        </div>

        <div className="space-y-4">
          {recapMarkdown.split(/\n\n+/).map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 12)}`} className="text-base leading-relaxed text-ink">
              {paragraph}
            </p>
          ))}
        </div>

        <Link
          href={resumeHref}
          className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92"
        >
          Resume the current prompt
        </Link>
      </SurfacePanel>

      <SurfacePanel className="space-y-4 px-6 py-6 sm:px-8">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Beta feedback
          </p>
          <h2 className="font-heading text-3xl text-ink">
            Offer a quiet note from the recap.
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsFeedbackOpen((value) => !value)}
          aria-controls="beta-feedback-panel"
          aria-expanded={isFeedbackOpen}
          className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 bg-bg/70 px-5 py-3 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40"
        >
          Share beta feedback
        </button>
        <div id="beta-feedback-panel" hidden={!isFeedbackOpen}>
          {isFeedbackOpen ? <FeedbackForm chronicleId={chronicleId} /> : null}
        </div>
      </SurfacePanel>

      <SurfacePanel className="space-y-4 px-6 py-6 sm:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Latest changes
          </p>
          <h2 className="mt-3 font-heading text-3xl text-ink">Recent archive echoes</h2>
        </div>
        <EventTimeline events={latestEvents} />
      </SurfacePanel>
    </div>
  );
}
