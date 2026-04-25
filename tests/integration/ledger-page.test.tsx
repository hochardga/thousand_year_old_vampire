import { render, screen, within } from "@testing-library/react";
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
    order(column: string, options?: { ascending?: boolean }) {
      const ascending = options?.ascending ?? true;
      workingRows = [...workingRows].sort((left, right) => {
        const leftValue = left[column];
        const rightValue = right[column];

        if (typeof leftValue === "number" && typeof rightValue === "number") {
          if (leftValue === rightValue) {
            return 0;
          }

          return ascending ? leftValue - rightValue : rightValue - leftValue;
        }

        const leftText = String(leftValue ?? "");
        const rightText = String(rightValue ?? "");

        if (leftText === rightText) {
          return 0;
        }

        return ascending
          ? leftText.localeCompare(rightText)
          : rightText.localeCompare(leftText);
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
            case "characters":
              return createQueryBuilder([
                {
                  chronicle_id: "chronicle-1",
                  description: "Still mortal in memory, though not in time.",
                  id: "character-1",
                  kind: "mortal",
                  name: "Marta",
                  status: "active",
                },
                {
                  chronicle_id: "chronicle-1",
                  description: "The immortal who remade me and vanished.",
                  id: "character-2",
                  kind: "immortal",
                  name: "Aurelia",
                  status: "lost",
                },
              ]);
            case "chronicles":
              return createQueryBuilder([
                {
                  id: "chronicle-1",
                  status: "active",
                  title: "The Long Night",
                },
              ]);
            case "marks":
              return createQueryBuilder([
                {
                  chronicle_id: "chronicle-1",
                  description: "My reflection lags half a breath behind.",
                  id: "mark-1",
                  is_active: false,
                  is_concealed: true,
                  label: "Unsteady Reflection",
                },
              ]);
            case "resources":
              return createQueryBuilder([
                {
                  chronicle_id: "chronicle-1",
                  description: "A marsh house with boarded windows.",
                  id: "resource-1",
                  is_stationary: true,
                  label: "The Marsh House",
                  status: "lost",
                },
              ]);
            case "skills":
              return createQueryBuilder([
                {
                  chronicle_id: "chronicle-1",
                  description: "I know how to listen for danger.",
                  id: "skill-1",
                  label: "Quiet Devotion",
                  sort_order: 0,
                  status: "checked",
                },
                {
                  chronicle_id: "chronicle-1",
                  description: "I can follow the river roads after midnight.",
                  id: "skill-3",
                  label: "Night Navigation",
                  sort_order: 2,
                  status: "active",
                },
                {
                  chronicle_id: "chronicle-1",
                  description: "I no longer trust this hunger.",
                  id: "skill-2",
                  label: "Bloodthirsty",
                  sort_order: 1,
                  status: "lost",
                },
              ]);
            default:
              throw new Error(`Unsupported table in ledger page test: ${table}`);
          }
        },
      };
    },
  };
}

function buildSparseLedgerSupabaseClient() {
  function createErroringSkillsBuilder() {
    const builder = {
      eq() {
        return builder;
      },
      order() {
        return Promise.resolve({
          data: null,
          error: { message: "timeout" },
        });
      },
    };

    return builder;
  }

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
            case "characters":
              return createQueryBuilder([]);
            case "chronicles":
              return createQueryBuilder([
                {
                  id: "chronicle-1",
                  status: "active",
                  title: "The Long Night",
                },
              ]);
            case "marks":
              return createQueryBuilder([]);
            case "resources":
              return createQueryBuilder([]);
            case "skills":
              return createErroringSkillsBuilder();
            default:
              throw new Error(`Unsupported table in ledger page test: ${table}`);
          }
        },
      };
    },
  };
}

describe("ledger page", () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
    redirect.mockClear();
  });

  it("keeps checked, lost, concealed, and active states readable across the four ledger sections", async () => {
    createServerSupabaseClient.mockResolvedValue(buildSupabaseClient());

    const LedgerPage = (
      await import("@/app/(app)/chronicles/[chronicleId]/ledger/page")
    ).default;
    render(
      await LedgerPage({
        params: Promise.resolve({ chronicleId: "chronicle-1" }),
      } as never),
    );

    expect(screen.getByRole("heading", { name: "Skills" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Resources" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Characters" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Marks" })).toBeInTheDocument();
    expect(screen.getByText("Quiet Devotion")).toBeInTheDocument();
    expect(screen.getByText("Night Navigation")).toBeInTheDocument();
    expect(screen.getByText("Checked")).toBeInTheDocument();
    expect(screen.getAllByText("Lost").length).toBeGreaterThan(1);
    expect(screen.getByText("Concealed")).toBeInTheDocument();
    expect(screen.getByText("Dormant")).toBeInTheDocument();
    expect(screen.getByText("Mortal")).toBeInTheDocument();
    expect(screen.getByText("Immortal")).toBeInTheDocument();
    const skillsSection = screen.getByRole("heading", { name: "Skills" }).closest("section");
    expect(skillsSection).not.toBeNull();
    const skillsSectionQueries = within(skillsSection as HTMLElement);
    expect(skillsSectionQueries.getByText("Active")).toBeInTheDocument();
    const skillLabels = skillsSectionQueries
      .getAllByRole("article")
      .map((article) =>
        article.querySelector("p.font-heading")?.textContent ?? null,
      );
    expect(skillLabels).toEqual([
      "Quiet Devotion",
      "Bloodthirsty",
      "Night Navigation",
    ]);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("uses shared alert and empty states across sparse ledger sections", async () => {
    createServerSupabaseClient.mockResolvedValue(buildSparseLedgerSupabaseClient());

    const LedgerPage = (
      await import("@/app/(app)/chronicles/[chronicleId]/ledger/page")
    ).default;
    render(
      await LedgerPage({
        params: Promise.resolve({ chronicleId: "chronicle-1" }),
      } as never),
    );

    expect(
      screen.getByRole("heading", {
        name: "The skill ledger could not be read just now.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "No resources have been entered into the ledger yet.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "No characters have been entered into the ledger yet.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "No marks have been entered into the ledger yet.",
      }),
    ).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
});
