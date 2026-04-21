import Link from "next/link";
import { EventTimeline } from "@/components/archive/EventTimeline";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type RecapBlockProps = {
  currentPromptEncounter: number;
  currentPromptNumber: number;
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
  currentPromptEncounter,
  currentPromptNumber,
  latestEvents,
  recapMarkdown,
  resumeHref,
}: RecapBlockProps) {
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
            Current place: prompt {currentPromptNumber}.{currentPromptEncounter}
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
