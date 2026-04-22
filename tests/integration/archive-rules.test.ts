import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { closeSessionWithRecap } from "@/lib/chronicles/sessionSnapshots";
import { createE2EServerSupabaseClient } from "@/lib/supabase/e2e";

type MemoryStateRow = {
  chronicle_id: string;
  diary_id?: string | null;
  id: string;
  location: "mind" | "diary" | "forgotten";
  slot_index: number | null;
  title: string;
};

type DiaryStateRow = {
  chronicle_id: string;
  id: string;
  status: "active" | "lost";
  title: string;
};

type MemoryEntryStateRow = {
  entry_text: string;
  id: string;
  memory_id: string;
  position: number;
  prompt_run_id: string | null;
};

type ArchiveEventStateRow = {
  chronicle_id: string;
  event_type: string;
  id: string;
  metadata: Record<string, unknown>;
  session_id: string | null;
  summary: string;
};

type ChronicleStateRow = {
  id: string;
  current_session_id: string | null;
};

type SessionStateRow = {
  chronicle_id: string;
  ended_at?: string;
  id: string;
  recap_markdown?: string | null;
  snapshot_json: Record<string, unknown>;
  started_at: string;
  status: "in_progress" | "paused" | "closed";
};

type PromptRunRpcResult = Awaited<
  ReturnType<
    ReturnType<typeof createE2EServerSupabaseClient>["rpc"]
  >
>;

type TestState = {
  archive_events?: ArchiveEventStateRow[];
  chronicles: ChronicleStateRow[];
  diaries: DiaryStateRow[];
  memories: MemoryStateRow[];
  memory_entries?: MemoryEntryStateRow[];
  prompt_runs: Array<Record<string, unknown>>;
  sessions: SessionStateRow[];
};

function resetE2EState() {
  (
    globalThis as typeof globalThis & {
      __tyovE2EState?: unknown;
    }
  ).__tyovE2EState = undefined;
}

function getState() {
  return (
    globalThis as typeof globalThis & {
      __tyovE2EState?: TestState;
    }
  ).__tyovE2EState as TestState;
}

function createAuthedClient() {
  return createE2EServerSupabaseClient({
    get(name) {
      if (name === "tyov-e2e-auth") {
        return { value: "1" };
      }

      return undefined;
    },
    set() {},
  });
}

function buildResolveArgs(
  chronicleId: string,
  sessionId: string,
  memoryDecision: Record<string, string>,
) {
  return {
    experience_text:
      "I set down the shape of this moment before it can leave me again.",
    memory_decision: memoryDecision,
    player_entry:
      "I answer the prompt with something measured enough to survive rereading.",
    target_chronicle_id: chronicleId,
    target_session_id: sessionId,
    trait_mutations: {
      characters: [],
      marks: [],
      resources: [],
      skills: [],
    },
  };
}

async function createActiveChronicle(memoryCount = 1) {
  const client = createAuthedClient();
  const inserted = await client
    .from("chronicles")
    .insert({ title: "The Long Night" })
    .select("id")
    .single();
  const chronicleId = inserted.data?.id as string;
  const setup = await client.rpc("complete_chronicle_setup", {
    setup_memories: Array.from({ length: memoryCount }, (_, index) => ({
      entryText: `Memory fragment ${index + 1}`,
      title: `Memory ${index + 1}`,
    })),
    target_chronicle_id: chronicleId,
  });

  expect(setup.error).toBeNull();

  const state = getState();
  state.memory_entries = [];
  state.archive_events = [];

  return {
    chronicleId,
    client,
    sessionId: setup.data?.sessionId as string,
    state,
  };
}

function setMemoryEntries(
  state: TestState,
  memoryId: string,
  count: number,
  startAt = 1,
) {
  state.memory_entries = state.memory_entries ?? [];

  for (let index = 0; index < count; index += 1) {
    state.memory_entries.push({
      entry_text: `Remembered detail ${startAt + index}`,
      id: randomUUID(),
      memory_id: memoryId,
      position: startAt + index,
      prompt_run_id: null,
    });
  }
}

function startFollowupSession(state: TestState, chronicleId: string) {
  const sessionId = randomUUID();

  state.sessions.push({
    chronicle_id: chronicleId,
    id: sessionId,
    snapshot_json: {},
    started_at: new Date().toISOString(),
    status: "in_progress",
  });

  const chronicle = state.chronicles.find((row) => row.id === chronicleId);

  if (chronicle) {
    chronicle.current_session_id = sessionId;
  }

  return sessionId;
}

async function resolvePromptRun(
  client: ReturnType<typeof createAuthedClient>,
  chronicleId: string,
  sessionId: string,
  memoryDecision: Record<string, string>,
): Promise<PromptRunRpcResult> {
  return client.rpc(
    "resolve_prompt_run",
    buildResolveArgs(chronicleId, sessionId, memoryDecision),
  );
}

beforeEach(() => {
  resetE2EState();
});

describe("archive rule enforcement", () => {
  it("appends an entry to an in-mind memory until it reaches three total entries", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle();
    const targetMemory = state.memories[0];

    setMemoryEntries(state, targetMemory.id, 2);

    const result = await resolvePromptRun(client, chronicleId, sessionId, {
      mode: "append-existing",
      targetMemoryId: targetMemory.id,
    });

    expect(result.error).toBeNull();
    expect(
      state.memory_entries?.filter((entry) => entry.memory_id === targetMemory.id),
    ).toHaveLength(3);
    expect(
      state.memory_entries
        ?.filter((entry) => entry.memory_id === targetMemory.id)
        .map((entry) => entry.position),
    ).toEqual([1, 2, 3]);
    expect(state.memories).toHaveLength(1);
  });

  it("rejects a fourth entry on the same memory", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle();
    const targetMemory = state.memories[0];

    setMemoryEntries(state, targetMemory.id, 3);

    const result = await resolvePromptRun(client, chronicleId, sessionId, {
      mode: "append-existing",
      targetMemoryId: targetMemory.id,
    });

    expect(result.error).toMatchObject({
      message: "That memory is already full.",
    });
    expect(
      state.memory_entries?.filter((entry) => entry.memory_id === targetMemory.id),
    ).toHaveLength(3);
  });

  it("rejects append attempts for diary memories", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle();
    const targetMemory = state.memories[0];
    const diaryId = randomUUID();

    state.diaries.push({
      chronicle_id: chronicleId,
      id: diaryId,
      status: "active",
      title: "The Diary",
    });
    targetMemory.diary_id = diaryId;
    targetMemory.location = "diary";
    targetMemory.slot_index = null;
    setMemoryEntries(state, targetMemory.id, 1);

    const result = await resolvePromptRun(client, chronicleId, sessionId, {
      mode: "append-existing",
      targetMemoryId: targetMemory.id,
    });

    expect(result.error).toMatchObject({
      message: "Only memories still held in mind can accept new entries.",
    });
    expect(
      state.memory_entries?.filter((entry) => entry.memory_id === targetMemory.id),
    ).toHaveLength(1);
  });

  it("requires a legal overflow decision before creating a sixth in-mind memory", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(5);

    const result = await resolvePromptRun(client, chronicleId, sessionId, {
      mode: "create-new",
    });

    expect(result.error).toMatchObject({
      message: "A memory decision is required when the mind is full.",
    });
    expect(
      state.memories.filter((memory) => memory.location === "mind"),
    ).toHaveLength(5);
  });

  it("creates one active diary, moves memories into it, and reuses it on later overflow", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(5);
    const [firstMemory, secondMemory] = state.memories;

    const firstResult = await resolvePromptRun(client, chronicleId, sessionId, {
      memoryId: firstMemory.id,
      mode: "move-to-diary",
    });

    expect(firstResult.error).toBeNull();
    expect(state.diaries).toHaveLength(1);
    expect(firstMemory.location).toBe("diary");
    expect(firstMemory.diary_id).toBe(state.diaries[0]?.id);
    expect(firstResult.data?.archiveEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "diary_created" }),
        expect.objectContaining({ eventType: "memory_moved_to_diary" }),
      ]),
    );

    const activeDiaryId = state.diaries[0]?.id;
    const secondResult = await resolvePromptRun(client, chronicleId, sessionId, {
      memoryId: secondMemory.id,
      mode: "move-to-diary",
    });

    expect(secondResult.error).toBeNull();
    expect(state.diaries).toHaveLength(1);
    expect(secondMemory.location).toBe("diary");
    expect(secondMemory.diary_id).toBe(activeDiaryId);
    expect(secondResult.data?.archiveEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "memory_moved_to_diary" }),
      ]),
    );
  });

  it("forgets the selected in-mind memory and frees its slot for the new memory", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(5);
    const forgottenMemory = state.memories[0];
    const forgottenSlot = forgottenMemory.slot_index;

    const result = await resolvePromptRun(client, chronicleId, sessionId, {
      memoryId: forgottenMemory.id,
      mode: "forget-existing",
    });

    expect(result.error).toBeNull();
    expect(forgottenMemory.location).toBe("forgotten");
    expect(forgottenMemory.slot_index).toBeNull();
    expect(
      state.memories.filter((memory) => memory.location === "mind"),
    ).toHaveLength(5);
    expect(
      state.memories.some(
        (memory) =>
          memory.id !== forgottenMemory.id &&
          memory.location === "mind" &&
          memory.slot_index === forgottenSlot,
      ),
    ).toBe(true);
    expect(result.data?.archiveEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "memory_forgotten" }),
      ]),
    );
  });

  it("preserves archive continuity when a later session resumes after the prior one is closed", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(4);

    const firstSessionResult = await resolvePromptRun(client, chronicleId, sessionId, {
      mode: "create-new",
    });

    expect(firstSessionResult.error).toBeNull();

    const closedPayload = await closeSessionWithRecap(client as never, {
      chronicleId,
      sessionId,
    });
    const closedSession = state.sessions.find((session) => session.id === sessionId);

    expect(closedPayload.recapMarkdown).toContain("The Long Night");
    expect(closedSession?.status).toBe("closed");
    expect(closedSession?.recap_markdown).toContain("Prompt 1");
    expect(closedSession?.ended_at).toBeTruthy();

    const resumedSessionId = startFollowupSession(state, chronicleId);
    const memoryToDiary = state.memories.find((memory) => memory.location === "mind");

    expect(memoryToDiary).toBeDefined();

    const resumedResult = await resolvePromptRun(client, chronicleId, resumedSessionId, {
      memoryId: memoryToDiary?.id as string,
      mode: "move-to-diary",
    });

    expect(resumedResult.error).toBeNull();
    expect(state.sessions.find((session) => session.id === resumedSessionId)?.status).toBe(
      "in_progress",
    );
    expect(state.chronicles.find((chronicle) => chronicle.id === chronicleId)?.current_session_id).toBe(
      resumedSessionId,
    );
    expect(state.diaries).toHaveLength(1);
    expect(state.memories.find((memory) => memory.id === memoryToDiary?.id)?.location).toBe(
      "diary",
    );
    expect(
      state.prompt_runs.map((promptRun) => String(promptRun.session_id)),
    ).toEqual(expect.arrayContaining([sessionId, resumedSessionId]));
  });
});
