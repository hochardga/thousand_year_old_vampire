"use client";

import { RitualTextarea } from "@/components/ritual/RitualTextarea";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type PromptMarkComposerProps = {
  description: string;
  errorMessage?: string | null;
  isConcealed: boolean;
  isOpen: boolean;
  label: string;
  onConcealedChange: (value: boolean) => void;
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onToggle: () => void;
};

export function PromptMarkComposer({
  description,
  errorMessage = null,
  isConcealed,
  isOpen,
  label,
  onConcealedChange,
  onDescriptionChange,
  onLabelChange,
  onToggle,
}: PromptMarkComposerProps) {
  return (
    <SurfacePanel className="space-y-4 border-gold/18 bg-gold/6 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Prompt-created mark
          </p>
          <h3 className="mt-3 font-heading text-2xl text-ink">
            Let the prompt leave a new sign behind.
          </h3>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40"
          onClick={onToggle}
          type="button"
        >
          {isOpen ? "Remove the new mark" : "Add a mark from this prompt"}
        </button>
      </div>

      {isOpen ? (
        <div className="space-y-4">
          <label className="block space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
              Mark name
            </span>
            <input
              className="min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
              name="newMarkLabel"
              onChange={(event) => onLabelChange(event.target.value)}
              placeholder="Name the sign the prompt leaves on the vampire."
              type="text"
              value={label}
            />
          </label>

          <RitualTextarea
            label="What changed"
            name="newMarkDescription"
            onChange={onDescriptionChange}
            placeholder="Describe the visible or hidden mark and what it means."
            rows={4}
            value={description}
          />

          <label className="flex items-start gap-3 rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-ink shadow-inner shadow-ink/5">
            <input
              aria-label="Concealed"
              checked={isConcealed}
              className="mt-1 h-4 w-4 rounded border-ink/20 text-nocturne focus:ring-gold/50"
              name="newMarkConcealed"
              onChange={(event) => onConcealedChange(event.target.checked)}
              type="checkbox"
            />
            <span className="space-y-1">
              <span className="block font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
                Concealed
              </span>
              <span className="block text-sm leading-relaxed text-ink-muted">
                Use this when the mark can be hidden from ordinary witnesses.
              </span>
            </span>
          </label>

          {errorMessage ? <p className="text-sm text-ink">{errorMessage}</p> : null}
        </div>
      ) : null}
    </SurfacePanel>
  );
}
