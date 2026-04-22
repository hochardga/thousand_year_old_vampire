import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());
const refreshSessionSnapshot = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() =>
  vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

vi.mock("@/lib/chronicles/sessionSnapshots", () => ({
  refreshSessionSnapshot,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

describe("recap page", () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
    refreshSessionSnapshot.mockReset();
    redirect.mockClear();
  });

  it("renders recap prose, recent archive changes, and a direct resume path back into play", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from(table: string) {
        return {
          select() {
            if (table === "archive_events") {
              return {
                eq: () => ({
                  limit: () => ({
                    order: () =>
                      Promise.resolve({
                        data: [
                          {
                            created_at: "2026-04-21T12:00:00.000Z",
                            event_type: "memory_forgotten",
                            id: "event-1",
                            summary:
                              "An old memory has been surrendered to the dark.",
                          },
                        ],
                        error: null,
                      }),
                  }),
                }),
              };
            }

            if (table === "chronicles") {
              return {
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        current_prompt_encounter: 1,
                        current_prompt_number: 7,
                        current_session_id: "session-1",
                        id: "chronicle-1",
                        status: "active",
                        title: "The Long Night",
                      },
                      error: null,
                    }),
                }),
              };
            }

            return {
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        recap_markdown:
                          "The Long Night waits at prompt 7.1 with the chapel smoke still in its lungs.",
                      },
                      error: null,
                    }),
                }),
              }),
            };
          },
        };
      },
    });

    const RecapPage = (
      await import("@/app/(app)/chronicles/[chronicleId]/recap/page")
    ).default;
    const view = await RecapPage({
      params: Promise.resolve({ chronicleId: "chronicle-1" }),
    } as never);

    render(view);

    expect(
      screen.getByRole("heading", { name: "The Long Night" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The Long Night waits at prompt 7.1 with the chapel smoke still in its lungs.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("An old memory has been surrendered to the dark."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Resume the current prompt" }),
    ).toHaveAttribute("href", "/chronicles/chronicle-1/play");
    expect(refreshSessionSnapshot).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("uses the shared empty state when no recent archive echoes are available", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from(table: string) {
        return {
          select() {
            if (table === "archive_events") {
              return {
                eq: () => ({
                  limit: () => ({
                    order: () =>
                      Promise.resolve({
                        data: [],
                        error: null,
                      }),
                  }),
                }),
              };
            }

            if (table === "chronicles") {
              return {
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        current_prompt_encounter: 1,
                        current_prompt_number: 7,
                        current_session_id: "session-1",
                        id: "chronicle-1",
                        status: "active",
                        title: "The Long Night",
                      },
                      error: null,
                    }),
                }),
              };
            }

            return {
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        recap_markdown:
                          "The Long Night waits at prompt 7.1 with the chapel smoke still in its lungs.",
                      },
                      error: null,
                    }),
                }),
              }),
            };
          },
        };
      },
    });

    const RecapPage = (
      await import("@/app/(app)/chronicles/[chronicleId]/recap/page")
    ).default;
    const view = await RecapPage({
      params: Promise.resolve({ chronicleId: "chronicle-1" }),
    } as never);

    render(view);

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
