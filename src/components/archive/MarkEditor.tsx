"use client";

import { useState } from "react";

type MarkEditorProps = {
  chronicleId: string;
  initialDescription: string;
  initialIsActive: boolean;
  initialIsConcealed: boolean;
  markId: string;
};

export function MarkEditor({
  chronicleId,
  initialDescription,
  initialIsActive,
  initialIsConcealed,
  markId,
}: MarkEditorProps) {
  const [description, setDescription] = useState(initialDescription);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isConcealed, setIsConcealed] = useState(initialIsConcealed);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/chronicles/${chronicleId}/marks/${markId}`, {
        body: JSON.stringify({
          description,
          isActive,
          isConcealed,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      if (!response.ok) {
        setMessage("Mark details could not be saved just now.");
        return;
      }

      setMessage("Mark details saved.");
    } catch {
      setMessage("Mark details could not be saved just now.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-soft border border-ink/10 bg-bg/55 px-4 py-4">
      <label className="block space-y-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          Mark description
        </span>
        <textarea
          className="min-h-24 w-full rounded-soft border border-ink/10 bg-surface/88 px-3 py-3 text-sm leading-relaxed text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual focus:border-gold/60"
          name="markDescription"
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label className="inline-flex min-h-11 items-center gap-3 rounded-soft border border-ink/10 bg-surface/72 px-3 py-2 text-sm text-ink">
          <input
            aria-label="Concealed"
            checked={isConcealed}
            className="h-4 w-4 rounded border-ink/20 text-nocturne focus:ring-gold"
            onChange={(event) => setIsConcealed(event.target.checked)}
            type="checkbox"
          />
          <span>Keep hidden in the ledger</span>
        </label>

        <label className="inline-flex min-h-11 items-center gap-3 rounded-soft border border-ink/10 bg-surface/72 px-3 py-2 text-sm text-ink">
          <input
            aria-label="Dormant"
            checked={!isActive}
            className="h-4 w-4 rounded border-ink/20 text-nocturne focus:ring-gold"
            onChange={(event) => setIsActive(!event.target.checked)}
            type="checkbox"
          />
          <span>Let the mark go quiet</span>
        </label>
      </div>

      <button
        className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40"
        disabled={isSaving}
        onClick={handleSave}
        type="button"
      >
        {isSaving ? "Saving mark details..." : "Save mark details"}
      </button>

      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}
