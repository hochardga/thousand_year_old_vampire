"use client";

import { PageShell } from "@/components/ui/PageShell";
import { QuietAlert } from "@/components/ui/QuietAlert";

export default function ChroniclesError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <PageShell className="gap-6 py-8">
      <QuietAlert
        title="The chronicle ledger could not be read just now."
        body="Try again when you are ready."
        actionLabel="Try again"
        onAction={reset}
      />
    </PageShell>
  );
}
