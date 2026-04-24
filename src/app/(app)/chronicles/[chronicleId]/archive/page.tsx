import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { TrackEventOnMount } from "@/components/analytics/TrackEventOnMount";
import { EventTimeline } from "@/components/archive/EventTimeline";
import { MemoryCard } from "@/components/archive/MemoryCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { QuietAlert } from "@/components/ui/QuietAlert";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { cn } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PAGE_SIZE = 6;

type ArchivePageProps = {
  params: Promise<{
    chronicleId: string;
  }>;
  searchParams: Promise<{
    eventCursor?: string;
    promptCursor?: string;
  }>;
};

type ChronicleRecord = {
  current_prompt_encounter: number;
  current_prompt_number: number;
  id: string;
  status: "draft" | "active" | "completed" | "archived";
  title: string;
};

type MemoryRecord = {
  id: string;
  location: "mind" | "diary" | "forgotten";
  memory_entries:
    | Array<{
        entry_text: string;
        id: string;
        position: number;
      }>
    | null;
  slot_index: number | null;
  title: string;
};

type DiaryRecord = {
  id: string;
  status: "active" | "lost";
  title: string;
} | null;

type PromptRunRecord = {
  created_at: string;
  encounter_index: number;
  experience_text: string;
  id: string;
  movement: number;
  player_entry: string;
  prompt_number: number;
};

type ArchiveEventRecord = {
  created_at: string;
  event_type: string;
  id: string;
  summary: string;
};

type QueryError = {
  message: string;
};

type SingleResult<T> = Promise<{
  data: T | null;
  error: QueryError | null;
}>;

type ManyResult<T> = Promise<{
  data: T[] | null;
  error: QueryError | null;
}>;

type CursorPageQuery<T> = {
  limit: (count: number) => ManyResult<T>;
  lt: (column: string, value: string) => CursorPageQuery<T>;
};

type ArchivePageClient = {
  from: (table: "archive_events") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => CursorPageQuery<ArchiveEventRecord>;
      };
    };
  };
  from: (table: "chronicles") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => SingleResult<ChronicleRecord>;
      };
    };
  };
  from: (table: "diaries") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => SingleResult<DiaryRecord>;
        };
      };
    };
  };
  from: (table: "memories") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => ManyResult<MemoryRecord>;
    };
  };
  from: (table: "prompt_runs") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => CursorPageQuery<PromptRunRecord>;
      };
    };
  };
};

function formatArchiveDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function sortMemories(memories: MemoryRecord[]) {
  const rank = {
    diary: 1,
    forgotten: 2,
    mind: 0,
  } as const;

  return [...memories].sort((left, right) => {
    const rankDelta = rank[left.location] - rank[right.location];

    if (rankDelta !== 0) {
      return rankDelta;
    }

    return (left.slot_index ?? 99) - (right.slot_index ?? 99);
  });
}

function trimPage<T extends { created_at: string }>(rows: T[] | null) {
  const collection = rows ?? [];
  const visibleRows = collection.slice(0, PAGE_SIZE);
  const nextCursor =
    collection.length > PAGE_SIZE
      ? visibleRows[visibleRows.length - 1]?.created_at ?? null
      : null;

  return {
    nextCursor,
    visibleRows,
  };
}

function buildArchiveHref(
  chronicleId: string,
  params: {
    eventCursor?: string | null;
    promptCursor?: string | null;
  },
) {
  const searchParams = new URLSearchParams();

  if (params.eventCursor) {
    searchParams.set("eventCursor", params.eventCursor);
  }

  if (params.promptCursor) {
    searchParams.set("promptCursor", params.promptCursor);
  }

  const query = searchParams.toString();

  return query
    ? `/chronicles/${chronicleId}/archive?${query}`
    : `/chronicles/${chronicleId}/archive`;
}

function ArchiveSection({
  children,
  className,
  description,
  title,
}: {
  children: ReactNode;
  className?: string;
  description: string;
  title: string;
}) {
  return (
    <details
      open
      className={cn(
        "rounded-panel border border-ink/10 bg-surface/92 shadow-float",
        className,
      )}
    >
      <summary className="cursor-pointer list-none px-5 py-4 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-muted">
          Archive section
        </p>
        <h2 className="mt-3 font-heading text-3xl leading-tight text-ink">
          {title}
        </h2>
        <p className="mt-2 max-w-reading text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      </summary>
      <div className="border-t border-ink/8 px-5 py-5 sm:px-6 sm:py-6">
        {children}
      </div>
    </details>
  );
}

export default async function ChronicleArchivePage({
  params,
  searchParams,
}: ArchivePageProps) {
  const { chronicleId } = await params;
  const { eventCursor, promptCursor } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const archiveClient = supabase as unknown as ArchivePageClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/sign-in?next=${encodeURIComponent(`/chronicles/${chronicleId}/archive`)}`,
    );
  }

  const { data: chronicle, error: chronicleError } = await archiveClient
    .from("chronicles")
    .select("id, title, status, current_prompt_number, current_prompt_encounter")
    .eq("id", chronicleId)
    .single();

  if (chronicleError || !chronicle) {
    redirect("/chronicles?error=That%20chronicle%20could%20not%20be%20opened.");
  }

  if (chronicle.status === "draft") {
    redirect(`/chronicles/${chronicleId}/setup`);
  }

  const promptRunsQuery = archiveClient
    .from("prompt_runs")
    .select(
      "id, prompt_number, encounter_index, player_entry, experience_text, movement, created_at",
    )
    .eq("chronicle_id", chronicleId)
    .order("created_at", { ascending: false });

  if (promptCursor) {
    promptRunsQuery.lt("created_at", promptCursor);
  }

  const archiveEventsQuery = archiveClient
    .from("archive_events")
    .select("id, event_type, summary, created_at")
    .eq("chronicle_id", chronicleId)
    .order("created_at", { ascending: false });

  if (eventCursor) {
    archiveEventsQuery.lt("created_at", eventCursor);
  }

  const [memoriesResult, diaryResult, promptRunsResult, archiveEventsResult] =
    await Promise.all([
      archiveClient
        .from("memories")
        .select(
          "id, title, location, slot_index, memory_entries(id, position, entry_text)",
        )
        .eq("chronicle_id", chronicleId),
      archiveClient
        .from("diaries")
        .select("id, title, status")
        .eq("chronicle_id", chronicleId)
        .eq("status", "active")
        .maybeSingle(),
      promptRunsQuery.limit(PAGE_SIZE + 1),
      archiveEventsQuery.limit(PAGE_SIZE + 1),
    ]);

  const sortedMemories = sortMemories(memoriesResult.data ?? []);
  const memoryStack = sortedMemories.filter((memory) => memory.location !== "diary");
  const diaryMemories = sortedMemories.filter((memory) => memory.location === "diary");
  const activeDiary = diaryResult.data ?? null;
  const promptPage = trimPage(promptRunsResult.data ?? []);
  const eventPage = trimPage(archiveEventsResult.data ?? []);

  return (
    <PageShell className="gap-6 py-8">
      <TrackEventOnMount
        event="archive_opened"
        onceKey={`archive-opened:${chronicleId}`}
        properties={{
          chronicleId,
          source: "archive",
        }}
      />
      <SurfacePanel tone="nocturne" className="px-5 py-6 sm:px-8 sm:py-7">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Chronicle archive
        </p>
        <h1 className="mt-4 font-heading text-4xl leading-[1.08] text-surface sm:text-5xl lg:text-6xl">
          {chronicle.title}
        </h1>
        <p className="mt-4 max-w-reading text-base leading-relaxed text-surface/76 sm:text-lg">
          Read the memories still in reach, the ones already surrendered, and
          the turns that brought the chronicle here.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/chronicles/${chronicleId}/play`}
            className="inline-flex min-h-11 items-center justify-center rounded-soft bg-surface px-5 py-3 text-sm font-medium text-nocturne transition-colors duration-160 ease-ritual hover:bg-surface-muted"
          >
            Return to the current prompt
          </Link>
          <p className="inline-flex min-h-11 items-center rounded-soft border border-surface/14 px-4 py-3 text-sm text-surface/78">
            Current place: prompt {(chronicle as ChronicleRecord).current_prompt_number}
            .{(chronicle as ChronicleRecord).current_prompt_encounter}
          </p>
        </div>
      </SurfacePanel>

      <ArchiveSection
        title="Memory stack"
        description="The memories still borne in mind, alongside the ones already given over to forgetting."
      >
        {memoriesResult.error ? (
          <QuietAlert
            title="The memory stack could not be read just now."
            body="Return when the archive is ready."
          />
        ) : memoryStack.length === 0 ? (
          <EmptyState
            eyebrow="Archive state"
            title="The archive has only the first faint traces so far."
            body="Memories carried in mind or surrendered to forgetting will gather here."
          />
        ) : (
          <div className="space-y-4">
            {memoryStack.map((memory) => (
              <MemoryCard
                key={memory.id}
                entries={[...(memory.memory_entries ?? [])].sort(
                  (left, right) => left.position - right.position,
                )}
                location={memory.location}
                slotIndex={memory.slot_index}
                title={memory.title}
              />
            ))}
          </div>
        )}
      </ArchiveSection>

      <ArchiveSection
        title="Diary"
        description="The memories written down so they can survive the thinning of the mind."
      >
        {diaryResult.error ? (
          <QuietAlert
            title="The diary could not be opened just now."
            body="Return when the chronicle is ready."
          />
        ) : activeDiary ? (
          <div className="space-y-4">
            <div className="rounded-panel border border-ink/10 bg-bg/55 px-5 py-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
                Active diary
              </p>
              <h2 className="mt-3 font-heading text-3xl text-ink">
                {activeDiary.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {diaryMemories.length === 1
                  ? "1 memory is sheltered here."
                  : `${diaryMemories.length} memories are sheltered here.`}
              </p>
            </div>

            {diaryMemories.length === 0 ? (
              <EmptyState
                eyebrow="Archive state"
                title="The diary exists, but no memories have been pressed into it yet."
                body="When the chronicle shelters a memory in writing, it will appear here."
              />
            ) : (
              diaryMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  entries={[...(memory.memory_entries ?? [])].sort(
                    (left, right) => left.position - right.position,
                  )}
                  location={memory.location}
                  slotIndex={memory.slot_index}
                  title={memory.title}
                />
              ))
            )}
          </div>
        ) : (
          <EmptyState
            eyebrow="Archive state"
            title="No diary has been opened against forgetting yet."
            body="Once the chronicle chooses to shelter memories in writing, the diary will appear here."
          />
        )}
      </ArchiveSection>

      <ArchiveSection
        title="Prompt history"
        description="The prompt-by-prompt movement of the chronicle, kept close to the writing that made it."
      >
        {promptRunsResult.error ? (
          <QuietAlert
            title="Prompt history could not be gathered just now."
            body="Return when the chronicle is ready."
          />
        ) : promptPage.visibleRows.length === 0 ? (
          <EmptyState
            eyebrow="Archive state"
            title="No prompt has been resolved yet."
            body="Prompt history will gather here once the first entry has been set into the archive."
          />
        ) : (
          <div className="space-y-4">
            <ol className="space-y-4">
              {promptPage.visibleRows.map((promptRun) => (
                <li
                  key={promptRun.id}
                  className="rounded-panel border border-ink/10 bg-surface/88 px-4 py-4 sm:px-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
                        Prompt history
                      </p>
                      <h3 className="mt-2 font-heading text-2xl leading-tight text-ink sm:text-3xl">
                        Prompt {promptRun.prompt_number}
                      </h3>
                    </div>
                    <p className="text-xs text-ink-muted">
                      {formatArchiveDate(promptRun.created_at)}
                    </p>
                  </div>
                  <p className="mt-4 text-sm uppercase tracking-[0.16em] text-ink-muted">
                    Player entry
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-ink">
                    {promptRun.player_entry}
                  </p>
                  <p className="mt-4 text-sm uppercase tracking-[0.16em] text-ink-muted">
                    Experience set into memory
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-ink">
                    {promptRun.experience_text}
                  </p>
                </li>
              ))}
            </ol>

            {promptPage.nextCursor ? (
              <Link
                href={buildArchiveHref(chronicleId, {
                  eventCursor,
                  promptCursor: promptPage.nextCursor,
                })}
                className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-5 py-3 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40 hover:text-ink"
              >
                Read older prompt entries
              </Link>
            ) : null}
          </div>
        )}
      </ArchiveSection>

      <ArchiveSection
        title="Event timeline"
        description="The sharper consequences that shaped the archive beyond the prompt text itself."
      >
        {archiveEventsResult.error ? (
          <QuietAlert
            title="The event timeline could not be gathered just now."
            body="Return when the chronicle is ready."
          />
        ) : (
          <div className="space-y-4">
            <EventTimeline events={eventPage.visibleRows} />

            {eventPage.nextCursor ? (
              <Link
                href={buildArchiveHref(chronicleId, {
                  eventCursor: eventPage.nextCursor,
                  promptCursor,
                })}
                className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-5 py-3 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40 hover:text-ink"
              >
                Read older timeline entries
              </Link>
            ) : null}
          </div>
        )}
      </ArchiveSection>
    </PageShell>
  );
}
