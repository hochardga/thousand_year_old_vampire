import { randomUUID } from "node:crypto";

const E2E_AUTH_COOKIE = "tyov-e2e-auth";
const E2E_USER_ID = "11111111-1111-4111-8111-111111111111";

type ChronicleRow = {
  created_at: string;
  current_prompt_encounter: number;
  current_prompt_number: number;
  current_session_id: string | null;
  id: string;
  last_played_at: string | null;
  mortal_summary: string | null;
  prompt_version: string;
  status: "draft" | "active" | "completed" | "archived";
  title: string;
  updated_at: string;
  user_id: string;
  vampire_name: string | null;
};

type SessionRow = {
  chronicle_id: string;
  id: string;
  snapshot_json: Record<string, unknown>;
  started_at: string;
  status: "in_progress" | "paused" | "closed";
};

type MemoryRow = {
  chronicle_id: string;
  created_at: string;
  diary_id: string | null;
  forgotten_at: string | null;
  id: string;
  location: "mind" | "diary" | "forgotten";
  slot_index: number | null;
  title: string;
  updated_at: string;
};

type DiaryRow = {
  chronicle_id: string;
  created_at: string;
  id: string;
  lost_at: string | null;
  memory_capacity: number;
  status: "active" | "lost";
  title: string;
};

type MemoryEntryRow = {
  created_at: string;
  entry_text: string;
  id: string;
  memory_id: string;
  position: number;
  prompt_run_id: string | null;
};

type ArchiveEventRow = {
  chronicle_id: string;
  created_at: string;
  event_type: string;
  id: string;
  metadata: Record<string, unknown>;
  session_id: string | null;
  summary: string;
};

type PromptRunRow = {
  chronicle_id: string;
  created_at: string;
  d10_roll: number;
  d6_roll: number;
  encounter_index: number;
  experience_text: string;
  id: string;
  movement: number;
  next_prompt_encounter: number;
  next_prompt_number: number;
  player_entry: string;
  prompt_markdown: string;
  prompt_number: number;
  session_id: string;
};

type PromptCatalogRow = {
  encounter_index: number;
  prompt_markdown: string;
  prompt_number: number;
  prompt_version: string;
};

type ProfileRow = {
  display_name: string;
  id: string;
};

type FeedbackSubmissionRow = {
  body: string;
  category: "bug" | "delight" | "friction" | "question";
  chronicle_id: string | null;
  created_at: string;
  id: string;
  source: "recap";
  user_id: string;
};

type E2EState = {
  archive_events: ArchiveEventRow[];
  characters: Array<Record<string, unknown>>;
  chronicles: ChronicleRow[];
  diaries: DiaryRow[];
  feedback_submissions: FeedbackSubmissionRow[];
  marks: Array<Record<string, unknown>>;
  memory_entries: MemoryEntryRow[];
  memories: MemoryRow[];
  prompt_catalog: PromptCatalogRow[];
  prompt_runs: PromptRunRow[];
  profiles: ProfileRow[];
  resources: Array<Record<string, unknown>>;
  sessions: SessionRow[];
  skills: Array<Record<string, unknown>>;
};

type CookieStoreLike = {
  get: (name: string) => { value?: string } | undefined;
  set: (
    name: string,
    value: string,
    options?: {
      path?: string;
    },
  ) => void;
};

type QueryOptions = {
  count?: "exact";
  head?: boolean;
};

type Filter = {
  column: string;
  operator: "eq" | "lt";
  value: number | string;
};

type InsertBuilder<T> = {
  select: (columns: string) => {
    single: () => Promise<{ data: Partial<T> | null; error: null }>;
  };
};

type SelectExecutionResult =
  | {
      count: number;
      data: null;
      error: null;
    }
  | {
      data: Record<string, unknown>[];
      error: null;
    };

type UpdateExecutionResult = {
  data: null;
  error: { message: string } | null;
};

type SelectBuilder<T extends Record<string, unknown>> = {
  eq: (column: string, value: number | string) => SelectBuilder<T>;
  limit: (count: number) => SelectBuilder<T>;
  lt: (column: string, value: number | string) => SelectBuilder<T>;
  maybeSingle: () => Promise<{
    data: Record<string, unknown> | null;
    error: null;
  }>;
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => SelectBuilder<T>;
  single: () => Promise<{
    data: Record<string, unknown> | null;
    error: { message: string } | null;
  }>;
  then: <TResult1 = SelectExecutionResult, TResult2 = never>(
    onFulfilled?:
      | ((value: SelectExecutionResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onRejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ) => Promise<TResult1 | TResult2>;
};

type UpdateBuilder<T extends Record<string, unknown>> = {
  eq: (column: string, value: number | string) => UpdateBuilder<T>;
  select: (columns: string) => {
    single: () => Promise<{
      data: Record<string, unknown> | null;
      error: { message: string } | null;
    }>;
  };
  then: <TResult1 = UpdateExecutionResult, TResult2 = never>(
    onFulfilled?:
      | ((value: UpdateExecutionResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onRejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ) => Promise<TResult1 | TResult2>;
};

const promptCatalogSeed: PromptCatalogRow[] = [
  {
    encounter_index: 1,
    prompt_markdown:
      "In your blood-hunger you destroy someone close to you. Kill a mortal Character. Create a mortal if none are available. Take the skill Bloodthirsty.",
    prompt_number: 1,
    prompt_version: "base",
  },
  {
    encounter_index: 1,
    prompt_markdown:
      "Horrified at your new nature, you withdraw from society. Where do you hide? How do you feed? Create a stationary Resource which shelters you.",
    prompt_number: 4,
    prompt_version: "base",
  },
];

function buildInitialState(): E2EState {
  return {
    archive_events: [],
    characters: [],
    chronicles: [],
    diaries: [],
    feedback_submissions: [],
    marks: [],
    memory_entries: [],
    memories: [],
    prompt_catalog: [...promptCatalogSeed],
    prompt_runs: [],
    profiles: [],
    resources: [],
    sessions: [],
    skills: [],
  };
}

function getState() {
  const globalWithState = globalThis as typeof globalThis & {
    __tyovE2EState?: E2EState;
  };

  if (!globalWithState.__tyovE2EState) {
    globalWithState.__tyovE2EState = buildInitialState();
  }

  return globalWithState.__tyovE2EState;
}

export function resetE2EState() {
  const globalWithState = globalThis as typeof globalThis & {
    __tyovE2EState?: E2EState;
  };

  globalWithState.__tyovE2EState = buildInitialState();
}

function timestamp() {
  return new Date().toISOString();
}

function pickColumns<T extends Record<string, unknown>>(row: T, columns: string) {
  if (columns === "*" || !columns.trim()) {
    return row;
  }

  const selected = columns
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);

  return selected.reduce<Record<string, unknown>>((result, column) => {
    result[column] = row[column];
    return result;
  }, {});
}

function applyFilters<T extends Record<string, unknown>>(rows: T[], filters: Filter[]) {
  return rows.filter((row) =>
    filters.every((filter) => {
      const rowValue = row[filter.column as keyof T];

      if (filter.operator === "lt") {
        if (typeof rowValue === "number" && typeof filter.value === "number") {
          return rowValue < filter.value;
        }

        if (typeof rowValue === "string" && typeof filter.value === "string") {
          return rowValue < filter.value;
        }

        return false;
      }

      return rowValue === filter.value;
    }),
  );
}

function createSelectBuilder<T extends Record<string, unknown>>(
  rowsFactory: () => T[],
  columns: string,
  options?: QueryOptions,
) {
  const filters: Filter[] = [];
  let limitCount: number | null = null;
  let orderColumn: string | null = null;
  let ascending = true;

  function execute() {
    let rows = applyFilters(rowsFactory(), filters);

    if (orderColumn) {
      rows = [...rows].sort((left, right) => {
        const leftValue = left[orderColumn as keyof T];
        const rightValue = right[orderColumn as keyof T];

        if (leftValue === rightValue) {
          return 0;
        }

        if (leftValue > rightValue) {
          return ascending ? 1 : -1;
        }

        return ascending ? -1 : 1;
      });
    }

    if (limitCount !== null) {
      rows = rows.slice(0, limitCount);
    }

    if (options?.head) {
      return Promise.resolve({
        count: rows.length,
        data: null,
        error: null,
      });
    }

    return Promise.resolve({
      data: rows.map((row) => pickColumns(row, columns)),
      error: null,
    });
  }

  const builder: SelectBuilder<T> = {
    eq(column: string, value: number | string) {
      filters.push({ column, operator: "eq", value });
      return builder;
    },
    limit(count: number) {
      limitCount = count;
      return builder;
    },
    lt(column: string, value: number | string) {
      filters.push({ column, operator: "lt", value });
      return builder;
    },
    maybeSingle() {
      const rows = applyFilters(rowsFactory(), filters);
      const row = rows[0];

      return Promise.resolve({
        data: row ? pickColumns(row, columns) : null,
        error: null,
      });
    },
    order(column: string, options?: { ascending?: boolean }) {
      orderColumn = column;
      ascending = options?.ascending ?? true;
      return builder;
    },
    single() {
      const rows = applyFilters(rowsFactory(), filters);
      const row = rows[0];

      return Promise.resolve({
        data: row ? pickColumns(row, columns) : null,
        error: row ? null : { message: "Not found" },
      });
    },
    then(onFulfilled, onRejected) {
      return execute().then(onFulfilled, onRejected);
    },
  };

  return builder;
}

function createRpcError(message: string) {
  return {
    data: null,
    error: { message },
  };
}

function createUpdateBuilder(
  table: string,
  values: Record<string, unknown>,
): UpdateBuilder<Record<string, unknown>> {
  const filters: Filter[] = [];

  function applyUpdates() {
    const rows = applyFilters(
      selectRowsForTable(table) as Record<string, unknown>[],
      filters,
    );

    rows.forEach((row) => {
      Object.assign(row, values);
    });

    return rows;
  }

  const builder: UpdateBuilder<Record<string, unknown>> = {
    eq(column: string, value: number | string) {
      filters.push({ column, operator: "eq", value });
      return builder;
    },
    select(columns: string) {
      return {
        single() {
          const rows = applyUpdates();
          const row = rows[0];

          return Promise.resolve({
            data: row ? pickColumns(row, columns) : null,
            error: row ? null : { message: "Not found" },
          });
        },
      };
    },
    then(onFulfilled, onRejected) {
      const rows = applyUpdates();

      return Promise.resolve({
        data: null,
        error: rows.length ? null : { message: "Not found" },
      }).then(onFulfilled, onRejected);
    },
  };

  return builder;
}

function countMindMemories(state: E2EState, chronicleId: string) {
  return state.memories.filter(
    (memory) =>
      memory.chronicle_id === chronicleId && memory.location === "mind",
  ).length;
}

function findMemoryEntries(state: E2EState, memoryId: string) {
  return state.memory_entries
    .filter((entry) => entry.memory_id === memoryId)
    .sort((left, right) => left.position - right.position);
}

function countDiaryMemories(state: E2EState, diaryId: string) {
  return state.memories.filter(
    (memory) => memory.diary_id === diaryId && memory.location === "diary",
  ).length;
}

function nextOpenMindSlot(state: E2EState, chronicleId: string) {
  for (let slot = 1; slot <= 5; slot += 1) {
    const occupied = state.memories.some(
      (memory) =>
        memory.chronicle_id === chronicleId &&
        memory.location === "mind" &&
        memory.slot_index === slot,
    );

    if (!occupied) {
      return slot;
    }
  }

  return null;
}

function getCurrentPrompt(
  state: E2EState,
  chronicle: ChronicleRow,
): PromptCatalogRow | undefined {
  return (
    state.prompt_catalog.find(
      (prompt) =>
        prompt.prompt_number === chronicle.current_prompt_number &&
        prompt.encounter_index === chronicle.current_prompt_encounter,
    ) || state.prompt_catalog[0]
  );
}

function ensureActiveDiary(
  state: E2EState,
  chronicleId: string,
  now: string,
): { created: boolean; diary: DiaryRow } {
  const existingDiary = state.diaries.find(
    (diary) => diary.chronicle_id === chronicleId && diary.status === "active",
  );

  if (existingDiary) {
    return { created: false, diary: existingDiary };
  }

  const diary: DiaryRow = {
    chronicle_id: chronicleId,
    created_at: now,
    id: randomUUID(),
    lost_at: null,
    memory_capacity: 4,
    status: "active",
    title: "The Diary",
  };
  state.diaries.push(diary);

  return { created: true, diary };
}

function appendArchiveEvents(
  state: E2EState,
  chronicleId: string,
  sessionId: string,
  events: Array<{ eventType: string; summary: string }>,
  now: string,
) {
  state.archive_events.push(
    ...events.map((event) => ({
      chronicle_id: chronicleId,
      created_at: now,
      event_type: event.eventType,
      id: randomUUID(),
      metadata: {},
      session_id: sessionId,
      summary: event.summary,
    })),
  );
}

function createChronicleInsertBuilder(
  payload: Record<string, unknown>,
): InsertBuilder<ChronicleRow> {
  const state = getState();
  const createdChronicle: ChronicleRow = {
    created_at: timestamp(),
    current_prompt_encounter: 1,
    current_prompt_number: 1,
    current_session_id: null,
    id: randomUUID(),
    last_played_at: null,
    mortal_summary: null,
    prompt_version: "base",
    status: "draft",
    title:
      typeof payload.title === "string" && payload.title
        ? payload.title
        : "Chronicle begun in test mode",
    updated_at: timestamp(),
    user_id:
      typeof payload.user_id === "string" && payload.user_id
        ? payload.user_id
        : E2E_USER_ID,
    vampire_name: null,
  };

  state.chronicles.unshift(createdChronicle);

  return {
    select(columns: string) {
      return {
        single() {
          return Promise.resolve({
            data: pickColumns(createdChronicle, columns),
            error: null,
          });
        },
      };
    },
  };
}

function createProfileInsertBuilder(
  payload: Record<string, unknown>,
): InsertBuilder<ProfileRow> {
  const state = getState();
  const createdProfile: ProfileRow = {
    display_name:
      typeof payload.display_name === "string" && payload.display_name
        ? payload.display_name
        : "Unnamed Vampire",
    id:
      typeof payload.id === "string" && payload.id
        ? payload.id
        : E2E_USER_ID,
  };
  const existingProfileIndex = state.profiles.findIndex(
    (profile) => profile.id === createdProfile.id,
  );

  if (existingProfileIndex >= 0) {
    state.profiles[existingProfileIndex] = createdProfile;
  } else {
    state.profiles.push(createdProfile);
  }

  return {
    select(columns: string) {
      return {
        single() {
          return Promise.resolve({
            data: pickColumns(createdProfile, columns),
            error: null,
          });
        },
      };
    },
  };
}

function createFeedbackSubmissionInsertBuilder(
  payload: Record<string, unknown>,
): InsertBuilder<FeedbackSubmissionRow> {
  const state = getState();
  const createdSubmission: FeedbackSubmissionRow = {
    body: typeof payload.body === "string" ? payload.body : "",
    category:
      (typeof payload.category === "string"
        ? payload.category
        : "friction") as FeedbackSubmissionRow["category"],
    chronicle_id:
      typeof payload.chronicle_id === "string" ? payload.chronicle_id : null,
    created_at: timestamp(),
    id: randomUUID(),
    source: "recap",
    user_id:
      typeof payload.user_id === "string" && payload.user_id
        ? payload.user_id
        : E2E_USER_ID,
  };

  state.feedback_submissions.unshift(createdSubmission);

  return {
    select(columns: string) {
      return {
        single() {
          return Promise.resolve({
            data: pickColumns(createdSubmission, columns),
            error: null,
          });
        },
      };
    },
  };
}

function selectRowsForTable(table: string) {
  const state = getState();

  switch (table) {
    case "archive_events":
      return state.archive_events;
    case "chronicles":
      return state.chronicles;
    case "diaries":
      return state.diaries;
    case "feedback_submissions":
      return state.feedback_submissions;
    case "memory_entries":
      return state.memory_entries;
    case "memories":
      return state.memories;
    case "prompt_catalog":
      return state.prompt_catalog;
    case "prompt_runs":
      return state.prompt_runs;
    case "profiles":
      return state.profiles;
    case "sessions":
      return state.sessions;
    default:
      return [];
  }
}

function applySetupCompletion(args: Record<string, unknown>) {
  const state = getState();
  const chronicle = state.chronicles.find(
    (row) => row.id === args.target_chronicle_id && row.user_id === E2E_USER_ID,
  );

  if (!chronicle) {
    return { data: null, error: { message: "Chronicle not found." } };
  }

  if (chronicle.status !== "draft") {
    return {
      data: null,
      error: { message: "Chronicle setup has already been completed." },
    };
  }

  const now = timestamp();
  const sessionId = randomUUID();
  chronicle.current_prompt_encounter = 1;
  chronicle.current_prompt_number = 1;
  chronicle.current_session_id = sessionId;
  chronicle.last_played_at = now;
  chronicle.mortal_summary = (args.mortal_summary as string) || null;
  chronicle.status = "active";
  chronicle.updated_at = now;
  chronicle.vampire_name =
    ((args.immortal_character as { name?: string } | undefined)?.name as string) ||
    chronicle.vampire_name;

  state.sessions.push({
    chronicle_id: chronicle.id,
    id: sessionId,
    snapshot_json: {
      currentPromptEncounter: 1,
      currentPromptNumber: 1,
    },
    started_at: now,
    status: "in_progress",
  });

  const setupMemories =
    (args.setup_memories as Array<{
      entryText?: string;
      title: string;
    }>) || [];

  setupMemories.forEach((memory, index) => {
    const memoryId = randomUUID();

    state.memories.push({
      chronicle_id: chronicle.id,
      created_at: now,
      diary_id: null,
      forgotten_at: null,
      id: memoryId,
      location: "mind",
      slot_index: index + 1,
      title: memory.title,
      updated_at: now,
    });

    state.memory_entries.push({
      created_at: now,
      entry_text: memory.entryText || "",
      id: randomUUID(),
      memory_id: memoryId,
      position: 1,
      prompt_run_id: null,
    });
  });

  const createdEntities = {
    characters: ((args.initial_characters as unknown[])?.length || 0) + 1,
    memories: setupMemories.length,
    resources: (args.initial_resources as unknown[])?.length || 0,
    skills: (args.initial_skills as unknown[])?.length || 0,
  };

  return {
    data: {
      chronicleId: chronicle.id,
      createdEntities,
      currentPromptNumber: 1,
      nextRoute: `/chronicles/${chronicle.id}/play`,
      sessionId,
    },
    error: null,
  };
}

function applyPromptResolution(args: Record<string, unknown>) {
  const state = getState();
  const chronicle = state.chronicles.find(
    (row) => row.id === args.target_chronicle_id && row.user_id === E2E_USER_ID,
  );

  if (!chronicle) {
    return { data: null, error: { message: "Chronicle not found." } };
  }

  const session = state.sessions.find(
    (row) =>
      row.id === args.target_session_id &&
      row.chronicle_id === args.target_chronicle_id,
  );

  if (!session) {
    return { data: null, error: { message: "Session not found." } };
  }

  if (chronicle.current_session_id !== args.target_session_id) {
    return {
      data: null,
      error: { message: "The active session no longer matches this request." },
    };
  }

  if (session.status !== "in_progress") {
    return createRpcError("Session is not active.");
  }

  const now = timestamp();
  const currentPrompt = getCurrentPrompt(state, chronicle);
  const promptRunId = randomUUID();
  const experienceText =
    typeof args.experience_text === "string" ? args.experience_text : "";
  const playerEntry =
    typeof args.player_entry === "string" ? args.player_entry : "";
  const eventPayload: Array<{ eventType: string; summary: string }> = [
    {
      eventType: "prompt_resolved",
      summary: "The entry has been set into memory.",
    },
  ];
  const memoryDecision =
    (args.memory_decision as
      | {
          memoryId?: string;
          mode?: string;
          targetMemoryId?: string;
        }
      | null) ?? { mode: "create-new" };

  if ((memoryDecision.mode ?? "create-new") === "append-existing") {
    const targetMemory = state.memories.find(
      (memory) =>
        memory.id === memoryDecision.targetMemoryId &&
        memory.chronicle_id === chronicle.id,
    );

    if (!targetMemory) {
      return createRpcError("Choose a memory still held in mind.");
    }

    if (targetMemory.location !== "mind") {
      return createRpcError(
        "Only memories still held in mind can accept new entries.",
      );
    }

    const entries = findMemoryEntries(state, targetMemory.id);

    if (entries.length >= 3) {
      return createRpcError("That memory is already full.");
    }

    state.memory_entries.push({
      created_at: now,
      entry_text: experienceText,
      id: randomUUID(),
      memory_id: targetMemory.id,
      position: entries.length + 1,
      prompt_run_id: promptRunId,
    });
  } else {
    if (countMindMemories(state, chronicle.id) >= 5) {
      const selectedMemory = state.memories.find(
        (memory) =>
          memory.id === memoryDecision.memoryId &&
          memory.chronicle_id === chronicle.id &&
          memory.location === "mind",
      );

      if ((memoryDecision.mode ?? "") === "forget-existing") {
        if (!selectedMemory) {
          return createRpcError("Choose a memory still held in mind.");
        }

        selectedMemory.diary_id = null;
        selectedMemory.forgotten_at = now;
        selectedMemory.location = "forgotten";
        selectedMemory.slot_index = null;
        selectedMemory.updated_at = now;
        eventPayload.push({
          eventType: "memory_forgotten",
          summary: "An old memory has been surrendered to the dark.",
        });
      } else if ((memoryDecision.mode ?? "") === "move-to-diary") {
        if (!selectedMemory) {
          return createRpcError("Choose a memory still held in mind.");
        }

        const { created, diary } = ensureActiveDiary(state, chronicle.id, now);
        const diaryMemoryCount = countDiaryMemories(state, diary.id);

        if (diaryMemoryCount >= diary.memory_capacity) {
          return createRpcError("The diary is already full.");
        }

        if (created) {
          eventPayload.push({
            eventType: "diary_created",
            summary: "A diary has been opened against forgetting.",
          });
        }

        selectedMemory.diary_id = diary.id;
        selectedMemory.location = "diary";
        selectedMemory.slot_index = null;
        selectedMemory.updated_at = now;
        eventPayload.push({
          eventType: "memory_moved_to_diary",
          summary: "A memory has been placed into the diary.",
        });
      } else {
        return createRpcError("A memory decision is required when the mind is full.");
      }
    }

    const availableSlot = nextOpenMindSlot(state, chronicle.id);

    if (availableSlot === null) {
      return createRpcError("No in-mind memory slot is available.");
    }

    const newMemoryId = randomUUID();
    state.memories.push({
      chronicle_id: chronicle.id,
      created_at: now,
      diary_id: null,
      forgotten_at: null,
      id: newMemoryId,
      location: "mind",
      slot_index: availableSlot,
      title: experienceText.slice(0, 80),
      updated_at: now,
    });
    state.memory_entries.push({
      created_at: now,
      entry_text: experienceText,
      id: randomUUID(),
      memory_id: newMemoryId,
      position: 1,
      prompt_run_id: promptRunId,
    });
  }

  state.prompt_runs.push({
    chronicle_id: chronicle.id,
    created_at: now,
    d10_roll: 7,
    d6_roll: 4,
    encounter_index: chronicle.current_prompt_encounter,
    experience_text: experienceText,
    id: promptRunId,
    movement: 3,
    next_prompt_encounter: 1,
    next_prompt_number: 4,
    player_entry: playerEntry,
    prompt_markdown: currentPrompt?.prompt_markdown || "",
    prompt_number: chronicle.current_prompt_number,
    session_id: session.id,
  });
  chronicle.current_prompt_number = 4;
  chronicle.current_prompt_encounter = 1;
  chronicle.last_played_at = now;
  chronicle.updated_at = now;
  session.snapshot_json = {
    ...session.snapshot_json,
    currentPromptEncounter: 1,
    currentPromptNumber: 4,
  };
  appendArchiveEvents(state, chronicle.id, session.id, eventPayload, now);

  return {
    data: {
      archiveEvents: eventPayload,
      nextPrompt: {
        encounterIndex: 1,
        promptNumber: 4,
      },
      promptRunId,
      rolled: {
        d10: 7,
        d6: 4,
        movement: 3,
      },
    },
    error: null,
  };
}

export function isE2EMockMode() {
  return process.env.TYOV_E2E_MOCKS === "1";
}

export function isE2EAuthenticatedCookieValue(value: string | undefined) {
  return value === "1";
}

export function getE2EAuthCookieName() {
  return E2E_AUTH_COOKIE;
}

function isAuthenticatedCookieValue(cookieStore: CookieStoreLike) {
  return isE2EAuthenticatedCookieValue(cookieStore.get(E2E_AUTH_COOKIE)?.value);
}

export function createE2EServerSupabaseClient(cookieStore: CookieStoreLike) {
  return {
    auth: {
      async exchangeCodeForSession() {
        return {
          data: {
            session: null,
            user: isAuthenticatedCookieValue(cookieStore)
              ? {
                  email: "e2e@example.com",
                  id: E2E_USER_ID,
                }
              : null,
          },
          error: null,
        };
      },
      async getUser() {
        return {
          data: {
            user: isAuthenticatedCookieValue(cookieStore)
              ? {
                  email: "e2e@example.com",
                  id: E2E_USER_ID,
                }
              : null,
          },
          error: null,
        };
      },
      async signInWithOtp() {
        return {
          data: {
            session: null,
            user: null,
          },
          error: null,
        };
      },
      async signInWithPassword() {
        cookieStore.set(E2E_AUTH_COOKIE, "1", {
          path: "/",
        });

        return {
          data: {
            session: {
              access_token: "e2e-access-token",
            },
            user: {
              email: "e2e@example.com",
              id: E2E_USER_ID,
            },
          },
          error: null,
        };
      },
    },
    from(table: string) {
      return {
        insert(payload: Record<string, unknown>) {
          if (table === "chronicles") {
            return createChronicleInsertBuilder(payload);
          }

          if (table === "profiles") {
            return createProfileInsertBuilder(payload);
          }

          if (table === "feedback_submissions") {
            return createFeedbackSubmissionInsertBuilder(payload);
          }

          throw new Error(`Unsupported e2e insert table: ${table}`);
        },
        select(columns: string, options?: QueryOptions) {
          return createSelectBuilder(
            () => selectRowsForTable(table) as Record<string, unknown>[],
            columns,
            options,
          );
        },
        update(values: Record<string, unknown>) {
          return createUpdateBuilder(table, values);
        },
        async upsert() {
          if (table === "profiles") {
            return {
              data: null,
              error: null,
            };
          }

          throw new Error(`Unsupported e2e upsert table: ${table}`);
        },
      };
    },
    async rpc(fn: string, args: Record<string, unknown>) {
      if (!isAuthenticatedCookieValue(cookieStore)) {
        return {
          data: null,
          error: { message: "Authentication required" },
        };
      }

      if (fn === "complete_chronicle_setup") {
        return applySetupCompletion(args);
      }

      if (fn === "resolve_prompt_run") {
        return applyPromptResolution(args);
      }

      return {
        data: null,
        error: { message: `Unsupported e2e rpc: ${fn}` },
      };
    },
  };
}
