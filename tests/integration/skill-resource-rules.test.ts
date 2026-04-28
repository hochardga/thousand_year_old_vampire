import { describe, expect, it } from "vitest";
import {
  buildSkillResourceTraitMutations,
  getSkillResourceResolutionState,
} from "@/lib/chronicles/skillResourceRules";

const skill = (id: string, status: "active" | "checked" | "lost") => ({
  description: null,
  id,
  label: `Skill ${id}`,
  status,
});

const resource = (id: string, status: "active" | "checked" | "lost") => ({
  description: null,
  id,
  isStationary: false,
  label: `Resource ${id}`,
  status,
});

describe("skill resource substitution rules", () => {
  it("offers unchecked Skills for required Skill checks", () => {
    const state = getSkillResourceResolutionState("check-skill", {
      resources: [resource("resource-1", "active")],
      skills: [skill("skill-1", "active"), skill("skill-2", "checked")],
    });

    expect(state.primaryAction).toBe("check-skill");
    expect(state.primaryTargets.map((target) => target.id)).toEqual(["skill-1"]);
    expect(state.substitutionAction).toBeNull();
    expect(state.isGameEnding).toBe(false);
  });

  it("substitutes Resource loss when no unchecked Skill can be checked", () => {
    const state = getSkillResourceResolutionState("check-skill", {
      resources: [resource("resource-1", "active")],
      skills: [skill("skill-1", "checked")],
    });

    expect(state.primaryTargets).toEqual([]);
    expect(state.substitutionAction).toBe("lose-resource");
    expect(state.substitutionTargets.map((target) => target.id)).toEqual([
      "resource-1",
    ]);
    expect(state.isGameEnding).toBe(false);
  });

  it("substitutes Skill checks when no Resource can be lost", () => {
    const state = getSkillResourceResolutionState("lose-resource", {
      resources: [resource("resource-1", "lost")],
      skills: [skill("skill-1", "active")],
    });

    expect(state.primaryTargets).toEqual([]);
    expect(state.substitutionAction).toBe("check-skill");
    expect(state.substitutionTargets.map((target) => target.id)).toEqual([
      "skill-1",
    ]);
    expect(state.isGameEnding).toBe(false);
  });

  it("does not substitute Resource loss for required Skill loss", () => {
    const state = getSkillResourceResolutionState("lose-skill", {
      resources: [resource("resource-1", "active")],
      skills: [skill("skill-1", "lost")],
    });

    expect(state.substitutionAction).toBeNull();
    expect(state.isGameEnding).toBe(true);
  });

  it("requires worst-outcome narration when a substitution is used", () => {
    const result = buildSkillResourceTraitMutations(
      {
        isSubstitution: true,
        requiredAction: "check-skill",
        resolutionAction: "lose-resource",
        targetId: "resource-1",
        worstOutcomeNarration: "",
      },
      {
        resources: [resource("resource-1", "active")],
        skills: [skill("skill-1", "checked")],
      },
    );

    expect(result).toEqual({
      error:
        "Describe the worst possible outcome before substituting a Resource for a Skill.",
    });
  });

  it("converts legal substitutions into trait mutations", () => {
    const result = buildSkillResourceTraitMutations(
      {
        isSubstitution: true,
        requiredAction: "check-skill",
        resolutionAction: "lose-resource",
        targetId: "resource-1",
        worstOutcomeNarration:
          "The fire takes the estate and every servant who trusted me.",
      },
      {
        resources: [resource("resource-1", "active")],
        skills: [skill("skill-1", "checked")],
      },
    );

    expect(result).toEqual({
      traitMutations: {
        characters: [],
        marks: [],
        resources: [{ action: "lose", id: "resource-1" }],
        skills: [],
      },
    });
  });
});
