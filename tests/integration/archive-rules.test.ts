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
  memory_capacity: number;
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

type SkillStateRow = {
  chronicle_id: string;
  description: string | null;
  id: string;
  label: string;
  sort_order: number;
  status: "active" | "checked" | "lost";
};

type ResourceStateRow = {
  chronicle_id: string;
  description: string | null;
  id: string;
  is_stationary: boolean;
  label: string;
  sort_order: number;
  status: "active" | "checked" | "lost";
};

type MarkStateRow = {
  chronicle_id: string;
  description: string | null;
  id: string;
  is_active: boolean;
  is_concealed: boolean;
  label: string;
  sort_order: number;
};

type CharacterStateRow = {
  chronicle_id: string;
  description: string;
  id: string;
  kind: "mortal" | "immortal";
  name: string;
  retired_at: string | null;
  sort_order: number;
  status: "active" | "dead" | "lost";
};

type PromptRunRpcResult = Awaited<
  ReturnType<
    ReturnType<typeof createE2EServerSupabaseClient>["rpc"]
  >
>;

type TestState = {
  archive_events?: ArchiveEventStateRow[];
  characters: CharacterStateRow[];
  chronicles: ChronicleStateRow[];
  diaries: DiaryStateRow[];
  memories: MemoryStateRow[];
  memory_entries?: MemoryEntryStateRow[];
  marks: MarkStateRow[];
  prompt_runs: Array<Record<string, unknown>>;
  resources: ResourceStateRow[];
  sessions: SessionStateRow[];
  skills: SkillStateRow[];
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
  newSkill?: {
    description: string;
    label: string;
  },
  newResource?: {
    description: string;
    isStationary: boolean;
    label: string;
  },
  newMark?: {
    description: string;
    isConcealed: boolean;
    label: string;
  },
  newCharacter?: {
    description: string;
    kind: "mortal" | "immortal";
    name: string;
  },
) {
  return {
    experience_text:
      "I set down the shape of this moment before it can leave me again.",
    memory_decision: memoryDecision,
    new_character: newCharacter ?? null,
    new_mark: newMark ?? null,
    new_resource: newResource ?? null,
    new_skill: newSkill ?? null,
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

async function createActiveChronicle(
  memoryCount = 1,
  initialSkills: Array<{
    description: string;
    label: string;
  }> = [],
) {
  const client = createAuthedClient();
  const inserted = await client
    .from("chronicles")
    .insert({ title: "The Long Night" })
    .select("id")
    .single();
  const chronicleId = inserted.data?.id as string;
  const setup = await client.rpc("complete_chronicle_setup", {
    initial_skills: initialSkills,
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
  newSkill?: {
    description: string;
    label: string;
  },
  newResource?: {
    description: string;
    isStationary: boolean;
    label: string;
  },
  newMark?: {
    description: string;
    isConcealed: boolean;
    label: string;
  },
  newCharacter?: {
    description: string;
    kind: "mortal" | "immortal";
    name: string;
  },
): Promise<PromptRunRpcResult> {
  return client.rpc(
    "resolve_prompt_run",
    buildResolveArgs(
      chronicleId,
      sessionId,
      memoryDecision,
      newSkill,
      newResource,
      newMark,
      newCharacter,
    ),
  );
}

beforeEach(() => {
  resetE2EState();
});

describe("archive rule enforcement", () => {
  it("returns joined memory entries from the e2e mock archive query", async () => {
    const client = createAuthedClient();
    const inserted = await client
      .from("chronicles")
      .insert({ title: "The Long Night" })
      .select("id")
      .single();
    const chronicleId = inserted.data?.id as string;

    const setup = await client.rpc("complete_chronicle_setup", {
      setup_memories: [
        {
          entryText: "The bell rang once each dawn until I forgot her voice.",
          title: "The bell below the crypt",
        },
      ],
      target_chronicle_id: chronicleId,
    });

    expect(setup.error).toBeNull();

    const memories = await client
      .from("memories")
      .select(
        "id, title, location, diary_id, slot_index, memory_entries(id, position, entry_text)",
      )
      .eq("chronicle_id", chronicleId);

    expect(memories.data?.[0]).toMatchObject({
      memory_entries: [
        {
          entry_text: "The bell rang once each dawn until I forgot her voice.",
          position: 1,
        },
      ],
      title: "The bell below the crypt",
    });
  });

  it("advances the e2e mock from Prompt 4 to the next available prompt", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle();

    state.prompt_catalog.push({
      encounter_index: 1,
      prompt_markdown: "A later prompt waits beyond the first withdrawal.",
      prompt_number: 7,
      prompt_version: "base",
    });

    const firstResult = await resolvePromptRun(client, chronicleId, sessionId, {
      mode: "create-new",
    });

    expect(firstResult.data?.nextPrompt).toMatchObject({
      encounterIndex: 1,
      promptNumber: 4,
    });

    const secondResult = await resolvePromptRun(client, chronicleId, sessionId, {
      mode: "create-new",
    });

    expect(secondResult.data?.nextPrompt).toMatchObject({
      encounterIndex: 1,
      promptNumber: 7,
    });
  });

  it("fails the e2e mock prompt resolution when no next prompt exists", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle();

    state.prompt_catalog = state.prompt_catalog.filter(
      (prompt) => prompt.prompt_number <= 7,
    );

    const firstResult = await resolvePromptRun(client, chronicleId, sessionId, {
      mode: "create-new",
    });
    const secondResult = await resolvePromptRun(client, chronicleId, sessionId, {
      mode: "create-new",
    });
    const thirdResult = await resolvePromptRun(client, chronicleId, sessionId, {
      mode: "create-new",
    });

    expect(firstResult.error).toBeNull();
    expect(secondResult.error).toBeNull();
    expect(thirdResult).toMatchObject({
      data: null,
      error: {
        message: "No next prompt is available in the prompt catalog.",
      },
    });
  });

  it("stores setup-era skills in e2e state so later play-time reads can load them", async () => {
    const initialSkills = [
      {
        description: "I know how to listen before danger takes shape.",
        label: "Quiet Devotion",
      },
      {
        description: "I can read the older debts in a room.",
        label: "Long Memory",
      },
    ];
    const { chronicleId, client, state } = await createActiveChronicle(1, initialSkills);

    expect(state.skills).toEqual([
      expect.objectContaining({
        chronicle_id: chronicleId,
        description: "I know how to listen before danger takes shape.",
        label: "Quiet Devotion",
        sort_order: 0,
        status: "active",
      }),
      expect.objectContaining({
        chronicle_id: chronicleId,
        description: "I can read the older debts in a room.",
        label: "Long Memory",
        sort_order: 1,
        status: "active",
      }),
    ]);

    const skillsResult = await client
      .from("skills")
      .select("label, description, sort_order, status")
      .eq("chronicle_id", chronicleId)
      .order("sort_order", { ascending: true });

    expect(skillsResult.error).toBeNull();
    expect(skillsResult.data).toEqual([
      {
        description: "I know how to listen before danger takes shape.",
        label: "Quiet Devotion",
        sort_order: 0,
        status: "active",
      },
      {
        description: "I can read the older debts in a room.",
        label: "Long Memory",
        sort_order: 1,
        status: "active",
      },
    ]);
  });

  it("creates prompt-created skills at the next sort order", async () => {
    const initialSkills = [
      {
        description: "I know how to listen before danger takes shape.",
        label: "Quiet Devotion",
      },
      {
        description: "I can read the older debts in a room.",
        label: "Long Memory",
      },
    ];
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      initialSkills,
    );

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      {
        description: "  I can find the safe route home after dusk.  ",
        label: "  Night Navigation  ",
      },
    );

    expect(result.error).toBeNull();
    expect(state.skills).toHaveLength(3);
    expect(state.skills.at(-1)).toMatchObject({
      chronicle_id: chronicleId,
      description: "I can find the safe route home after dusk.",
      label: "Night Navigation",
      sort_order: 2,
      status: "active",
    });
  });

  it("rejects duplicate prompt-created skill labels within the same chronicle", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(1, [
      {
        description: "I know how to listen before danger takes shape.",
        label: "Quiet Devotion",
      },
    ]);

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      {
        description: "  The hunger teaches the same lesson twice.  ",
        label: "  Quiet Devotion  ",
      },
    );

    expect(result.error).toMatchObject({
      message: "A skill with this name already exists.",
    });
    expect(state.skills).toHaveLength(1);
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("rejects prompt-created skills with a blank trimmed label", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(1, [
      {
        description: "I know how to listen before danger takes shape.",
        label: "Quiet Devotion",
      },
    ]);

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      {
        description: "A habit shaped by the road and its silence.",
        label: "   ",
      },
    );

    expect(result.error).toMatchObject({
      message: "A skill name is required.",
    });
    expect(state.skills).toHaveLength(1);
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("rejects prompt-created skills with a blank trimmed description", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(1, [
      {
        description: "I know how to listen before danger takes shape.",
        label: "Quiet Devotion",
      },
    ]);

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      {
        description: "   ",
        label: "Night Navigation",
      },
    );

    expect(result.error).toMatchObject({
      message: "A skill description is required.",
    });
    expect(state.skills).toHaveLength(1);
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("creates prompt-created resources at the next sort order", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    state.resources.push({
      chronicle_id: chronicleId,
      description: "A safe house kept by bribes and silence.",
      id: randomUUID(),
      is_stationary: false,
      label: "Pilgrim Road Inn",
      sort_order: 0,
      status: "active",
    });

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      {
        description: "  A roofed crypt where I can feed and vanish.  ",
        isStationary: true,
        label: "  The Marsh House  ",
      },
    );

    expect(result.error).toBeNull();
    expect(state.resources).toHaveLength(2);
    expect(state.resources.at(-1)).toMatchObject({
      chronicle_id: chronicleId,
      description: "A roofed crypt where I can feed and vanish.",
      is_stationary: true,
      label: "The Marsh House",
      sort_order: 1,
      status: "active",
    });
  });

  it("rejects duplicate prompt-created resource labels within the same chronicle", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    state.resources.push({
      chronicle_id: chronicleId,
      description: "A safe house kept by bribes and silence.",
      id: randomUUID(),
      is_stationary: false,
      label: "The Marsh House",
      sort_order: 0,
      status: "active",
    });

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      {
        description: "  A roofed crypt where I can feed and vanish.  ",
        isStationary: true,
        label: "  The Marsh House  ",
      },
    );

    expect(result.error).toMatchObject({
      message: "A resource with this name already exists.",
    });
    expect(state.resources).toHaveLength(1);
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("rejects prompt-created resources with a blank trimmed label", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      {
        description: "A safe place made meaningful by repetition and hunger.",
        isStationary: true,
        label: "   ",
      },
    );

    expect(result.error).toMatchObject({
      message: "A resource name is required.",
    });
    expect(state.resources).toHaveLength(0);
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("rejects prompt-created resources with a blank trimmed description", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      {
        description: "   ",
        isStationary: true,
        label: "The Marsh House",
      },
    );

    expect(result.error).toMatchObject({
      message: "A resource description is required.",
    });
    expect(state.resources).toHaveLength(0);
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("creates prompt-created marks at the next sort order", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    state.marks.push({
      chronicle_id: chronicleId,
      description: "The first mark left by undeath.",
      id: randomUUID(),
      is_active: true,
      is_concealed: false,
      label: "Bloodless Reflection",
      sort_order: 0,
    });

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      {
        description: "  A crescent scar that opens when I hunger.  ",
        isConcealed: true,
        label: "  Moon-Scarred Throat  ",
      },
    );

    expect(result.error).toBeNull();
    expect(state.marks).toHaveLength(2);
    expect(state.marks.at(-1)).toMatchObject({
      chronicle_id: chronicleId,
      description: "A crescent scar that opens when I hunger.",
      is_active: true,
      is_concealed: true,
      label: "Moon-Scarred Throat",
      sort_order: 1,
    });
  });

  it("rejects duplicate prompt-created mark labels within the same chronicle", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    state.marks.push({
      chronicle_id: chronicleId,
      description: "A crescent scar that opens when I hunger.",
      id: randomUUID(),
      is_active: true,
      is_concealed: true,
      label: "Moon-Scarred Throat",
      sort_order: 0,
    });

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      {
        description: "  The same wound trying to enter the chronicle twice.  ",
        isConcealed: true,
        label: "  Moon-Scarred Throat  ",
      },
    );

    expect(result.error).toMatchObject({
      message: "A mark with this name already exists.",
    });
    expect(state.marks).toHaveLength(1);
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("rejects prompt-created marks with a blank trimmed label", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      {
        description: "A crescent scar that opens when I hunger.",
        isConcealed: true,
        label: "   ",
      },
    );

    expect(result.error).toMatchObject({
      message: "A mark name is required.",
    });
    expect(state.marks).toHaveLength(0);
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("rejects prompt-created marks with a blank trimmed description", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      {
        description: "   ",
        isConcealed: true,
        label: "Moon-Scarred Throat",
      },
    );

    expect(result.error).toMatchObject({
      message: "A mark description is required.",
    });
    expect(state.marks).toHaveLength(0);
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("creates prompt-created characters at the next sort order", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle();

    state.characters.push({
      chronicle_id: chronicleId,
      description: "My sister kept the house until the last fever.",
      id: randomUUID(),
      kind: "mortal",
      name: "Marta",
      retired_at: null,
      sort_order: 0,
      status: "active",
    });

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      undefined,
      {
        description: "  A parish clerk who saw my hunger and chose silence.  ",
        kind: "mortal",
        name: "  Elias Voss  ",
      },
    );

    expect(result.error).toBeNull();
    expect(state.characters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chronicle_id: chronicleId,
          description: "A parish clerk who saw my hunger and chose silence.",
          kind: "mortal",
          name: "Elias Voss",
          sort_order: 1,
          status: "active",
        }),
      ]),
    );
  });

  it("rejects duplicate prompt-created character names within the same chronicle", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle();

    state.characters.push({
      chronicle_id: chronicleId,
      description: "A parish clerk who saw too much.",
      id: randomUUID(),
      kind: "mortal",
      name: "Elias Voss",
      retired_at: null,
      sort_order: 0,
      status: "active",
    });

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      undefined,
      {
        description: "A second clerk with the same name.",
        kind: "mortal",
        name: " Elias Voss ",
      },
    );

    expect(result.error).toMatchObject({
      message: "A character with this name already exists.",
    });
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("rejects prompt-created characters with a blank trimmed name", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle();

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      undefined,
      {
        description: "A parish clerk who saw too much.",
        kind: "mortal",
        name: "   ",
      },
    );

    expect(result.error).toMatchObject({
      message: "A character name is required.",
    });
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("rejects prompt-created characters with a blank trimmed description", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle();

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      undefined,
      {
        description: "   ",
        kind: "mortal",
        name: "Elias Voss",
      },
    );

    expect(result.error).toMatchObject({
      message: "A character description is required.",
    });
    expect(state.prompt_runs).toHaveLength(0);
  });

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
      memory_capacity: 4,
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

  it("rejects moving a memory into a full diary", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(5);
    const selectedMemory = state.memories[0];
    const diaryId = randomUUID();

    state.diaries.push({
      chronicle_id: chronicleId,
      id: diaryId,
      memory_capacity: 4,
      status: "active",
      title: "The Diary",
    });

    for (let index = 0; index < 4; index += 1) {
      state.memories.push({
        chronicle_id: chronicleId,
        diary_id: diaryId,
        id: randomUUID(),
        location: "diary",
        slot_index: null,
        title: `Archived Memory ${index + 1}`,
      });
    }

    const result = await resolvePromptRun(client, chronicleId, sessionId, {
      memoryId: selectedMemory.id,
      mode: "move-to-diary",
    });

    expect(result.error).toMatchObject({
      message: "The diary is already full.",
    });
    expect(selectedMemory.location).toBe("mind");
    expect(
      state.memories.filter(
        (memory) => memory.diary_id === diaryId && memory.location === "diary",
      ),
    ).toHaveLength(4);
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
