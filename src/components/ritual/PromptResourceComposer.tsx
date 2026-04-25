"use client";

import { RitualTextarea } from "@/components/ritual/RitualTextarea";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type PromptResourceComposerProps = {
  description: string;
  errorMessage?: string | null;
  isOpen: boolean;
  isRequired?: boolean;
  isStationary: boolean;
  label: string;
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onStationaryChange: (value: boolean) => void;
  onToggle: () => void;
};

export function PromptResourceComposer({
  description,
  errorMessage = null,
  isOpen,
  isRequired = false,
  isStationary,
  label,
  onDescriptionChange,
  onLabelChange,
  onStationaryChange,
  onToggle,
}: PromptResourceComposerProps) {
  return (
    <SurfacePanel className="space-y-4 border-gold/18 bg-gold/6 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Prompt-created resource
          </p>
          <h3 className="mt-3 font-heading text-2xl text-ink">
            Let the prompt leave something durable behind.
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
              ? "Remove the new resource"
              : "Add a resource from this prompt"}
        </button>
      </div>

      {isOpen ? (
        <div className="space-y-4">
          <label className="block space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
              Resource name
            </span>
            <input
              className="min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
              name="newResourceLabel"
              onChange={(event) => onLabelChange(event.target.value)}
              placeholder="Name the thing, shelter, leverage, or object the prompt creates."
              type="text"
              value={label}
            />
          </label>

          <RitualTextarea
            label="Why it matters"
            name="newResourceDescription"
            onChange={onDescriptionChange}
            placeholder="Describe why this resource now shapes the vampire's survival."
            rows={4}
            value={description}
          />

          <label className="flex items-start gap-3 rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-ink shadow-inner shadow-ink/5">
            <input
              aria-label="Stationary"
              checked={isStationary}
              className="mt-1 h-4 w-4 rounded border-ink/20 text-nocturne focus:ring-gold/50"
              name="newResourceStationary"
              onChange={(event) => onStationaryChange(event.target.checked)}
              type="checkbox"
            />
            <span className="space-y-1">
              <span className="block font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
                Stationary
              </span>
              <span className="block text-sm leading-relaxed text-ink-muted">
                Use this when the resource is rooted in one place, such as a lair,
                workshop, or hidden refuge.
              </span>
            </span>
          </label>

          {errorMessage ? <p className="text-sm text-ink">{errorMessage}</p> : null}
        </div>
      ) : null}
    </SurfacePanel>
  );
}
