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

      trackAnalyticsEvent(event, properties);
      window.sessionStorage.setItem(onceKey, "1");
    } catch {
      trackAnalyticsEvent(event, properties);
    }
  }, [event, onceKey, properties]);

  return null;
}
