import { beforeEach, describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

describe("chronicle creation route", () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
    vi.resetModules();
  });

  it("redirects guests to sign-in with a return path", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const { POST } = await import("@/app/api/chronicles/route");
    const response = await POST(
      new Request("http://localhost/api/chronicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(),
      }),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/sign-in?next=%2Fchronicles",
    );
  });

  it("creates a draft chronicle for authenticated users", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: "chronicle-1" }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn(() => ({ insert })),
    });

    const formData = new URLSearchParams();
    formData.set("title", "The Long Night");

    const { POST } = await import("@/app/api/chronicles/route");
    const response = await POST(
      new Request("http://localhost/api/chronicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/chronicles?created=chronicle-1",
    );
  });
});
