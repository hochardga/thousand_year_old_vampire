import { beforeEach, describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

describe("auth callback route", () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
    vi.resetModules();
  });

  it("redirects into the app after a successful code exchange without requiring profile writes", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: null,
        }),
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "gregory@example.com",
              id: "user-1",
            },
          },
        }),
      },
    });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request("http://localhost/auth/callback?code=ritual&next=%2Fchronicles") as never,
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/chronicles");
  });
});
