import { describe, expect, it, vi } from "vitest";
import { closeSessionWithRecap } from "@/lib/chronicles/sessionSnapshots";

function createSnapshotClient() {
  const update = vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })),
  }));

  const sessions = [
    {
      chronicle_id: "chronicle-1",
      id: "session-1",
      recap_markdown: null,
      snapshot_json: {},
      status: "in_progress",
    },
  ];

  return {
    from(table: string) {
      return {
        select() {
          switch (table) {
            case "archive_events":
              return {
                eq: () => ({
                  eq: () => ({
                    limit: () => ({
                      order: () =>
                        Promise.resolve({
                          data: [
                            {
                              created_at: "2026-04-21T12:00:00.000Z",
                              event_type: "memory_forgotten",
                              summary:
                                "An old memory has been surrendered to the dark.",
                            },
                          ],
                          error: null,
                        }),
                    }),
                  }),
                }),
              };
            case "chronicles":
              return {
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        current_prompt_encounter: 1,
                        current_prompt_number: 7,
                        id: "chronicle-1",
                        title: "The Long Night",
                      },
                      error: null,
                    }),
                }),
              };
            case "prompt_runs":
              return {
                eq: () => ({
                  eq: () => ({
                    limit: () => ({
                      order: () =>
                        Promise.resolve({
                          data: [
                            {
                              created_at: "2026-04-21T11:00:00.000Z",
                              encounter_index: 1,
                              experience_text:
                                "I kept the chapel smoke in my lungs.",
                              movement: 3,
                              prompt_number: 6,
                            },
                          ],
                          error: null,
                        }),
                    }),
                  }),
                }),
              };
            case "sessions":
              return {
                eq: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: sessions[0],
                        error: null,
                      }),
                  }),
                }),
              };
            default:
              throw new Error(`Unsupported table in snapshot test: ${table}`);
          }
        },
        update,
      };
    },
    updates: update,
  };
}

describe("closeSessionWithRecap", () => {
  it("stores a recap and closes the session with an updated snapshot", async () => {
    const client = createSnapshotClient();

    const result = await closeSessionWithRecap(client as never, {
      chronicleId: "chronicle-1",
      sessionId: "session-1",
    });

    expect(result.recapMarkdown).toContain("The Long Night");
    expect(result.recapMarkdown).toContain("Prompt 6");
    expect(client.updates).toHaveBeenCalledWith(
      expect.objectContaining({
        recap_markdown: expect.stringContaining("The Long Night"),
        snapshot_json: expect.objectContaining({
          currentPromptEncounter: 1,
          currentPromptNumber: 7,
        }),
        status: "closed",
      }),
    );
  });
});
