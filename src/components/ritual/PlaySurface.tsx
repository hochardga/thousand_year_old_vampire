"use client";

import { useEffect, useState } from "react";
import { ConsequencePanel } from "@/components/ritual/ConsequencePanel";
import { RitualTextarea } from "@/components/ritual/RitualTextarea";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import {
  clearPromptDraft,
  loadPromptDraft,
  savePromptDraft,
} from "@/lib/chronicles/localDrafts";

type ResolvePromptResponse = {
  archiveEvents?: Array<{
    eventType: string;
    summary: string;
  }>;
  nextPrompt?: {
    encounterIndex: number;
    promptNumber: number;
  };
};

type PlaySurfaceProps = {
  chronicleId: string;
  initialSessionId: string | null;
};

export function PlaySurface({
  chronicleId,
  initialSessionId,
}: PlaySurfaceProps) {
  const [playerEntry, setPlayerEntry] = useState(
    () => loadPromptDraft(chronicleId)?.playerEntry ?? "",
  );
  const [experienceText, setExperienceText] = useState(
    () => loadPromptDraft(chronicleId)?.experienceText ?? "",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ResolvePromptResponse | null>(null);

  useEffect(() => {
    if (!playerEntry && !experienceText) {
      return;
    }

    savePromptDraft(chronicleId, {
      experienceText,
      playerEntry,
    });
  }, [chronicleId, experienceText, playerEntry]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/chronicles/${chronicleId}/play/resolve`,
        {
          body: JSON.stringify({
            experienceText,
            memoryDecision: {
              mode: "create-new",
            },
            playerEntry,
            sessionId: initialSessionId,
            traitMutations: {
              characters: [],
              marks: [],
              resources: [],
              skills: [],
            },
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );
      const payload = (await response.json()) as ResolvePromptResponse & {
        error?: string;
      };

      if (!response.ok) {
        setErrorMessage(payload.error || "The prompt could not be resolved.");
        return;
      }

      setResult(payload);
      setPlayerEntry("");
      setExperienceText("");
      clearPromptDraft(chronicleId);
    } catch {
      setErrorMessage("The prompt could not be resolved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const consequenceSummary = result?.archiveEvents?.[0]?.summary;
  const nextPromptNumber = result?.nextPrompt?.promptNumber;

  return (
    <div className="space-y-4">
      {consequenceSummary && nextPromptNumber ? (
        <ConsequencePanel
          chronicleId={chronicleId}
          nextPromptNumber={nextPromptNumber}
          summary={consequenceSummary}
        />
      ) : null}

      {errorMessage ? (
        <SurfacePanel className="border-error/20 bg-error/10 px-5 py-4">
          <p className="text-sm text-ink">{errorMessage}</p>
        </SurfacePanel>
      ) : null}

      <SurfacePanel className="space-y-5 px-6 py-6 sm:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Writing surface
          </p>
          <h2 className="mt-3 font-heading text-3xl text-ink">
            Set down what happened, then what it became.
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <RitualTextarea
            label="Player entry"
            name="playerEntry"
            value={playerEntry}
            onChange={setPlayerEntry}
            placeholder="Write the immediate answer to the prompt."
          />
          <RitualTextarea
            label="Experience text"
            name="experienceText"
            value={experienceText}
            onChange={setExperienceText}
            placeholder="Distill the lasting consequence into a single sentence."
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92 disabled:cursor-wait disabled:opacity-75"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Setting the entry into memory..." : "Set the entry into memory"}
          </button>
        </form>
      </SurfacePanel>
    </div>
  );
}
