# Prompt Tool Sandbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert prompt resolution into a player-directed tool sandbox by removing prompt-position effect enforcement while keeping all existing manual creation and Skill/Resource mutation tools available.

**Architecture:** Remove `getPromptEffectByPosition` from active play and make `PlaySurface` derive optional tool state only from player drafts and user toggles. Keep prompt-created trait composers and Skill/Resource legality helpers intact, so the player can manually choose actions without the app pretending it parsed the prompt. Update integration, E2E, and audit coverage to describe the sandbox model.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript, Vitest with Testing Library, Playwright E2E, Supabase-backed prompt resolution.

---

## File Structure

- Modify `tests/integration/setup-flow.test.tsx`: replace Prompt 1/Prompt 4 prompt-effect assertions with sandbox assertions, and update the play-page integration test so it expects all tools to be optional.
- Modify `src/components/ritual/PlaySurface.tsx`: remove the `promptEffect` prop, prompt-effect-derived initial state, prompt requirement callout, required composer props, and prompt-effect prefill branches.
- Modify `src/components/ritual/PromptSkillComposer.tsx`: remove the `isRequired` prop and disabled "Required by this prompt" branch.
- Modify `src/components/ritual/PromptResourceComposer.tsx`: remove the `isRequired` prop and disabled "Required by this prompt" branch.
- Modify `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`: stop importing/calling `getPromptEffectByPosition` and stop passing `promptEffect` to `PlaySurface`.
- Delete `src/lib/prompts/effects.ts`: no active play call sites should remain.
- Modify `tests/e2e/first-session.spec.ts`: manually open the prompt-created Skill tool when the journey wants to create `Bloodthirsty`.
- Modify `tests/e2e/beta-smoke.spec.ts`: remove helper logic that assumes auto-opened Prompt 1/Prompt 4 tools.
- Modify `tests/e2e/multi-session.spec.ts`: remove helper logic that assumes auto-opened Prompt 1/Prompt 4 tools.
- Modify `docs/thousand-year-old-vampire-rules-coverage-audit.md`: replace prompt-effect guidance language with manual sandbox language and remove `src/lib/prompts/effects.ts` from evidence.

### Task 1: Lock Sandbox Expectations In Integration Tests

**Files:**
- Modify: `tests/integration/setup-flow.test.tsx`
- Test: `tests/integration/setup-flow.test.tsx`

- [ ] **Step 1: Replace the four Prompt 1/Prompt 4 prompt-effect tests with sandbox tests**

In `tests/integration/setup-flow.test.tsx`, replace the tests beginning with:

```ts
it("surfaces known prompt skill effects and prefills Prompt 1's required skill", async () => {
```

and ending after:

```ts
it("keeps required prompt resource fields open when a stale draft disabled resource creation", async () => {
```

with these tests:

```tsx
  it("keeps the prompt-created skill composer optional even if legacy prompt metadata is passed", async () => {
    const { PlaySurface } = await import("@/components/ritual/PlaySurface");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            archiveEvents: [
              {
                eventType: "prompt_resolved",
                summary: "The entry has been set into memory.",
              },
            ],
            nextPrompt: {
              encounterIndex: 1,
              promptNumber: 4,
            },
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 200,
          },
        ),
      );
    const legacyPromptEffectProps = {
      promptEffect: {
        guidance:
          "This prompt requires a new skill: Bloodthirsty. Add it before setting the entry into memory.",
        skill: {
          label: "Bloodthirsty",
        },
      },
    } as unknown as Partial<Parameters<typeof PlaySurface>[0]>;

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        initialSessionId="session-1"
        {...legacyPromptEffectProps}
      />,
    );

    expect(
      screen.queryByText(
        "This prompt requires a new skill: Bloodthirsty. Add it before setting the entry into memory.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Skill name")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Add a skill from this prompt",
      }),
    ).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Player entry"), {
      target: {
        value:
          "I answered the bells by dragging the sexton into the thawing graveyard.",
      },
    });
    fireEvent.change(screen.getByLabelText("Experience text"), {
      target: {
        value:
          "I left the chapel with blood under my nails and a prayer I could not finish.",
      },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Set the entry into memory",
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body)) as {
      newSkill?: unknown;
    };

    expect(payload.newSkill).toBeUndefined();

    fetchMock.mockRestore();
  });

  it("uses saved drafts, not prompt metadata, to decide whether the skill composer starts open", async () => {
    window.localStorage.setItem(
      "tyov.prompt.chronicle-1",
      JSON.stringify({
        experienceText: "",
        newResourceDescription: "",
        newResourceIsStationary: false,
        newResourceLabel: "",
        newSkillDescription: "",
        newSkillLabel: "",
        playerEntry: "",
        shouldCreateResource: false,
        shouldCreateSkill: false,
      }),
    );
    const { PlaySurface } = await import("@/components/ritual/PlaySurface");
    const legacyPromptEffectProps = {
      promptEffect: {
        guidance:
          "This prompt requires a new skill: Bloodthirsty. Add it before setting the entry into memory.",
        skill: {
          label: "Bloodthirsty",
        },
      },
    } as unknown as Partial<Parameters<typeof PlaySurface>[0]>;

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        initialSessionId="session-1"
        {...legacyPromptEffectProps}
      />,
    );

    expect(screen.queryByLabelText("Skill name")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Add a skill from this prompt",
      }),
    ).toBeEnabled();
  });

  it("keeps the prompt-created resource composer optional even if legacy prompt metadata is passed", async () => {
    const { PlaySurface } = await import("@/components/ritual/PlaySurface");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            archiveEvents: [
              {
                eventType: "prompt_resolved",
                summary: "The entry has been set into memory.",
              },
            ],
            nextPrompt: {
              encounterIndex: 1,
              promptNumber: 7,
            },
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 200,
          },
        ),
      );
    const legacyPromptEffectProps = {
      promptEffect: {
        guidance:
          "This prompt requires a new stationary resource. Add the place that now shelters the chronicle.",
        resource: {
          isStationary: true,
        },
      },
    } as unknown as Partial<Parameters<typeof PlaySurface>[0]>;

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={4}
        initialSessionId="session-1"
        {...legacyPromptEffectProps}
      />,
    );

    expect(
      screen.queryByText(
        "This prompt requires a new stationary resource. Add the place that now shelters the chronicle.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Resource name")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Add a resource from this prompt",
      }),
    ).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Player entry"), {
      target: {
        value:
          "I learned to keep hunger hidden behind a church door and a careful smile.",
      },
    });
    fireEvent.change(screen.getByLabelText("Experience text"), {
      target: {
        value: "Second consequence kept in mind.",
      },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Set the entry into memory",
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body)) as {
      newResource?: unknown;
    };

    expect(payload.newResource).toBeUndefined();

    fetchMock.mockRestore();
  });

  it("uses saved drafts, not prompt metadata, to decide whether the resource composer starts open", async () => {
    window.localStorage.setItem(
      "tyov.prompt.chronicle-1",
      JSON.stringify({
        experienceText: "",
        newResourceDescription: "",
        newResourceIsStationary: false,
        newResourceLabel: "",
        newSkillDescription: "",
        newSkillLabel: "",
        playerEntry: "",
        shouldCreateResource: false,
        shouldCreateSkill: false,
      }),
    );
    const { PlaySurface } = await import("@/components/ritual/PlaySurface");
    const legacyPromptEffectProps = {
      promptEffect: {
        guidance:
          "This prompt requires a new stationary resource. Add the place that now shelters the chronicle.",
        resource: {
          isStationary: true,
        },
      },
    } as unknown as Partial<Parameters<typeof PlaySurface>[0]>;

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={4}
        initialSessionId="session-1"
        {...legacyPromptEffectProps}
      />,
    );

    expect(screen.queryByLabelText("Resource name")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Add a resource from this prompt",
      }),
    ).toBeEnabled();
  });
```

- [ ] **Step 2: Update the play-page integration assertion**

In the play-page integration test near the existing assertions for `skillsOrder`, `resourcesOrder`, `marksOrder`, and `charactersOrder`, replace:

```tsx
    expect(
      screen.getByRole("button", {
        name: "Required by this prompt",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Skill name")).toHaveValue("Bloodthirsty");
```

with:

```tsx
    expect(
      screen.queryByRole("button", {
        name: "Required by this prompt",
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Skill name")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Add a skill from this prompt",
      }),
    ).toBeInTheDocument();
```

- [ ] **Step 3: Run the focused integration tests and confirm the expected failure**

Run:

```bash
npx vitest run tests/integration/setup-flow.test.tsx
```

Expected: FAIL before implementation. The failure should show that legacy `promptEffect` metadata still opens/prefills the Skill or Resource composer, and/or that the play page still renders `Required by this prompt`.

### Task 2: Remove Prompt-Effect State From PlaySurface

**Files:**
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `src/components/ritual/PromptSkillComposer.tsx`
- Modify: `src/components/ritual/PromptResourceComposer.tsx`
- Test: `tests/integration/setup-flow.test.tsx`

- [ ] **Step 1: Remove the prompt effect import and prop from `PlaySurface`**

In `src/components/ritual/PlaySurface.tsx`, remove:

```ts
import type { PromptEffectGuidance } from "@/lib/prompts/effects";
```

Then remove this property from `type PlaySurfaceProps`:

```ts
  promptEffect?: PromptEffectGuidance | null;
```

Then update the component parameter list from:

```ts
  promptEffect = null,
  resources = [],
  skills = [],
}: PlaySurfaceProps) {
  const hasTrackedFirstPromptResolved = useRef(false);
  const initialDraft = loadPromptDraft(chronicleId);
  const requiresPromptResource = Boolean(promptEffect?.resource);
  const requiresPromptSkill = Boolean(promptEffect?.skill);
```

to:

```ts
  resources = [],
  skills = [],
}: PlaySurfaceProps) {
  const hasTrackedFirstPromptResolved = useRef(false);
  const initialDraft = loadPromptDraft(chronicleId);
```

- [ ] **Step 2: Make composer initial state draft-driven only**

In `src/components/ritual/PlaySurface.tsx`, replace the Resource and Skill state initializers with:

```ts
  const [isAddingResource, setIsAddingResource] = useState(
    () => initialDraft?.shouldCreateResource ?? false,
  );
  const [newResourceLabel, setNewResourceLabel] = useState(
    () => initialDraft?.newResourceLabel ?? "",
  );
  const [newResourceDescription, setNewResourceDescription] = useState(
    () => initialDraft?.newResourceDescription ?? "",
  );
  const [newResourceIsStationary, setNewResourceIsStationary] = useState(
    () => initialDraft?.newResourceIsStationary ?? false,
  );
```

and:

```ts
  const [isAddingSkill, setIsAddingSkill] = useState(
    () => initialDraft?.shouldCreateSkill ?? false,
  );
  const [newSkillLabel, setNewSkillLabel] = useState(
    () => initialDraft?.newSkillLabel ?? "",
  );
  const [newSkillDescription, setNewSkillDescription] = useState(
    () => initialDraft?.newSkillDescription ?? "",
  );
```

- [ ] **Step 3: Simplify the Skill and Resource composer toggles**

In `src/components/ritual/PlaySurface.tsx`, replace `handleSkillComposerToggle` with:

```ts
  function handleSkillComposerToggle() {
    if (isAddingSkill) {
      syncPromptDraft({
        newSkillDescription: "",
        newSkillLabel: "",
        shouldCreateSkill: false,
      });

      setIsAddingSkill(false);
      setNewSkillLabel("");
      setNewSkillDescription("");
      setSkillErrorMessage(null);
      return;
    }

    setIsAddingSkill(true);
    setSkillErrorMessage(null);
  }
```

Replace `handleResourceComposerToggle` with:

```ts
  function handleResourceComposerToggle() {
    if (isAddingResource) {
      syncPromptDraft({
        newResourceDescription: "",
        newResourceIsStationary: false,
        newResourceLabel: "",
        shouldCreateResource: false,
      });

      setIsAddingResource(false);
      setNewResourceDescription("");
      setNewResourceIsStationary(false);
      setNewResourceLabel("");
      setResourceErrorMessage(null);
      return;
    }

    setIsAddingResource(true);
    setResourceErrorMessage(null);
  }
```

- [ ] **Step 4: Remove the prompt requirement callout**

In `src/components/ritual/PlaySurface.tsx`, delete this block:

```tsx
      {!hasResolvedPrompt && promptEffect?.guidance ? (
        <SurfacePanel className="border-gold/20 bg-gold/8 px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Prompt requirement
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {promptEffect.guidance}
          </p>
        </SurfacePanel>
      ) : null}
```

- [ ] **Step 5: Stop passing required flags to prompt-created composers**

In `src/components/ritual/PlaySurface.tsx`, change:

```tsx
          <PromptSkillComposer
            description={newSkillDescription}
            errorMessage={skillErrorMessage}
            isOpen={isAddingSkill}
            isRequired={requiresPromptSkill}
            label={newSkillLabel}
            onDescriptionChange={setNewSkillDescription}
            onLabelChange={setNewSkillLabel}
            onToggle={handleSkillComposerToggle}
          />
          <PromptResourceComposer
            description={newResourceDescription}
            errorMessage={resourceErrorMessage}
            isOpen={isAddingResource}
            isRequired={requiresPromptResource}
            isStationary={newResourceIsStationary}
            label={newResourceLabel}
            onDescriptionChange={setNewResourceDescription}
            onLabelChange={setNewResourceLabel}
            onStationaryChange={setNewResourceIsStationary}
            onToggle={handleResourceComposerToggle}
          />
```

to:

```tsx
          <PromptSkillComposer
            description={newSkillDescription}
            errorMessage={skillErrorMessage}
            isOpen={isAddingSkill}
            label={newSkillLabel}
            onDescriptionChange={setNewSkillDescription}
            onLabelChange={setNewSkillLabel}
            onToggle={handleSkillComposerToggle}
          />
          <PromptResourceComposer
            description={newResourceDescription}
            errorMessage={resourceErrorMessage}
            isOpen={isAddingResource}
            isStationary={newResourceIsStationary}
            label={newResourceLabel}
            onDescriptionChange={setNewResourceDescription}
            onLabelChange={setNewResourceLabel}
            onStationaryChange={setNewResourceIsStationary}
            onToggle={handleResourceComposerToggle}
          />
```

- [ ] **Step 6: Remove `isRequired` from `PromptSkillComposer`**

In `src/components/ritual/PromptSkillComposer.tsx`, change the props type from:

```ts
type PromptSkillComposerProps = {
  description: string;
  errorMessage?: string | null;
  isOpen: boolean;
  isRequired?: boolean;
  label: string;
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onToggle: () => void;
};
```

to:

```ts
type PromptSkillComposerProps = {
  description: string;
  errorMessage?: string | null;
  isOpen: boolean;
  label: string;
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onToggle: () => void;
};
```

Change the component destructuring from:

```ts
  isOpen,
  isRequired = false,
  label,
```

to:

```ts
  isOpen,
  label,
```

Change the button from:

```tsx
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40"
          disabled={isRequired}
          onClick={onToggle}
          type="button"
        >
          {isRequired
            ? "Required by this prompt"
            : isOpen
              ? "Remove the new skill"
              : "Add a skill from this prompt"}
        </button>
```

to:

```tsx
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40"
          onClick={onToggle}
          type="button"
        >
          {isOpen ? "Remove the new skill" : "Add a skill from this prompt"}
        </button>
```

- [ ] **Step 7: Remove `isRequired` from `PromptResourceComposer`**

In `src/components/ritual/PromptResourceComposer.tsx`, change the props type from:

```ts
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
```

to:

```ts
type PromptResourceComposerProps = {
  description: string;
  errorMessage?: string | null;
  isOpen: boolean;
  isStationary: boolean;
  label: string;
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onStationaryChange: (value: boolean) => void;
  onToggle: () => void;
};
```

Change the component destructuring from:

```ts
  isOpen,
  isRequired = false,
  isStationary,
```

to:

```ts
  isOpen,
  isStationary,
```

Change the button from:

```tsx
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
```

to:

```tsx
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40"
          onClick={onToggle}
          type="button"
        >
          {isOpen ? "Remove the new resource" : "Add a resource from this prompt"}
        </button>
```

- [ ] **Step 8: Run the focused integration tests**

Run:

```bash
npx vitest run tests/integration/setup-flow.test.tsx
```

Expected: FAIL only on the play-page test if `ChroniclePlayPage` still passes `promptEffect`. If it passes already, continue to Task 3 and still remove the play-page effect path.

### Task 3: Remove Prompt Effects From the Play Page and Delete the Helper

**Files:**
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Delete: `src/lib/prompts/effects.ts`
- Test: `tests/integration/setup-flow.test.tsx`

- [ ] **Step 1: Remove the prompt effects import from the play page**

In `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`, delete:

```ts
import { getPromptEffectByPosition } from "@/lib/prompts/effects";
```

- [ ] **Step 2: Remove prompt-effect derivation from the play page**

In `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`, delete:

```ts
  const promptEffect = getPromptEffectByPosition(
    chronicle.current_prompt_number,
    chronicle.current_prompt_encounter,
    chronicle.prompt_version,
  );
```

- [ ] **Step 3: Stop passing prompt effects into `PlaySurface`**

In `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`, remove this prop:

```tsx
          promptEffect={promptEffect}
```

The `PlaySurface` call should still include:

```tsx
        <PlaySurface
          activeDiary={activeDiary}
          chronicleId={chronicleId}
          currentPromptNumber={chronicle.current_prompt_number}
          existingCharacterNames={(charactersResult.data ?? []).map(
            (character) => character.name,
          )}
          existingMarkLabels={(marksResult.data ?? []).map((mark) => mark.label)}
          existingResourceLabels={(resourcesResult.data ?? []).map(
            (resource) => resource.label,
          )}
          existingSkillLabels={(skillsResult.data ?? []).map((skill) => skill.label)}
          initialSessionId={chronicle.current_session_id}
          mindMemories={mindMemories.map((memory) => ({
            entryCount: memory.memory_entries?.length ?? 0,
            id: memory.id,
            slotIndex: memory.slot_index,
            title: memory.title,
          }))}
          resources={(resourcesResult.data ?? []).map((resource) => ({
            description: resource.description,
            id: resource.id,
            isStationary: resource.is_stationary,
            label: resource.label,
            status: resource.status,
          }))}
          skills={skillsResult.data ?? []}
        />
```

- [ ] **Step 4: Delete the prompt effects helper**

Delete `src/lib/prompts/effects.ts`.

- [ ] **Step 5: Confirm no source or test call sites remain**

Run:

```bash
rg "getPromptEffectByPosition|PromptEffectGuidance|@/lib/prompts/effects" src tests
rg "promptEffect" src
```

Expected: both commands return no output. The integration test may still contain `legacyPromptEffectProps` to prove old metadata is ignored.

- [ ] **Step 6: Run focused integration tests**

Run:

```bash
npx vitest run tests/integration/setup-flow.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit the sandbox code and integration tests**

Run:

```bash
git add \
  tests/integration/setup-flow.test.tsx \
  src/components/ritual/PlaySurface.tsx \
  src/components/ritual/PromptSkillComposer.tsx \
  src/components/ritual/PromptResourceComposer.tsx \
  'src/app/(app)/chronicles/[chronicleId]/play/page.tsx' \
  src/lib/prompts/effects.ts
git commit -m "feat: make prompt tools player directed"
```

Expected: commit succeeds. `src/lib/prompts/effects.ts` should appear as deleted in the commit.

### Task 4: Update E2E Journeys for Manual Tool Use

**Files:**
- Modify: `tests/e2e/first-session.spec.ts`
- Modify: `tests/e2e/beta-smoke.spec.ts`
- Modify: `tests/e2e/multi-session.spec.ts`
- Test: Playwright focused specs

- [ ] **Step 1: Make the first-session journey manually open the Skill tool**

In `tests/e2e/first-session.spec.ts`, replace:

```ts
  await expect(page.getByLabel("Skill name")).toHaveValue("Bloodthirsty");
  await page
    .getByLabel("Why this skill now")
    .fill("I learned to feed first and mourn later.");
```

with:

```ts
  await expect(page.getByLabel("Skill name")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add a skill from this prompt" })
    .click();
  await page.getByLabel("Skill name").fill("Bloodthirsty");
  await page
    .getByLabel("Why this skill now")
    .fill("I learned to feed first and mourn later.");
```

- [ ] **Step 2: Remove auto-opened Skill/Resource handling from beta smoke helper**

In `tests/e2e/beta-smoke.spec.ts`, remove this block from `resolvePrompt`:

```ts
  if (await page.getByLabel("Why this skill now").isVisible().catch(() => false)) {
    await expect(page.getByLabel("Skill name")).toHaveValue("Bloodthirsty");
    await page
      .getByLabel("Why this skill now")
      .fill("I learned to feed first and mourn later.");
  }

  if (await page.getByLabel("Resource name").isVisible().catch(() => false)) {
    await page.getByLabel("Resource name").fill("A trusted resting place");
    await page
      .getByLabel("Why it matters")
      .fill("It sheltered me while I learned to survive outside mortal company.");
    await expect(page.getByLabel("Stationary")).toBeChecked();
  }
```

Do not replace it with anything. The helper should fill only the core writing fields and overflow choices unless a test explicitly opens a sandbox tool.

- [ ] **Step 3: Remove auto-opened Skill/Resource handling from multi-session helper**

In `tests/e2e/multi-session.spec.ts`, remove this block from `resolvePrompt`:

```ts
  if (await page.getByLabel("Why this skill now").isVisible().catch(() => false)) {
    await expect(page.getByLabel("Skill name")).toHaveValue("Bloodthirsty");
    await page
      .getByLabel("Why this skill now")
      .fill("I learned to feed first and mourn later.");
  }

  if (await page.getByLabel("Resource name").isVisible().catch(() => false)) {
    await page.getByLabel("Resource name").fill("A trusted resting place");
    await page
      .getByLabel("Why it matters")
      .fill("It sheltered me while I learned to survive outside mortal company.");
    await expect(page.getByLabel("Stationary")).toBeChecked();
  }
```

Do not replace it with anything.

- [ ] **Step 4: Confirm no E2E test expects automatic Bloodthirsty or stationary Resource fields**

Run:

```bash
rg "toHaveValue\\(\"Bloodthirsty\"\\)|Required by this prompt|toBeChecked\\(\\)" tests/e2e
```

Expected: no output for `Bloodthirsty` auto-prefill or `Required by this prompt`. If `toBeChecked()` appears for unrelated controls, inspect the match and keep it only when it is not about prompt-created Resource stationarity.

- [ ] **Step 5: Run focused E2E specs**

Run:

```bash
npx playwright test tests/e2e/first-session.spec.ts tests/e2e/beta-smoke.spec.ts tests/e2e/multi-session.spec.ts
```

Expected: PASS. If the local browser server setup makes this slow, run `npx playwright test tests/e2e/first-session.spec.ts` first, then the other two specs.

- [ ] **Step 6: Commit E2E updates**

Run:

```bash
git add tests/e2e/first-session.spec.ts tests/e2e/beta-smoke.spec.ts tests/e2e/multi-session.spec.ts
git commit -m "test: update prompt sandbox journeys"
```

Expected: commit succeeds.

### Task 5: Update the Rules Coverage Audit

**Files:**
- Modify: `docs/thousand-year-old-vampire-rules-coverage-audit.md`
- Test: documentation grep checks

- [ ] **Step 1: Update the executive summary partial-coverage row**

In `docs/thousand-year-old-vampire-rules-coverage-audit.md`, replace:

```md
| Prompt-created traits | The play UI can create new Skills, Resources, Characters, and Marks, but only base Prompt 1 and base Prompt 4 receive special prompt-effect guidance. Most prompt-required creations are manual player interpretation. |
```

with:

```md
| Prompt-created traits | The play UI offers a prompt tool sandbox for creating new Skills, Resources, Characters, and Marks during resolution. The app deliberately does not infer which prompts require those tools; the player opens the relevant tool when the prompt calls for it. |
```

- [ ] **Step 2: Update the missing-area parsing row**

Replace:

```md
| Structured prompt-instruction parsing | The player still declares which Skill/Resource change the prompt requires; the app does not yet parse every prompt into required mechanical effects. |
```

with:

```md
| Structured prompt-instruction parsing | The app intentionally leaves prompt interpretation to the player and provides manual tools for supported outcomes instead of parsing every prompt into required mechanical effects. |
```

- [ ] **Step 3: Update detailed prompt parsing evidence**

Replace the detailed rows that cite `src/lib/prompts/effects.ts` with these versions:

```md
| Most prompts modify one or more traits. | Partial | The app shows prompt text and provides a manual sandbox for supported trait outcomes, but it does not parse prompt instructions into required trait actions. | `src/components/ritual/PromptCard.tsx`, `src/components/ritual/PlaySurface.tsx` |
| Prompt-specific instructions take precedence over general rules. | Manual | Prompt text is shown, but the app does not understand, enforce, or prioritize those instructions automatically. | `src/components/ritual/PromptCard.tsx`, `src/components/ritual/PlaySurface.tsx` |
```

- [ ] **Step 4: Update Skill and Resource creation rows**

Replace the Skill row:

```md
| Prompts can create new Skills during play. | Partial | The play surface can persist one new Skill transactionally. Base Prompt 1 is specifically guided and required by `getPromptEffectByPosition`; other prompt-required Skills rely on the player opening the optional composer. | `src/lib/prompts/effects.ts`, `src/components/ritual/PromptSkillComposer.tsx`, `src/components/ritual/PlaySurface.tsx`, `supabase/migrations/0010_prompt_created_skills.sql` |
```

with:

```md
| Prompts can create new Skills during play. | Partial | The play surface can persist one new Skill transactionally through an optional sandbox composer. Prompt text remains player-interpreted, so the app does not infer when a Skill is required. | `src/components/ritual/PromptSkillComposer.tsx`, `src/components/ritual/PlaySurface.tsx`, `supabase/migrations/0010_prompt_created_skills.sql` |
```

Replace the Resource stationarity row:

```md
| Resources can be stationary. | Partial | `is_stationary` is modeled and visible, but guided setup does not expose a stationary/portable choice for the first Resource. Prompt 4 does require a stationary Resource. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx`, `src/lib/prompts/effects.ts`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
```

with:

```md
| Resources can be stationary. | Partial | `is_stationary` is modeled, visible, and available when the player manually creates a prompt Resource, but guided setup does not expose a stationary/portable choice for the first Resource. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx`, `src/components/ritual/PromptResourceComposer.tsx`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
```

Replace the Resource creation row:

```md
| Prompts can create new Resources during play. | Partial | The play surface can persist one new Resource transactionally. Base Prompt 4 is specifically guided and required as stationary; other prompt-required Resources rely on the player opening the optional composer. | `src/lib/prompts/effects.ts`, `src/components/ritual/PromptResourceComposer.tsx`, `supabase/migrations/0011_prompt_created_resources.sql` |
```

with:

```md
| Prompts can create new Resources during play. | Partial | The play surface can persist one new Resource transactionally through an optional sandbox composer, including the stationary flag. Prompt text remains player-interpreted, so the app does not infer when a Resource is required. | `src/components/ritual/PromptResourceComposer.tsx`, `src/components/ritual/PlaySurface.tsx`, `supabase/migrations/0011_prompt_created_resources.sql` |
```

- [ ] **Step 5: Soften automatic-parsing language in Skill/Resource substitution rows**

Replace the Skill check substitution assessment:

```md
The app still does not parse prompt text into this requirement automatically.
```

with:

```md
The sandbox model leaves the player responsible for deciding when the current prompt calls for this requirement.
```

Replace:

```md
Prompt parsing remains manual.
```

with:

```md
Prompt interpretation remains player-directed.
```

Replace:

```md
The app still relies on the player to identify that the current prompt requires the exhausted change.
```

with:

```md
The sandbox model still relies on the player to identify that the current prompt requires the exhausted change.
```

- [ ] **Step 6: Confirm removed helper references are gone**

Run:

```bash
rg "src/lib/prompts/effects|getPromptEffectByPosition|Prompt 1 is specifically guided|Prompt 4 is specifically guided|does not yet parse every prompt" docs/thousand-year-old-vampire-rules-coverage-audit.md
```

Expected: no output.

- [ ] **Step 7: Commit audit updates**

Run:

```bash
git add docs/thousand-year-old-vampire-rules-coverage-audit.md
git commit -m "docs: describe prompt tool sandbox coverage"
```

Expected: commit succeeds.

### Task 6: Final Verification

**Files:**
- Verify: full changed surface

- [ ] **Step 1: Check worktree status**

Run:

```bash
git status --short
```

Expected: only unrelated pre-existing untracked files may remain:

```text
?? docs/superpowers/plans/2026-04-24-diary-capacity.md
?? docs/superpowers/plans/2026-04-24-prompt-created-skills.md
```

If files from this plan are unstaged or uncommitted, inspect them and commit them before continuing.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run the full Vitest suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 4: Run focused E2E verification**

Run:

```bash
npx playwright test tests/e2e/first-session.spec.ts tests/e2e/beta-smoke.spec.ts tests/e2e/multi-session.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Search for removed prompt-effect concepts**

Run:

```bash
rg "getPromptEffectByPosition|PromptEffectGuidance|@/lib/prompts/effects|Required by this prompt|Prompt requirement" src tests docs/thousand-year-old-vampire-rules-coverage-audit.md
```

Expected: no output.

- [ ] **Step 6: Commit any verification-only cleanup**

If verification required cleanup changes, run `git status --short`, stage only files from this plan's file-structure list that appear as modified, and commit them:

```bash
git commit -m "chore: finish prompt sandbox cleanup"
```

Expected: commit succeeds. If there are no cleanup changes, skip this step.
