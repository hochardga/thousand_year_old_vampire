"use client";

import { RitualTextarea } from "@/components/ritual/RitualTextarea";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type PromptCharacterComposerProps = {
  description: string;
  errorMessage?: string | null;
  isOpen: boolean;
  kind: "immortal" | "mortal";
  name: string;
  onDescriptionChange: (value: string) => void;
  onKindChange: (value: "immortal" | "mortal") => void;
  onNameChange: (value: string) => void;
  onToggle: () => void;
};

export function PromptCharacterComposer({
  description,
  errorMessage = null,
  isOpen,
  kind,
  name,
  onDescriptionChange,
  onKindChange,
  onNameChange,
  onToggle,
}: PromptCharacterComposerProps) {
  return (
    <SurfacePanel className="space-y-4 border-gold/18 bg-gold/6 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Prompt-created character
          </p>
          <h3 className="mt-3 font-heading text-2xl text-ink">
            Let the prompt leave a person behind.
          </h3>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40"
          onClick={onToggle}
          type="button"
        >
          {isOpen
            ? "Remove the new character"
            : "Add a character from this prompt"}
        </button>
      </div>

      {isOpen ? (
        <div className="space-y-4">
          <label className="block space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
              Character name
            </span>
            <input
              className="min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
              name="newCharacterName"
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Name the person the prompt brings into the chronicle."
              type="text"
              value={name}
            />
          </label>

          <RitualTextarea
            label="Who they are"
            name="newCharacterDescription"
            onChange={onDescriptionChange}
            placeholder="Describe their place in the vampire's existence."
            rows={4}
            value={description}
          />

          <fieldset className="space-y-3 rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-ink shadow-inner shadow-ink/5">
            <legend className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
              Character kind
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-ink">
                <input
                  checked={kind === "mortal"}
                  className="h-4 w-4 border-ink/20 text-nocturne focus:ring-gold/50"
                  name="newCharacterKind"
                  onChange={() => onKindChange("mortal")}
                  type="radio"
                />
                Mortal
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-ink">
                <input
                  checked={kind === "immortal"}
                  className="h-4 w-4 border-ink/20 text-nocturne focus:ring-gold/50"
                  name="newCharacterKind"
                  onChange={() => onKindChange("immortal")}
                  type="radio"
                />
                Immortal
              </label>
            </div>
          </fieldset>

          {errorMessage ? <p className="text-sm text-ink">{errorMessage}</p> : null}
        </div>
      ) : null}
    </SurfacePanel>
  );
}
