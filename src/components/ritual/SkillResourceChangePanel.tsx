"use client";

import { RitualTextarea } from "@/components/ritual/RitualTextarea";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import {
  getSkillResourceResolutionState,
  type SkillResourceRequiredAction,
  type SkillResourceResource,
  type SkillResourceSkill,
} from "@/lib/chronicles/skillResourceRules";

type SkillResourceChangePanelProps = {
  errorMessage?: string | null;
  onRequiredActionChange: (value: SkillResourceRequiredAction | "") => void;
  onTargetChange: (value: string) => void;
  onWorstOutcomeChange: (value: string) => void;
  requiredAction: SkillResourceRequiredAction | "";
  resources: SkillResourceResource[];
  selectedTargetId: string;
  skills: SkillResourceSkill[];
  worstOutcomeNarration: string;
};

const actionLabels: Record<SkillResourceRequiredAction, string> = {
  "check-skill": "Check a Skill",
  "lose-resource": "Lose a Resource",
  "lose-skill": "Lose a Skill",
};

function targetDescription(
  target: SkillResourceSkill | SkillResourceResource,
) {
  const details: string[] = [];

  if (target.status === "checked") {
    details.push("checked");
  }

  if ("isStationary" in target && target.isStationary) {
    details.push("stationary");
  }

  return details.length > 0 ? ` (${details.join(", ")})` : "";
}

export function SkillResourceChangePanel({
  errorMessage = null,
  onRequiredActionChange,
  onTargetChange,
  onWorstOutcomeChange,
  requiredAction,
  resources,
  selectedTargetId,
  skills,
  worstOutcomeNarration,
}: SkillResourceChangePanelProps) {
  const resolutionState = requiredAction
    ? getSkillResourceResolutionState(requiredAction, {
        resources,
        skills,
      })
    : null;
  const isSubstitution = Boolean(resolutionState?.substitutionAction);
  const targetAction = isSubstitution
    ? resolutionState?.substitutionAction
    : resolutionState?.primaryAction;
  const targets = isSubstitution
    ? (resolutionState?.substitutionTargets ?? [])
    : (resolutionState?.primaryTargets ?? []);

  return (
    <SurfacePanel className="space-y-4 border-gold/18 bg-gold/6 px-6 py-6 sm:px-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
          Skill and resource rules
        </p>
        <h3 className="mt-3 font-heading text-2xl text-ink">
          Spend what the prompt asks to change.
        </h3>
      </div>

      <label className="block space-y-3">
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
          Prompt requires
        </span>
        <select
          className="min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual focus:border-gold/70"
          id="skillResourceRequiredAction"
          name="skillResourceRequiredAction"
          onChange={(event) =>
            onRequiredActionChange(
              event.target.value as SkillResourceRequiredAction | "",
            )
          }
          value={requiredAction}
        >
          <option value="">No Skill or Resource change</option>
          <option value="check-skill">Check a Skill</option>
          <option value="lose-skill">Lose a Skill</option>
          <option value="lose-resource">Lose a Resource</option>
        </select>
      </label>

      {resolutionState?.isGameEnding ? (
        <div className="rounded-soft border border-error/20 bg-error/10 px-4 py-3 text-sm leading-relaxed text-ink">
          No legal Skill or Resource remains for this prompt.
        </div>
      ) : null}

      {requiredAction && targets.length > 0 && targetAction ? (
        <fieldset className="space-y-3">
          <legend className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            {isSubstitution
              ? `Substitute: ${actionLabels[targetAction]}`
              : actionLabels[targetAction]}
          </legend>
          {isSubstitution ? (
            <p className="text-sm leading-relaxed text-ink-muted">
              The requested trait is unavailable, so the rules allow this
              Skill/Resource substitution.
            </p>
          ) : null}
          <div className="grid gap-2">
            {targets.map((target) => (
              <label
                className="flex items-start gap-3 rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-ink shadow-inner shadow-ink/5"
                key={target.id}
              >
                <input
                  checked={selectedTargetId === target.id}
                  className="mt-1 h-4 w-4 border-ink/20 text-nocturne focus:ring-gold/50"
                  name="skillResourceTargetId"
                  onChange={() => onTargetChange(target.id)}
                  type="radio"
                  value={target.id}
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium">
                    {target.label}
                    {targetDescription(target)}
                  </span>
                  {target.description ? (
                    <span className="block text-sm leading-relaxed text-ink-muted">
                      {target.description}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {isSubstitution ? (
        <RitualTextarea
          label="Worst outcome"
          name="skillResourceWorstOutcome"
          onChange={onWorstOutcomeChange}
          placeholder="Narrate how this substitution makes things go terribly wrong."
          rows={4}
          value={worstOutcomeNarration}
        />
      ) : null}

      {errorMessage ? <p className="text-sm text-ink">{errorMessage}</p> : null}
    </SurfacePanel>
  );
}
