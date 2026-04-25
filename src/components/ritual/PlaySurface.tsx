"use client";

import { useEffect, useRef, useState } from "react";
import type { ActiveDiarySummary } from "@/types/chronicle";
import { trackAnalyticsEvent } from "@/lib/analytics/posthog";
import { ConsequencePanel } from "@/components/ritual/ConsequencePanel";
import { MemoryDecisionPanel } from "@/components/ritual/MemoryDecisionPanel";
import { PromptSkillComposer } from "@/components/ritual/PromptSkillComposer";
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
  activeDiary?: ActiveDiarySummary | null;
  chronicleId: string;
  currentPromptNumber: number;
  existingSkillLabels?: string[];
  initialSessionId: string | null;
  mindMemories?: Array<{
    id: string;
    slotIndex: number | null;
    title: string;
  }>;
};

export function PlaySurface({
  activeDiary = null,
  chronicleId,
  currentPromptNumber,
  existingSkillLabels = [],
  initialSessionId,
  mindMemories = [],
}: PlaySurfaceProps) {
  const hasTrackedFirstPromptResolved = useRef(false);
  const initialDraft = loadPromptDraft(chronicleId);
  const [playerEntry, setPlayerEntry] = useState(() => initialDraft?.playerEntry ?? "");
  const [experienceText, setExperienceText] = useState(
    () => initialDraft?.experienceText ?? "",
  );
  const [isAddingSkill, setIsAddingSkill] = useState(
    () => initialDraft?.shouldCreateSkill ?? false,
  );
  const [newSkillLabel, setNewSkillLabel] = useState(
    () => initialDraft?.newSkillLabel ?? "",
  );
  const [newSkillDescription, setNewSkillDescription] = useState(
    () => initialDraft?.newSkillDescription ?? "",
  );
  const [skillErrorMessage, setSkillErrorMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ResolvePromptResponse | null>(null);
  const [overflowMode, setOverflowMode] = useState<
    "forget-existing" | "move-to-diary" | null
  >(null);
  const [selectedOverflowMemoryId, setSelectedOverflowMemoryId] = useState<
    string | null
  >(null);

  const requiresOverflowDecision = mindMemories.length >= 5;

  useEffect(() => {
    const hasAnyDraftContent =
      Boolean(playerEntry) ||
      Boolean(experienceText) ||
      Boolean(newSkillLabel) ||
      Boolean(newSkillDescription) ||
      isAddingSkill;

    if (!hasAnyDraftContent) {
      clearPromptDraft(chronicleId);
      return;
    }

    savePromptDraft(chronicleId, {
      experienceText,
      newSkillDescription,
      newSkillLabel,
      playerEntry,
      shouldCreateSkill: isAddingSkill,
    });
  }, [
    chronicleId,
    experienceText,
    isAddingSkill,
    newSkillDescription,
    newSkillLabel,
    playerEntry,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSkillErrorMessage(null);

    if (requiresOverflowDecision && (!overflowMode || !selectedOverflowMemoryId)) {
      setErrorMessage(
        "Choose which memory to forget or move into the diary before continuing.",
      );
      return;
    }

    const normalizedExistingSkillLabels = existingSkillLabels.map((label) =>
      label.trim(),
    );

    if (isAddingSkill) {
      const normalizedNewSkillLabel = newSkillLabel.trim();
      const normalizedNewSkillDescription = newSkillDescription.trim();

      if (!normalizedNewSkillLabel || !normalizedNewSkillDescription) {
        setSkillErrorMessage(
          "Name the skill and explain why this prompt gave it shape.",
        );
        return;
      }

      if (normalizedExistingSkillLabels.includes(normalizedNewSkillLabel)) {
        setSkillErrorMessage(
          "That skill name is already in the chronicle. Choose different wording.",
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/chronicles/${chronicleId}/play/resolve`,
        {
          body: JSON.stringify({
            experienceText,
            memoryDecision:
              requiresOverflowDecision && overflowMode && selectedOverflowMemoryId
                ? {
                    memoryId: selectedOverflowMemoryId,
                    mode: overflowMode,
                  }
                : {
                    mode: "create-new",
                  },
            newSkill: isAddingSkill
              ? {
                  description: newSkillDescription,
                  label: newSkillLabel,
                }
              : undefined,
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
        if (
          payload.error ===
          "That skill name is already in the chronicle. Choose different wording."
        ) {
          setSkillErrorMessage(payload.error);
          return;
        }

        setErrorMessage(payload.error || "The prompt could not be resolved.");
        return;
      }

      setResult(payload);
      if (
        currentPromptNumber === 1 &&
        !hasTrackedFirstPromptResolved.current
      ) {
        hasTrackedFirstPromptResolved.current = true;
        trackAnalyticsEvent("first_prompt_resolved", {
          chronicleId,
          promptNumber: currentPromptNumber,
        });
      }
      setPlayerEntry("");
      setExperienceText("");
      setIsAddingSkill(false);
      setNewSkillDescription("");
      setNewSkillLabel("");
      setSkillErrorMessage(null);
      setOverflowMode(null);
      setSelectedOverflowMemoryId(null);
      clearPromptDraft(chronicleId);
    } catch {
      setErrorMessage("The prompt could not be resolved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const consequenceSummary = result?.archiveEvents?.[0]?.summary;
  const nextPromptNumber = result?.nextPrompt?.promptNumber;

  function handleSkillComposerToggle() {
    if (isAddingSkill) {
      if (playerEntry || experienceText) {
        savePromptDraft(chronicleId, {
          experienceText,
          newSkillDescription: "",
          newSkillLabel: "",
          playerEntry,
          shouldCreateSkill: false,
        });
      } else {
        clearPromptDraft(chronicleId);
      }

      setIsAddingSkill(false);
      setNewSkillLabel("");
      setNewSkillDescription("");
      setSkillErrorMessage(null);
      return;
    }

    setIsAddingSkill(true);
    setSkillErrorMessage(null);
  }

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
        <SurfacePanel
          role="alert"
          className="border-error/20 bg-error/10 px-5 py-4"
        >
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
          <PromptSkillComposer
            description={newSkillDescription}
            errorMessage={skillErrorMessage}
            isOpen={isAddingSkill}
            label={newSkillLabel}
            onDescriptionChange={setNewSkillDescription}
            onLabelChange={setNewSkillLabel}
            onToggle={handleSkillComposerToggle}
          />
          {requiresOverflowDecision ? (
            <MemoryDecisionPanel
              activeDiary={activeDiary}
              memories={mindMemories}
              onModeChange={setOverflowMode}
              onSelectedMemoryChange={setSelectedOverflowMemoryId}
              selectedMemoryId={selectedOverflowMemoryId}
              selectedMode={overflowMode}
            />
          ) : null}
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
