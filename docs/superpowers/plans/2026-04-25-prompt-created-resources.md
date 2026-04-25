# Prompt-Created Resources Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-party support for creating prompt-driven Resources, including stationary resources, inside the active play loop and persist them transactionally with prompt resolution.

**Architecture:** Extend the existing prompt-created skill pattern instead of inventing a generic trait composer. The play surface will expose an optional prompt-created resource composer, validation will accept a separate `newResource` payload, and prompt resolution will create the resource inside the same authoritative RPC transaction used for memories, prompt runs, and other trait effects.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Vitest, Supabase SQL migrations, local e2e Supabase mock

---

## File Structure

- Modify: `src/types/chronicle.ts`
  Defines the prompt-resolution payload types and the new prompt-created resource input contract.
- Modify: `src/lib/validation/play.ts`
  Adds `newResource` parsing and validation.
- Modify: `src/lib/chronicles/resolvePrompt.ts`
  Passes the new resource payload into `resolve_prompt_run`.
- Create: `src/components/ritual/PromptResourceComposer.tsx`
  Encapsulates the collapsed-by-default play-surface UI for prompt-created resources.
- Modify: `src/components/ritual/PlaySurface.tsx`
  Owns the prompt-created resource draft state, duplicate checking, payload construction, and error presentation.
- Modify: `src/lib/chronicles/localDrafts.ts`
  Persists prompt-created resource draft fields between failed submissions and refreshes.
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
  Loads existing resource labels so the client can block duplicates early.
- Modify: `src/lib/chronicles/memoryRules.ts`
  Maps duplicate resource failures to calm product copy.
- Create: `supabase/migrations/0011_prompt_created_resources.sql`
  Adds the SQL helper and RPC extension needed to create prompt-created resources transactionally.
- Modify: `src/lib/supabase/e2e.ts`
  Mirrors the new RPC/resource creation behavior in the local e2e Supabase mock.
- Modify: `tests/integration/chronicle-validation.test.ts`
  Covers prompt-created resource payload parsing.
- Modify: `tests/integration/resolve-prompt.test.ts`
  Covers resolver wiring and duplicate-resource error normalization.
- Modify: `tests/integration/setup-flow.test.tsx`
  Covers play-page label loading, prompt-created resource UI behavior, local draft persistence, and request payload shape.
- Modify: `tests/integration/archive-rules.test.ts`
  Covers e2e-backed resource creation ordering and duplicate rejection at the transactional boundary.
- Modify: `tests/integration/gameplay-rpc-guards.test.ts`
  Guards the SQL shape so prompt-created resources stay wired into the RPC.
- Modify: `docs/thousand-year-old-vampire-rules-coverage-audit.md`
  Updates the rules audit to reflect the new support level and the remaining adjacent gaps.

### Task 1: Extend the Prompt Resolution Contract

**Files:**
- Modify: `src/types/chronicle.ts`
- Modify: `src/lib/validation/play.ts`
- Modify: `src/lib/chronicles/resolvePrompt.ts`
- Test: `tests/integration/chronicle-validation.test.ts`
- Test: `tests/integration/resolve-prompt.test.ts`

- [ ] **Step 1: Write the failing validation and resolver tests**

```ts
it("keeps prompt-created resources in the parsed prompt resolution payload", () => {
  const result = promptResolutionSchema.safeParse({
    experienceText: "I made a refuge of the ruin before dawn found me.",
    memoryDecision: { mode: "create-new" },
    newResource: {
      description: "A roofed crypt where I can feed and vanish.",
      isStationary: true,
      label: "The Marsh House",
    },
    playerEntry: "I buried myself inside the old stones and named them home.",
    sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
    traitMutations: { characters: [], marks: [], resources: [], skills: [] },
  });

  expect(result.success).toBe(true);
});

it("passes prompt-created resources into the resolve_prompt_run RPC payload", async () => {
  await resolvePrompt({ rpc }, "chronicle-1", {
    ...payload,
    newResource: {
      description: "A roofed crypt where I can feed and vanish.",
      isStationary: true,
      label: "The Marsh House",
    },
  });

  expect(rpc).toHaveBeenCalledWith(
    "resolve_prompt_run",
    expect.objectContaining({
      new_resource: {
        description: "A roofed crypt where I can feed and vanish.",
        isStationary: true,
        label: "The Marsh House",
      },
    }),
  );
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `pnpm vitest run tests/integration/chronicle-validation.test.ts tests/integration/resolve-prompt.test.ts`
Expected: FAIL with `newResource` missing from the schema and RPC payload.

- [ ] **Step 3: Add the minimal type, schema, and resolver wiring**

```ts
export type PromptCreatedResourceInput = {
  description: string;
  isStationary: boolean;
  label: string;
};

export type PromptResolutionPayload = {
  experienceText: string;
  memoryDecision: MemoryDecisionPayload;
  newResource?: PromptCreatedResourceInput;
  newSkill?: PromptCreatedSkillInput;
  playerEntry: string;
  sessionId: string;
  traitMutations: TraitMutationsPayload;
};
```

```ts
const newResourceSchema: z.ZodType<PromptCreatedResourceInput> = z.object({
  description: z.string().trim().min(1).max(280),
  isStationary: z.boolean(),
  label: z.string().trim().min(1).max(120),
});

export const promptResolutionSchema: z.ZodType<PromptResolutionPayload> = z.object({
  experienceText: z.string().trim().min(1).max(1600),
  memoryDecision: memoryDecisionSchema.default({ mode: "create-new" }),
  newResource: newResourceSchema.optional(),
  newSkill: newSkillSchema.optional(),
  playerEntry: z.string().trim().min(1).max(4000),
  sessionId: uuidSchema,
  traitMutations: traitMutationsSchema.default({
    characters: [],
    marks: [],
    resources: [],
    skills: [],
  }),
});
```

```ts
const { data, error } = await supabase.rpc("resolve_prompt_run", {
  experience_text: payload.experienceText,
  memory_decision: payload.memoryDecision,
  new_resource: payload.newResource ?? null,
  new_skill: payload.newSkill ?? null,
  player_entry: payload.playerEntry,
  target_chronicle_id: chronicleId,
  target_session_id: payload.sessionId,
  trait_mutations: payload.traitMutations,
});
```

- [ ] **Step 4: Re-run the focused tests**

Run: `pnpm vitest run tests/integration/chronicle-validation.test.ts tests/integration/resolve-prompt.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the contract changes**

```bash
git add src/types/chronicle.ts src/lib/validation/play.ts src/lib/chronicles/resolvePrompt.ts tests/integration/chronicle-validation.test.ts tests/integration/resolve-prompt.test.ts
git commit -m "feat: add prompt-created resource contract"
```

### Task 2: Add Transactional Resource Creation to Prompt Resolution

**Files:**
- Create: `supabase/migrations/0011_prompt_created_resources.sql`
- Modify: `src/lib/supabase/e2e.ts`
- Modify: `src/lib/chronicles/memoryRules.ts`
- Test: `tests/integration/archive-rules.test.ts`
- Test: `tests/integration/gameplay-rpc-guards.test.ts`
- Test: `tests/integration/resolve-prompt.test.ts`

- [ ] **Step 1: Write the failing persistence and SQL guard tests**

```ts
it("creates prompt-created resources at the next sort order", async () => {
  const result = await resolvePromptRun(client, chronicleId, sessionId, { mode: "create-new" }, undefined, {
    description: "A roofed crypt where I can feed and vanish.",
    isStationary: true,
    label: "The Marsh House",
  });

  expect(result.error).toBeNull();
  expect(
    state.resources.filter((resource) => resource.chronicle_id === chronicleId),
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        is_stationary: true,
        label: "The Marsh House",
        sort_order: 1,
        status: "active",
      }),
    ]),
  );
});

it("adds a prompt-created resource helper and wires a new_resource argument into resolve_prompt_run", () => {
  expect(migrationSql).toMatch(/create_prompt_resource/i);
  expect(migrationSql).toMatch(/new_resource jsonb default null/i);
  expect(migrationSql).toMatch(/perform public\.create_prompt_resource\(target_chronicle_id, new_resource\)/i);
});
```

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run: `pnpm vitest run tests/integration/archive-rules.test.ts tests/integration/gameplay-rpc-guards.test.ts tests/integration/resolve-prompt.test.ts`
Expected: FAIL because resource creation is not persisted and duplicate resource errors are not normalized.

- [ ] **Step 3: Add the SQL migration, e2e mock behavior, and error copy**

```sql
create or replace function public.create_prompt_resource(
  target_chronicle_id uuid,
  new_resource jsonb
)
returns uuid
language plpgsql
as $$
declare
  created_resource_id uuid;
  new_resource_description text;
  new_resource_is_stationary boolean;
  new_resource_label text;
  new_sort_order integer;
begin
  if new_resource is null then
    return null;
  end if;

  new_resource_label := btrim(coalesce(new_resource->>'label', ''));
  new_resource_description := btrim(coalesce(new_resource->>'description', ''));
  new_resource_is_stationary := coalesce((new_resource->>'isStationary')::boolean, false);

  if exists (
    select 1
    from public.resources
    where chronicle_id = target_chronicle_id
      and btrim(label) = new_resource_label
  ) then
    raise exception 'A resource with this name already exists.'
      using errcode = 'P0001';
  end if;

  select coalesce(max(sort_order), -1) + 1
  into new_sort_order
  from public.resources
  where chronicle_id = target_chronicle_id;

  insert into public.resources (
    chronicle_id,
    label,
    description,
    is_stationary,
    sort_order
  )
  values (
    target_chronicle_id,
    new_resource_label,
    new_resource_description,
    new_resource_is_stationary,
    new_sort_order
  )
  returning id into created_resource_id;

  return created_resource_id;
end;
$$;
```

```ts
if (newResource) {
  state.resources.push({
    chronicle_id: chronicle.id,
    description: newResource.description,
    id: randomUUID(),
    is_stationary: newResource.isStationary,
    label: newResource.label,
    sort_order: nextResourceSortOrder(state, chronicle.id),
    status: "active",
  });
}
```

```ts
if (normalizedMessage === "A resource with this name already exists.") {
  return "That resource name is already in the chronicle. Choose different wording.";
}
```

- [ ] **Step 4: Re-run the targeted backend tests**

Run: `pnpm vitest run tests/integration/archive-rules.test.ts tests/integration/gameplay-rpc-guards.test.ts tests/integration/resolve-prompt.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the backend transaction work**

```bash
git add supabase/migrations/0011_prompt_created_resources.sql src/lib/supabase/e2e.ts src/lib/chronicles/memoryRules.ts tests/integration/archive-rules.test.ts tests/integration/gameplay-rpc-guards.test.ts tests/integration/resolve-prompt.test.ts
git commit -m "feat: persist prompt-created resources"
```

### Task 3: Add the Play-Surface Resource Composer

**Files:**
- Create: `src/components/ritual/PromptResourceComposer.tsx`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `src/lib/chronicles/localDrafts.ts`
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Test: `tests/integration/setup-flow.test.tsx`

- [ ] **Step 1: Write the failing UI and payload tests**

```tsx
it("reveals prompt-created resource fields on demand and sends newResource in the request body", async () => {
  render(
    <PlaySurface
      chronicleId="chronicle-1"
      existingResourceLabels={["The Marsh House"]}
      existingSkillLabels={[]}
      initialSessionId="session-1"
      mindMemories={[]}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Add a resource from this prompt" }),
  );
  fireEvent.change(screen.getByLabelText("Resource name"), {
    target: { value: "Pilgrim Road Inn" },
  });
  fireEvent.change(screen.getByLabelText("Why it matters"), {
    target: { value: "It keeps hunters and daylight equally far from me." },
  });
  fireEvent.click(screen.getByLabelText("Stationary"));
  fireEvent.click(screen.getByRole("button", { name: "Set the entry into memory" }));

  const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
  const payload = JSON.parse(String(request.body));

  expect(payload.newResource).toEqual({
    description: "It keeps hunters and daylight equally far from me.",
    isStationary: true,
    label: "Pilgrim Road Inn",
  });
});

it("blocks duplicate prompt-created resource labels before submitting", async () => {
  render(
    <PlaySurface
      chronicleId="chronicle-1"
      existingResourceLabels={["The Marsh House"]}
      existingSkillLabels={[]}
      initialSessionId="session-1"
      mindMemories={[]}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Add a resource from this prompt" }),
  );
  fireEvent.change(screen.getByLabelText("Resource name"), {
    target: { value: "The Marsh House" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Set the entry into memory" }));

  expect(
    screen.getByText(
      "That resource name is already in the chronicle. Choose different wording.",
    ),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the UI test file to verify it fails**

Run: `pnpm vitest run tests/integration/setup-flow.test.tsx`
Expected: FAIL because the play page does not load resource labels and the play surface has no resource composer.

- [ ] **Step 3: Add the resource composer, draft state, and play-page lookup**

```tsx
export function PromptResourceComposer({
  description,
  errorMessage = null,
  isOpen,
  isStationary,
  label,
  onDescriptionChange,
  onLabelChange,
  onStationaryChange,
  onToggle,
}: PromptResourceComposerProps) {
  return (
    <SurfacePanel className="space-y-4 border-gold/18 bg-gold/6 px-6 py-6 sm:px-8">
      <button onClick={onToggle} type="button">
        {isOpen ? "Remove the new resource" : "Add a resource from this prompt"}
      </button>

      {isOpen ? (
        <>
          <input name="newResourceLabel" value={label} />
          <RitualTextarea label="Why it matters" name="newResourceDescription" value={description} />
          <label>
            <input
              checked={isStationary}
              name="newResourceStationary"
              onChange={(event) => onStationaryChange(event.target.checked)}
              type="checkbox"
            />
            Stationary
          </label>
          {errorMessage ? <p className="text-sm text-ink">{errorMessage}</p> : null}
        </>
      ) : null}
    </SurfacePanel>
  );
}
```

```ts
export type PromptDraft = {
  experienceText: string;
  newResourceDescription: string;
  newResourceIsStationary: boolean;
  newResourceLabel: string;
  newSkillDescription: string;
  newSkillLabel: string;
  playerEntry: string;
  shouldCreateResource: boolean;
  shouldCreateSkill: boolean;
};
```

```ts
newResource: isAddingResource
  ? {
      description: newResourceDescription,
      isStationary: newResourceIsStationary,
      label: newResourceLabel,
    }
  : undefined,
```

```ts
const [mindMemoriesResult, diaryResult, skillsResult, resourcesResult, prompt] =
  await Promise.all([
    memoryClient.from("memories").select("id, title, slot_index, location, diary_id").eq("chronicle_id", chronicleId),
    diaryClient.from("diaries").select("id, title, memory_capacity").eq("chronicle_id", chronicleId).eq("status", "active").maybeSingle(),
    skillClient.from("skills").select("label").eq("chronicle_id", chronicleId).order("sort_order", { ascending: true }),
    resourceClient.from("resources").select("label").eq("chronicle_id", chronicleId).order("sort_order", { ascending: true }),
    promptPromise,
  ]);
```

- [ ] **Step 4: Re-run the UI test file**

Run: `pnpm vitest run tests/integration/setup-flow.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the play-surface resource flow**

```bash
git add src/components/ritual/PromptResourceComposer.tsx src/components/ritual/PlaySurface.tsx src/lib/chronicles/localDrafts.ts src/app/'(app)'/chronicles/'[chronicleId]'/play/page.tsx tests/integration/setup-flow.test.tsx
git commit -m "feat: add prompt-created resource flow"
```

### Task 4: Update the Rules Audit and Run Final Verification

**Files:**
- Modify: `docs/thousand-year-old-vampire-rules-coverage-audit.md`
- Test: `tests/integration/chronicle-validation.test.ts`
- Test: `tests/integration/resolve-prompt.test.ts`
- Test: `tests/integration/setup-flow.test.tsx`
- Test: `tests/integration/archive-rules.test.ts`
- Test: `tests/integration/gameplay-rpc-guards.test.ts`

- [ ] **Step 1: Update the rules audit to reflect the new support**

```md
| Prompts can create new Resources during play. | Automated | The play surface now supports prompt-created resources, including stationary resources, and prompt resolution persists them transactionally with the prompt answer. | `src/components/ritual/PromptResourceComposer.tsx`, `src/components/ritual/PlaySurface.tsx`, `src/lib/validation/play.ts`, `supabase/migrations/0011_prompt_created_resources.sql` |
```

```md
| No in-play creation of new skills, resources, characters, or marks | Partial | Skills and resources can now be created during prompt resolution, but characters and marks still lack first-party in-play creation flows. |
```

- [ ] **Step 2: Run the full targeted verification suite**

Run: `pnpm vitest run tests/integration/chronicle-validation.test.ts tests/integration/resolve-prompt.test.ts tests/integration/setup-flow.test.tsx tests/integration/archive-rules.test.ts tests/integration/gameplay-rpc-guards.test.ts`
Expected: PASS

- [ ] **Step 3: Review git diff for drift**

Run: `git diff --stat HEAD~3..HEAD`
Expected: Only the prompt-created resource contract, persistence, play-surface, tests, and audit updates appear.

- [ ] **Step 4: Commit the docs and final polish**

```bash
git add docs/thousand-year-old-vampire-rules-coverage-audit.md
git commit -m "docs: update rules coverage for prompt-created resources"
```

## Self-Review

- Spec coverage: this plan covers the spec's contract, transactional persistence, play-surface UX, duplicate/error handling, stationary-resource support, and audit updates.
- Placeholder scan: no `TODO`, `TBD`, or undefined "write tests later" steps remain.
- Type consistency: the plan uses `newResource`, `PromptCreatedResourceInput`, and `isStationary` consistently across types, UI, and RPC payloads.
