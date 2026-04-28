import type { TraitMutationsPayload } from "@/types/chronicle";

export type SkillResourceRequiredAction =
  | "check-skill"
  | "lose-resource"
  | "lose-skill";

export type SkillResourceResolutionAction = SkillResourceRequiredAction;

export type SkillResourceSkill = {
  description: string | null;
  id: string;
  label: string;
  status: "active" | "checked" | "lost";
};

export type SkillResourceResource = {
  description: string | null;
  id: string;
  isStationary: boolean;
  label: string;
  status: "active" | "checked" | "lost";
};

export type SkillResourceCollections = {
  resources: SkillResourceResource[];
  skills: SkillResourceSkill[];
};

export type SkillResourceChangeInput = {
  isSubstitution: boolean;
  requiredAction: SkillResourceRequiredAction;
  resolutionAction: SkillResourceResolutionAction;
  targetId: string;
  worstOutcomeNarration?: string | null;
};

export type SkillResourceResolutionState = {
  isGameEnding: boolean;
  primaryAction: SkillResourceResolutionAction;
  primaryTargets: Array<SkillResourceSkill | SkillResourceResource>;
  substitutionAction: SkillResourceResolutionAction | null;
  substitutionTargets: Array<SkillResourceSkill | SkillResourceResource>;
};

const emptyTraitMutations: TraitMutationsPayload = {
  characters: [],
  marks: [],
  resources: [],
  skills: [],
};

function activeSkills(skills: SkillResourceSkill[]) {
  return skills.filter((skill) => skill.status === "active");
}

function losableSkills(skills: SkillResourceSkill[]) {
  return skills.filter((skill) => skill.status !== "lost");
}

function losableResources(resources: SkillResourceResource[]) {
  return resources.filter((resource) => resource.status !== "lost");
}

export function getSkillResourceResolutionState(
  requiredAction: SkillResourceRequiredAction,
  collections: SkillResourceCollections,
): SkillResourceResolutionState {
  if (requiredAction === "check-skill") {
    const primaryTargets = activeSkills(collections.skills);
    const substitutionTargets =
      primaryTargets.length > 0 ? [] : losableResources(collections.resources);

    return {
      isGameEnding: primaryTargets.length === 0 && substitutionTargets.length === 0,
      primaryAction: "check-skill",
      primaryTargets,
      substitutionAction:
        primaryTargets.length === 0 && substitutionTargets.length > 0
          ? "lose-resource"
          : null,
      substitutionTargets,
    };
  }

  if (requiredAction === "lose-resource") {
    const primaryTargets = losableResources(collections.resources);
    const substitutionTargets =
      primaryTargets.length > 0 ? [] : activeSkills(collections.skills);

    return {
      isGameEnding: primaryTargets.length === 0 && substitutionTargets.length === 0,
      primaryAction: "lose-resource",
      primaryTargets,
      substitutionAction:
        primaryTargets.length === 0 && substitutionTargets.length > 0
          ? "check-skill"
          : null,
      substitutionTargets,
    };
  }

  const primaryTargets = losableSkills(collections.skills);

  return {
    isGameEnding: primaryTargets.length === 0,
    primaryAction: "lose-skill",
    primaryTargets,
    substitutionAction: null,
    substitutionTargets: [],
  };
}

export function buildSkillResourceTraitMutations(
  change: SkillResourceChangeInput | null | undefined,
  collections: SkillResourceCollections,
): { traitMutations: TraitMutationsPayload } | { error: string } {
  if (!change) {
    return { traitMutations: emptyTraitMutations };
  }

  const state = getSkillResourceResolutionState(
    change.requiredAction,
    collections,
  );

  if (state.isGameEnding) {
    return {
      error:
        "No legal Skill or Resource remains for this prompt. End the chronicle instead.",
    };
  }

  const legalTargets = change.isSubstitution
    ? state.substitutionTargets
    : state.primaryTargets;
  const legalAction = change.isSubstitution
    ? state.substitutionAction
    : state.primaryAction;

  if (!legalAction || change.resolutionAction !== legalAction) {
    return { error: "That Skill or Resource substitution is not legal." };
  }

  if (!legalTargets.some((target) => target.id === change.targetId)) {
    return { error: "Choose an available Skill or Resource for this change." };
  }

  if (change.isSubstitution && !change.worstOutcomeNarration?.trim()) {
    return {
      error:
        change.requiredAction === "check-skill"
          ? "Describe the worst possible outcome before substituting a Resource for a Skill."
          : "Describe the worst possible outcome before substituting a Skill for a Resource.",
    };
  }

  if (change.resolutionAction === "check-skill") {
    return {
      traitMutations: {
        ...emptyTraitMutations,
        skills: [{ action: "check", id: change.targetId }],
      },
    };
  }

  if (change.resolutionAction === "lose-skill") {
    return {
      traitMutations: {
        ...emptyTraitMutations,
        skills: [{ action: "lose", id: change.targetId }],
      },
    };
  }

  return {
    traitMutations: {
      ...emptyTraitMutations,
      resources: [{ action: "lose", id: change.targetId }],
    },
  };
}
