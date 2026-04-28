import { beforeEach, describe, expect, it, vi } from "vitest";

const closeSessionWithRecap = vi.hoisted(() => vi.fn());
const createServerSupabaseClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/chronicles/sessionSnapshots", () => ({
  closeSessionWithRecap,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

const chronicleId = "11111111-1111-4111-8111-111111111111";

type SkillRow = {
  description: string;
  id: string;
  label: string;
  status: "active" | "checked" | "lost";
};

type ResourceRow = {
  description: string;
  id: string;
  is_stationary: boolean;
  label: string;
  status: "active" | "checked" | "lost";
};

function selectRows(rows: Array<Record<string, unknown>>) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: rows,
          error: null,
        }),
      }),
    }),
  };
}

function mockEndRouteClient(args: {
  resources: ResourceRow[];
  skills: SkillRow[];
}) {
  const archiveInsert = vi.fn().mockResolvedValue({ error: null });
  const updateChronicleEq = vi.fn().mockResolvedValue({ error: null });
  const updateChronicle = vi.fn().mockReturnValue({
    eq: updateChronicleEq,
  });

  createServerSupabaseClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
      }),
    },
    from(table: string) {
      if (table === "chronicles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    current_session_id: "session-1",
                    id: chronicleId,
                    status: "active",
                  },
                  error: null,
                }),
              }),
            }),
          }),
          update: updateChronicle,
        };
      }

      if (table === "skills") {
        return selectRows(args.skills);
      }

      if (table === "resources") {
        return selectRows(args.resources);
      }

      if (table === "archive_events") {
        return {
          insert: archiveInsert,
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  });

  return {
    archiveInsert,
    updateChronicle,
    updateChronicleEq,
  };
}

async function postEndRoute() {
  const { POST } = await import(
    "@/app/api/chronicles/[chronicleId]/play/end/route"
  );

  return POST(
    new Request(`http://localhost/api/chronicles/${chronicleId}/play/end`, {
      body: JSON.stringify({
        narration: "The prompt tries to end me before my ledger is spent.",
        requiredAction: "check-skill",
      }),
      method: "POST",
    }),
    {
      params: Promise.resolve({
        chronicleId,
      }),
    },
  );
}

describe("play end route", () => {
  beforeEach(() => {
    closeSessionWithRecap.mockReset();
    createServerSupabaseClient.mockReset();
  });

  it("rejects chronicle completion while the required Skill/Resource action still has legal choices", async () => {
    const { archiveInsert, updateChronicle } = mockEndRouteClient({
      resources: [
        {
          description: "A safe house in the marsh.",
          id: "resource-1",
          is_stationary: true,
          label: "The Marsh House",
          status: "active",
        },
      ],
      skills: [
        {
          description: "I can wait without being seen.",
          id: "skill-1",
          label: "Quiet Devotion",
          status: "active",
        },
      ],
    });

    const response = await postEndRoute();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      details: [
        {
          message: "This Skill/Resource requirement still has legal choices.",
          path: "requiredAction",
        },
      ],
      error: "Validation failed",
    });
    expect(archiveInsert).not.toHaveBeenCalled();
    expect(closeSessionWithRecap).not.toHaveBeenCalled();
    expect(updateChronicle).not.toHaveBeenCalled();
  });

  it("completes the chronicle when no Skill or Resource can satisfy the required action", async () => {
    const { archiveInsert, updateChronicle, updateChronicleEq } =
      mockEndRouteClient({
        resources: [
          {
            description: "A safe house already gone.",
            id: "resource-1",
            is_stationary: true,
            label: "The Marsh House",
            status: "lost",
          },
        ],
        skills: [
          {
            description: "A talent already spent.",
            id: "skill-1",
            label: "Quiet Devotion",
            status: "checked",
          },
        ],
      });

    const response = await postEndRoute();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      nextRoute: `/chronicles/${chronicleId}/recap`,
    });
    expect(archiveInsert).toHaveBeenCalledWith({
      chronicle_id: chronicleId,
      event_type: "chronicle_completed",
      metadata: {
        narration: "The prompt tries to end me before my ledger is spent.",
        requiredAction: "check-skill",
      },
      session_id: "session-1",
      summary:
        "The chronicle ends because no Skill or Resource can answer the prompt.",
    });
    expect(closeSessionWithRecap).toHaveBeenCalledWith(expect.anything(), {
      chronicleId,
      sessionId: "session-1",
    });
    expect(updateChronicle).toHaveBeenCalledWith({
      last_played_at: expect.any(String),
      status: "completed",
    });
    expect(updateChronicleEq).toHaveBeenCalledWith("id", chronicleId);
  });
});
