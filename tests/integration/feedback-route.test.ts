import { beforeEach, describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

describe("feedback route", () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
  });

  it("returns 401 for unauthenticated feedback", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const { POST } = await import("@/app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          category: "friction",
          body: "The recap helped, but I still wanted more context.",
          source: "recap",
        }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("accepts authenticated feedback without needing a readback", async () => {
    const insert = vi.fn().mockResolvedValue({
      error: null,
    });

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn(() => ({
        insert,
      })),
    });

    const { POST } = await import("@/app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        body: JSON.stringify({
          body: "The recap helped me feel grounded, but I wanted one more cue.",
          category: "friction",
          chronicleId: "11111111-1111-4111-8111-111111111111",
          source: "recap",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith({
      body: "The recap helped me feel grounded, but I wanted one more cue.",
      category: "friction",
      chronicle_id: "11111111-1111-4111-8111-111111111111",
      source: "recap",
      user_id: "user-1",
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
    });
  });
});
