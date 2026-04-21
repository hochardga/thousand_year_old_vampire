import { buildRecap } from "@/lib/recap/buildRecap";

type SessionSnapshotClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq?: (column: string, value: string) => {
          limit?: (count: number) => {
            order: (
              column: string,
              options?: { ascending?: boolean },
            ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
          };
          single?: () => Promise<{
            data: Record<string, unknown> | null;
            error: { message: string } | null;
          }>;
        };
        limit?: (count: number) => {
          order: (
            column: string,
            options?: { ascending?: boolean },
          ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
        };
        single?: () => Promise<{
          data: Record<string, unknown> | null;
          error: { message: string } | null;
        }>;
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

type RefreshSessionSnapshotInput = {
  chronicleId: string;
  sessionId: string;
};

type PromptRunRecord = {
  created_at: string;
  encounter_index: number;
  experience_text: string;
  movement: number;
  prompt_number: number;
};

type ArchiveEventRecord = {
  created_at: string;
  event_type: string;
  summary: string;
};

type ChronicleRecord = {
  current_prompt_encounter: number;
  current_prompt_number: number;
  id: string;
  title: string;
};

async function buildSessionSnapshotPayload(
  supabase: SessionSnapshotClient,
  { chronicleId, sessionId }: RefreshSessionSnapshotInput,
) {
  const chronicleQuery = supabase
    .from("chronicles")
    .select("id, title, current_prompt_number, current_prompt_encounter")
    .eq("id", chronicleId);
  const promptRunsQuery = supabase
    .from("prompt_runs")
    .select("prompt_number, encounter_index, experience_text, movement, created_at")
    .eq("chronicle_id", chronicleId)
    .eq?.("session_id", sessionId);
  const archiveEventsQuery = supabase
    .from("archive_events")
    .select("event_type, summary, created_at")
    .eq("chronicle_id", chronicleId)
    .eq?.("session_id", sessionId);

  const [
    chronicleResult,
    promptRunsResult,
    archiveEventsResult,
  ] = await Promise.all([
    chronicleQuery.single?.(),
    promptRunsQuery?.limit?.(3).order("created_at", { ascending: false }),
    archiveEventsQuery?.limit?.(5).order("created_at", { ascending: false }),
  ]);

  if (!chronicleResult?.data) {
    throw new Error(chronicleResult?.error?.message || "Chronicle not found.");
  }

  const chronicle = chronicleResult.data as ChronicleRecord;
  const promptRuns = (promptRunsResult?.data ?? []) as PromptRunRecord[];
  const archiveEvents = (archiveEventsResult?.data ?? []) as ArchiveEventRecord[];
  const recapMarkdown = buildRecap({
    archiveEvents,
    chronicleTitle: chronicle.title,
    currentPromptEncounter: chronicle.current_prompt_encounter,
    currentPromptNumber: chronicle.current_prompt_number,
    promptRuns,
  });
  const snapshotJson = {
    currentPromptEncounter: chronicle.current_prompt_encounter,
    currentPromptNumber: chronicle.current_prompt_number,
    latestEventSummaries: archiveEvents.map((event) => event.summary),
    latestPromptRuns: promptRuns.map((promptRun) => ({
      encounterIndex: promptRun.encounter_index,
      movement: promptRun.movement,
      promptNumber: promptRun.prompt_number,
    })),
    recapMarkdown,
  };

  return {
    currentPromptEncounter: chronicle.current_prompt_encounter,
    currentPromptNumber: chronicle.current_prompt_number,
    latestEvents: archiveEvents,
    recapMarkdown,
    snapshotJson,
  };
}

export async function refreshSessionSnapshot(
  supabase: SessionSnapshotClient,
  input: RefreshSessionSnapshotInput,
) {
  const payload = await buildSessionSnapshotPayload(supabase, input);
  const { error } = await supabase
    .from("sessions")
    .update({
      recap_markdown: payload.recapMarkdown,
      snapshot_json: payload.snapshotJson,
    })
    .eq("id", input.sessionId)
    .eq("chronicle_id", input.chronicleId);

  if (error) {
    throw new Error(error.message || "The session recap could not be updated.");
  }

  return payload;
}

export async function closeSessionWithRecap(
  supabase: SessionSnapshotClient,
  input: RefreshSessionSnapshotInput,
) {
  const payload = await buildSessionSnapshotPayload(supabase, input);
  const { error } = await supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
      recap_markdown: payload.recapMarkdown,
      snapshot_json: payload.snapshotJson,
      status: "closed",
    })
    .eq("id", input.sessionId)
    .eq("chronicle_id", input.chronicleId);

  if (error) {
    throw new Error(error.message || "The session could not be closed.");
  }

  return payload;
}
