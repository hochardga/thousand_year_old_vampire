import { render } from "@testing-library/react";
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
    window.sessionStorage.clear();
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

  it("dedupes TrackEventOnMount by onceKey within the same session", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";

    const { TrackEventOnMount } = await import(
      "@/components/analytics/TrackEventOnMount"
    );

    const { unmount } = render(
      <TrackEventOnMount
        event="archive_opened"
        onceKey="archive-opened:chronicle-1"
        properties={{
          chronicleId: "chronicle-1",
          source: "archive",
        }}
      />,
    );

    unmount();

    render(
      <TrackEventOnMount
        event="archive_opened"
        onceKey="archive-opened:chronicle-1"
        properties={{
          chronicleId: "chronicle-1",
          source: "archive",
        }}
      />,
    );

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith("archive_opened", {
      chronicleId: "chronicle-1",
      source: "archive",
    });
  });

  it("captures at most once when sessionStorage.setItem throws", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";

    const getItem = vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage blocked");
      });

    const { TrackEventOnMount } = await import(
      "@/components/analytics/TrackEventOnMount"
    );

    try {
      render(
        <TrackEventOnMount
          event="archive_opened"
          onceKey="archive-opened:chronicle-2"
          properties={{
            chronicleId: "chronicle-2",
            source: "archive",
          }}
        />,
      );

      expect(capture).toHaveBeenCalledTimes(1);
      expect(capture).toHaveBeenCalledWith("archive_opened", {
        chronicleId: "chronicle-2",
        source: "archive",
      });
      expect(getItem).toHaveBeenCalledWith("archive-opened:chronicle-2");
      expect(setItem).toHaveBeenCalledWith("archive-opened:chronicle-2", "1");
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});
