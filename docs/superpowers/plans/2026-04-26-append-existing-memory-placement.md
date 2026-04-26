# Append Existing Memory Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players append a new Experience to an existing in-mind Memory from the normal play UI.

**Architecture:** The backend already supports `append-existing`, so this plan adds first-party UI and page data for choosing a target Memory. `PlaySurface` owns the memory-placement state and payload assembly, while the play page supplies Memory entry counts so the client can disable full Memories before submit.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Vitest, Testing Library, Playwright for UAT.

---

## File Structure

- Modify `src/components/ritual/PlaySurface.tsx`: add memory-placement state, validation, draft persistence, and request payload generation.
- Create `src/components/ritual/MemoryPlacementPanel.tsx`: render the create-new versus append-existing controls.
- Modify `src/lib/chronicles/localDrafts.ts`: persist the selected placement mode and append target with the existing prompt draft.
- Modify `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`: fetch nested `memory_entries(id)` with memories and pass `entryCount` to `PlaySurface`.
- Modify `tests/integration/setup-flow.test.tsx`: add component and page integration coverage for append-existing placement.
- Modify `docs/thousand-year-old-vampire-rules-coverage-audit.md`: move normal append-existing UI from Partial/Missing to Automated and update the biggest-gaps summary.

---

### Task 1: PlaySurface Append Payload Behavior

**Files:**
- Modify: `tests/integration/setup-flow.test.tsx`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `src/lib/chronicles/localDrafts.ts`
- Create: `src/components/ritual/MemoryPlacementPanel.tsx`

- [ ] **Step 1: Write the failing append payload test**

Add this test near the existing `PlaySurface` prompt-resolution tests in `tests/integration/setup-flow.test.tsx`:

```tsx
it("submits append-existing when the player chooses an in-mind memory", async () => {
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
          promptRunId: "run-1",
          rolled: {
            d10: 7,
            d6: 4,
            movement: 3,
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

  const { PlaySurface } = await import("@/components/ritual/PlaySurface");

  render(
    <PlaySurface
      chronicleId="chronicle-1"
      currentPromptNumber={1}
      initialSessionId="session-1"
      mindMemories={[
        {
          entryCount: 2,
          id: "9b3a25d0-89de-4c6f-b0fd-f719f99c4f6b",
          slotIndex: 1,
          title: "Winter bells",
        },
      ]}
    />,
  );

  fireEvent.change(screen.getByLabelText("Player entry"), {
    target: {
      value: "I answered the bells by dragging the sexton into the thawing graveyard.",
    },
  });
  fireEvent.change(screen.getByLabelText("Experience text"), {
    target: {
      value:
        "I left the chapel with blood under my nails and a prayer I could not finish.",
    },
  });
  fireEvent.click(
    screen.getByRole("radio", {
      name: /Add this Experience to an existing Memory/i,
    }),
  );
  fireEvent.click(
    screen.getByRole("radio", {
      name: /Slot 1: Winter bells/i,
    }),
  );
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
    memoryDecision: {
      mode: string;
      targetMemoryId: string;
    };
  };

  expect(payload.memoryDecision).toEqual({
    mode: "append-existing",
    targetMemoryId: "9b3a25d0-89de-4c6f-b0fd-f719f99c4f6b",
  });

  fetchMock.mockRestore();
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
npm test -- tests/integration/setup-flow.test.tsx -t "submits append-existing"
```

Expected: FAIL because the append-existing placement controls do not exist.

- [ ] **Step 3: Add draft fields for memory placement**

Extend `PromptDraft` in `src/lib/chronicles/localDrafts.ts`:

```ts
export type PromptDraft = {
  experienceText: string;
  memoryPlacementMode?: "append-existing" | "create-new";
  newMarkDescription: string;
  newMarkIsConcealed: boolean;
  newMarkLabel: string;
  newResourceDescription: string;
  newResourceIsStationary: boolean;
  newResourceLabel: string;
  newSkillDescription: string;
  newSkillLabel: string;
  playerEntry: string;
  selectedAppendMemoryId?: string;
  shouldCreateMark: boolean;
  shouldCreateResource: boolean;
  shouldCreateSkill: boolean;
};
```

- [ ] **Step 4: Create the placement panel**

Create `src/components/ritual/MemoryPlacementPanel.tsx`:

```tsx
"use client";

import { SurfacePanel } from "@/components/ui/SurfacePanel";

type PlacementMode = "append-existing" | "create-new";

type MemoryPlacementPanelProps = {
  memories: Array<{
    entryCount?: number;
    id: string;
    slotIndex: number | null;
    title: string;
  }>;
  onModeChange: (value: PlacementMode) => void;
  onSelectedMemoryChange: (value: string) => void;
  selectedMemoryId: string | null;
  selectedMode: PlacementMode;
};

function describeEntryCount(entryCount: number | undefined) {
  if (typeof entryCount !== "number") {
    return "Held in mind; the chronicle will confirm whether there is room.";
  }

  return `${entryCount} of 3 Experiences held here.`;
}

export function MemoryPlacementPanel({
  memories,
  onModeChange,
  onSelectedMemoryChange,
  selectedMemoryId,
  selectedMode,
}: MemoryPlacementPanelProps) {
  const canAppend = memories.length > 0;

  return (
    <SurfacePanel className="space-y-5 border-ink/10 bg-surface/88 px-5 py-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
          Memory placement
        </p>
        <h3 className="mt-2 font-heading text-2xl text-ink">
          Decide where this Experience settles.
        </h3>
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">Memory placement</legend>

        <label className="flex cursor-pointer items-start gap-3 rounded-soft border border-ink/10 bg-surface px-4 py-3">
          <input
            checked={selectedMode === "create-new"}
            className="mt-1"
            name="memoryPlacementMode"
            onChange={() => onModeChange("create-new")}
            type="radio"
            value="create-new"
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-ink">
              Begin a new Memory
            </span>
            <span className="block text-sm leading-relaxed text-ink-muted">
              Let this Experience open a new thread in the vampire's mind.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-soft border border-ink/10 bg-surface px-4 py-3">
          <input
            checked={selectedMode === "append-existing"}
            className="mt-1"
            disabled={!canAppend}
            name="memoryPlacementMode"
            onChange={() => onModeChange("append-existing")}
            type="radio"
            value="append-existing"
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-ink">
              Add this Experience to an existing Memory
            </span>
            <span className="block text-sm leading-relaxed text-ink-muted">
              Keep related Experiences clustered until a Memory holds three.
            </span>
          </span>
        </label>
      </fieldset>

      {selectedMode === "append-existing" && canAppend ? (
        <fieldset className="space-y-3">
          <legend className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Choose the Memory
          </legend>
          <div className="space-y-2">
            {memories.map((memory) => {
              const isFull =
                typeof memory.entryCount === "number" && memory.entryCount >= 3;

              return (
                <label
                  key={memory.id}
                  className="flex cursor-pointer items-start gap-3 rounded-soft border border-ink/10 bg-surface px-4 py-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
                >
                  <input
                    checked={selectedMemoryId === memory.id}
                    className="mt-1"
                    disabled={isFull}
                    name="appendMemory"
                    onChange={() => onSelectedMemoryChange(memory.id)}
                    type="radio"
                    value={memory.id}
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-ink">
                      {memory.slotIndex
                        ? `Slot ${memory.slotIndex}: ${memory.title}`
                        : memory.title}
                    </span>
                    <span className="block text-sm leading-relaxed text-ink-muted">
                      {isFull
                        ? "This Memory already holds 3 Experiences."
                        : describeEntryCount(memory.entryCount)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
    </SurfacePanel>
  );
}
```

- [ ] **Step 5: Wire placement state in `PlaySurface`**

Add the import, prop entry count, state, validation, draft fields, and payload branch:

```tsx
import { MemoryPlacementPanel } from "@/components/ritual/MemoryPlacementPanel";

type MemoryPlacementMode = "append-existing" | "create-new";

// In PlaySurfaceProps mindMemories:
mindMemories?: Array<{
  entryCount?: number;
  id: string;
  slotIndex: number | null;
  title: string;
}>;

const [memoryPlacementMode, setMemoryPlacementMode] =
  useState<MemoryPlacementMode>(
    () => initialDraft?.memoryPlacementMode ?? "create-new",
  );
const [selectedAppendMemoryId, setSelectedAppendMemoryId] = useState<
  string | null
>(() => initialDraft?.selectedAppendMemoryId ?? null);

const selectedAppendMemory = mindMemories.find(
  (memory) => memory.id === selectedAppendMemoryId,
);
const selectedAppendMemoryIsFull =
  typeof selectedAppendMemory?.entryCount === "number" &&
  selectedAppendMemory.entryCount >= 3;
const requiresOverflowDecision =
  memoryPlacementMode === "create-new" && mindMemories.length >= 5;
```

Add these fields to `syncPromptDraft` and `hasAnyDraftContent`:

```tsx
memoryPlacementMode: MemoryPlacementMode;
selectedAppendMemoryId: string | null;

memoryPlacementMode,
selectedAppendMemoryId,

Boolean(nextDraft.selectedAppendMemoryId) ||
nextDraft.memoryPlacementMode === "append-existing" ||
```

Add validation before submit:

```tsx
if (memoryPlacementMode === "append-existing" && !selectedAppendMemoryId) {
  setErrorMessage("Choose which Memory receives this Experience.");
  return;
}

if (memoryPlacementMode === "append-existing" && selectedAppendMemoryIsFull) {
  setErrorMessage("That Memory is already full.");
  return;
}
```

Replace the existing request `memoryDecision` branch with:

```tsx
memoryDecision:
  memoryPlacementMode === "append-existing" && selectedAppendMemoryId
    ? {
        mode: "append-existing",
        targetMemoryId: selectedAppendMemoryId,
      }
    : requiresOverflowDecision && overflowMode && selectedOverflowMemoryId
      ? {
          memoryId: selectedOverflowMemoryId,
          mode: overflowMode,
        }
      : {
          mode: "create-new",
        },
```

Render the panel after `Experience text`:

```tsx
<MemoryPlacementPanel
  memories={mindMemories}
  onModeChange={(mode) => {
    setMemoryPlacementMode(mode);
    setErrorMessage(null);
    syncPromptDraft({ memoryPlacementMode: mode });
  }}
  onSelectedMemoryChange={(memoryId) => {
    setSelectedAppendMemoryId(memoryId);
    setErrorMessage(null);
    syncPromptDraft({ selectedAppendMemoryId: memoryId });
  }}
  selectedMemoryId={selectedAppendMemoryId}
  selectedMode={memoryPlacementMode}
/>
```

Clear placement after successful submit:

```tsx
setMemoryPlacementMode("create-new");
setSelectedAppendMemoryId(null);
```

- [ ] **Step 6: Run the focused test and verify pass**

Run:

```bash
npm test -- tests/integration/setup-flow.test.tsx -t "submits append-existing"
```

Expected: PASS.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add src/components/ritual/MemoryPlacementPanel.tsx src/components/ritual/PlaySurface.tsx src/lib/chronicles/localDrafts.ts tests/integration/setup-flow.test.tsx
git commit -m "feat: add append existing memory placement"
```

---

### Task 2: Full Memory and Overflow Rules

**Files:**
- Modify: `tests/integration/setup-flow.test.tsx`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `src/components/ritual/MemoryPlacementPanel.tsx`

- [ ] **Step 1: Write failing tests for full and full-mind cases**

Add these tests near the Task 1 test:

```tsx
it("disables full memories in the append-existing picker", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch");
  const { PlaySurface } = await import("@/components/ritual/PlaySurface");

  render(
    <PlaySurface
      chronicleId="chronicle-1"
      currentPromptNumber={1}
      initialSessionId="session-1"
      mindMemories={[
        {
          entryCount: 3,
          id: "9b3a25d0-89de-4c6f-b0fd-f719f99c4f6b",
          slotIndex: 1,
          title: "Winter bells",
        },
      ]}
    />,
  );

  fireEvent.click(
    screen.getByRole("radio", {
      name: /Add this Experience to an existing Memory/i,
    }),
  );

  expect(
    screen.getByRole("radio", {
      name: /Slot 1: Winter bells/i,
    }),
  ).toBeDisabled();
  expect(
    screen.getByText("This Memory already holds 3 Experiences."),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Player entry"), {
    target: { value: "I answered the prompt." },
  });
  fireEvent.change(screen.getByLabelText("Experience text"), {
    target: { value: "I carried the consequence forward." },
  });
  fireEvent.click(
    screen.getByRole("button", {
      name: "Set the entry into memory",
    }),
  );

  expect(
    screen.getByText("Choose which Memory receives this Experience."),
  ).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();

  fetchMock.mockRestore();
});

it("allows append-existing without overflow when five memories are in mind", async () => {
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
          promptRunId: "run-1",
          rolled: {
            d10: 7,
            d6: 4,
            movement: 3,
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
  const { PlaySurface } = await import("@/components/ritual/PlaySurface");

  render(
    <PlaySurface
      chronicleId="chronicle-1"
      initialSessionId="session-1"
      mindMemories={[
        { entryCount: 1, id: "memory-1", slotIndex: 1, title: "Winter bells" },
        { entryCount: 1, id: "memory-2", slotIndex: 2, title: "The nameless face" },
        { entryCount: 1, id: "memory-3", slotIndex: 3, title: "A flooded chapel" },
        { entryCount: 1, id: "memory-4", slotIndex: 4, title: "The black carriage" },
        { entryCount: 1, id: "memory-5", slotIndex: 5, title: "A ruined oath" },
      ]}
    />,
  );

  fireEvent.click(
    screen.getByRole("radio", {
      name: /Add this Experience to an existing Memory/i,
    }),
  );
  expect(screen.queryByText("The mind is full.")).not.toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("radio", {
      name: /Slot 1: Winter bells/i,
    }),
  );
  fireEvent.change(screen.getByLabelText("Player entry"), {
    target: { value: "I answered the prompt." },
  });
  fireEvent.change(screen.getByLabelText("Experience text"), {
    target: { value: "I carried the consequence forward." },
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
    memoryDecision: {
      mode: string;
      targetMemoryId: string;
    };
  };

  expect(payload.memoryDecision).toEqual({
    mode: "append-existing",
    targetMemoryId: "memory-1",
  });

  fetchMock.mockRestore();
});
```

- [ ] **Step 2: Run the new focused tests and verify failure**

Run:

```bash
npm test -- tests/integration/setup-flow.test.tsx -t "full memories|five memories"
```

Expected: FAIL until the component logic from Task 1 handles disabled full targets and conditional overflow.

- [ ] **Step 3: Refine disabled target behavior**

If the full-memory test fails because a disabled option remains selected, update the placement mode handler in `PlaySurface`:

```tsx
onModeChange={(mode) => {
  setMemoryPlacementMode(mode);
  setErrorMessage(null);

  if (mode === "create-new") {
    setSelectedAppendMemoryId(null);
    syncPromptDraft({
      memoryPlacementMode: mode,
      selectedAppendMemoryId: null,
    });
    return;
  }

  syncPromptDraft({ memoryPlacementMode: mode });
}}
```

- [ ] **Step 4: Run focused tests and verify pass**

Run:

```bash
npm test -- tests/integration/setup-flow.test.tsx -t "full memories|five memories"
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add src/components/ritual/MemoryPlacementPanel.tsx src/components/ritual/PlaySurface.tsx tests/integration/setup-flow.test.tsx
git commit -m "test: cover memory placement edge cases"
```

---

### Task 3: Play Page Entry Counts

**Files:**
- Modify: `tests/integration/setup-flow.test.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`

- [ ] **Step 1: Update the play page test expectation**

In the test named `renders the first prompt and compact memory summary on the play route`, change the first memory fixture to include nested entries:

```ts
{
  diary_id: null,
  id: "memory-1",
  location: "mind",
  memory_entries: [{ id: "entry-1" }, { id: "entry-2" }],
  slot_index: 1,
  title: "Winter bells",
}
```

Add this expectation near the other rendered play assertions:

```tsx
expect(screen.getByText("2 of 3 Experiences held here.")).toBeInTheDocument();
expect(memoriesSelect).toHaveBeenCalledWith(
  "id, title, slot_index, location, diary_id, memory_entries(id)",
);
```

- [ ] **Step 2: Run the page test and verify failure**

Run:

```bash
npm test -- tests/integration/setup-flow.test.tsx -t "renders the first prompt"
```

Expected: FAIL because the page still selects memories without nested entries.

- [ ] **Step 3: Add entry counts to the page data**

Update `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`:

```ts
type MindMemoryRecord = {
  diary_id: string | null;
  id: string;
  location: "mind" | "diary";
  memory_entries?: Array<{
    id: string;
  }>;
  slot_index: number | null;
  title: string;
};
```

Change the memory select call:

```ts
.select("id, title, slot_index, location, diary_id, memory_entries(id)")
```

Pass `entryCount` to `PlaySurface`:

```tsx
mindMemories={mindMemories.map((memory) => ({
  entryCount: memory.memory_entries?.length ?? 0,
  id: memory.id,
  slotIndex: memory.slot_index,
  title: memory.title,
}))}
```

- [ ] **Step 4: Run the page test and verify pass**

Run:

```bash
npm test -- tests/integration/setup-flow.test.tsx -t "renders the first prompt"
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add 'src/app/(app)/chronicles/[chronicleId]/play/page.tsx' tests/integration/setup-flow.test.tsx
git commit -m "feat: load memory entry counts for play"
```

---

### Task 4: Audit, Verification, and UAT

**Files:**
- Modify: `docs/thousand-year-old-vampire-rules-coverage-audit.md`

- [ ] **Step 1: Update the coverage audit**

Change the executive summary and detailed memory-rule rows so append-existing UI is no longer listed as missing or partial. Use these concrete edits:

```markdown
| Normal UI support for adding an Experience to an existing memory | This is now supported in the play surface; players can choose between creating a new Memory and appending to a non-full in-mind Memory before resolving a prompt. |
```

Replace the Detailed Breakdown row:

```markdown
| If a new Experience fits an existing Memory, it may be added there. | Automated | The play UI now lets the player create a new Memory or append to a selected in-mind Memory; full Memories are shown as unavailable, and the backend still enforces the three-Experience cap. | `src/components/ritual/MemoryPlacementPanel.tsx`, `src/components/ritual/PlaySurface.tsx`, `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`, `supabase/migrations/0007_memory_rule_helpers.sql`, `tests/integration/setup-flow.test.tsx`, `tests/integration/archive-rules.test.ts` |
```

Remove append-existing from the `Biggest Rule Gaps` table.

- [ ] **Step 2: Run focused and full verification**

Run:

```bash
npm test -- tests/integration/setup-flow.test.tsx
npm test -- tests/integration/archive-rules.test.ts
npm test
npm run lint
```

Expected: all commands PASS.

- [ ] **Step 3: Run browser UAT**

Run the local app:

```bash
npm run dev
```

Use the browser to verify:

- The play surface shows Memory placement for an active chronicle with at least one in-mind Memory.
- Selecting append-existing reveals in-mind Memories with entry usage.
- A non-full Memory can be selected and submitted.
- With five Memories in mind, append-existing does not show the overflow panel.
- Switching back to create-new with five Memories in mind shows the overflow panel.

- [ ] **Step 4: Commit final changes**

Run:

```bash
git add docs/thousand-year-old-vampire-rules-coverage-audit.md
git commit -m "docs: update rules coverage for memory placement"
```

- [ ] **Step 5: Push and open a ready pull request**

Run:

```bash
git push -u origin codex/append-existing-memory-placement
```

Open a ready-for-review PR against the repository default branch. Do not create a draft PR.
