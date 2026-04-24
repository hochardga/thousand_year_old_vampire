import { redirect } from "next/navigation";
import { RecapBlock } from "@/components/ritual/RecapBlock";
import { PageShell } from "@/components/ui/PageShell";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { refreshSessionSnapshot } from "@/lib/chronicles/sessionSnapshots";
import { buildRecap } from "@/lib/recap/buildRecap";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RecapPageProps = {
  params: Promise<{
    chronicleId: string;
  }>;
};

type ChronicleRecord = {
  current_prompt_encounter: number;
  current_prompt_number: number;
  current_session_id: string | null;
  id: string;
  status: "draft" | "active" | "completed" | "archived";
  title: string;
};

type ArchiveEventRecord = {
  created_at: string;
  event_type: string;
  id: string;
  summary: string;
};

type PromptRunRecord = {
  created_at: string;
  encounter_index: number;
  experience_text: string;
  movement: number;
  prompt_number: number;
};

type SessionRecord = {
  recap_markdown: string | null;
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

type LimitedOrderQuery<T> = {
  order: (
    column: string,
    options: { ascending: boolean },
  ) => ManyResult<T>;
};

type RecapPageClient = {
  from: (table: "archive_events") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        limit: (count: number) => LimitedOrderQuery<ArchiveEventRecord>;
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
  from: (table: "prompt_runs") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        limit: (count: number) => LimitedOrderQuery<PromptRunRecord>;
      };
    };
  };
  from: (table: "sessions") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          single: () => SingleResult<SessionRecord>;
        };
      };
    };
  };
};

export default async function ChronicleRecapPage({ params }: RecapPageProps) {
  const { chronicleId } = await params;
  const supabase = await createServerSupabaseClient();
  const recapClient = supabase as unknown as RecapPageClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/sign-in?next=${encodeURIComponent(`/chronicles/${chronicleId}/recap`)}`,
    );
  }

  const { data: chronicle, error } = await recapClient
    .from("chronicles")
    .select(
      "id, title, status, current_prompt_number, current_prompt_encounter, current_session_id",
    )
    .eq("id", chronicleId)
    .single();

  if (error || !chronicle) {
    redirect("/chronicles?error=That%20chronicle%20could%20not%20be%20opened.");
  }

  if (chronicle.status === "draft") {
    redirect(`/chronicles/${chronicleId}/setup`);
  }

  const latestEventsResult = await recapClient
    .from("archive_events")
    .select("id, event_type, summary, created_at")
    .eq("chronicle_id", chronicleId)
    .limit(5)
    .order("created_at", { ascending: false });
  const latestEvents = latestEventsResult.data ?? [];

  let recapMarkdown: string | null = null;

  if (chronicle.current_session_id) {
    const sessionResult = await recapClient
      .from("sessions")
      .select("recap_markdown")
      .eq("id", chronicle.current_session_id)
      .eq("chronicle_id", chronicleId)
      .single();

    recapMarkdown = sessionResult.data?.recap_markdown ?? null;

    if (!recapMarkdown) {
      const refreshed = await refreshSessionSnapshot(supabase as never, {
        chronicleId,
        sessionId: chronicle.current_session_id,
      });
      recapMarkdown = refreshed.recapMarkdown;
    }
  }

  if (!recapMarkdown) {
    const promptRunsResult = await recapClient
      .from("prompt_runs")
      .select("prompt_number, encounter_index, experience_text, movement, created_at")
      .eq("chronicle_id", chronicleId)
      .limit(3)
      .order("created_at", { ascending: false });

    recapMarkdown = buildRecap({
      archiveEvents: latestEvents,
      chronicleTitle: chronicle.title,
      currentPromptEncounter: chronicle.current_prompt_encounter,
      currentPromptNumber: chronicle.current_prompt_number,
      promptRuns: promptRunsResult.data ?? [],
    });
  }

  return (
    <PageShell className="gap-6 py-8">
      <SurfacePanel tone="nocturne" className="px-6 py-7 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Chronicle return
        </p>
        <h1 className="mt-4 font-heading text-5xl leading-[1.08] text-surface sm:text-6xl">
          {chronicle.title}
        </h1>
        <p className="mt-4 max-w-reading text-lg leading-relaxed text-surface/76">
          Read the last stretch back into yourself before the next prompt asks
          anything more.
        </p>
      </SurfacePanel>

      <RecapBlock
        currentPromptEncounter={chronicle.current_prompt_encounter}
        currentPromptNumber={chronicle.current_prompt_number}
        latestEvents={latestEvents}
        recapMarkdown={recapMarkdown}
        resumeHref={`/chronicles/${chronicleId}/play`}
      />
    </PageShell>
  );
}
