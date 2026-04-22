import { redirect } from "next/navigation";
import { TrackEventOnMount } from "@/components/analytics/TrackEventOnMount";
import { RecapBlock } from "@/components/ritual/RecapBlock";
import { PageShell } from "@/components/ui/PageShell";
import { QuietAlert } from "@/components/ui/QuietAlert";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { refreshSessionSnapshot } from "@/lib/chronicles/sessionSnapshots";
import { buildRecap } from "@/lib/recap/buildRecap";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RecapPageProps = {
  params: Promise<{
    chronicleId: string;
  }>;
  searchParams: Promise<{
    returned?: string;
  }>;
};

export default async function ChronicleRecapPage({
  params,
  searchParams,
}: RecapPageProps) {
  const { chronicleId } = await params;
  const recapParams = await searchParams;
  const supabase = await createServerSupabaseClient();
  const recapClient = supabase as any;
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
      <TrackEventOnMount
        event="recap_opened"
        onceKey={`recap-opened:${chronicleId}`}
        properties={{
          chronicleId,
          source: "recap",
        }}
      />
      {recapParams.returned === "1" ? (
        <TrackEventOnMount
          event="second_session_return"
          onceKey={`second-session:${chronicleId}`}
          properties={{
            chronicleId,
            source: "recap",
          }}
        />
      ) : null}
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

      {latestEventsResult.error ? (
        <QuietAlert
          title="The latest archive echoes could not be gathered just now."
          body="The recap is still here. Return to the archive when you are ready."
          tone="info"
        />
      ) : null}
    </PageShell>
  );
}
