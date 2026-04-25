"use client";

import { RitualTextarea } from "@/components/ritual/RitualTextarea";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type PromptSkillComposerProps = {
  description: string;
  errorMessage?: string | null;
  isOpen: boolean;
  isRequired?: boolean;
  label: string;
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onToggle: () => void;
};

export function PromptSkillComposer({
  description,
  errorMessage = null,
  isOpen,
  isRequired = false,
  label,
  onDescriptionChange,
  onLabelChange,
  onToggle,
}: PromptSkillComposerProps) {
  return (
    <SurfacePanel className="space-y-4 border-gold/18 bg-gold/6 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Prompt-created skill
          </p>
          <h3 className="mt-3 font-heading text-2xl text-ink">
            Let the prompt leave a new capability behind.
          </h3>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40"
          disabled={isRequired}
          onClick={onToggle}
          type="button"
        >
          {isRequired
            ? "Required by this prompt"
            : isOpen
              ? "Remove the new skill"
              : "Add a skill from this prompt"}
        </button>
      </div>

      {isOpen ? (
        <div className="space-y-4">
          <label className="block space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
              Skill name
            </span>
            <input
              className="min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
              name="newSkillLabel"
              onChange={(event) => onLabelChange(event.target.value)}
              placeholder="Name the capability the prompt leaves behind."
              type="text"
              value={label}
            />
          </label>

          <RitualTextarea
            label="Why this skill now"
            name="newSkillDescription"
            onChange={onDescriptionChange}
            placeholder="Describe how this prompt changed what the vampire can do."
            rows={4}
            value={description}
          />

          {errorMessage ? <p className="text-sm text-ink">{errorMessage}</p> : null}
        </div>
      ) : null}
    </SurfacePanel>
  );
}
