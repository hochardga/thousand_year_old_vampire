"use client";

import { SurfacePanel } from "@/components/ui/SurfacePanel";

const groundingSuggestions = [
  "Reduce the level of detail when a prompt feels too close.",
  "Pause after a difficult turn and come back another night.",
  "Let implication carry the weight when naming every wound would be too much.",
] as const;

export function SafetyCheckpointPanel() {
  return (
    <SurfacePanel className="border-gold/20 bg-nocturne/5 px-6 py-6 sm:px-8">
      <div className="space-y-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            A deliberate threshold
          </p>
          <h2 className="mt-3 font-heading text-3xl leading-tight text-ink sm:text-4xl">
            Pause at the threshold before the first prompt.
          </h2>
          <p className="mt-3 max-w-reading text-sm leading-relaxed text-ink-muted">
            This chronicle asks for mature, solitary, and sometimes painful
            material. You can continue now, step away, or return another night
            without penalty.
          </p>
        </div>

        <ul className="space-y-3 text-sm leading-relaxed text-ink-muted">
          {groundingSuggestions.map((suggestion) => (
            <li key={suggestion} className="flex gap-3">
              <span aria-hidden="true" className="text-gold/80">
                +
              </span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </SurfacePanel>
  );
}
