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

type SkillRow = {
  chronicle_id: string;
  description: string;
  id: string;
  label: string;
  sort_order: number;
  status: "active" | "checked" | "lost";
};

type ResourceRow = {
  chronicle_id: string;
  description: string;
  id: string;
  is_stationary: boolean;
  label: string;
  sort_order: number;
  status: "active" | "checked" | "lost";
};

type MarkRow = {
  chronicle_id: string;
  created_at?: string;
  description: string;
  id: string;
  is_active: boolean;
  is_concealed: boolean;
  label: string;
  sort_order: number;
};

type E2EState = {
  archive_events: ArchiveEventRow[];
  characters: Array<Record<string, unknown>>;
  chronicles: ChronicleRow[];
  diaries: DiaryRow[];
  feedback_submissions: FeedbackSubmissionRow[];
  marks: MarkRow[];
  memory_entries: MemoryEntryRow[];
  memories: MemoryRow[];
  prompt_catalog: PromptCatalogRow[];
  prompt_runs: PromptRunRow[];
  profiles: ProfileRow[];
  resources: ResourceRow[];
  sessions: SessionRow[];
  skills: SkillRow[];
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
  then: <TResult1 = { data: null; error: null }, TResult2 = never>(
    onFulfilled?:
      | ((value: { data: null; error: null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onRejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ) => Promise<TResult1 | TResult2>;
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
  {
    encounter_index: 1,
    prompt_markdown:
      "The centuries press onward. What mortal custom do you fail to recognize, and who notices?",
    prompt_number: 7,
    prompt_version: "base",
  },
  {
    encounter_index: 1,
    prompt_markdown:
      "A new hunger changes the shape of your nights. What do you take that you once would have spared?",
    prompt_number: 10,
    prompt_version: "base",
  },
  {
    encounter_index: 1,
    prompt_markdown:
      "Someone remembers you incorrectly. What false story do they tell, and why does it endure?",
    prompt_number: 13,
    prompt_version: "base",
  },
  {
    encounter_index: 1,
    prompt_markdown:
      "A refuge fails you. What sign tells you it is no longer safe?",
    prompt_number: 16,
    prompt_version: "base",
  },
  {
    encounter_index: 1,
    prompt_markdown:
      "You lose track of a mortal custom. Who corrects you, and what do you do with the shame?",
    prompt_number: 19,
    prompt_version: "base",
  },
  {
    encounter_index: 1,
    prompt_markdown:
      "An old debt returns wearing a new face. What do you still owe?",
    prompt_number: 22,
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

function splitSelectColumns(columns: string) {
  const result: string[] = [];
  let current = "";
  let depth = 0;

  for (const character of columns) {
    if (character === "(") {
      depth += 1;
    }

    if (character === ")") {
      depth = Math.max(0, depth - 1);
    }

    if (character === "," && depth === 0) {
      if (current.trim()) {
        result.push(current.trim());
      }

      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

function pickMemoryEntries(memoryId: unknown, columns: string) {
  if (typeof memoryId !== "string") {
    return [];
  }

  return getState().memory_entries
    .filter((entry) => entry.memory_id === memoryId)
    .sort((left, right) => left.position - right.position)
    .map((entry) => pickColumns(entry as unknown as Record<string, unknown>, columns));
}

function pickColumns<T extends Record<string, unknown>>(row: T, columns: string) {
  if (columns === "*" || !columns.trim()) {
    return row;
  }

  const selected = splitSelectColumns(columns);

  return selected.reduce<Record<string, unknown>>((result, column) => {
    const nestedMatch = column.match(/^([a-z_]+)\((.*)\)$/);

    if (nestedMatch?.[1] === "memory_entries") {
      result.memory_entries = pickMemoryEntries(row.id, nestedMatch[2]);
      return result;
    }

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

function nextSkillSortOrder(state: E2EState, chronicleId: string) {
  return (
    state.skills.reduce((highestSortOrder, skill) => {
      if (skill.chronicle_id !== chronicleId) {
        return highestSortOrder;
      }

      return Math.max(highestSortOrder, skill.sort_order);
    }, -1) + 1
  );
}

function nextResourceSortOrder(state: E2EState, chronicleId: string) {
  return (
    state.resources.reduce((highestSortOrder, resource) => {
      if (resource.chronicle_id !== chronicleId) {
        return highestSortOrder;
      }

      return Math.max(highestSortOrder, resource.sort_order);
    }, -1) + 1
  );
}

function nextMarkSortOrder(state: E2EState, chronicleId: string) {
  return (
    state.marks.reduce((highestSortOrder, mark) => {
      if (mark.chronicle_id !== chronicleId) {
        return highestSortOrder;
      }

      return Math.max(highestSortOrder, mark.sort_order);
    }, -1) + 1
  );
}

function nextCharacterSortOrder(state: E2EState, chronicleId: string) {
  return (
    state.characters.reduce((highestSortOrder, character) => {
      if (character.chronicle_id !== chronicleId) {
        return highestSortOrder;
      }

      return Math.max(
        highestSortOrder,
        typeof character.sort_order === "number" ? character.sort_order : -1,
      );
    }, -1) + 1
  );
}

function normalizeSkillText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeResourceText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCharacterText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMarkText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

function findNextPromptPosition(
  state: E2EState,
  chronicle: ChronicleRow,
  movement: number,
): { encounterIndex: number; promptNumber: number } | null {
  let candidatePromptNumber = Math.max(
    1,
    chronicle.current_prompt_number + movement,
  );

  while (candidatePromptNumber <= 500) {
    const existingEncounters = state.prompt_runs
      .filter(
        (run) =>
          run.chronicle_id === chronicle.id &&
          run.prompt_number === candidatePromptNumber,
      )
      .map((run) => run.encounter_index);
    const minimumEncounter =
      candidatePromptNumber === chronicle.current_prompt_number
        ? chronicle.current_prompt_encounter
        : 0;
    const encounterIndex =
      Math.max(minimumEncounter, 0, ...existingEncounters) + 1;
    const prompt = state.prompt_catalog.find(
      (row) =>
        row.prompt_number === candidatePromptNumber &&
        row.encounter_index === encounterIndex &&
        row.prompt_version === chronicle.prompt_version,
    );

    if (prompt) {
      return {
        encounterIndex,
        promptNumber: candidatePromptNumber,
      };
    }

    candidatePromptNumber += 1;
  }

  return null;
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

function createInsertBuilder<T>(
  row: Partial<T> | null,
): InsertBuilder<T> {
  const result = {
    data: null,
    error: null,
  };

  return {
    select(columns: string) {
      return {
        single() {
          return Promise.resolve({
            data: row
              ? (pickColumns(
                  row as Record<string, unknown>,
                  columns,
                ) as Partial<T>)
              : null,
            error: null,
          });
        },
      };
    },
    then(onFulfilled, onRejected) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };
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

  return createInsertBuilder(createdChronicle);
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

  return createInsertBuilder(createdProfile);
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

  return createInsertBuilder(createdSubmission);
}

function createArchiveEventInsertBuilder(
  payload: Record<string, unknown>,
): InsertBuilder<ArchiveEventRow> {
  const state = getState();
  const createdEvent: ArchiveEventRow = {
    chronicle_id: String(payload.chronicle_id),
    created_at: timestamp(),
    event_type: String(payload.event_type),
    id: randomUUID(),
    metadata:
      payload.metadata && typeof payload.metadata === "object"
        ? (payload.metadata as Record<string, unknown>)
        : {},
    session_id: typeof payload.session_id === "string" ? payload.session_id : null,
    summary: String(payload.summary),
  };

  state.archive_events.push(createdEvent);

  return createInsertBuilder(createdEvent);
}

function selectRowsForTable(table: string) {
  const state = getState();

  switch (table) {
    case "archive_events":
      return state.archive_events;
    case "characters":
      return state.characters;
    case "chronicles":
      return state.chronicles;
    case "diaries":
      return state.diaries;
    case "feedback_submissions":
      return state.feedback_submissions;
    case "marks":
      return state.marks;
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
    case "resources":
      return state.resources;
    case "sessions":
      return state.sessions;
    case "skills":
      return state.skills;
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
  const initialSkills =
    (args.initial_skills as Array<{
      description?: string;
      label?: string;
    }>) || [];
  const initialResources =
    (args.initial_resources as Array<{
      description?: string;
      isStationary?: boolean;
      label?: string;
    }>) || [];
  const initialCharacters =
    (args.initial_characters as Array<{
      description?: string;
      kind?: "mortal" | "immortal";
      name?: string;
    }>) || [];
  const immortalCharacter =
    (args.immortal_character as
      | {
          description?: string;
          kind?: "mortal" | "immortal";
          name?: string;
        }
      | undefined) ?? {};
  const mark =
    (args.mark as
      | {
          description?: string;
          isConcealed?: boolean;
          label?: string;
        }
      | undefined) ?? {};

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

  initialSkills.forEach((skill, index) => {
    const label = normalizeSkillText(skill.label);

    if (!label) {
      return;
    }

    state.skills.push({
      chronicle_id: chronicle.id,
      description: normalizeSkillText(skill.description),
      id: randomUUID(),
      label,
      sort_order: index,
      status: "active",
    });
  });

  initialResources.forEach((resource, index) => {
    const label = normalizeResourceText(resource.label);

    if (!label) {
      return;
    }

    state.resources.push({
      chronicle_id: chronicle.id,
      description: normalizeResourceText(resource.description),
      id: randomUUID(),
      is_stationary: Boolean(resource.isStationary),
      label,
      sort_order: index,
      status: "active",
    });
  });

  initialCharacters.forEach((character) => {
    const name = normalizeCharacterText(character.name);

    if (!name) {
      return;
    }

    state.characters.push({
      chronicle_id: chronicle.id,
      description: normalizeCharacterText(character.description),
      id: randomUUID(),
      introduced_at: now,
      kind: character.kind ?? "mortal",
      name,
      sort_order: nextCharacterSortOrder(state, chronicle.id),
      status: "active",
    });
  });

  const immortalName = normalizeCharacterText(immortalCharacter.name);

  if (immortalName) {
    state.characters.push({
      chronicle_id: chronicle.id,
      description: normalizeCharacterText(immortalCharacter.description),
      id: randomUUID(),
      introduced_at: now,
      kind: immortalCharacter.kind ?? "immortal",
      name: immortalName,
      sort_order: nextCharacterSortOrder(state, chronicle.id),
      status: "active",
    });
  }

  const markLabel = normalizeMarkText(mark.label);

  if (markLabel) {
    state.marks.push({
      chronicle_id: chronicle.id,
      created_at: now,
      description: normalizeMarkText(mark.description),
      id: randomUUID(),
      is_active: true,
      is_concealed: Boolean(mark.isConcealed),
      label: markLabel,
      sort_order: nextMarkSortOrder(state, chronicle.id),
    });
  }

  const createdEntities = {
    characters: state.characters.filter(
      (character) => character.chronicle_id === chronicle.id,
    ).length,
    memories: setupMemories.length,
    resources: state.resources.filter(
      (resource) => resource.chronicle_id === chronicle.id,
    ).length,
    skills: state.skills.filter((skill) => skill.chronicle_id === chronicle.id).length,
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
  const rolled = {
    d10: 7,
    d6: 4,
    movement: 3,
  };
  const nextPrompt = findNextPromptPosition(state, chronicle, rolled.movement);

  if (!nextPrompt) {
    return createRpcError("No next prompt is available in the prompt catalog.");
  }

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
  const rawNewSkill =
    args.new_skill && typeof args.new_skill === "object"
      ? (args.new_skill as Record<string, unknown>)
      : null;
  const rawNewResource =
    args.new_resource && typeof args.new_resource === "object"
      ? (args.new_resource as Record<string, unknown>)
      : null;
  const rawNewMark =
    args.new_mark && typeof args.new_mark === "object"
      ? (args.new_mark as Record<string, unknown>)
      : null;
  const rawNewCharacter =
    args.new_character && typeof args.new_character === "object"
      ? (args.new_character as Record<string, unknown>)
      : null;
  const rawTraitMutations =
    args.trait_mutations && typeof args.trait_mutations === "object"
      ? (args.trait_mutations as Record<string, unknown>)
      : {};
  const newSkill = rawNewSkill
    ? {
        description: normalizeSkillText(rawNewSkill.description),
        label: normalizeSkillText(rawNewSkill.label),
      }
    : null;
  const newResource = rawNewResource
    ? {
        description: normalizeResourceText(rawNewResource.description),
        isStationary: Boolean(rawNewResource.isStationary),
        label: normalizeResourceText(rawNewResource.label),
      }
    : null;
  const newMark = rawNewMark
    ? {
        description: normalizeMarkText(rawNewMark.description),
        isConcealed: Boolean(rawNewMark.isConcealed),
        label: normalizeMarkText(rawNewMark.label),
      }
    : null;
  const newCharacter = rawNewCharacter
    ? {
        description: normalizeCharacterText(rawNewCharacter.description),
        kind:
          rawNewCharacter.kind === "immortal" ? "immortal" : ("mortal" as const),
        name: normalizeCharacterText(rawNewCharacter.name),
      }
    : null;
  const skillMutations = Array.isArray(rawTraitMutations.skills)
    ? (rawTraitMutations.skills as Array<Record<string, unknown>>)
    : [];
  const resourceMutations = Array.isArray(rawTraitMutations.resources)
    ? (rawTraitMutations.resources as Array<Record<string, unknown>>)
    : [];

  if (newSkill && !newSkill.label) {
    return createRpcError("A skill name is required.");
  }

  if (newSkill && !newSkill.description) {
    return createRpcError("A skill description is required.");
  }

  if (
    newSkill &&
    state.skills.some(
      (skill) =>
        skill.chronicle_id === chronicle.id &&
        normalizeSkillText(skill.label) === newSkill.label,
    )
  ) {
    return createRpcError("A skill with this name already exists.");
  }

  if (newResource && !newResource.label) {
    return createRpcError("A resource name is required.");
  }

  if (newResource && !newResource.description) {
    return createRpcError("A resource description is required.");
  }

  if (
    newResource &&
    state.resources.some(
      (resource) =>
        resource.chronicle_id === chronicle.id &&
        normalizeResourceText(resource.label) === newResource.label,
    )
  ) {
    return createRpcError("A resource with this name already exists.");
  }

  if (newMark && !newMark.label) {
    return createRpcError("A mark name is required.");
  }

  if (newMark && !newMark.description) {
    return createRpcError("A mark description is required.");
  }

  if (
    newMark &&
    state.marks.some(
      (mark) =>
        mark.chronicle_id === chronicle.id &&
        normalizeMarkText(mark.label) === newMark.label,
    )
  ) {
    return createRpcError("A mark with this name already exists.");
  }

  if (newCharacter && !newCharacter.name) {
    return createRpcError("A character name is required.");
  }

  if (newCharacter && !newCharacter.description) {
    return createRpcError("A character description is required.");
  }

  if (
    newCharacter &&
    state.characters.some(
      (character) =>
        character.chronicle_id === chronicle.id &&
        normalizeCharacterText(character.name) === newCharacter.name,
    )
  ) {
    return createRpcError("A character with this name already exists.");
  }

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

  for (const mutation of skillMutations) {
    const targetSkill = state.skills.find(
      (skillRow) =>
        skillRow.id === mutation.id &&
        skillRow.chronicle_id === chronicle.id,
    );

    if (targetSkill && mutation.action === "check") {
      targetSkill.status = "checked";
    }

    if (targetSkill && mutation.action === "lose") {
      targetSkill.status = "lost";
    }
  }

  for (const mutation of resourceMutations) {
    const targetResource = state.resources.find(
      (resourceRow) =>
        resourceRow.id === mutation.id &&
        resourceRow.chronicle_id === chronicle.id,
    );

    if (targetResource && mutation.action === "lose") {
      targetResource.status = "lost";
    }
  }

  if (newSkill) {
    state.skills.push({
      chronicle_id: chronicle.id,
      description: newSkill.description,
      id: randomUUID(),
      label: newSkill.label,
      sort_order: nextSkillSortOrder(state, chronicle.id),
      status: "active",
    });
  }

  if (newResource) {
    state.resources.push({
      chronicle_id: chronicle.id,
      description: newResource.description,
      id: randomUUID(),
      is_stationary: newResource.isStationary,
      label: newResource.label,
      sort_order: nextResourceSortOrder(state, chronicle.id),
      status: "active",
    });
  }

  if (newMark) {
    state.marks.push({
      chronicle_id: chronicle.id,
      created_at: now,
      description: newMark.description,
      id: randomUUID(),
      is_active: true,
      is_concealed: newMark.isConcealed,
      label: newMark.label,
      sort_order: nextMarkSortOrder(state, chronicle.id),
    });
  }

  if (newCharacter) {
    state.characters.push({
      chronicle_id: chronicle.id,
      description: newCharacter.description,
      id: randomUUID(),
      introduced_at: now,
      kind: newCharacter.kind,
      name: newCharacter.name,
      retired_at: null,
      sort_order: nextCharacterSortOrder(state, chronicle.id),
      status: "active",
    });
  }

  state.prompt_runs.push({
    chronicle_id: chronicle.id,
    created_at: now,
    d10_roll: rolled.d10,
    d6_roll: rolled.d6,
    encounter_index: chronicle.current_prompt_encounter,
    experience_text: experienceText,
    id: promptRunId,
    movement: rolled.movement,
    next_prompt_encounter: nextPrompt.encounterIndex,
    next_prompt_number: nextPrompt.promptNumber,
    player_entry: playerEntry,
    prompt_markdown: currentPrompt?.prompt_markdown || "",
    prompt_number: chronicle.current_prompt_number,
    session_id: session.id,
  });
  chronicle.current_prompt_number = nextPrompt.promptNumber;
  chronicle.current_prompt_encounter = nextPrompt.encounterIndex;
  chronicle.last_played_at = now;
  chronicle.updated_at = now;
  session.snapshot_json = {
    ...session.snapshot_json,
    currentPromptEncounter: nextPrompt.encounterIndex,
    currentPromptNumber: nextPrompt.promptNumber,
  };
  appendArchiveEvents(state, chronicle.id, session.id, eventPayload, now);

  return {
    data: {
      archiveEvents: eventPayload,
      nextPrompt: {
        encounterIndex: nextPrompt.encounterIndex,
        promptNumber: nextPrompt.promptNumber,
      },
      promptRunId,
      rolled,
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

          if (table === "archive_events") {
            return createArchiveEventInsertBuilder(payload);
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
