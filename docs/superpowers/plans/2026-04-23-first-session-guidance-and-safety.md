# First-Session Guidance and Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add calm setup teaching, a deliberate safety checkpoint before Prompt 1, and a compact play-side rules reference without adding new routes, persistence, or rules-engine state.

**Architecture:** Keep the feature inside the existing guided setup and play routes. Extract three small presentation components so `SetupStepper` and the play page stay readable, keep the current setup submission path unchanged so error handling still behaves the same, and verify the flow through the existing Vitest and Playwright coverage instead of introducing a parallel test surface.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, Playwright

---

## File Map

- Create: `src/components/ritual/SetupTeachingBlock.tsx` for the reusable `How this works` helper panel rendered on each setup threshold
- Create: `src/components/ritual/SafetyCheckpointPanel.tsx` for the deliberate pre-play threshold content and grounding suggestions
- Create: `src/components/ritual/PlayGuidancePanel.tsx` for the compact reference surface in the play route's secondary column
- Modify: `src/components/ritual/SetupStepper.tsx` to add teaching metadata, optional field hints, a sixth safety step, and checkpoint-aware button labels while preserving the current submit/error path
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx` to render the compact play guidance beside the existing `MemoryMeter`
- Modify: `tests/integration/setup-flow.test.tsx` to cover setup helper blocks, safety-checkpoint sequencing, checkpoint error handling, and play-side guidance
- Modify: `tests/e2e/first-session.spec.ts` to verify the first-session journey pauses at the checkpoint before setup submission

### Task 1: Add helper blocks to the setup thresholds

**Files:**
- Create: `src/components/ritual/SetupTeachingBlock.tsx`
- Modify: `src/components/ritual/SetupStepper.tsx`
- Test: `tests/integration/setup-flow.test.tsx`

- [ ] **Step 1: Write the failing setup-guidance test**

```tsx
it("renders rules guidance inside the setup thresholds", () => {
  render(
    <SetupStepper
      chronicleId="chronicle-1"
      chronicleTitle="The Long Night"
    />,
  );

  expect(screen.getByText("How this works")).toBeInTheDocument();
  expect(
    screen.getByText(
      "This summary anchors the mortal life the chronicle will spend and distort.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Keep this grounded in the life, habits, and loyalties that mattered before undeath.",
    ),
  ).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "Continue to the next threshold" }),
  );

  expect(
    screen.getByText(
      "Skills and resources become part of the living record, so choose what feels defining rather than exhaustive.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Choose one thing the vampire could do before the hunger learned its name.",
    ),
  ).toBeInTheDocument();

  for (let index = 0; index < 3; index += 1) {
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to the next threshold" }),
    );
  }

  expect(
    screen.getByText(
      "These first memories seed the mind the chronicle will later struggle to keep intact.",
    ),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused integration test to confirm RED**

Run: `npx vitest run tests/integration/setup-flow.test.tsx -t "renders rules guidance inside the setup thresholds"`
Expected: FAIL because no setup helper block or new helper copy exists yet

- [ ] **Step 3: Create the reusable setup teaching block**

```tsx
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type SetupTeachingBlockProps = {
  body: string;
  label?: string;
};

export function SetupTeachingBlock({
  body,
  label = "How this works",
}: SetupTeachingBlockProps) {
  return (
    <SurfacePanel className="border-gold/20 bg-gold/5 px-5 py-4">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-gold/80">
        {label}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{body}</p>
    </SurfacePanel>
  );
}
```

- [ ] **Step 4: Thread teaching metadata and concrete hints into `SetupStepper`**

```tsx
const stepDefinitions = [
  {
    heading: "Begin with the life you had before.",
    id: "before-life",
    label: "The life you had before",
    teaching:
      "This summary anchors the mortal life the chronicle will spend and distort.",
  },
  {
    heading: "Name what you can still carry into the night.",
    id: "traits",
    label: "What you can still carry",
    teaching:
      "Skills and resources become part of the living record, so choose what feels defining rather than exhaustive.",
  },
  {
    heading: "Record who stood beside you, and who changed you.",
    id: "characters",
    label: "Who stood beside you",
    teaching:
      "Characters matter both mechanically and emotionally, so choose the people whose loss or loyalty will still wound.",
  },
  {
    heading: "Write the mark the night left upon you.",
    id: "mark",
    label: "What the night left on you",
    teaching:
      "The mark is a lasting sign of what undeath changed, not a catalogue of every curse.",
  },
  {
    heading: "Gather the first memory fragments you refuse to lose.",
    id: "memories",
    label: "First memory fragments",
    teaching:
      "These first memories seed the mind the chronicle will later struggle to keep intact.",
  },
] as const;
```

```tsx
function SetupTextInput({
  hint,
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  hint?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <div className="space-y-3">
      <label
        htmlFor={name}
        className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
      />
      {hint ? (
        <p className="text-sm leading-relaxed text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
```

```tsx
<SetupTeachingBlock body={currentStep.teaching} />

<SetupTextInput
  hint="Choose one thing the vampire could do before the hunger learned its name."
  label="First skill"
  name="firstSkill"
  onChange={(value) =>
    setDraft((currentDraft) => ({
      ...currentDraft,
      initialSkills: [
        {
          ...currentDraft.initialSkills[0],
          label: value,
        },
      ],
    }))
  }
  placeholder="Quiet Devotion"
  value={draft.initialSkills[0]?.label ?? ""}
/>

<SetupTextInput
  hint="Name the place, possession, or leverage survival keeps pulling the chronicle back toward."
  label="First resource"
  name="firstResource"
  onChange={(value) =>
    setDraft((currentDraft) => ({
      ...currentDraft,
      initialResources: [
        {
          ...currentDraft.initialResources[0],
          label: value,
        },
      ],
    }))
  }
  placeholder="The Marsh House"
  value={draft.initialResources[0]?.label ?? ""}
/>

<SetupTextInput
  hint="Pick someone whose absence would still rearrange the vampire's choices."
  label="A mortal character"
  name="firstCharacter"
  onChange={(value) =>
    setDraft((currentDraft) => ({
      ...currentDraft,
      initialCharacters: [
        {
          ...currentDraft.initialCharacters[0],
          name: value,
        },
      ],
    }))
  }
  placeholder="Marta"
  value={draft.initialCharacters[0]?.name ?? ""}
/>
```

- [ ] **Step 5: Re-run the focused integration test to verify GREEN**

Run: `npx vitest run tests/integration/setup-flow.test.tsx -t "renders rules guidance inside the setup thresholds"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add tests/integration/setup-flow.test.tsx src/components/ritual/SetupTeachingBlock.tsx src/components/ritual/SetupStepper.tsx
git commit -m "feat: teach setup thresholds"
```

### Task 2: Insert the deliberate safety checkpoint before Prompt 1

**Files:**
- Create: `src/components/ritual/SafetyCheckpointPanel.tsx`
- Modify: `src/components/ritual/SetupStepper.tsx`
- Modify: `tests/integration/setup-flow.test.tsx`
- Modify: `tests/e2e/first-session.spec.ts`

- [ ] **Step 1: Write the failing checkpoint tests**

```tsx
it("adds a deliberate safety checkpoint before the first prompt", () => {
  render(
    <SetupStepper
      chronicleId="chronicle-1"
      chronicleTitle="The Long Night"
    />,
  );

  for (let index = 0; index < 5; index += 1) {
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to the next threshold" }),
    );
  }

  expect(
    screen.getByRole("heading", {
      name: "Pause at the threshold before the first prompt.",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "This chronicle asks for mature, solitary, and sometimes painful material. You can continue now, step away, or return another night without penalty.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Continue to the first prompt" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Return to the memory fragments" }),
  ).toBeInTheDocument();
});

it("keeps the player on the checkpoint when setup submission fails", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        error: "The chronicle could not be completed just now.",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 500,
      },
    ),
  );

  render(
    <SetupStepper
      chronicleId="chronicle-1"
      chronicleTitle="The Long Night"
    />,
  );

  for (let index = 0; index < 5; index += 1) {
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to the next threshold" }),
    );
  }

  fireEvent.click(
    screen.getByRole("button", { name: "Continue to the first prompt" }),
  );

  await waitFor(() => {
    expect(
      screen.getByText("The chronicle could not be completed just now."),
    ).toBeInTheDocument();
  });
  expect(
    screen.getByRole("heading", {
      name: "Pause at the threshold before the first prompt.",
    }),
  ).toBeInTheDocument();

  fetchMock.mockRestore();
});
```

- [ ] **Step 2: Run the focused checkpoint tests to confirm RED**

Run: `npx vitest run tests/integration/setup-flow.test.tsx -t "checkpoint"`
Expected: FAIL because there is no sixth setup step or safety-specific button copy yet

- [ ] **Step 3: Create the dedicated checkpoint component**

```tsx
import { SurfacePanel } from "@/components/ui/SurfacePanel";

const groundingSuggestions = [
  "Reduce the level of detail when a prompt feels too close.",
  "Pause after a difficult turn and come back another night.",
  "Let implication carry the weight when naming every wound would be too much.",
] as const;

export function SafetyCheckpointPanel() {
  return (
    <SurfacePanel className="border-gold/20 bg-nocturne/5 px-6 py-6 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
        A deliberate threshold
      </p>
      <h2 className="mt-3 font-heading text-3xl leading-tight text-ink">
        Pause at the threshold before the first prompt.
      </h2>
      <p className="mt-4 max-w-reading text-base leading-relaxed text-ink-muted">
        This chronicle asks for mature, solitary, and sometimes painful
        material. You can continue now, step away, or return another night
        without penalty.
      </p>
      <ul className="mt-5 space-y-3 text-sm leading-relaxed text-ink">
        {groundingSuggestions.map((suggestion) => (
          <li key={suggestion}>{suggestion}</li>
        ))}
      </ul>
    </SurfacePanel>
  );
}
```

- [ ] **Step 4: Make the checkpoint the last setup step without changing the existing submit path**

```tsx
const stepDefinitions = [
  {
    heading: "Begin with the life you had before.",
    id: "before-life",
    label: "The life you had before",
    teaching:
      "This summary anchors the mortal life the chronicle will spend and distort.",
  },
  {
    heading: "Name what you can still carry into the night.",
    id: "traits",
    label: "What you can still carry",
    teaching:
      "Skills and resources become part of the living record, so choose what feels defining rather than exhaustive.",
  },
  {
    heading: "Record who stood beside you, and who changed you.",
    id: "characters",
    label: "Who stood beside you",
    teaching:
      "Characters matter both mechanically and emotionally, so choose the people whose loss or loyalty will still wound.",
  },
  {
    heading: "Write the mark the night left upon you.",
    id: "mark",
    label: "What the night left on you",
    teaching:
      "The mark is a lasting sign of what undeath changed, not a catalogue of every curse.",
  },
  {
    heading: "Gather the first memory fragments you refuse to lose.",
    id: "memories",
    label: "First memory fragments",
    teaching:
      "These first memories seed the mind the chronicle will later struggle to keep intact.",
  },
  {
    heading: "Pause at the threshold before the first prompt.",
    id: "safety",
    label: "A deliberate threshold",
    teaching: "",
  },
] as const;

const isSafetyStep = currentStep.id === "safety";
```

```tsx
{isSafetyStep ? (
  <SafetyCheckpointPanel />
) : (
  <SetupTeachingBlock body={currentStep.teaching} />
)}
```

```tsx
<button
  type="button"
  onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
  className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-5 py-3 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
  disabled={stepIndex === 0}
>
  {isSafetyStep
    ? "Return to the memory fragments"
    : "Return to the previous threshold"}
</button>

<button
  type="button"
  onClick={handlePrimaryAction}
  className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92"
  disabled={isSubmitting}
>
  {isSafetyStep
    ? isSubmitting
      ? "Opening the first prompt..."
      : "Continue to the first prompt"
    : "Continue to the next threshold"}
</button>
```

- [ ] **Step 5: Re-run the focused checkpoint tests to verify GREEN**

Run: `npx vitest run tests/integration/setup-flow.test.tsx -t "checkpoint"`
Expected: PASS

- [ ] **Step 6: Update the end-to-end first-session test so submission happens from the checkpoint**

```ts
await page
  .getByRole("button", { name: "Continue to the next threshold" })
  .click();

await expect(
  page.getByRole("heading", {
    name: "Pause at the threshold before the first prompt.",
  }),
).toBeVisible();
await expect(
  page.getByText(
    "This chronicle asks for mature, solitary, and sometimes painful material. You can continue now, step away, or return another night without penalty.",
  ),
).toBeVisible();
await expect(
  page.getByText("Reduce the level of detail when a prompt feels too close."),
).toBeVisible();

const setupCompletionResponsePromise = page.waitForResponse(
  (response) =>
    response.url().includes("/setup/complete") &&
    response.request().method() === "POST",
);
await page
  .getByRole("button", { name: "Continue to the first prompt" })
  .click();
const setupCompletionResponse = await setupCompletionResponsePromise;
```

- [ ] **Step 7: Run the first-session end-to-end test to verify GREEN**

Run: `npx playwright test tests/e2e/first-session.spec.ts`
Expected: PASS and the flow reaches the play route only after the checkpoint submit action

- [ ] **Step 8: Commit**

```bash
git add tests/integration/setup-flow.test.tsx tests/e2e/first-session.spec.ts src/components/ritual/SafetyCheckpointPanel.tsx src/components/ritual/SetupStepper.tsx
git commit -m "feat: add first-session safety checkpoint"
```

### Task 3: Add the compact play-side rules reference

**Files:**
- Create: `src/components/ritual/PlayGuidancePanel.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Modify: `tests/integration/setup-flow.test.tsx`

- [ ] **Step 1: Extend the existing play-route integration test with failing guidance assertions**

```tsx
expect(screen.getByText("Keep your footing")).toBeInTheDocument();
expect(screen.getByText("What belongs in the entry?")).toBeInTheDocument();
expect(
  screen.getByText(
    "Write the immediate answer to the prompt: what the vampire did, chose, or suffered.",
  ),
).toBeInTheDocument();
expect(screen.getByText("When the mind is full")).toBeInTheDocument();
expect(
  screen.getByText(
    "Choose whether the new experience joins a memory, replaces one, or moves into the diary when a diary is present.",
  ),
).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused play-route test to confirm RED**

Run: `npx vitest run tests/integration/setup-flow.test.tsx -t "renders the first prompt and compact memory summary on the play route"`
Expected: FAIL because the play page still renders only `PlaySurface` and `MemoryMeter`

- [ ] **Step 3: Create the compact play guidance panel**

```tsx
import { SurfacePanel } from "@/components/ui/SurfacePanel";

const guidanceItems = [
  {
    title: "What belongs in the entry?",
    body: "Write the immediate answer to the prompt: what the vampire did, chose, or suffered.",
  },
  {
    title: "What is an experience?",
    body: "Distill the lasting consequence into one sentence the chronicle can carry forward.",
  },
  {
    title: "How memories fill",
    body: "Each resolved prompt can set down another fragment until the mind reaches its limit.",
  },
  {
    title: "When the mind is full",
    body: "Choose whether the new experience joins a memory, replaces one, or moves into the diary when a diary is present.",
  },
] as const;

export function PlayGuidancePanel() {
  return (
    <SurfacePanel className="space-y-4 px-5 py-5">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
        Keep your footing
      </p>
      {guidanceItems.map((item) => (
        <div key={item.title} className="space-y-1">
          <h2 className="text-sm font-medium text-ink">{item.title}</h2>
          <p className="text-sm leading-relaxed text-ink-muted">{item.body}</p>
        </div>
      ))}
    </SurfacePanel>
  );
}
```

- [ ] **Step 4: Render the new panel beside the existing memory-state surface**

```tsx
import { MemoryMeter } from "@/components/ritual/MemoryMeter";
import { PlayGuidancePanel } from "@/components/ritual/PlayGuidancePanel";
import { PlaySurface } from "@/components/ritual/PlaySurface";
```

```tsx
<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
  <PlaySurface
    chronicleId={chronicleId}
    hasActiveDiary={diaryCount > 0}
    initialSessionId={chronicle.current_session_id}
    mindMemories={mindMemories.map((memory) => ({
      id: memory.id,
      slotIndex: memory.slot_index,
      title: memory.title,
    }))}
  />

  <div className="space-y-4">
    <PlayGuidancePanel />
    <MemoryMeter
      hasActiveDiary={diaryCount > 0}
      memoriesInMind={memoriesInMind}
    />
  </div>
</div>
```

- [ ] **Step 5: Re-run the focused play-route test to verify GREEN**

Run: `npx vitest run tests/integration/setup-flow.test.tsx -t "renders the first prompt and compact memory summary on the play route"`
Expected: PASS

- [ ] **Step 6: Run lint before the final focused regressions**

Run: `npm run lint`
Expected: exit code 0

- [ ] **Step 7: Run the full integration file**

Run: `npx vitest run tests/integration/setup-flow.test.tsx`
Expected: PASS

- [ ] **Step 8: Re-run the first-session end-to-end test**

Run: `npx playwright test tests/e2e/first-session.spec.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add tests/integration/setup-flow.test.tsx src/components/ritual/PlayGuidancePanel.tsx 'src/app/(app)/chronicles/[chronicleId]/play/page.tsx'
git commit -m "feat: add play-loop guidance surface"
```
