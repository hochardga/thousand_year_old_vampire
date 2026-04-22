import { NextResponse } from "next/server";
import { refreshSessionSnapshot } from "@/lib/chronicles/sessionSnapshots";
import { buildRecap } from "@/lib/recap/buildRecap";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RecapRouteContext = {
  params: Promise<{
    chronicleId: string;
  }>;
};

export async function GET(_request: Request, context: RecapRouteContext) {
  const { chronicleId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const recapClient = supabase as any;
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
