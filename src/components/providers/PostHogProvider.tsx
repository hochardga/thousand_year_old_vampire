"use client";

import { useEffect, type ReactNode } from "react";
import { initPostHog } from "@/lib/analytics/posthog";

type PostHogProviderProps = {
  children: ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}
