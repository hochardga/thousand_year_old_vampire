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
});
