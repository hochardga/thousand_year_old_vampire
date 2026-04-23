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
    vi.resetModules();
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

  it("does not burn a onceKey before analytics can initialize", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { TrackEventOnMount } = await import(
      "@/components/analytics/TrackEventOnMount"
    );

    try {
      const firstAttempt = render(
        <TrackEventOnMount
          event="recap_opened"
          onceKey="recap-opened:chronicle-retry"
          properties={{
            chronicleId: "chronicle-retry",
            source: "recap",
          }}
        />,
      );

      expect(capture).not.toHaveBeenCalled();
      expect(setItem).not.toHaveBeenCalled();

      firstAttempt.unmount();
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";

      render(
        <TrackEventOnMount
          event="recap_opened"
          onceKey="recap-opened:chronicle-retry"
          properties={{
            chronicleId: "chronicle-retry",
            source: "recap",
          }}
        />,
      );

      expect(capture).toHaveBeenCalledTimes(1);
      expect(capture).toHaveBeenCalledWith("recap_opened", {
        chronicleId: "chronicle-retry",
        source: "recap",
      });
      expect(setItem).toHaveBeenCalledWith("recap-opened:chronicle-retry", "1");
    } finally {
      setItem.mockRestore();
    }
  });

  it("still dedupes across remounts when storage remains unavailable", async () => {
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
      const first = render(
        <TrackEventOnMount
          event="archive_opened"
          onceKey="archive-opened:chronicle-3"
          properties={{
            chronicleId: "chronicle-3",
            source: "archive",
          }}
        />,
      );

      first.unmount();

      render(
        <TrackEventOnMount
          event="archive_opened"
          onceKey="archive-opened:chronicle-3"
          properties={{
            chronicleId: "chronicle-3",
            source: "archive",
          }}
        />,
      );

      expect(capture).toHaveBeenCalledTimes(1);
      expect(capture).toHaveBeenCalledWith("archive_opened", {
        chronicleId: "chronicle-3",
        source: "archive",
      });
      expect(getItem).toHaveBeenCalledTimes(1);
      expect(setItem).toHaveBeenCalledTimes(1);
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});
