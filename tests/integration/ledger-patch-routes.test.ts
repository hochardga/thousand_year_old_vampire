import { beforeEach, describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

describe("ledger patch routes", () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
  });

  it("updates a character through the narrow allowed patch contract", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        description: "Changed by the returning chronicle.",
        id: "character-1",
        kind: "mortal",
        name: "Marta",
        status: "lost",
      },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const secondEq = vi.fn(() => ({ select }));
    const firstEq = vi.fn(() => ({ eq: secondEq }));
    const update = vi.fn(() => ({ eq: firstEq }));

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn(() => ({
        update,
      })),
    });

    const { PATCH } = await import(
      "@/app/api/chronicles/[chronicleId]/characters/[characterId]/route"
    );
    const response = await PATCH(
      new Request(
        "http://localhost/api/chronicles/chronicle-1/characters/character-1",
        {
          body: JSON.stringify({
            description: "Changed by the returning chronicle.",
            status: "lost",
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        },
      ),
      {
        params: Promise.resolve({
          characterId: "character-1",
          chronicleId: "chronicle-1",
        }),
      } as never,
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      description: "Changed by the returning chronicle.",
      status: "lost",
    });
    await expect(response.json()).resolves.toMatchObject({
      character: {
        id: "character-1",
        status: "lost",
      },
    });
  });

  it("rejects invalid skill updates outside the allowed status contract", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    });

    const { PATCH } = await import(
      "@/app/api/chronicles/[chronicleId]/skills/[skillId]/route"
    );
    const response = await PATCH(
      new Request("http://localhost/api/chronicles/chronicle-1/skills/skill-1", {
        body: JSON.stringify({
          label: "Nope",
          status: "checked",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      }),
      {
        params: Promise.resolve({
          chronicleId: "chronicle-1",
          skillId: "skill-1",
        }),
      } as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      details: expect.any(Array),
      error: "Validation failed",
    });
  });

  it("requires authentication for resource updates", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const { PATCH } = await import(
      "@/app/api/chronicles/[chronicleId]/resources/[resourceId]/route"
    );
    const response = await PATCH(
      new Request(
        "http://localhost/api/chronicles/chronicle-1/resources/resource-1",
        {
          body: JSON.stringify({
            status: "lost",
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        },
      ),
      {
        params: Promise.resolve({
          chronicleId: "chronicle-1",
          resourceId: "resource-1",
        }),
      } as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Authentication required",
    });
  });

  it("updates mark detail fields through the allowed patch contract", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        description: "My reflection lags half a breath behind.",
        id: "mark-1",
        is_active: false,
        is_concealed: true,
        label: "Unsteady Reflection",
      },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const secondEq = vi.fn(() => ({ select }));
    const firstEq = vi.fn(() => ({ eq: secondEq }));
    const update = vi.fn(() => ({ eq: firstEq }));

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn(() => ({
        update,
      })),
    });

    const { PATCH } = await import(
      "@/app/api/chronicles/[chronicleId]/marks/[markId]/route"
    );
    const response = await PATCH(
      new Request("http://localhost/api/chronicles/chronicle-1/marks/mark-1", {
        body: JSON.stringify({
          description: "My reflection lags half a breath behind.",
          isActive: false,
          isConcealed: true,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      }),
      {
        params: Promise.resolve({
          chronicleId: "chronicle-1",
          markId: "mark-1",
        }),
      } as never,
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      description: "My reflection lags half a breath behind.",
      is_active: false,
      is_concealed: true,
    });
  });
});
