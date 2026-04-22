"use client";

import { PageShell } from "@/components/ui/PageShell";
import { QuietAlert } from "@/components/ui/QuietAlert";

export default function MarketingError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <PageShell className="gap-6 py-8">
      <QuietAlert
        title="The landing page could not be gathered just now."
        body="Try again when you are ready."
        actionLabel="Try again"
        onAction={reset}
      />
    </PageShell>
  );
}
