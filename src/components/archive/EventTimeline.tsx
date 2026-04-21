type EventTimelineProps = {
  events: Array<{
    created_at: string;
    event_type: string;
    id: string;
    summary: string;
  }>;
};

function formatArchiveDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatEventLabel(eventType: string) {
  return eventType.replaceAll("_", " ");
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-ink-muted">
        The archive timeline is quiet for now. Events will gather here as the
        chronicle lengthens.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li
          key={event.id}
          className="rounded-panel border border-ink/10 bg-surface/88 px-5 py-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
              {formatEventLabel(event.event_type)}
            </p>
            <p className="text-xs text-ink-muted">
              {formatArchiveDate(event.created_at)}
            </p>
          </div>
          <p className="mt-3 text-base leading-relaxed text-ink">
            {event.summary}
          </p>
        </li>
      ))}
    </ol>
  );
}
