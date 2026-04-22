"use client";

import { useState } from "react";

type CharacterEditorProps = {
  characterId: string;
  chronicleId: string;
  initialDescription: string;
  initialStatus: "active" | "dead" | "lost";
};

export function CharacterEditor({
  characterId,
  chronicleId,
  initialDescription,
  initialStatus,
}: CharacterEditorProps) {
  const [description, setDescription] = useState(initialDescription);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/chronicles/${chronicleId}/characters/${characterId}`,
        {
          body: JSON.stringify({
            description,
            status,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        },
      );

      if (!response.ok) {
        setMessage("Character notes could not be saved just now.");
        return;
      }

      setMessage("Character notes saved.");
    } catch {
      setMessage("Character notes could not be saved just now.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-soft border border-ink/10 bg-bg/55 px-4 py-4">
      <label className="block space-y-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          Character notes
        </span>
        <textarea
          className="min-h-24 w-full rounded-soft border border-ink/10 bg-surface/88 px-3 py-3 text-sm leading-relaxed text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual focus:border-gold/60"
          name="characterDescription"
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
      </label>

      <label className="block space-y-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          Character status
        </span>
        <select
          className="min-h-11 w-full rounded-soft border border-ink/10 bg-surface/88 px-3 py-2 text-sm text-ink outline-none transition-colors duration-160 ease-ritual focus:border-gold/60"
          name="characterStatus"
          onChange={(event) =>
            setStatus(event.target.value as "active" | "dead" | "lost")
          }
          value={status}
        >
          <option value="active">Active</option>
          <option value="dead">Dead</option>
          <option value="lost">Lost</option>
        </select>
      </label>

      <button
        className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40"
        disabled={isSaving}
        onClick={handleSave}
        type="button"
      >
        {isSaving ? "Saving character notes..." : "Save character notes"}
      </button>

      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}
