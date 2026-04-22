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

export function TrackEventOnMount({
  event,
  onceKey,
  properties = {},
}: TrackEventOnMountProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (window.sessionStorage.getItem(onceKey)) {
        return;
      }
    } catch {
      // Storage can fail in privacy-restricted browsers; still capture once.
    }

    trackAnalyticsEvent(event, properties);

    try {
      window.sessionStorage.setItem(onceKey, "1");
    } catch {
      // Best effort only. Never retry the event.
    }
  }, [event, onceKey, properties]);

  return null;
}
