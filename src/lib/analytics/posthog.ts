"use client";

import posthog from "posthog-js";

export type AnalyticsEventName =
  | "archive_opened"
  | "chronicle_created"
  | "first_prompt_resolved"
  | "recap_opened"
  | "second_session_return"
  | "setup_completed"
  | "sign_in_requested";

type SafeSource = "archive" | "chronicle-list" | "recap" | "sign-in" | "setup";

export type SafeProperties = {
  chronicleId?: string;
  promptNumber?: number;
  source?: SafeSource;
};

let hasInitializedPostHog = false;

function sanitizeProperties(
  properties: Partial<SafeProperties>,
): SafeProperties {
  const sanitized: SafeProperties = {};

  if (typeof properties.chronicleId === "string" && properties.chronicleId) {
    sanitized.chronicleId = properties.chronicleId;
  }

  if (
    typeof properties.promptNumber === "number" &&
    Number.isFinite(properties.promptNumber)
  ) {
    sanitized.promptNumber = properties.promptNumber;
  }

  if (
    properties.source === "archive" ||
    properties.source === "chronicle-list" ||
    properties.source === "recap" ||
    properties.source === "sign-in" ||
    properties.source === "setup"
  ) {
    sanitized.source = properties.source;
  }

  return sanitized;
}

export function initPostHog() {
  if (hasInitializedPostHog) {
    return;
  }

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host) {
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    person_profiles: "identified_only",
  });
  hasInitializedPostHog = true;
}

export function trackAnalyticsEvent(
  event: AnalyticsEventName,
  properties: Partial<SafeProperties> = {},
) {
  posthog.capture(event, sanitizeProperties(properties));
}
