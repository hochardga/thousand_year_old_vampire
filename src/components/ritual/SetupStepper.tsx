"use client";

import { useEffect, useState } from "react";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import {
  clearSetupDraft,
  loadSetupDraft,
  saveSetupDraft,
} from "@/lib/chronicles/localDrafts";
import type { ChronicleSetupPayload } from "@/types/chronicle";
import { RitualTextarea } from "./RitualTextarea";

type SetupStepperProps = {
  chronicleId: string;
  chronicleTitle: string;
};

const defaultSetupDraft: ChronicleSetupPayload = {
  immortalCharacter: {
    description: "",
    kind: "immortal",
    name: "",
  },
  initialCharacters: [
    {
      description: "",
      kind: "mortal",
      name: "",
    },
  ],
  initialResources: [
    {
      description: "",
      isStationary: false,
      label: "",
    },
  ],
  initialSkills: [
    {
      description: "",
      label: "",
    },
  ],
  mark: {
    description: "",
    isConcealed: true,
    label: "",
  },
  mortalSummary: "",
  setupMemories: [
    {
      entryText: "",
      title: "",
    },
  ],
};

const stepDefinitions = [
  {
    heading: "Begin with the life you had before.",
    id: "before-life",
    label: "The life you had before",
  },
  {
    heading: "Name what you can still carry into the night.",
    id: "traits",
    label: "What you can still carry",
  },
  {
    heading: "Record who stood beside you, and who changed you.",
    id: "characters",
    label: "Who stood beside you",
  },
  {
    heading: "Write the mark the night left upon you.",
    id: "mark",
    label: "What the night left on you",
  },
  {
    heading: "Gather the first memory fragments you refuse to lose.",
    id: "memories",
    label: "First memory fragments",
  },
] as const;

function mergeWithDefaultDraft(
  draft: ChronicleSetupPayload | null,
): ChronicleSetupPayload {
  return {
    ...defaultSetupDraft,
    ...draft,
    immortalCharacter: {
      ...defaultSetupDraft.immortalCharacter,
      ...(draft?.immortalCharacter ?? {}),
    },
    initialCharacters:
      draft?.initialCharacters?.length
        ? draft.initialCharacters.map((character) => ({
            ...defaultSetupDraft.initialCharacters[0],
            ...character,
          }))
        : defaultSetupDraft.initialCharacters,
    initialResources:
      draft?.initialResources?.length
        ? draft.initialResources.map((resource) => ({
            ...defaultSetupDraft.initialResources[0],
            ...resource,
          }))
        : defaultSetupDraft.initialResources,
    initialSkills:
      draft?.initialSkills?.length
        ? draft.initialSkills.map((skill) => ({
            ...defaultSetupDraft.initialSkills[0],
            ...skill,
          }))
        : defaultSetupDraft.initialSkills,
    mark: {
      ...defaultSetupDraft.mark,
      ...(draft?.mark ?? {}),
    },
    setupMemories:
      draft?.setupMemories?.length
        ? draft.setupMemories.map((memory) => ({
            ...defaultSetupDraft.setupMemories[0],
            ...memory,
          }))
        : defaultSetupDraft.setupMemories,
  };
}

function SetupTextInput({
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <div className="space-y-3">
      <label
        htmlFor={name}
        className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
      />
    </div>
  );
}

export function SetupStepper({
  chronicleId,
  chronicleTitle,
}: SetupStepperProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState(() =>
    mergeWithDefaultDraft(loadSetupDraft(chronicleId)),
  );

  useEffect(() => {
    saveSetupDraft(chronicleId, draft);
  }, [chronicleId, draft]);

  const currentStep = stepDefinitions[stepIndex];

  async function handlePrimaryAction() {
    if (stepIndex < stepDefinitions.length - 1) {
      setStepIndex((index) => Math.min(stepDefinitions.length - 1, index + 1));
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/chronicles/${chronicleId}/setup/complete`,
        {
          body: JSON.stringify(draft),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        nextRoute?: string;
      };

      if (!response.ok || !payload.nextRoute) {
        setErrorMessage(
          payload.error || "The chronicle could not be completed just now.",
        );
        return;
      }

      clearSetupDraft(chronicleId);
      window.location.assign(payload.nextRoute);
    } catch {
      setErrorMessage("The chronicle could not be completed just now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <SurfacePanel tone="nocturne" className="px-6 py-7 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Becoming-undead sequence
        </p>
        <h2 className="mt-4 font-heading text-4xl leading-tight text-surface sm:text-5xl">
          {chronicleTitle}
        </h2>
        <p className="mt-3 max-w-reading text-base leading-relaxed text-surface/76">
          Move through the life that brought you here, then let the first night
          take shape without breaking the hush of the room.
        </p>
      </SurfacePanel>

      <SurfacePanel className="px-6 py-6 sm:px-8">
        <div className="flex flex-wrap gap-2">
          {stepDefinitions.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setStepIndex(index)}
              className={`rounded-soft border px-3 py-2 text-left text-sm transition-colors duration-160 ease-ritual ${
                index === stepIndex
                  ? "border-gold/60 bg-gold/10 text-ink"
                  : "border-ink/10 bg-surface text-ink-muted hover:border-gold/30 hover:text-ink"
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel className="space-y-6 px-6 py-6 sm:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Step {stepIndex + 1} of {stepDefinitions.length}
          </p>
          <h1 className="mt-3 font-heading text-4xl leading-tight text-ink">
            {currentStep.heading}
          </h1>
        </div>

        {errorMessage ? (
          <SurfacePanel className="border-error/20 bg-error/10 px-5 py-4">
            <p className="text-sm text-ink">{errorMessage}</p>
          </SurfacePanel>
        ) : null}

        {stepIndex === 0 ? (
          <RitualTextarea
            label="Mortal summary"
            name="mortalSummary"
            value={draft.mortalSummary}
            onChange={(value) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                mortalSummary: value,
              }))
            }
            placeholder="Tell the life you had before the hunger learned your name."
            hint="Keep this grounded in the life, habits, and loyalties that mattered before undeath."
          />
        ) : null}

        {stepIndex === 1 ? (
          <div className="grid gap-5">
            <SetupTextInput
              label="First skill"
              name="firstSkill"
              value={draft.initialSkills[0]?.label ?? ""}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  initialSkills: [
                    {
                      ...currentDraft.initialSkills[0],
                      label: value,
                    },
                  ],
                }))
              }
              placeholder="Quiet Devotion"
            />
            <RitualTextarea
              label="Why this skill mattered"
              name="firstSkillDescription"
              rows={4}
              value={draft.initialSkills[0]?.description ?? ""}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  initialSkills: [
                    {
                      ...currentDraft.initialSkills[0],
                      description: value,
                    },
                  ],
                }))
              }
            />
            <SetupTextInput
              label="First resource"
              name="firstResource"
              value={draft.initialResources[0]?.label ?? ""}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  initialResources: [
                    {
                      ...currentDraft.initialResources[0],
                      label: value,
                    },
                  ],
                }))
              }
              placeholder="The Marsh House"
            />
            <RitualTextarea
              label="Why it matters"
              name="firstResourceDescription"
              rows={4}
              value={draft.initialResources[0]?.description ?? ""}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  initialResources: [
                    {
                      ...currentDraft.initialResources[0],
                      description: value,
                    },
                  ],
                }))
              }
            />
          </div>
        ) : null}

        {stepIndex === 2 ? (
          <div className="grid gap-5">
            <SetupTextInput
              label="A mortal character"
              name="firstCharacter"
              value={draft.initialCharacters[0]?.name ?? ""}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  initialCharacters: [
                    {
                      ...currentDraft.initialCharacters[0],
                      name: value,
                    },
                  ],
                }))
              }
              placeholder="Marta"
            />
            <RitualTextarea
              label="Why they still matter"
              name="firstCharacterDescription"
              rows={4}
              value={draft.initialCharacters[0]?.description ?? ""}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  initialCharacters: [
                    {
                      ...currentDraft.initialCharacters[0],
                      description: value,
                    },
                  ],
                }))
              }
            />
            <SetupTextInput
              label="The immortal who made you"
              name="immortalCharacterName"
              value={draft.immortalCharacter.name}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  immortalCharacter: {
                    ...currentDraft.immortalCharacter,
                    name: value,
                  },
                }))
              }
              placeholder="Aurelia"
            />
            <RitualTextarea
              label="How they changed you"
              name="immortalCharacterDescription"
              rows={4}
              value={draft.immortalCharacter.description}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  immortalCharacter: {
                    ...currentDraft.immortalCharacter,
                    description: value,
                  },
                }))
              }
            />
          </div>
        ) : null}

        {stepIndex === 3 ? (
          <div className="grid gap-5">
            <SetupTextInput
              label="The mark"
              name="markLabel"
              value={draft.mark.label}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  mark: {
                    ...currentDraft.mark,
                    label: value,
                  },
                }))
              }
              placeholder="Unsteady Reflection"
            />
            <RitualTextarea
              label="How it shows itself"
              name="markDescription"
              rows={4}
              value={draft.mark.description}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  mark: {
                    ...currentDraft.mark,
                    description: value,
                  },
                }))
              }
            />
          </div>
        ) : null}

        {stepIndex === 4 ? (
          <div className="grid gap-5">
            <SetupTextInput
              label="First memory title"
              name="firstMemoryTitle"
              value={draft.setupMemories[0]?.title ?? ""}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  setupMemories: [
                    {
                      ...currentDraft.setupMemories[0],
                      title: value,
                    },
                  ],
                }))
              }
              placeholder="My vigil by the sickbed"
            />
            <RitualTextarea
              label="First memory entry"
              name="firstMemoryEntry"
              rows={5}
              value={draft.setupMemories[0]?.entryText ?? ""}
              onChange={(value) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  setupMemories: [
                    {
                      ...currentDraft.setupMemories[0],
                      entryText: value,
                    },
                  ],
                }))
              }
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-5 py-3 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            disabled={stepIndex === 0}
          >
            Return to the previous threshold
          </button>
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92"
            disabled={isSubmitting}
          >
            {stepIndex === stepDefinitions.length - 1
              ? isSubmitting
                ? "Opening the first prompt..."
                : "Enter the first prompt"
              : "Continue to the next threshold"}
          </button>
        </div>
      </SurfacePanel>
    </div>
  );
}
