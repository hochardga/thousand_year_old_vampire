import { beforeEach, describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());
const refreshSessionSnapshot = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

vi.mock("@/lib/chronicles/sessionSnapshots", () => ({
  refreshSessionSnapshot,
}));

describe("recap route", () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
    refreshSessionSnapshot.mockReset();
  });

  it("returns stored recap data when it already exists for the current session", async () => {
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
                        current_prompt_number: 7,
                        current_session_id: "session-1",
                        id: "chronicle-1",
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

    const { GET } = await import("@/app/api/chronicles/[chronicleId]/recap/route");
    const response = await GET(
      new Request("http://localhost/api/chronicles/chronicle-1/recap"),
      {
        params: Promise.resolve({ chronicleId: "chronicle-1" }),
      } as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      currentPromptNumber: 7,
      latestEvents: [
        expect.objectContaining({
          summary: "An old memory has been surrendered to the dark.",
        }),
      ],
      recapMarkdown:
        "The Long Night waits at prompt 7.1 with the chapel smoke still in its lungs.",
    });
    expect(refreshSessionSnapshot).not.toHaveBeenCalled();
  });
});
