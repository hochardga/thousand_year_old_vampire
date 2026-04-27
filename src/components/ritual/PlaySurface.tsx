"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActiveDiarySummary } from "@/types/chronicle";
import { trackAnalyticsEvent } from "@/lib/analytics/posthog";
import type { PromptEffectGuidance } from "@/lib/prompts/effects";
import { ConsequencePanel } from "@/components/ritual/ConsequencePanel";
import { MemoryDecisionPanel } from "@/components/ritual/MemoryDecisionPanel";
import { MemoryPlacementPanel } from "@/components/ritual/MemoryPlacementPanel";
import { PromptCharacterComposer } from "@/components/ritual/PromptCharacterComposer";
import { PromptMarkComposer } from "@/components/ritual/PromptMarkComposer";
import { PromptResourceComposer } from "@/components/ritual/PromptResourceComposer";
import { SkillResourceChangePanel } from "@/components/ritual/SkillResourceChangePanel";
import { PromptSkillComposer } from "@/components/ritual/PromptSkillComposer";
import { RitualTextarea } from "@/components/ritual/RitualTextarea";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import {
  clearPromptDraft,
  loadPromptDraft,
  savePromptDraft,
} from "@/lib/chronicles/localDrafts";
import {
  getSkillResourceResolutionState,
  type SkillResourceRequiredAction,
  type SkillResourceResource,
  type SkillResourceSkill,
} from "@/lib/chronicles/skillResourceRules";

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

type ActiveResolvePromptResponse = ResolvePromptResponse & {
  resolvedPromptNumber: number;
  resolvedSessionId: string | null;
};

type EndChronicleResponse = {
  nextRoute?: string;
};

type PlaySurfaceProps = {
  activeDiary?: ActiveDiarySummary | null;
  chronicleId: string;
  currentPromptNumber?: number;
  existingCharacterNames?: string[];
  existingMarkLabels?: string[];
  existingResourceLabels?: string[];
  existingSkillLabels?: string[];
  initialSessionId: string | null;
  mindMemories?: Array<{
    entryCount?: number;
    id: string;
    slotIndex: number | null;
    title: string;
  }>;
  promptEffect?: PromptEffectGuidance | null;
  resources?: SkillResourceResource[];
  skills?: SkillResourceSkill[];
};

type MemoryPlacementMode = "append-existing" | "create-new";

export function PlaySurface({
  activeDiary = null,
  chronicleId,
  currentPromptNumber = 1,
  existingCharacterNames = [],
  existingMarkLabels = [],
  existingResourceLabels = [],
  existingSkillLabels = [],
  initialSessionId,
  mindMemories = [],
  promptEffect = null,
  resources = [],
  skills = [],
}: PlaySurfaceProps) {
  const hasTrackedFirstPromptResolved = useRef(false);
  const initialDraft = loadPromptDraft(chronicleId);
  const requiresPromptResource = Boolean(promptEffect?.resource);
  const requiresPromptSkill = Boolean(promptEffect?.skill);
  const [playerEntry, setPlayerEntry] = useState(() => initialDraft?.playerEntry ?? "");
  const [experienceText, setExperienceText] = useState(
    () => initialDraft?.experienceText ?? "",
  );
  const [isAddingResource, setIsAddingResource] = useState(
    () =>
      requiresPromptResource ? true : (initialDraft?.shouldCreateResource ?? false),
  );
  const [newResourceLabel, setNewResourceLabel] = useState(
    () => initialDraft?.newResourceLabel ?? "",
  );
  const [newResourceDescription, setNewResourceDescription] = useState(
    () => initialDraft?.newResourceDescription ?? "",
  );
  const [newResourceIsStationary, setNewResourceIsStationary] = useState(
    () =>
      requiresPromptResource
        ? (promptEffect?.resource?.isStationary ?? false)
        : (initialDraft?.newResourceIsStationary ?? false),
  );
  const [isAddingCharacter, setIsAddingCharacter] = useState(
    () => initialDraft?.shouldCreateCharacter ?? false,
  );
  const [newCharacterName, setNewCharacterName] = useState(
    () => initialDraft?.newCharacterName ?? "",
  );
  const [newCharacterDescription, setNewCharacterDescription] = useState(
    () => initialDraft?.newCharacterDescription ?? "",
  );
  const [newCharacterKind, setNewCharacterKind] = useState<
    "immortal" | "mortal"
  >(() => initialDraft?.newCharacterKind ?? "mortal");
  const [isAddingMark, setIsAddingMark] = useState(
    () => initialDraft?.shouldCreateMark ?? false,
  );
  const [newMarkLabel, setNewMarkLabel] = useState(
    () => initialDraft?.newMarkLabel ?? "",
  );
  const [newMarkDescription, setNewMarkDescription] = useState(
    () => initialDraft?.newMarkDescription ?? "",
  );
  const [newMarkIsConcealed, setNewMarkIsConcealed] = useState(
    () => initialDraft?.newMarkIsConcealed ?? false,
  );
  const [isAddingSkill, setIsAddingSkill] = useState(
    () => (requiresPromptSkill ? true : (initialDraft?.shouldCreateSkill ?? false)),
  );
  const [newSkillLabel, setNewSkillLabel] = useState(
    () =>
      requiresPromptSkill
        ? (initialDraft?.newSkillLabel?.trim() || promptEffect?.skill?.label || "")
        : (initialDraft?.newSkillLabel ?? ""),
  );
  const [newSkillDescription, setNewSkillDescription] = useState(
    () => initialDraft?.newSkillDescription ?? "",
  );
  const [skillResourceRequiredAction, setSkillResourceRequiredAction] =
    useState<SkillResourceRequiredAction | "">(
      () => initialDraft?.skillResourceRequiredAction ?? "",
    );
  const [skillResourceTargetId, setSkillResourceTargetId] = useState(
    () => initialDraft?.skillResourceTargetId ?? "",
  );
  const [skillResourceWorstOutcome, setSkillResourceWorstOutcome] = useState(
    () => initialDraft?.skillResourceWorstOutcome ?? "",
  );
  const [skillResourceDemiseNarration, setSkillResourceDemiseNarration] =
    useState(() => initialDraft?.skillResourceDemiseNarration ?? "");
  const [skillResourceErrorMessage, setSkillResourceErrorMessage] =
    useState<string | null>(null);
  const [characterErrorMessage, setCharacterErrorMessage] = useState<string | null>(null);
  const [resourceErrorMessage, setResourceErrorMessage] = useState<string | null>(null);
  const [markErrorMessage, setMarkErrorMessage] = useState<string | null>(null);
  const [skillErrorMessage, setSkillErrorMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [endChronicleRoute, setEndChronicleRoute] = useState<string | null>(null);
  const [isEndingChronicle, setIsEndingChronicle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ActiveResolvePromptResponse | null>(null);
  const [memoryPlacementMode, setMemoryPlacementMode] =
    useState<MemoryPlacementMode>(
      () => initialDraft?.memoryPlacementMode ?? "create-new",
    );
  const [selectedAppendMemoryId, setSelectedAppendMemoryId] = useState<
    string | null
  >(() => initialDraft?.selectedAppendMemoryId ?? null);
  const [overflowMode, setOverflowMode] = useState<
    "forget-existing" | "move-to-diary" | null
  >(null);
  const [selectedOverflowMemoryId, setSelectedOverflowMemoryId] = useState<
    string | null
  >(null);

  const selectedAppendMemory = mindMemories.find(
    (memory) => memory.id === selectedAppendMemoryId,
  );
  const selectedAppendMemoryIsFull =
    typeof selectedAppendMemory?.entryCount === "number" &&
    selectedAppendMemory.entryCount >= 3;
  const requiresOverflowDecision =
    memoryPlacementMode === "create-new" && mindMemories.length >= 5;
  const skillResourceResolutionState = skillResourceRequiredAction
    ? getSkillResourceResolutionState(skillResourceRequiredAction, {
        resources,
        skills,
      })
    : null;
  const skillResourceIsSubstitution = Boolean(
    skillResourceResolutionState?.substitutionAction,
  );
  const skillResourceResolutionAction = skillResourceIsSubstitution
    ? skillResourceResolutionState?.substitutionAction
    : skillResourceResolutionState?.primaryAction;

  const syncPromptDraft = useCallback(
    (
      overrides: Partial<{
        experienceText: string;
        memoryPlacementMode: MemoryPlacementMode;
        newCharacterDescription: string;
        newCharacterKind: "immortal" | "mortal";
        newCharacterName: string;
        newMarkDescription: string;
        newMarkIsConcealed: boolean;
        newMarkLabel: string;
        newResourceDescription: string;
        newResourceIsStationary: boolean;
        newResourceLabel: string;
        newSkillDescription: string;
        newSkillLabel: string;
        playerEntry: string;
        selectedAppendMemoryId: string | null;
        shouldCreateCharacter: boolean;
        shouldCreateMark: boolean;
        shouldCreateResource: boolean;
        shouldCreateSkill: boolean;
        skillResourceDemiseNarration: string;
        skillResourceRequiredAction: SkillResourceRequiredAction | "";
        skillResourceTargetId: string;
        skillResourceWorstOutcome: string;
      }> = {},
    ) => {
      const nextDraft = {
        experienceText,
        memoryPlacementMode,
        newCharacterDescription,
        newCharacterKind,
        newCharacterName,
        newMarkDescription,
        newMarkIsConcealed,
        newMarkLabel,
        newResourceDescription,
        newResourceIsStationary,
        newResourceLabel,
        newSkillDescription,
        newSkillLabel,
        playerEntry,
        selectedAppendMemoryId,
        shouldCreateCharacter: isAddingCharacter,
        shouldCreateMark: isAddingMark,
        shouldCreateResource: isAddingResource,
        shouldCreateSkill: isAddingSkill,
        skillResourceDemiseNarration,
        skillResourceRequiredAction,
        skillResourceTargetId,
        skillResourceWorstOutcome,
        ...overrides,
      };

      const hasAnyDraftContent =
        Boolean(nextDraft.playerEntry) ||
        Boolean(nextDraft.experienceText) ||
        Boolean(nextDraft.newCharacterName) ||
        Boolean(nextDraft.newCharacterDescription) ||
        Boolean(nextDraft.newMarkLabel) ||
        Boolean(nextDraft.newMarkDescription) ||
        Boolean(nextDraft.newResourceLabel) ||
        Boolean(nextDraft.newResourceDescription) ||
        Boolean(nextDraft.newSkillLabel) ||
        Boolean(nextDraft.newSkillDescription) ||
        Boolean(nextDraft.skillResourceDemiseNarration) ||
        Boolean(nextDraft.skillResourceRequiredAction) ||
        Boolean(nextDraft.skillResourceTargetId) ||
        Boolean(nextDraft.skillResourceWorstOutcome) ||
        Boolean(nextDraft.selectedAppendMemoryId) ||
        nextDraft.memoryPlacementMode === "append-existing" ||
        nextDraft.shouldCreateCharacter ||
        nextDraft.shouldCreateMark ||
        nextDraft.shouldCreateResource ||
        nextDraft.shouldCreateSkill;

      if (!hasAnyDraftContent) {
        clearPromptDraft(chronicleId);
        return;
      }

      savePromptDraft(chronicleId, nextDraft);
    },
    [
      chronicleId,
      experienceText,
      isAddingCharacter,
      isAddingMark,
      isAddingResource,
      isAddingSkill,
      memoryPlacementMode,
      newCharacterDescription,
      newCharacterKind,
      newCharacterName,
      newMarkDescription,
      newMarkIsConcealed,
      newMarkLabel,
      newResourceDescription,
      newResourceIsStationary,
      newResourceLabel,
      newSkillDescription,
      newSkillLabel,
      playerEntry,
      selectedAppendMemoryId,
      skillResourceDemiseNarration,
      skillResourceRequiredAction,
      skillResourceTargetId,
      skillResourceWorstOutcome,
    ],
  );

  useEffect(() => {
    syncPromptDraft();
  }, [syncPromptDraft]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setCharacterErrorMessage(null);
    setMarkErrorMessage(null);
    setResourceErrorMessage(null);
    setSkillErrorMessage(null);
    setSkillResourceErrorMessage(null);

    if (requiresOverflowDecision && (!overflowMode || !selectedOverflowMemoryId)) {
      setErrorMessage(
        "Choose which memory to forget or move into the diary before continuing.",
      );
      return;
    }

    if (memoryPlacementMode === "append-existing" && !selectedAppendMemoryId) {
      setErrorMessage("Choose which Memory receives this Experience.");
      return;
    }

    if (memoryPlacementMode === "append-existing" && selectedAppendMemoryIsFull) {
      setErrorMessage("That Memory is already full.");
      return;
    }

    const normalizedExistingResourceLabels = existingResourceLabels.map((label) =>
      label.trim(),
    );
    const normalizedExistingCharacterNames = existingCharacterNames.map((name) =>
      name.trim(),
    );
    const normalizedExistingMarkLabels = existingMarkLabels.map((label) =>
      label.trim(),
    );
    const normalizedExistingSkillLabels = existingSkillLabels.map((label) =>
      label.trim(),
    );

    if (isAddingResource) {
      const normalizedNewResourceLabel = newResourceLabel.trim();
      const normalizedNewResourceDescription = newResourceDescription.trim();

      if (!normalizedNewResourceLabel || !normalizedNewResourceDescription) {
        setResourceErrorMessage(
          "Name the resource and explain why this prompt made it matter.",
        );
        return;
      }

      if (normalizedExistingResourceLabels.includes(normalizedNewResourceLabel)) {
        setResourceErrorMessage(
          "That resource name is already in the chronicle. Choose different wording.",
        );
        return;
      }
    }

    if (isAddingCharacter) {
      const normalizedNewCharacterName = newCharacterName.trim();
      const normalizedNewCharacterDescription = newCharacterDescription.trim();

      if (!normalizedNewCharacterName || !normalizedNewCharacterDescription) {
        setCharacterErrorMessage(
          "Name the character and describe who this prompt brought forward.",
        );
        return;
      }

      if (normalizedExistingCharacterNames.includes(normalizedNewCharacterName)) {
        setCharacterErrorMessage(
          "That character name is already in the chronicle. Choose different wording.",
        );
        return;
      }
    }

    if (isAddingMark) {
      const normalizedNewMarkLabel = newMarkLabel.trim();
      const normalizedNewMarkDescription = newMarkDescription.trim();

      if (!normalizedNewMarkLabel || !normalizedNewMarkDescription) {
        setMarkErrorMessage(
          "Name the mark and describe what this prompt changed.",
        );
        return;
      }

      if (normalizedExistingMarkLabels.includes(normalizedNewMarkLabel)) {
        setMarkErrorMessage(
          "That mark name is already in the chronicle. Choose different wording.",
        );
        return;
      }
    }

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

    if (skillResourceRequiredAction) {
      if (skillResourceResolutionState?.isGameEnding) {
        setSkillResourceErrorMessage(
          "No legal Skill or Resource remains for this prompt.",
        );
        return;
      }

      if (!skillResourceResolutionAction || !skillResourceTargetId) {
        setSkillResourceErrorMessage(
          "Choose an available Skill or Resource for this prompt.",
        );
        return;
      }

      if (skillResourceIsSubstitution && !skillResourceWorstOutcome.trim()) {
        setSkillResourceErrorMessage(
          "Describe the worst possible outcome before setting this substitution into memory.",
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
              memoryPlacementMode === "append-existing" && selectedAppendMemoryId
                ? {
                    mode: "append-existing",
                    targetMemoryId: selectedAppendMemoryId,
                  }
                : requiresOverflowDecision && overflowMode && selectedOverflowMemoryId
                ? {
                    memoryId: selectedOverflowMemoryId,
                    mode: overflowMode,
                  }
                : {
                    mode: "create-new",
                  },
            newCharacter: isAddingCharacter
              ? {
                  description: newCharacterDescription,
                  kind: newCharacterKind,
                  name: newCharacterName,
                }
              : undefined,
            newMark: isAddingMark
              ? {
                  description: newMarkDescription,
                  isConcealed: newMarkIsConcealed,
                  label: newMarkLabel,
                }
              : undefined,
            newResource: isAddingResource
              ? {
                  description: newResourceDescription,
                  isStationary: newResourceIsStationary,
                  label: newResourceLabel,
                }
              : undefined,
            newSkill: isAddingSkill
              ? {
                  description: newSkillDescription,
                  label: newSkillLabel,
                }
              : undefined,
            playerEntry,
            sessionId: initialSessionId,
            skillResourceChange:
              skillResourceRequiredAction &&
              skillResourceResolutionAction &&
              skillResourceTargetId
                ? {
                    isSubstitution: skillResourceIsSubstitution,
                    requiredAction: skillResourceRequiredAction,
                    resolutionAction: skillResourceResolutionAction,
                    targetId: skillResourceTargetId,
                    worstOutcomeNarration: skillResourceWorstOutcome,
                  }
                : undefined,
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
          "That character name is already in the chronicle. Choose different wording."
        ) {
          setCharacterErrorMessage(payload.error);
          return;
        }

        if (
          payload.error ===
          "That resource name is already in the chronicle. Choose different wording."
        ) {
          setResourceErrorMessage(payload.error);
          return;
        }

        if (
          payload.error ===
          "That mark name is already in the chronicle. Choose different wording."
        ) {
          setMarkErrorMessage(payload.error);
          return;
        }

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

      setResult({
        ...payload,
        resolvedPromptNumber: currentPromptNumber,
        resolvedSessionId: initialSessionId,
      });
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
      setIsAddingResource(false);
      setNewResourceDescription("");
      setNewResourceIsStationary(false);
      setNewResourceLabel("");
      setResourceErrorMessage(null);
      setIsAddingCharacter(false);
      setNewCharacterDescription("");
      setNewCharacterKind("mortal");
      setNewCharacterName("");
      setCharacterErrorMessage(null);
      setIsAddingMark(false);
      setNewMarkDescription("");
      setNewMarkIsConcealed(false);
      setNewMarkLabel("");
      setMarkErrorMessage(null);
      setIsAddingSkill(false);
      setNewSkillDescription("");
      setNewSkillLabel("");
      setSkillErrorMessage(null);
      setSkillResourceRequiredAction("");
      setSkillResourceTargetId("");
      setSkillResourceWorstOutcome("");
      setSkillResourceDemiseNarration("");
      setSkillResourceErrorMessage(null);
      setMemoryPlacementMode("create-new");
      setSelectedAppendMemoryId(null);
      setOverflowMode(null);
      setSelectedOverflowMemoryId(null);
      clearPromptDraft(chronicleId);
    } catch {
      setErrorMessage("The prompt could not be resolved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeResult =
    result?.resolvedPromptNumber === currentPromptNumber &&
    result.resolvedSessionId === initialSessionId
      ? result
      : null;
  const consequenceSummary = activeResult?.archiveEvents?.[0]?.summary;
  const nextPromptNumber = activeResult?.nextPrompt?.promptNumber;
  const hasResolvedPrompt = Boolean(activeResult);

  function handleSkillComposerToggle() {
    if (requiresPromptSkill) {
      return;
    }

    if (isAddingSkill) {
      syncPromptDraft({
        newSkillDescription: "",
        newSkillLabel: "",
        shouldCreateSkill: false,
      });

      setIsAddingSkill(false);
      setNewSkillLabel("");
      setNewSkillDescription("");
      setSkillErrorMessage(null);
      return;
    }

    setIsAddingSkill(true);
    setSkillErrorMessage(null);
    if (promptEffect?.skill?.label && !newSkillLabel.trim()) {
      setNewSkillLabel(promptEffect.skill.label);
      syncPromptDraft({
        newSkillLabel: promptEffect.skill.label,
        shouldCreateSkill: true,
      });
    }
  }

  function handleResourceComposerToggle() {
    if (requiresPromptResource) {
      return;
    }

    if (isAddingResource) {
      syncPromptDraft({
        newResourceDescription: "",
        newResourceIsStationary: false,
        newResourceLabel: "",
        shouldCreateResource: false,
      });

      setIsAddingResource(false);
      setNewResourceDescription("");
      setNewResourceIsStationary(false);
      setNewResourceLabel("");
      setResourceErrorMessage(null);
      return;
    }

    setIsAddingResource(true);
    setResourceErrorMessage(null);
    if (promptEffect?.resource?.isStationary && !newResourceIsStationary) {
      setNewResourceIsStationary(true);
      syncPromptDraft({
        newResourceIsStationary: true,
        shouldCreateResource: true,
      });
    }
  }

  function handleCharacterComposerToggle() {
    if (isAddingCharacter) {
      syncPromptDraft({
        newCharacterDescription: "",
        newCharacterKind: "mortal",
        newCharacterName: "",
        shouldCreateCharacter: false,
      });

      setIsAddingCharacter(false);
      setNewCharacterDescription("");
      setNewCharacterKind("mortal");
      setNewCharacterName("");
      setCharacterErrorMessage(null);
      return;
    }

    setIsAddingCharacter(true);
    setCharacterErrorMessage(null);
  }

  function handleMarkComposerToggle() {
    if (isAddingMark) {
      syncPromptDraft({
        newMarkDescription: "",
        newMarkIsConcealed: false,
        newMarkLabel: "",
        shouldCreateMark: false,
      });

      setIsAddingMark(false);
      setNewMarkDescription("");
      setNewMarkIsConcealed(false);
      setNewMarkLabel("");
      setMarkErrorMessage(null);
      return;
    }

    setIsAddingMark(true);
    setMarkErrorMessage(null);
  }

  function handleSkillResourceRequiredActionChange(
    value: SkillResourceRequiredAction | "",
  ) {
    setSkillResourceRequiredAction(value);
    setSkillResourceTargetId("");
    setSkillResourceWorstOutcome("");
    setSkillResourceDemiseNarration("");
    setEndChronicleRoute(null);
    setSkillResourceErrorMessage(null);
    syncPromptDraft({
      skillResourceDemiseNarration: "",
      skillResourceRequiredAction: value,
      skillResourceTargetId: "",
      skillResourceWorstOutcome: "",
    });
  }

  function handleSkillResourceTargetChange(value: string) {
    setSkillResourceTargetId(value);
    setSkillResourceErrorMessage(null);
    syncPromptDraft({ skillResourceTargetId: value });
  }

  function handleSkillResourceWorstOutcomeChange(value: string) {
    setSkillResourceWorstOutcome(value);
    setSkillResourceErrorMessage(null);
    syncPromptDraft({ skillResourceWorstOutcome: value });
  }

  function handleSkillResourceDemiseNarrationChange(value: string) {
    setSkillResourceDemiseNarration(value);
    setSkillResourceErrorMessage(null);
    syncPromptDraft({ skillResourceDemiseNarration: value });
  }

  async function handleEndChronicle() {
    setSkillResourceErrorMessage(null);
    setErrorMessage(null);

    if (!skillResourceRequiredAction) {
      setSkillResourceErrorMessage(
        "Choose the Skill or Resource change the prompt requires.",
      );
      return;
    }

    if (!skillResourceDemiseNarration.trim()) {
      setSkillResourceErrorMessage(
        "Narrate the vampire's demise before ending the chronicle.",
      );
      return;
    }

    setIsEndingChronicle(true);

    try {
      const response = await fetch(`/api/chronicles/${chronicleId}/play/end`, {
        body: JSON.stringify({
          narration: skillResourceDemiseNarration,
          requiredAction: skillResourceRequiredAction,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as EndChronicleResponse & {
        error?: string;
      };

      if (!response.ok) {
        setSkillResourceErrorMessage(
          payload.error || "The chronicle could not be ended.",
        );
        return;
      }

      setEndChronicleRoute(payload.nextRoute ?? `/chronicles/${chronicleId}/recap`);
      clearPromptDraft(chronicleId);
    } catch {
      setSkillResourceErrorMessage("The chronicle could not be ended.");
    } finally {
      setIsEndingChronicle(false);
    }
  }

  function handleMemoryPlacementModeChange(mode: MemoryPlacementMode) {
    setMemoryPlacementMode(mode);
    setErrorMessage(null);

    if (mode === "create-new") {
      setSelectedAppendMemoryId(null);
      syncPromptDraft({
        memoryPlacementMode: mode,
        selectedAppendMemoryId: null,
      });
      return;
    }

    syncPromptDraft({ memoryPlacementMode: mode });
  }

  function handleSelectedAppendMemoryChange(memoryId: string) {
    setSelectedAppendMemoryId(memoryId);
    setErrorMessage(null);
    syncPromptDraft({ selectedAppendMemoryId: memoryId });
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

      {!hasResolvedPrompt && promptEffect?.guidance ? (
        <SurfacePanel className="border-gold/20 bg-gold/8 px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Prompt requirement
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {promptEffect.guidance}
          </p>
        </SurfacePanel>
      ) : null}

      {!hasResolvedPrompt ? (
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
          {mindMemories.length > 0 ? (
            <MemoryPlacementPanel
              memories={mindMemories}
              onModeChange={handleMemoryPlacementModeChange}
              onSelectedMemoryChange={handleSelectedAppendMemoryChange}
              selectedMemoryId={selectedAppendMemoryId}
              selectedMode={memoryPlacementMode}
            />
          ) : null}
          <SkillResourceChangePanel
            errorMessage={skillResourceErrorMessage}
            onRequiredActionChange={handleSkillResourceRequiredActionChange}
            onTargetChange={handleSkillResourceTargetChange}
            onWorstOutcomeChange={handleSkillResourceWorstOutcomeChange}
            requiredAction={skillResourceRequiredAction}
            resources={resources}
            selectedTargetId={skillResourceTargetId}
            skills={skills}
            worstOutcomeNarration={skillResourceWorstOutcome}
          />
          {skillResourceResolutionState?.isGameEnding ? (
            <SurfacePanel className="space-y-4 border-error/20 bg-error/10 px-6 py-6 sm:px-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
                  No legal substitution
                </p>
                <h3 className="mt-3 font-heading text-2xl text-ink">
                  End the chronicle with the prompt as its last wound.
                </h3>
              </div>
              <RitualTextarea
                label="Demise narration"
                name="skillResourceDemiseNarration"
                onChange={handleSkillResourceDemiseNarrationChange}
                placeholder="Narrate the vampire's demise using the prompt for inspiration."
                rows={4}
                value={skillResourceDemiseNarration}
              />
              {endChronicleRoute ? (
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92"
                  href={endChronicleRoute}
                >
                  Go to recap
                </a>
              ) : (
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92 disabled:cursor-wait disabled:opacity-75"
                  disabled={isEndingChronicle}
                  onClick={handleEndChronicle}
                  type="button"
                >
                  {isEndingChronicle ? "Ending the chronicle..." : "End the chronicle"}
                </button>
              )}
            </SurfacePanel>
          ) : null}
          <PromptSkillComposer
            description={newSkillDescription}
            errorMessage={skillErrorMessage}
            isOpen={isAddingSkill}
            isRequired={requiresPromptSkill}
            label={newSkillLabel}
            onDescriptionChange={setNewSkillDescription}
            onLabelChange={setNewSkillLabel}
            onToggle={handleSkillComposerToggle}
          />
          <PromptResourceComposer
            description={newResourceDescription}
            errorMessage={resourceErrorMessage}
            isOpen={isAddingResource}
            isRequired={requiresPromptResource}
            isStationary={newResourceIsStationary}
            label={newResourceLabel}
            onDescriptionChange={setNewResourceDescription}
            onLabelChange={setNewResourceLabel}
            onStationaryChange={setNewResourceIsStationary}
            onToggle={handleResourceComposerToggle}
          />
          <PromptCharacterComposer
            description={newCharacterDescription}
            errorMessage={characterErrorMessage}
            isOpen={isAddingCharacter}
            kind={newCharacterKind}
            name={newCharacterName}
            onDescriptionChange={setNewCharacterDescription}
            onKindChange={setNewCharacterKind}
            onNameChange={setNewCharacterName}
            onToggle={handleCharacterComposerToggle}
          />
          <PromptMarkComposer
            description={newMarkDescription}
            errorMessage={markErrorMessage}
            isConcealed={newMarkIsConcealed}
            isOpen={isAddingMark}
            label={newMarkLabel}
            onConcealedChange={setNewMarkIsConcealed}
            onDescriptionChange={setNewMarkDescription}
            onLabelChange={setNewMarkLabel}
            onToggle={handleMarkComposerToggle}
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
      ) : null}
    </div>
  );
}
