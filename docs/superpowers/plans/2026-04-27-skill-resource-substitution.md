# Skill Resource Substitution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-party Skill/Resource mutation, substitution, and exhaustion handling to prompt resolution.

**Architecture:** Keep prompt interpretation player-declared, then enforce the declared Skill/Resource action with shared rule helpers. The play page passes full Skill/Resource state into a new panel, the route validates the chosen change against current database state, and the client can complete the chronicle when no legal Skill/Resource action remains.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zod, Supabase RPC, Vitest, Testing Library, Playwright.

---

## File Structure

- Create `src/lib/chronicles/skillResourceRules.ts`: pure Skill/Resource availability, substitution, mutation conversion, and error-copy helpers.
- Create `src/components/ritual/SkillResourceChangePanel.tsx`: client panel for selecting required action, primary/substitute target, substitution narration, and end-state narration.
- Modify `src/types/chronicle.ts`: add Skill/Resource record and `SkillResourceChangeInput` types to the prompt payload.
- Modify `src/lib/validation/play.ts`: parse the optional `skillResourceChange` and end-chronicle request body.
- Modify `src/app/api/chronicles/[chronicleId]/play/resolve/route.ts`: load current Skill/Resource state, validate the declared change, and merge generated trait mutations before RPC resolution.
- Create `src/app/api/chronicles/[chronicleId]/play/end/route.ts`: validate no-legal-action narration, insert a completion archive event, close the session recap, and mark the chronicle completed.
- Modify `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`: load full Skill/Resource records and pass them to `PlaySurface`.
- Modify `src/components/ritual/PlaySurface.tsx`: wire panel state, draft persistence, payload submission, and completion response handling.
- Modify `src/lib/chronicles/localDrafts.ts`: persist optional Skill/Resource panel state.
- Modify tests in `tests/integration/chronicle-validation.test.ts`, `tests/integration/resolve-prompt.test.ts`, and `tests/integration/setup-flow.test.tsx`.
- Create `tests/integration/skill-resource-rules.test.ts`.
- Update `docs/thousand-year-old-vampire-rules-coverage-audit.md` after implementation and UAT.

### Task 1: Rule Helper

**Files:**
- Create: `src/lib/chronicles/skillResourceRules.ts`
- Test: `tests/integration/skill-resource-rules.test.ts`

- [ ] **Step 1: Write failing pure-rule tests**

```ts
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
    expect(state.substitutionTargets.map((target) => target.id)).toEqual(["resource-1"]);
    expect(state.isGameEnding).toBe(false);
  });

  it("substitutes Skill checks when no Resource can be lost", () => {
    const state = getSkillResourceResolutionState("lose-resource", {
      resources: [resource("resource-1", "lost")],
      skills: [skill("skill-1", "active")],
    });

    expect(state.primaryTargets).toEqual([]);
    expect(state.substitutionAction).toBe("check-skill");
    expect(state.substitutionTargets.map((target) => target.id)).toEqual(["skill-1"]);
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
      error: "Describe the worst possible outcome before substituting a Resource for a Skill.",
    });
  });

  it("converts legal substitutions into trait mutations", () => {
    const result = buildSkillResourceTraitMutations(
      {
        isSubstitution: true,
        requiredAction: "check-skill",
        resolutionAction: "lose-resource",
        targetId: "resource-1",
        worstOutcomeNarration: "The fire takes the estate and every servant who trusted me.",
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
```

- [ ] **Step 2: Run the failing test**

Run: `npm run test:integration -- tests/integration/skill-resource-rules.test.ts`

Expected: FAIL because `src/lib/chronicles/skillResourceRules.ts` does not exist.

- [ ] **Step 3: Implement the helper**

```ts
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
):
  | { traitMutations: TraitMutationsPayload }
  | { error: string } {
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
```

- [ ] **Step 4: Run the pure-rule test**

Run: `npm run test:integration -- tests/integration/skill-resource-rules.test.ts`

Expected: PASS.

### Task 2: Payload Validation And Resolve Route

**Files:**
- Modify: `src/types/chronicle.ts`
- Modify: `src/lib/validation/play.ts`
- Modify: `src/app/api/chronicles/[chronicleId]/play/resolve/route.ts`
- Test: `tests/integration/chronicle-validation.test.ts`
- Test: `tests/integration/resolve-prompt.test.ts`

- [ ] **Step 1: Add failing validation and route-helper tests**

Add to `tests/integration/chronicle-validation.test.ts`:

```ts
it("keeps a Skill/Resource change in the parsed prompt resolution payload", () => {
  const result = promptResolutionSchema.safeParse({
    experienceText:
      "I left the burning house carrying nothing but the shape of my hunger.",
    memoryDecision: { mode: "create-new" },
    playerEntry:
      "The prompt asks me to check a Skill, but the old habits are already spent.",
    sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
    skillResourceChange: {
      isSubstitution: true,
      requiredAction: "check-skill",
      resolutionAction: "lose-resource",
      targetId: "3d6ca4e5-4627-4298-b4ae-1ca4a1c4d341",
      worstOutcomeNarration: "The estate burns with everyone still inside.",
    },
    traitMutations: {
      characters: [],
      marks: [],
      resources: [],
      skills: [],
    },
  });

  expect(result.success).toBe(true);
});
```

Add to `tests/integration/resolve-prompt.test.ts`:

```ts
it("passes Skill/Resource trait mutations into the resolve_prompt_run RPC payload", async () => {
  const rpc = vi.fn().mockResolvedValue({
    data: {
      archiveEvents: [],
      nextPrompt: { encounterIndex: 1, promptNumber: 4 },
      promptRunId: "run-1",
      rolled: { d10: 7, d6: 4, movement: 3 },
    },
    error: null,
  });

  await resolvePrompt(
    { rpc },
    "chronicle-1",
    {
      ...payload,
      traitMutations: {
        characters: [],
        marks: [],
        resources: [{ action: "lose", id: "resource-1" }],
        skills: [],
      },
    },
  );

  expect(rpc).toHaveBeenCalledWith(
    "resolve_prompt_run",
    expect.objectContaining({
      trait_mutations: {
        characters: [],
        marks: [],
        resources: [{ action: "lose", id: "resource-1" }],
        skills: [],
      },
    }),
  );
});
```

- [ ] **Step 2: Run focused tests to verify failure**

Run: `npm run test:integration -- tests/integration/chronicle-validation.test.ts tests/integration/resolve-prompt.test.ts`

Expected: validation test FAILS because `skillResourceChange` is stripped or unknown until typed and parsed.

- [ ] **Step 3: Add types and schema**

Update `src/types/chronicle.ts`:

```ts
export type SkillResourceRequiredAction =
  | "check-skill"
  | "lose-resource"
  | "lose-skill";

export type SkillResourceResolutionAction = SkillResourceRequiredAction;

export type SkillResourceChangeInput = {
  isSubstitution: boolean;
  requiredAction: SkillResourceRequiredAction;
  resolutionAction: SkillResourceResolutionAction;
  targetId: string;
  worstOutcomeNarration?: string | null;
};
```

Add `skillResourceChange?: SkillResourceChangeInput;` to `PromptResolutionPayload`.

Update `src/lib/validation/play.ts`:

```ts
const skillResourceActionSchema = z.enum([
  "check-skill",
  "lose-resource",
  "lose-skill",
]);

const skillResourceChangeSchema = z.object({
  isSubstitution: z.boolean(),
  requiredAction: skillResourceActionSchema,
  resolutionAction: skillResourceActionSchema,
  targetId: uuidSchema,
  worstOutcomeNarration: z.string().trim().max(600).optional().nullable(),
});
```

Add `skillResourceChange: skillResourceChangeSchema.optional(),` to `promptResolutionSchema`.

- [ ] **Step 4: Merge generated Skill/Resource mutations in the route**

In `src/app/api/chronicles/[chronicleId]/play/resolve/route.ts`, import:

```ts
import {
  buildSkillResourceTraitMutations,
  type SkillResourceResource,
  type SkillResourceSkill,
} from "@/lib/chronicles/skillResourceRules";
import type { TraitMutationsPayload } from "@/types/chronicle";
```

Add helper functions:

```ts
function mergeTraitMutations(
  base: TraitMutationsPayload,
  addition: TraitMutationsPayload,
): TraitMutationsPayload {
  return {
    characters: [...base.characters, ...addition.characters],
    marks: [...base.marks, ...addition.marks],
    resources: [...base.resources, ...addition.resources],
    skills: [...base.skills, ...addition.skills],
  };
}
```

Before `resolvePrompt`, fetch state when `parsed.data.skillResourceChange` exists, call `buildSkillResourceTraitMutations`, return `validationErrorResponse` on error, then call `resolvePrompt` with merged mutations:

```ts
let traitMutations = parsed.data.traitMutations;

if (parsed.data.skillResourceChange) {
  const [skillsResult, resourcesResult] = await Promise.all([
    supabase
      .from("skills")
      .select("id, label, description, status")
      .eq("chronicle_id", chronicleId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("resources")
      .select("id, label, description, is_stationary, status")
      .eq("chronicle_id", chronicleId)
      .order("sort_order", { ascending: true }),
  ]);

  if (skillsResult.error || resourcesResult.error) {
    throw new Error("The Skill and Resource ledger could not be read.");
  }

  const generated = buildSkillResourceTraitMutations(
    parsed.data.skillResourceChange,
    {
      resources: (resourcesResult.data ?? []).map((resource) => ({
        description: resource.description,
        id: resource.id,
        isStationary: resource.is_stationary,
        label: resource.label,
        status: resource.status,
      })) as SkillResourceResource[],
      skills: (skillsResult.data ?? []) as SkillResourceSkill[],
    },
  );

  if ("error" in generated) {
    return validationErrorResponse([
      {
        message: generated.error,
        path: ["skillResourceChange"],
      },
    ]);
  }

  traitMutations = mergeTraitMutations(
    parsed.data.traitMutations,
    generated.traitMutations,
  );
}
```

Call `resolvePrompt` with `{ ...parsed.data, traitMutations }`.

- [ ] **Step 5: Run focused tests**

Run: `npm run test:integration -- tests/integration/chronicle-validation.test.ts tests/integration/resolve-prompt.test.ts`

Expected: PASS.

### Task 3: Play UI Panel

**Files:**
- Create: `src/components/ritual/SkillResourceChangePanel.tsx`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `src/lib/chronicles/localDrafts.ts`
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Test: `tests/integration/setup-flow.test.tsx`

- [ ] **Step 1: Add failing UI tests**

Add tests to `tests/integration/setup-flow.test.tsx` near the existing `PlaySurface` tests:

```tsx
it("submits a selected Skill check as a Skill/Resource change", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        archiveEvents: [{ eventType: "prompt_resolved", summary: "The entry has been set into memory." }],
        nextPrompt: { encounterIndex: 1, promptNumber: 4 },
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 },
    ),
  );
  const { PlaySurface } = await import("@/components/ritual/PlaySurface");

  render(
    <PlaySurface
      chronicleId="chronicle-1"
      currentPromptNumber={1}
      initialSessionId="session-1"
      resources={[]}
      skills={[
        {
          description: "I know when to vanish.",
          id: "06a408b6-f408-477a-a0d4-4d167bb365c1",
          label: "Quiet Vanishing",
          status: "active",
        },
      ]}
    />,
  );

  fireEvent.change(screen.getByLabelText("Player entry"), {
    target: { value: "I slip out through the sacristy smoke." },
  });
  fireEvent.change(screen.getByLabelText("Experience text"), {
    target: { value: "I escape with ash in my throat and nobody left behind me." },
  });
  fireEvent.change(screen.getByLabelText("Prompt requires"), {
    target: { value: "check-skill" },
  });
  fireEvent.click(screen.getByRole("radio", { name: /Quiet Vanishing/i }));
  fireEvent.click(screen.getByRole("button", { name: "Set the entry into memory" }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
  const payload = JSON.parse(String(request.body));

  expect(payload.skillResourceChange).toEqual({
    isSubstitution: false,
    requiredAction: "check-skill",
    resolutionAction: "check-skill",
    targetId: "06a408b6-f408-477a-a0d4-4d167bb365c1",
    worstOutcomeNarration: "",
  });

  fetchMock.mockRestore();
});

it("requires worst-outcome narration before submitting a substitution", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch");
  const { PlaySurface } = await import("@/components/ritual/PlaySurface");

  render(
    <PlaySurface
      chronicleId="chronicle-1"
      currentPromptNumber={1}
      initialSessionId="session-1"
      resources={[
        {
          description: "A safe house kept by bribes.",
          id: "3d6ca4e5-4627-4298-b4ae-1ca4a1c4d341",
          isStationary: true,
          label: "The Marsh House",
          status: "active",
        },
      ]}
      skills={[
        {
          description: "Already spent.",
          id: "06a408b6-f408-477a-a0d4-4d167bb365c1",
          label: "Quiet Vanishing",
          status: "checked",
        },
      ]}
    />,
  );

  fireEvent.change(screen.getByLabelText("Player entry"), {
    target: { value: "I try to escape without a clean talent left to spend." },
  });
  fireEvent.change(screen.getByLabelText("Experience text"), {
    target: { value: "The house burns because I had nothing left but shelter." },
  });
  fireEvent.change(screen.getByLabelText("Prompt requires"), {
    target: { value: "check-skill" },
  });
  fireEvent.click(screen.getByRole("radio", { name: /The Marsh House/i }));
  fireEvent.click(screen.getByRole("button", { name: "Set the entry into memory" }));

  expect(
    await screen.findByText(
      "Describe the worst possible outcome before setting this substitution into memory.",
    ),
  ).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();

  fetchMock.mockRestore();
});
```

- [ ] **Step 2: Run the failing UI tests**

Run: `npm run test:integration -- tests/integration/setup-flow.test.tsx`

Expected: FAIL because `PlaySurface` does not accept `skills` / `resources` props and the panel is absent.

- [ ] **Step 3: Implement the panel and wire state**

Create `src/components/ritual/SkillResourceChangePanel.tsx` using `SurfacePanel`, `RitualTextarea`, and `getSkillResourceResolutionState`. Include:

- A select with label `Prompt requires` and options blank, `Check a Skill`, `Lose a Skill`, `Lose a Resource`.
- Primary radio choices when primary targets exist.
- Substitute radio choices and explanatory copy when primary targets are empty and substitution targets exist.
- A `RitualTextarea` labelled `Worst outcome` when substitution is active.
- A game-ending block when `isGameEnding` is true.

Modify `PlaySurface` props:

```ts
  resources?: SkillResourceResource[];
  skills?: SkillResourceSkill[];
```

Add state:

```ts
const [skillResourceRequiredAction, setSkillResourceRequiredAction] =
  useState<SkillResourceRequiredAction | "">(
    () => initialDraft?.skillResourceRequiredAction ?? "",
  );
const [skillResourceTargetId, setSkillResourceTargetId] = useState(
  () => initialDraft?.skillResourceTargetId ?? "",
);
const [skillResourceWorstOutcome, setSkillResourceWorstOutcome] = useState(
  () => initialDraft?.skillResourceWorstOutcome ?? "",
);
const [skillResourceErrorMessage, setSkillResourceErrorMessage] =
  useState<string | null>(null);
```

Derive the selected change with the helper state. Submit `skillResourceChange` when an action and target are selected.

Add these fields to `PromptDraft` in `src/lib/chronicles/localDrafts.ts`:

```ts
  skillResourceRequiredAction?: "check-skill" | "lose-resource" | "lose-skill" | "";
  skillResourceTargetId?: string;
  skillResourceWorstOutcome?: string;
```

- [ ] **Step 4: Load full Skill/Resource state on the play page**

In `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`, replace label-only records with records including ids and status:

```ts
type SkillRecord = {
  description: string | null;
  id: string;
  label: string;
  status: "active" | "checked" | "lost";
};

type ResourceRecord = {
  description: string | null;
  id: string;
  is_stationary: boolean;
  label: string;
  status: "active" | "checked" | "lost";
};
```

Select `id, label, description, status` for Skills and `id, label, description, is_stationary, status` for Resources. Continue deriving duplicate labels from these records for prompt-created trait validation.

Pass:

```tsx
resources={(resourcesResult.data ?? []).map((resource) => ({
  description: resource.description,
  id: resource.id,
  isStationary: resource.is_stationary,
  label: resource.label,
  status: resource.status,
}))}
skills={skillsResult.data ?? []}
```

- [ ] **Step 5: Run focused UI tests**

Run: `npm run test:integration -- tests/integration/setup-flow.test.tsx`

Expected: PASS.

### Task 4: No-Legal-Action Completion Route

**Files:**
- Create: `src/app/api/chronicles/[chronicleId]/play/end/route.ts`
- Modify: `src/lib/validation/play.ts`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Test: `tests/integration/setup-flow.test.tsx`

- [ ] **Step 1: Add failing UI test for the end-state flow**

Add to `tests/integration/setup-flow.test.tsx`:

```tsx
it("ends the chronicle when no legal Skill or Resource action remains", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({ nextRoute: "/chronicles/chronicle-1/recap" }),
      { headers: { "Content-Type": "application/json" }, status: 200 },
    ),
  );
  const { PlaySurface } = await import("@/components/ritual/PlaySurface");

  render(
    <PlaySurface
      chronicleId="chronicle-1"
      currentPromptNumber={1}
      initialSessionId="session-1"
      resources={[]}
      skills={[]}
    />,
  );

  fireEvent.change(screen.getByLabelText("Prompt requires"), {
    target: { value: "check-skill" },
  });
  fireEvent.change(screen.getByLabelText("Demise narration"), {
    target: {
      value:
        "With no talent and no refuge left, I walk into morning and let it finish the old story.",
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "End the chronicle" }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/chronicles/chronicle-1/play/end",
    expect.objectContaining({
      method: "POST",
    }),
  );
  expect(
    await screen.findByRole("link", { name: "Go to recap" }),
  ).toHaveAttribute("href", "/chronicles/chronicle-1/recap");

  fetchMock.mockRestore();
});
```

- [ ] **Step 2: Run failing UI test**

Run: `npm run test:integration -- tests/integration/setup-flow.test.tsx`

Expected: FAIL because the end route and UI behavior do not exist.

- [ ] **Step 3: Add end request validation**

In `src/lib/validation/play.ts`, export:

```ts
export const skillResourceEndSchema = z.object({
  narration: z.string().trim().min(1).max(1200),
  requiredAction: skillResourceActionSchema,
});
```

- [ ] **Step 4: Implement route**

Create `src/app/api/chronicles/[chronicleId]/play/end/route.ts`. It should:

- Authenticate the user.
- Parse `skillResourceEndSchema`.
- Fetch active chronicle by id and user.
- Insert an `archive_events` row with `event_type: "chronicle_completed"`, summary `The chronicle ends because no Skill or Resource can answer the prompt.`, and metadata containing `requiredAction` and `narration`.
- Call `closeSessionWithRecap` when `current_session_id` is present.
- Update `chronicles.status` to `completed` and `last_played_at` to now.
- Return `{ nextRoute: `/chronicles/${chronicleId}/recap` }`.

- [ ] **Step 5: Wire PlaySurface end submission**

In `PlaySurface`, when `SkillResourceChangePanel` reports `isGameEnding`, show `Demise narration` and an `End the chronicle` button. Submit to `/api/chronicles/${chronicleId}/play/end`; on success show a `Go to recap` link.

- [ ] **Step 6: Run focused UI tests**

Run: `npm run test:integration -- tests/integration/setup-flow.test.tsx`

Expected: PASS.

### Task 5: Coverage Audit And UAT

**Files:**
- Modify: `docs/thousand-year-old-vampire-rules-coverage-audit.md`

- [ ] **Step 1: Update the coverage audit**

Revise section 12:

- Skill check substitution becomes `Partial` or `Automated with player-declared prompt requirement`: the app enforces legal substitution once the player selects the prompt-required change.
- Resource loss substitution becomes the same status.
- Only Skills/Resources substitution becomes `Automated` for the new rules panel.
- Worst-outcome narration becomes `Partial`: required for substitutions in the rules panel, but still human-written.
- No legal substitution remains becomes `Partial`: the UI can complete the chronicle from a no-legal-action state, while full prompt parsing remains future work.

Also update executive summary and biggest gaps so they say the app now has a player-declared substitution engine, while prompt-instruction parsing remains incomplete.

- [ ] **Step 2: Run automated verification**

Run:

```bash
npm run lint
npm run test:integration
npm run build
```

Expected: all pass.

- [ ] **Step 3: Run deep UAT in a browser**

Run: `npm run dev`.

Open the app with Playwright/browser and exercise:

- Start or use an active chronicle with an unchecked Skill; choose `Check a Skill`, select it, resolve the prompt, and confirm the ledger shows the Skill checked.
- Use a chronicle with only checked/lost Skills and an available Resource; choose `Check a Skill`, select the substitute Resource, confirm worst-outcome narration is required, resolve, and confirm the Resource is lost.
- Use a chronicle with no available Resources and an unchecked Skill; choose `Lose a Resource`, select substitute Skill, resolve, and confirm Skill is checked.
- Use a chronicle with no available Skills or Resources; choose a required Skill/Resource action, enter demise narration, end the chronicle, and confirm recap route.
- Re-check prompt-created Skill/Resource/Character/Mark controls still submit successfully.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add src tests docs/thousand-year-old-vampire-rules-coverage-audit.md
git commit -m "feat: enforce skill resource substitution"
```

Expected: commit succeeds without staging unrelated untracked plan docs.

- [ ] **Step 5: Push and open ready PR**

Run:

```bash
git push -u origin codex/skill-resource-substitution
```

Open a ready-for-review PR against `main`. Do not create a draft PR.
