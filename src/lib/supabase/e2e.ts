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
  id: string;
  location: "mind" | "diary" | "forgotten";
  slot_index: number | null;
  title: string;
};

type DiaryRow = {
  chronicle_id: string;
  id: string;
  status: "active" | "lost";
  title: string;
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

type E2EState = {
  characters: Array<Record<string, unknown>>;
  chronicles: ChronicleRow[];
  diaries: DiaryRow[];
  marks: Array<Record<string, unknown>>;
  memories: MemoryRow[];
  prompt_catalog: PromptCatalogRow[];
  prompt_runs: Array<Record<string, unknown>>;
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

type SelectBuilder<T extends Record<string, unknown>> = {
  eq: (column: string, value: number | string) => SelectBuilder<T>;
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

function getState() {
  const globalWithState = globalThis as typeof globalThis & {
    __tyovE2EState?: E2EState;
  };

  if (!globalWithState.__tyovE2EState) {
    globalWithState.__tyovE2EState = {
      characters: [],
      chronicles: [],
      diaries: [],
      marks: [],
      memories: [],
      prompt_catalog: [...promptCatalogSeed],
      prompt_runs: [],
      profiles: [],
      resources: [],
      sessions: [],
      skills: [],
    };
  }

  return globalWithState.__tyovE2EState;
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
    filters.every((filter) => row[filter.column] === filter.value),
  );
}

function createSelectBuilder<T extends Record<string, unknown>>(
  rowsFactory: () => T[],
  columns: string,
  options?: QueryOptions,
) {
  const filters: Filter[] = [];
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
      filters.push({ column, value });
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

function createChronicleInsertBuilder(
  payload: Partial<ChronicleRow>,
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
    title: payload.title || "Chronicle begun in test mode",
    updated_at: timestamp(),
    user_id: payload.user_id || E2E_USER_ID,
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
  payload: Partial<ProfileRow>,
): InsertBuilder<ProfileRow> {
  const state = getState();
  const createdProfile: ProfileRow = {
    display_name: payload.display_name || "Unnamed Vampire",
    id: payload.id || E2E_USER_ID,
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

function selectRowsForTable(table: string) {
  const state = getState();

  switch (table) {
    case "chronicles":
      return state.chronicles;
    case "diaries":
      return state.diaries;
    case "memories":
      return state.memories;
    case "prompt_catalog":
      return state.prompt_catalog;
    case "profiles":
      return state.profiles;
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

  const setupMemories = (args.setup_memories as Array<{
    title: string;
  }>) || [];

  setupMemories.forEach((memory, index) => {
    state.memories.push({
      chronicle_id: chronicle.id,
      id: randomUUID(),
      location: "mind",
      slot_index: index + 1,
      title: memory.title,
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
    return {
      data: null,
      error: { message: "Session is not active." },
    };
  }

  chronicle.current_prompt_number = 4;
  chronicle.current_prompt_encounter = 1;
  chronicle.last_played_at = timestamp();
  chronicle.updated_at = timestamp();

  return {
    data: {
      archiveEvents: [
        {
          eventType: "prompt_resolved",
          summary: "The entry has been set into memory.",
        },
      ],
      nextPrompt: {
        encounterIndex: 1,
        promptNumber: 4,
      },
      promptRunId: randomUUID(),
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
        insert(payload: Partial<ChronicleRow>) {
          if (table === "chronicles") {
            return createChronicleInsertBuilder(payload);
          }

          if (table === "profiles") {
            return createProfileInsertBuilder(payload as Partial<ProfileRow>);
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
