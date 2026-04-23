import { render, screen } from "@testing-library/react";
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
    expect(response.status).toBe(303);
  });

  it("creates a draft chronicle for authenticated users", async () => {
    const profileMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileSelect = vi.fn(() => ({ eq: profileEq }));
    const profileInsert = vi.fn().mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            display_name: "User 1",
            id: "user-1",
          },
          error: null,
        }),
      })),
    });
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: "chronicle-1" }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: "user-1@example.com", id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            insert: profileInsert,
            select: profileSelect,
          };
        }

        return { insert };
      }),
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
      "http://localhost/chronicles/chronicle-1/setup?created=1",
    );
    expect(profileInsert).toHaveBeenCalledWith({
      display_name: "User 1",
      id: "user-1",
    });
  });
});

describe("chronicles page", () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
    vi.resetModules();
  });

  it("repairs a missing profile on the first authenticated page load", async () => {
    const profileMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileSelect = vi.fn(() => ({ eq: profileEq }));
    const profileInsert = vi.fn().mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            display_name: "Gregory",
            id: "user-1",
          },
          error: null,
        }),
      })),
    });
    const chroniclesOrder = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const chroniclesSelect = vi.fn(() => ({ order: chroniclesOrder }));

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "gregory@example.com",
              id: "user-1",
            },
          },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            insert: profileInsert,
            select: profileSelect,
          };
        }

        return {
          select: chroniclesSelect,
        };
      }),
    });

    const { default: ChroniclesPage } = await import("@/app/(app)/chronicles/page");
    const view = await ChroniclesPage({
      searchParams: Promise.resolve({}),
    } as never);

    render(view);

    expect(profileInsert).toHaveBeenCalledWith({
      display_name: "Gregory",
      id: "user-1",
    });
    expect(
      screen.getByRole("heading", {
        name: "No chronicle has been opened yet.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Begin the first one when you are ready. The ledger will keep the life for you once it starts.",
      ),
    ).toBeInTheDocument();
  });

  it("routes returning players through recap for the last active chronicle", async () => {
    const profileMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        display_name: "Gregory",
        id: "user-1",
      },
      error: null,
    });
    const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileSelect = vi.fn(() => ({ eq: profileEq }));
    const chroniclesOrder = vi.fn().mockResolvedValue({
      data: [
        {
          created_at: "2026-04-10T10:00:00.000Z",
          current_prompt_encounter: 1,
          current_prompt_number: 7,
          id: "chronicle-1",
          last_played_at: "2026-04-21T10:00:00.000Z",
          status: "active",
          title: "The Long Night",
          vampire_name: "Aurelia's Refusal",
        },
      ],
      error: null,
    });
    const chroniclesSelect = vi.fn(() => ({ order: chroniclesOrder }));

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "gregory@example.com",
              id: "user-1",
            },
          },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: profileSelect,
          };
        }

        return {
          select: chroniclesSelect,
        };
      }),
    });

    const { default: ChroniclesPage } = await import("@/app/(app)/chronicles/page");
    const view = await ChroniclesPage({
      searchParams: Promise.resolve({}),
    } as never);

    render(view);

    expect(
      screen.getByRole("link", { name: "Resume the last active chronicle" }),
    ).toHaveAttribute("href", "/chronicles/chronicle-1/recap?returned=1");
    expect(
      screen.getByText("Resume through recap"),
    ).toBeInTheDocument();
  });

  it("does not tag first-session active chronicles as second-session returns", async () => {
    const profileMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        display_name: "Gregory",
        id: "user-1",
      },
      error: null,
    });
    const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileSelect = vi.fn(() => ({ eq: profileEq }));
    const chroniclesOrder = vi.fn().mockResolvedValue({
      data: [
        {
          created_at: "2026-04-10T10:00:00.000Z",
          current_prompt_encounter: 1,
          current_prompt_number: 1,
          id: "chronicle-1",
          last_played_at: "2026-04-21T10:00:00.000Z",
          status: "active",
          title: "The Long Night",
          vampire_name: "Aurelia's Refusal",
        },
      ],
      error: null,
    });
    const chroniclesSelect = vi.fn(() => ({ order: chroniclesOrder }));

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "gregory@example.com",
              id: "user-1",
            },
          },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: profileSelect,
          };
        }

        return {
          select: chroniclesSelect,
        };
      }),
    });

    const { default: ChroniclesPage } = await import("@/app/(app)/chronicles/page");
    const view = await ChroniclesPage({
      searchParams: Promise.resolve({}),
    } as never);

    render(view);

    expect(
      screen.getByRole("link", { name: "Resume the last active chronicle" }),
    ).toHaveAttribute("href", "/chronicles/chronicle-1/recap");
    expect(screen.getByText("The Long Night").closest("a")).toHaveAttribute(
      "href",
      "/chronicles/chronicle-1/recap",
    );
  });

  it("keeps only the active chronicle card on the returned recap path", async () => {
    const profileMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        display_name: "Gregory",
        id: "user-1",
      },
      error: null,
    });
    const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileSelect = vi.fn(() => ({ eq: profileEq }));
    const chroniclesOrder = vi.fn().mockResolvedValue({
      data: [
        {
          created_at: "2026-04-10T10:00:00.000Z",
          id: "chronicle-draft",
          last_played_at: null,
          status: "draft",
          title: "The Still Unwritten",
          vampire_name: null,
        },
        {
          created_at: "2026-04-11T10:00:00.000Z",
          current_prompt_encounter: 1,
          current_prompt_number: 4,
          id: "chronicle-active",
          last_played_at: "2026-04-21T10:00:00.000Z",
          status: "active",
          title: "The Long Night",
          vampire_name: "Aurelia's Refusal",
        },
        {
          created_at: "2026-04-12T10:00:00.000Z",
          id: "chronicle-completed",
          last_played_at: "2026-04-20T10:00:00.000Z",
          status: "completed",
          title: "The Ashen Road",
          vampire_name: "The Ashen Road",
        },
        {
          created_at: "2026-04-13T10:00:00.000Z",
          id: "chronicle-archived",
          last_played_at: "2026-04-19T10:00:00.000Z",
          status: "archived",
          title: "The Hollow Crown",
          vampire_name: "The Hollow Crown",
        },
      ],
      error: null,
    });
    const chroniclesSelect = vi.fn(() => ({ order: chroniclesOrder }));

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "gregory@example.com",
              id: "user-1",
            },
          },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: profileSelect,
          };
        }

        return {
          select: chroniclesSelect,
        };
      }),
    });

    const { default: ChroniclesPage } = await import("@/app/(app)/chronicles/page");
    const view = await ChroniclesPage({
      searchParams: Promise.resolve({}),
    } as never);

    render(view);

    expect(
      screen.getByText("The Still Unwritten").closest("a"),
    ).toHaveAttribute("href", "/chronicles/chronicle-draft/setup");
    expect(screen.getByText("The Long Night").closest("a")).toHaveAttribute(
      "href",
      "/chronicles/chronicle-active/recap?returned=1",
    );
    expect(screen.getByText("The Ashen Road").closest("a")).toHaveAttribute(
      "href",
      "/chronicles/chronicle-completed/recap",
    );
    expect(screen.getByText("The Hollow Crown").closest("a")).toHaveAttribute(
      "href",
      "/chronicles/chronicle-archived/recap",
    );
    expect(
      screen.getByRole("link", { name: "Resume the last active chronicle" }),
    ).toHaveAttribute("href", "/chronicles/chronicle-active/recap?returned=1");
  });

  it("keeps chronicle-list failures on route-safe copy", async () => {
    const profileMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        display_name: "Gregory",
        id: "user-1",
      },
      error: null,
    });
    const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileSelect = vi.fn(() => ({ eq: profileEq }));
    const chroniclesOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "database timeout while reading chronicles" },
    });
    const chroniclesSelect = vi.fn(() => ({ order: chroniclesOrder }));

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "gregory@example.com",
              id: "user-1",
            },
          },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: profileSelect,
          };
        }

        return {
          select: chroniclesSelect,
        };
      }),
    });

    const { default: ChroniclesPage } = await import("@/app/(app)/chronicles/page");
    const view = await ChroniclesPage({
      searchParams: Promise.resolve({}),
    } as never);

    render(view);

    expect(
      screen.getByText("The chronicle ledger could not be read just now."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("database timeout while reading chronicles"),
    ).not.toBeInTheDocument();
  });
});

describe("chronicle setup page", () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
    vi.resetModules();
  });

  it("shows a calm shared confirmation state when a new draft has just been opened", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "chronicle-1",
        status: "draft",
        title: "The Long Night",
      },
      error: null,
    });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
            },
          },
        }),
      },
      from: vi.fn(() => ({
        select,
      })),
    });

    const { default: ChronicleSetupPage } = await import(
      "@/app/(app)/chronicles/[chronicleId]/setup/page"
    );
    const view = await ChronicleSetupPage({
      params: Promise.resolve({ chronicleId: "chronicle-1" }),
      searchParams: Promise.resolve({ created: "1" }),
    } as never);

    render(view);

    expect(
      screen.getByRole("heading", {
        name: "The draft chronicle has been opened.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The becoming-undead sequence is ready when you are.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Begin with the life you had before.",
      }),
    ).toBeInTheDocument();
  });
});
