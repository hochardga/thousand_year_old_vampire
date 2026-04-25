export type PromptEffectGuidance = {
  guidance: string;
  resource?: {
    isStationary?: boolean;
  };
  skill?: {
    label?: string;
  };
};

export function getPromptEffectByPosition(
  promptNumber: number,
  encounterIndex: number,
  promptVersion = "base",
): PromptEffectGuidance | null {
  if (promptVersion !== "base" || encounterIndex !== 1) {
    return null;
  }

  if (promptNumber === 1) {
    return {
      guidance:
        "This prompt requires a new skill: Bloodthirsty. Add it before setting the entry into memory.",
      skill: {
        label: "Bloodthirsty",
      },
    };
  }

  if (promptNumber === 4) {
    return {
      guidance:
        "This prompt requires a new stationary resource. Add the place that now shelters the chronicle.",
      resource: {
        isStationary: true,
      },
    };
  }

  return null;
}
