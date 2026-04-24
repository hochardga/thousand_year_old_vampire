import { NextResponse } from "next/server";
import { refreshSessionSnapshot } from "@/lib/chronicles/sessionSnapshots";
import { buildRecap } from "@/lib/recap/buildRecap";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RecapRouteContext = {
  params: Promise<{
    chronicleId: string;
  }>;
};

type ChronicleRecord = {
  current_prompt_encounter: number;
  current_prompt_number: number;
  current_session_id: string | null;
  id: string;
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

type RecapRouteClient = {
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

export async function GET(_request: Request, context: RecapRouteContext) {
  const { chronicleId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const recapClient = supabase as unknown as RecapRouteClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Authentication required",
      },
      { status: 401 },
    );
  }

  const { data: chronicle, error: chronicleError } = await recapClient
    .from("chronicles")
    .select("id, title, current_prompt_number, current_prompt_encounter, current_session_id")
    .eq("id", chronicleId)
    .single();

  if (chronicleError || !chronicle) {
    return NextResponse.json(
      {
        error: "Chronicle not found.",
      },
      { status: 404 },
    );
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

  return NextResponse.json({
    currentPromptNumber: chronicle.current_prompt_number,
    latestEvents,
    recapMarkdown,
  });
}
