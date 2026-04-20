import { afterEach, describe, expect, it } from "vitest";
import {
  assertTestAuthEnabled,
  isTestAuthEnabled,
} from "@/lib/auth/testAuth";

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

afterEach(() => {
  restoreEnv();
});

describe("preview test auth guard", () => {
  it("stays disabled when the feature flag is absent", () => {
    delete process.env.ENABLE_TEST_AUTH;
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL_ENV;

    expect(isTestAuthEnabled()).toBe(false);
  });

  it("enables test auth for preview deployments when the flag is set", () => {
    process.env.ENABLE_TEST_AUTH = "1";
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "preview";

    expect(isTestAuthEnabled()).toBe(true);
  });

  it("enables test auth in local development when the flag is set", () => {
    process.env.ENABLE_TEST_AUTH = "1";
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL_ENV;

    expect(isTestAuthEnabled()).toBe(true);
  });

  it("fails closed for production even when the flag is set", () => {
    process.env.ENABLE_TEST_AUTH = "1";
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";

    expect(isTestAuthEnabled()).toBe(false);
    expect(() => assertTestAuthEnabled()).toThrow(
      "Testing-only sign-in is unavailable here.",
    );
  });
});
