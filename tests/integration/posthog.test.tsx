import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const capture = vi.fn();
const init = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    capture,
    init,
  },
}));

describe("posthog helpers", () => {
  beforeEach(() => {
    capture.mockReset();
    init.mockReset();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  it("does not initialize when public env vars are absent", async () => {
    const { initPostHog } = await import("@/lib/analytics/posthog");
    initPostHog();
    expect(init).not.toHaveBeenCalled();
  });

  it("tracks only the allowed funnel properties", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";
    const { trackAnalyticsEvent } = await import("@/lib/analytics/posthog");

    trackAnalyticsEvent("chronicle_created", {
      chronicleId: "chronicle-1",
      source: "chronicle-list",
      playerEntry: "this must be dropped",
    });

    expect(capture).toHaveBeenCalledWith("chronicle_created", {
      chronicleId: "chronicle-1",
      source: "chronicle-list",
    });
  });
});
