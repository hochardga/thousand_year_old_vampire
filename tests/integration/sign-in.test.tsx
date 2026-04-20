import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());
const createAdminSupabaseClient = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

const originalEnv = {
  ENABLE_TEST_AUTH: process.env.ENABLE_TEST_AUTH,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
};

function restoreEnv() {
  if (originalEnv.ENABLE_TEST_AUTH === undefined) {
    delete process.env.ENABLE_TEST_AUTH;
  } else {
    process.env.ENABLE_TEST_AUTH = originalEnv.ENABLE_TEST_AUTH;
  }

  if (originalEnv.NODE_ENV === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
  }

  if (originalEnv.VERCEL_ENV === undefined) {
    delete process.env.VERCEL_ENV;
  } else {
    process.env.VERCEL_ENV = originalEnv.VERCEL_ENV;
  }
}

async function loadSignInModule() {
  vi.resetModules();

  return import("@/app/(auth)/sign-in/page");
}

async function captureRedirectUrl(action: Promise<unknown>) {
  try {
    await action;
    throw new Error("Expected a redirect");
  } catch (error) {
    if (
      error instanceof Error &&
      "url" in error &&
      typeof error.url === "string"
    ) {
      return error.url;
    }

    throw error;
  }
}

beforeEach(() => {
  createServerSupabaseClient.mockReset();
  createAdminSupabaseClient.mockReset();
  redirect.mockClear();
  restoreEnv();
});

afterEach(() => {
  restoreEnv();
});

describe("sign-in shell", () => {
  it("renders the quiet magic-link form contract and hides testing auth by default", async () => {
    delete process.env.ENABLE_TEST_AUTH;
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL_ENV;

    const { default: SignInPage } = await loadSignInModule();
    const view = await SignInPage({
      searchParams: Promise.resolve({}),
    } as never);

    render(view);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send the Link" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enter Through Test Sign-In" }),
    ).not.toBeInTheDocument();
  });

  it("renders a clearly marked testing-only password path when enabled", async () => {
    process.env.ENABLE_TEST_AUTH = "1";
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "preview";

    const { default: SignInPage } = await loadSignInModule();
    const view = await SignInPage({
      searchParams: Promise.resolve({}),
    } as never);

    render(view);

    expect(
      screen.getByText("Testing only", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Testing email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Testing password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enter Through Test Sign-In" }),
    ).toBeInTheDocument();
  });
});

describe("testing-only password sign-in action", () => {
  it("redirects to the requested route after a successful password sign-in", async () => {
    process.env.ENABLE_TEST_AUTH = "1";
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "preview";

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          error: null,
        }),
      },
    });

    const { requestTestPasswordSignIn } = await loadSignInModule();
    const formData = new FormData();
    formData.set("email", "tester@example.com");
    formData.set("password", "nightfall");
    formData.set("next", "/chronicles");

    await expect(captureRedirectUrl(requestTestPasswordSignIn(formData))).resolves
      .toBe("/chronicles");
  });

  it("provisions the canonical preview test user and retries once when the password user does not exist yet", async () => {
    process.env.ENABLE_TEST_AUTH = "1";
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "preview";

    const signInWithPassword = vi
      .fn()
      .mockResolvedValueOnce({
        error: {
          code: "invalid_credentials",
          message: "Invalid login credentials",
        },
      })
      .mockResolvedValueOnce({
        error: null,
      });

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        signInWithPassword,
      },
    });
    createAdminSupabaseClient.mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-1" } },
            error: null,
          }),
          listUsers: vi.fn().mockResolvedValue({
            data: { users: [] },
            error: null,
          }),
          updateUserById: vi.fn(),
        },
      },
    });

    const { requestTestPasswordSignIn } = await loadSignInModule();
    const formData = new FormData();
    formData.set("email", "e2e@example.com");
    formData.set("password", "nightfall");
    formData.set("next", "/chronicles");

    await expect(captureRedirectUrl(requestTestPasswordSignIn(formData))).resolves
      .toBe("/chronicles");
    expect(signInWithPassword).toHaveBeenCalledTimes(2);
    expect(createAdminSupabaseClient).toHaveBeenCalledTimes(1);
  });

  it("keeps paging through auth users before deciding the preview test user is missing", async () => {
    process.env.ENABLE_TEST_AUTH = "1";
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "preview";

    const signInWithPassword = vi
      .fn()
      .mockResolvedValueOnce({
        error: {
          code: "invalid_credentials",
          message: "Invalid login credentials",
        },
      })
      .mockResolvedValueOnce({
        error: null,
      });
    const listUsers = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          lastPage: 2,
          nextPage: 2,
          total: 201,
          users: [],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          lastPage: 2,
          nextPage: null,
          total: 201,
          users: [
            {
              email: "e2e@example.com",
              id: "user-201",
            },
          ],
        },
        error: null,
      });
    const updateUserById = vi.fn().mockResolvedValue({
      data: { user: { id: "user-201" } },
      error: null,
    });
    const createUser = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "User already registered",
      },
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        signInWithPassword,
      },
    });
    createAdminSupabaseClient.mockReturnValue({
      auth: {
        admin: {
          createUser,
          listUsers,
          updateUserById,
        },
      },
    });

    const { requestTestPasswordSignIn } = await loadSignInModule();
    const formData = new FormData();
    formData.set("email", "e2e@example.com");
    formData.set("password", "nightfall");
    formData.set("next", "/chronicles");

    await expect(captureRedirectUrl(requestTestPasswordSignIn(formData))).resolves
      .toBe("/chronicles");

    expect(listUsers).toHaveBeenCalledTimes(2);
    expect(listUsers).toHaveBeenNthCalledWith(1, {
      page: 1,
      perPage: 200,
    });
    expect(listUsers).toHaveBeenNthCalledWith(2, {
      page: 2,
      perPage: 200,
    });
    expect(updateUserById).toHaveBeenCalledWith("user-201", {
      email_confirm: true,
      password: "nightfall",
    });
    expect(createUser).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("returns to sign-in with a testing-only error when the password is rejected", async () => {
    process.env.ENABLE_TEST_AUTH = "1";
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "preview";

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          error: {
            message: "Invalid login credentials",
          },
        }),
      },
    });

    const { requestTestPasswordSignIn } = await loadSignInModule();
    const formData = new FormData();
    formData.set("email", "tester@example.com");
    formData.set("password", "wrong");
    formData.set("next", "/chronicles");

    const redirectUrl = await captureRedirectUrl(requestTestPasswordSignIn(formData));
    const parsed = new URL(redirectUrl, "http://localhost");

    expect(parsed.pathname).toBe("/sign-in");
    expect(parsed.searchParams.get("testAuthError")).toBe(
      "The testing password could not open the door just now.",
    );
    expect(parsed.searchParams.get("next")).toBe("/chronicles");
    expect(parsed.searchParams.get("email")).toBe("tester@example.com");
    expect(createAdminSupabaseClient).not.toHaveBeenCalled();
  });

  it("fails closed when the feature is disabled even if the action is called directly", async () => {
    delete process.env.ENABLE_TEST_AUTH;
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL_ENV;

    const { requestTestPasswordSignIn } = await loadSignInModule();
    const formData = new FormData();
    formData.set("email", "tester@example.com");
    formData.set("password", "nightfall");
    formData.set("next", "/chronicles");

    const redirectUrl = await captureRedirectUrl(requestTestPasswordSignIn(formData));
    const parsed = new URL(redirectUrl, "http://localhost");

    expect(parsed.pathname).toBe("/sign-in");
    expect(parsed.searchParams.get("testAuthError")).toBe(
      "Testing-only sign-in is unavailable here.",
    );
    expect(parsed.searchParams.get("next")).toBe("/chronicles");
    expect(parsed.searchParams.get("email")).toBe("tester@example.com");

    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });
});
