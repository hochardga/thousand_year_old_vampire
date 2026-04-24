import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() =>
  vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

type QueryRow = Record<string, unknown>;

function createQueryBuilder(rows: QueryRow[]) {
  let workingRows = [...rows];

  const builder = {
    eq(column: string, value: string) {
      workingRows = workingRows.filter((row) => row[column] === value);
      return builder;
    },
    lt(column: string, value: string) {
      workingRows = workingRows.filter((row) => String(row[column]) < value);
      return builder;
    },
    limit(count: number) {
      return Promise.resolve({
        data: workingRows.slice(0, count),
        error: null,
      });
    },
    maybeSingle() {
      return Promise.resolve({
        data: workingRows[0] ?? null,
        error: null,
      });
    },
    order(column: string, options?: { ascending?: boolean }) {
      const ascending = options?.ascending ?? true;
      workingRows = [...workingRows].sort((left, right) => {
        const leftValue = String(left[column] ?? "");
        const rightValue = String(right[column] ?? "");

        if (leftValue === rightValue) {
          return 0;
        }

        return ascending
          ? leftValue.localeCompare(rightValue)
          : rightValue.localeCompare(leftValue);
      });

      return builder;
    },
    single() {
      return Promise.resolve({
        data: workingRows[0] ?? null,
        error: workingRows[0] ? null : { message: "Not found" },
      });
    },
    then<TResult1 = unknown, TResult2 = never>(
      onFulfilled?:
        | ((value: { data: QueryRow[]; error: null }) => TResult1 | PromiseLike<TResult1>)
        | null,
      onRejected?:
        | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
        | null,
    ) {
      return Promise.resolve({
        data: workingRows,
        error: null,
      }).then(onFulfilled, onRejected);
    },
  };

  return builder;
}

function buildSupabaseClient() {
  const promptRuns = Array.from({ length: 7 }, (_, index) => ({
    chronicle_id: "chronicle-1",
    created_at: `2026-04-${String(21 - index).padStart(2, "0")}T12:00:00.000Z`,
    encounter_index: 1,
    experience_text: `Experience ${index + 1}`,
    id: `run-${index + 1}`,
    movement: index + 1,
    player_entry: `Entry ${index + 1}`,
    prompt_number: index + 1,
  }));
  const archiveEvents = Array.from({ length: 7 }, (_, index) => ({
    chronicle_id: "chronicle-1",
    created_at: `2026-04-${String(21 - index).padStart(2, "0")}T16:00:00.000Z`,
    event_type: index === 0 ? "prompt_resolved" : "memory_forgotten",
    id: `event-${index + 1}`,
    summary: `Archive event ${index + 1}`,
  }));
  const memories = [
    {
      chronicle_id: "chronicle-1",
      id: "memory-1",
      location: "mind",
      memory_entries: [
        {
          created_at: "2026-04-20T10:00:00.000Z",
          entry_text: "A bell tolling under snow.",
          id: "entry-1",
          position: 1,
        },
      ],
      slot_index: 1,
      title: "Winter bells",
    },
    {
      chronicle_id: "chronicle-1",
      id: "memory-2",
      location: "forgotten",
      memory_entries: [
        {
          created_at: "2026-04-19T10:00:00.000Z",
          entry_text: "A face I can no longer name.",
          id: "entry-2",
          position: 1,
        },
      ],
      slot_index: null,
      title: "The nameless face",
    },
    {
      chronicle_id: "chronicle-1",
      id: "memory-3",
      location: "diary",
      diary_id: "diary-1",
      memory_entries: [
        {
          created_at: "2026-04-18T10:00:00.000Z",
          entry_text: "Pressed between the diary pages.",
          id: "entry-3",
          position: 1,
        },
      ],
      slot_index: null,
      title: "Diary-kept vow",
    },
    {
      chronicle_id: "chronicle-1",
      id: "memory-4",
      location: "diary",
      diary_id: "diary-2",
      memory_entries: [
        {
          created_at: "2026-04-17T10:00:00.000Z",
          entry_text: "Another diary-bound memory from elsewhere.",
          id: "entry-4",
          position: 1,
        },
      ],
      slot_index: null,
      title: "Elsewhere bound memory",
    },
  ];
  const diaries = [
    {
      chronicle_id: "chronicle-1",
      id: "diary-1",
      memory_capacity: 4,
      status: "active",
      title: "The Diary",
    },
  ];

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "user-1",
          },
        },
      }),
    },
    from(table: string) {
      return {
        select() {
          switch (table) {
            case "archive_events":
              return createQueryBuilder(archiveEvents);
            case "chronicles":
              return createQueryBuilder([
                {
                  current_prompt_encounter: 1,
                  current_prompt_number: 7,
                  id: "chronicle-1",
                  status: "active",
                  title: "The Long Night",
                },
              ]);
            case "diaries":
              return createQueryBuilder(diaries);
            case "memories":
              return createQueryBuilder(memories);
            case "prompt_runs":
              return createQueryBuilder(promptRuns);
            default:
              throw new Error(`Unsupported table in archive page test: ${table}`);
          }
        },
      };
    },
  };
}

function buildEmptyArchiveSupabaseClient() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "user-1",
          },
        },
      }),
    },
    from(table: string) {
      return {
        select() {
          switch (table) {
            case "archive_events":
              return createQueryBuilder([]);
            case "chronicles":
              return createQueryBuilder([
                {
                  current_prompt_encounter: 1,
                  current_prompt_number: 7,
                  id: "chronicle-1",
                  status: "active",
                  title: "The Long Night",
                },
              ]);
            case "diaries":
              return createQueryBuilder([]);
            case "memories":
              return createQueryBuilder([]);
            case "prompt_runs":
              return createQueryBuilder([]);
            default:
              throw new Error(`Unsupported table in archive page test: ${table}`);
          }
        },
      };
    },
  };
}

describe("archive page", () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
    redirect.mockClear();
  });

  it("renders the archive sections in order and exposes pagination links for longer chronicle history", async () => {
    createServerSupabaseClient.mockResolvedValue(buildSupabaseClient());

    const ArchivePage = (
      await import("@/app/(app)/chronicles/[chronicleId]/archive/page")
    ).default;
    const view = render(
      await ArchivePage({
        params: Promise.resolve({ chronicleId: "chronicle-1" }),
        searchParams: Promise.resolve({}),
      } as never),
    );
    const content = view.container.textContent ?? "";

    expect(content.indexOf("Memory stack")).toBeGreaterThan(-1);
    expect(content.indexOf("Diary")).toBeGreaterThan(content.indexOf("Memory stack"));
    expect(content.indexOf("Prompt history")).toBeGreaterThan(
      content.indexOf("Diary"),
    );
    expect(content.indexOf("Event timeline")).toBeGreaterThan(
      content.indexOf("Prompt history"),
    );
    expect(content.indexOf("Prompt 1")).toBeGreaterThan(-1);
    expect(content.indexOf("Prompt 2")).toBeGreaterThan(
      content.indexOf("Prompt 1"),
    );
    expect(screen.getByText("Winter bells")).toBeInTheDocument();
    expect(screen.getByText("Diary-kept vow")).toBeInTheDocument();
    expect(screen.getByText("Elsewhere bound memory")).toBeInTheDocument();
    expect(
      screen.getByText("1 of 4 memories sheltered here."),
    ).toBeInTheDocument();
    expect(screen.getByText("Archive event 1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read older prompt entries" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read older timeline entries" }),
    ).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("uses the shared empty state when the event timeline has not gathered any echoes yet", async () => {
    createServerSupabaseClient.mockResolvedValue(buildEmptyArchiveSupabaseClient());

    const ArchivePage = (
      await import("@/app/(app)/chronicles/[chronicleId]/archive/page")
    ).default;
    render(
      await ArchivePage({
        params: Promise.resolve({ chronicleId: "chronicle-1" }),
        searchParams: Promise.resolve({}),
      } as never),
    );

    expect(
      screen.getByRole("heading", {
        name: "The archive timeline is quiet for now.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Events will gather here as the chronicle lengthens."),
    ).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
});
