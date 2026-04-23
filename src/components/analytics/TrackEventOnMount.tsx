"use client";

import { useEffect } from "react";
import {
  trackAnalyticsEvent,
  type AnalyticsEventName,
  type SafeProperties,
} from "@/lib/analytics/posthog";

type TrackEventOnMountProps = {
  event: AnalyticsEventName;
  onceKey: string;
  properties?: Partial<SafeProperties>;
};

const inMemoryOnceKeys = new Set<string>();

export function TrackEventOnMount({
  event,
  onceKey,
  properties = {},
}: TrackEventOnMountProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (inMemoryOnceKeys.has(onceKey)) {
      return;
    }

    try {
      if (window.sessionStorage.getItem(onceKey)) {
        inMemoryOnceKeys.add(onceKey);
        return;
      }
    } catch {
      // Storage can fail in privacy-restricted browsers; still capture once.
    }

    if (!trackAnalyticsEvent(event, properties)) {
      return;
    }

    inMemoryOnceKeys.add(onceKey);

    try {
      window.sessionStorage.setItem(onceKey, "1");
    } catch {
      // Best effort only. Never retry the event.
    }
  }, [event, onceKey, properties]);

  return null;
}
