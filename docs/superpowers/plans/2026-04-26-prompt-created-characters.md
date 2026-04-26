# Prompt-Created Characters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players create a mortal or immortal Character while resolving a prompt, with the Character persisted in the same transaction as the prompt answer.

**Architecture:** Follow the existing prompt-created Skill, Resource, and Mark pattern. Add a `newCharacter` payload beside the existing creation payloads, validate it at the route boundary, pass it through `resolvePrompt`, create it inside `resolve_prompt_run`, and expose it through a small play-surface composer. Keep existing character mutations separate from creation.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Zod, Supabase SQL migrations, Vitest, Testing Library, Playwright.

---

## File Map

- Modify `src/types/chronicle.ts`: add `PromptCreatedCharacterInput` and `newCharacter`.
- Modify `src/lib/validation/play.ts`: add Zod schema for `newCharacter`.
- Modify `src/lib/chronicles/resolvePrompt.ts`: pass `new_character` into the RPC.
- Modify `src/lib/chronicles/memoryRules.ts`: normalize duplicate Character server errors.
- Create `src/components/ritual/PromptCharacterComposer.tsx`: optional play-surface Character composer.
- Modify `src/lib/chronicles/localDrafts.ts`: persist Character composer draft state.
- Modify `src/components/ritual/PlaySurface.tsx`: manage Character composer state, validation, draft persistence, payload, and reset.
- Modify `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`: load existing Character names for duplicate detection.
- Create `supabase/migrations/0013_prompt_created_characters.sql`: helper plus updated `resolve_prompt_run` signature.
- Modify `src/lib/supabase/e2e.ts`: mirror prompt-created Character behavior in the local Supabase mock.
- Modify `tests/integration/chronicle-validation.test.ts`: validation coverage.
- Modify `tests/integration/resolve-prompt.test.ts`: resolver payload and duplicate normalization coverage.
- Modify `tests/integration/gameplay-rpc-guards.test.ts`: migration guard coverage.
- Modify `tests/integration/archive-rules.test.ts`: transactional behavior in e2e mock.
- Modify `tests/integration/setup-flow.test.tsx`: play-surface and page regressions.
- Modify `docs/thousand-year-old-vampire-rules-coverage-audit.md`: mark prompt-created Characters as automated and update gap summary.
- Create `docs/uat-report-2026-04-26-prompt-created-characters.md`: deep UAT notes.

## Task 1: Contract And Validation

**Files:**
- Modify: `src/types/chronicle.ts`
- Modify: `src/lib/validation/play.ts`
- Modify: `tests/integration/chronicle-validation.test.ts`

- [ ] **Step 1: Write validation tests**

Add tests to `tests/integration/chronicle-validation.test.ts` after the prompt-created mark tests:

```ts
it("keeps prompt-created characters in the parsed prompt resolution payload", () => {
  const result = promptResolutionSchema.safeParse({
    experienceText: "I learned the name of the witness who would not look away.",
    memoryDecision: { mode: "create-new" },
    newCharacter: {
      description: "A parish clerk who saw my hunger and chose silence.",
      kind: "mortal",
      name: "Elias Voss",
    },
    playerEntry: "The clerk watched me feed and crossed himself after I spared him.",
    sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
    traitMutations: { characters: [], marks: [], resources: [], skills: [] },
  });

  expect(result.success).toBe(true);
  if (!result.success) throw new Error("Expected prompt-created character payload to parse.");
  expect(result.data.newCharacter).toEqual({
    description: "A parish clerk who saw my hunger and chose silence.",
    kind: "mortal",
    name: "Elias Voss",
  });
});

it("trims prompt-created character fields in the parsed payload", () => {
  const result = promptResolutionSchema.safeParse({
    experienceText: "I learned the name of the witness who would not look away.",
    memoryDecision: { mode: "create-new" },
    newCharacter: {
      description: "  A parish clerk who saw my hunger and chose silence.  ",
      kind: "immortal",
      name: "  Elias Voss  ",
    },
    playerEntry: "The clerk watched me feed and crossed himself after I spared him.",
    sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
    traitMutations: { characters: [], marks: [], resources: [], skills: [] },
  });

  expect(result.success).toBe(true);
  if (!result.success) throw new Error("Expected trimmed prompt-created character payload to parse.");
  expect(result.data.newCharacter).toEqual({
    description: "A parish clerk who saw my hunger and chose silence.",
    kind: "immortal",
    name: "Elias Voss",
  });
});

it("rejects prompt-created characters with invalid kind", () => {
  const result = promptResolutionSchema.safeParse({
    experienceText: "I learned the name of the witness who would not look away.",
    memoryDecision: { mode: "create-new" },
    newCharacter: {
      description: "A parish clerk who saw my hunger and chose silence.",
      kind: "ghost",
      name: "Elias Voss",
    },
    playerEntry: "The clerk watched me feed and crossed himself after I spared him.",
    sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
    traitMutations: { characters: [], marks: [], resources: [], skills: [] },
  });

  expect(result.success).toBe(false);
});
```

- [ ] **Step 2: Run the failing validation tests**

Run: `npm test -- tests/integration/chronicle-validation.test.ts`

Expected: FAIL because `newCharacter` is stripped or not typed yet, and invalid kind handling is not defined.

- [ ] **Step 3: Add the shared type and schema**

In `src/types/chronicle.ts`, add:

```ts
export type PromptCreatedCharacterInput = {
  description: string;
  kind: "mortal" | "immortal";
  name: string;
};
```

Add `newCharacter?: PromptCreatedCharacterInput;` to `PromptResolutionPayload`.

In `src/lib/validation/play.ts`, import the type, add:

```ts
const newCharacterSchema: z.ZodType<PromptCreatedCharacterInput> = z.object({
  description: z.string().trim().min(1).max(280),
  kind: z.enum(["mortal", "immortal"]),
  name: z.string().trim().min(1).max(120),
});
```

Then add `newCharacter: newCharacterSchema.optional(),` to `promptResolutionSchema`.

- [ ] **Step 4: Run the validation tests again**

Run: `npm test -- tests/integration/chronicle-validation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/chronicle.ts src/lib/validation/play.ts tests/integration/chronicle-validation.test.ts
git commit -m "feat: validate prompt-created characters"
```

## Task 2: Resolver, SQL, And E2E Mock

**Files:**
- Modify: `src/lib/chronicles/resolvePrompt.ts`
- Modify: `src/lib/chronicles/memoryRules.ts`
- Create: `supabase/migrations/0013_prompt_created_characters.sql`
- Modify: `src/lib/supabase/e2e.ts`
- Modify: `tests/integration/resolve-prompt.test.ts`
- Modify: `tests/integration/gameplay-rpc-guards.test.ts`
- Modify: `tests/integration/archive-rules.test.ts`

- [ ] **Step 1: Write resolver tests**

Add to `tests/integration/resolve-prompt.test.ts`:

```ts
it("passes prompt-created characters into the resolve_prompt_run RPC payload", async () => {
  const rpc = vi.fn().mockResolvedValue({
    data: {
      archiveEvents: [],
      nextPrompt: { encounterIndex: 1, promptNumber: 4 },
      promptRunId: "run-1",
      rolled: { d10: 7, d6: 4, movement: 3 },
    },
    error: null,
  });

  await resolvePrompt({ rpc }, "chronicle-1", {
    ...payload,
    newCharacter: {
      description: "A parish clerk who saw my hunger and chose silence.",
      kind: "mortal",
      name: "Elias Voss",
    },
  });

  expect(rpc).toHaveBeenCalledWith(
    "resolve_prompt_run",
    expect.objectContaining({
      new_character: {
        description: "A parish clerk who saw my hunger and chose silence.",
        kind: "mortal",
        name: "Elias Voss",
      },
    }),
  );
});

it("normalizes duplicate prompt-created character failures into calm copy", async () => {
  const supabase = {
    rpc: async () => ({
      data: null,
      error: { message: "A character with this name already exists." },
    }),
  };

  await expect(
    resolvePrompt(supabase, "chronicle-1", {
      ...payload,
      newCharacter: {
        description: "A parish clerk who saw my hunger and chose silence.",
        kind: "mortal",
        name: "Elias Voss",
      },
    }),
  ).rejects.toThrow(
    "That character name is already in the chronicle. Choose different wording.",
  );
});
```

- [ ] **Step 2: Write SQL guard tests**

Add a migration path reader for `0013_prompt_created_characters.sql` in `tests/integration/gameplay-rpc-guards.test.ts`, then add:

```ts
it("adds a prompt-created character helper and wires a new_character argument into resolve_prompt_run", () => {
  const sql = readPromptCreatedCharactersMigration();

  expect(sql).toMatch(
    /create or replace function public\.create_prompt_character\(\s*target_chronicle_id uuid,\s*new_character jsonb\s*\)[\s\S]*?if new_character is null then[\s\S]*?return null;[\s\S]*?select \*\s*into locked_chronicle\s*from public\.chronicles[\s\S]*?where id = target_chronicle_id[\s\S]*?for update;/i,
  );
  expect(sql).toMatch(
    /create or replace function public\.resolve_prompt_run\(\s*target_chronicle_id uuid,\s*target_session_id uuid,\s*player_entry text,\s*experience_text text,\s*memory_decision jsonb default null,\s*trait_mutations jsonb default '\{\}'::jsonb,\s*new_skill jsonb default null,\s*new_resource jsonb default null,\s*new_mark jsonb default null,\s*new_character jsonb default null\s*\)/i,
  );
  expect(sql).toMatch(
    /perform public\.create_prompt_skill\(target_chronicle_id, new_skill\);\s*perform public\.create_prompt_resource\(target_chronicle_id, new_resource\);\s*perform public\.create_prompt_mark\(target_chronicle_id, new_mark\);\s*perform public\.create_prompt_character\(target_chronicle_id, new_character\);/i,
  );
});

it("rejects duplicate character names and assigns the next character sort order", () => {
  const sql = readPromptCreatedCharactersMigration();

  expect(sql).toMatch(/raise exception 'A character with this name already exists\.'/i);
  expect(sql).toMatch(/select coalesce\(max\(sort_order\), -1\) \+ 1[\s\S]*from public\.characters/i);
});
```

- [ ] **Step 3: Write archive rule tests**

Extend the helpers in `tests/integration/archive-rules.test.ts` to accept `newCharacter`, then add:

```ts
it("creates prompt-created characters at the next sort order", async () => {
  const { chronicleId, client, sessionId, state } = await createActiveChronicle();

  state.characters.push({
    chronicle_id: chronicleId,
    description: "My sister kept the house until the last fever.",
    id: randomUUID(),
    kind: "mortal",
    name: "Marta",
    retired_at: null,
    sort_order: 0,
    status: "active",
  });

  const result = await resolvePromptRun(
    client,
    chronicleId,
    sessionId,
    { mode: "create-new" },
    undefined,
    undefined,
    undefined,
    {
      description: "A parish clerk who saw my hunger and chose silence.",
      kind: "mortal",
      name: "Elias Voss",
    },
  );

  expect(result.error).toBeNull();
  expect(state.characters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        chronicle_id: chronicleId,
        description: "A parish clerk who saw my hunger and chose silence.",
        kind: "mortal",
        name: "Elias Voss",
        sort_order: 1,
        status: "active",
      }),
    ]),
  );
});
```

Add these companion archive-rule tests in the same file:

```ts
it("rejects duplicate prompt-created character names within the same chronicle", async () => {
  const { chronicleId, client, sessionId, state } = await createActiveChronicle();

  state.characters.push({
    chronicle_id: chronicleId,
    description: "A parish clerk who saw too much.",
    id: randomUUID(),
    kind: "mortal",
    name: "Elias Voss",
    retired_at: null,
    sort_order: 0,
    status: "active",
  });

  const result = await resolvePromptRun(
    client,
    chronicleId,
    sessionId,
    { mode: "create-new" },
    undefined,
    undefined,
    undefined,
    {
      description: "A second clerk with the same name.",
      kind: "mortal",
      name: " Elias Voss ",
    },
  );

  expect(result.error).toMatchObject({
    message: "A character with this name already exists.",
  });
  expect(state.prompt_runs).toHaveLength(0);
});

it("rejects prompt-created characters with a blank trimmed name", async () => {
  const { chronicleId, client, sessionId, state } = await createActiveChronicle();

  const result = await resolvePromptRun(
    client,
    chronicleId,
    sessionId,
    { mode: "create-new" },
    undefined,
    undefined,
    undefined,
    {
      description: "A parish clerk who saw too much.",
      kind: "mortal",
      name: "   ",
    },
  );

  expect(result.error).toMatchObject({ message: "A character name is required." });
  expect(state.prompt_runs).toHaveLength(0);
});

it("rejects prompt-created characters with a blank trimmed description", async () => {
  const { chronicleId, client, sessionId, state } = await createActiveChronicle();

  const result = await resolvePromptRun(
    client,
    chronicleId,
    sessionId,
    { mode: "create-new" },
    undefined,
    undefined,
    undefined,
    {
      description: "   ",
      kind: "mortal",
      name: "Elias Voss",
    },
  );

  expect(result.error).toMatchObject({
    message: "A character description is required.",
  });
  expect(state.prompt_runs).toHaveLength(0);
});
```

- [ ] **Step 4: Run the failing resolver/backend tests**

Run: `npm test -- tests/integration/resolve-prompt.test.ts tests/integration/gameplay-rpc-guards.test.ts tests/integration/archive-rules.test.ts`

Expected: FAIL because the new resolver payload, migration, and e2e mock do not exist yet.

- [ ] **Step 5: Implement resolver and duplicate-message normalization**

In `src/lib/chronicles/resolvePrompt.ts`, add `new_character: payload.newCharacter ?? null,` to the RPC args.

In `src/lib/chronicles/memoryRules.ts`, map `"A character with this name already exists."` to `"That character name is already in the chronicle. Choose different wording."`.

- [ ] **Step 6: Add the SQL migration**

Create `supabase/migrations/0013_prompt_created_characters.sql` by following `0012_prompt_created_marks.sql`. Add `create_prompt_character`, drop the previous `resolve_prompt_run(uuid, uuid, text, text, jsonb, jsonb, jsonb, jsonb, jsonb)` signature, recreate `resolve_prompt_run` with `new_character jsonb default null`, and call `perform public.create_prompt_character(target_chronicle_id, new_character);` after mark creation.

- [ ] **Step 7: Update the e2e Supabase mock**

In `src/lib/supabase/e2e.ts`, add `nextCharacterSortOrder`, parse `args.new_character`, validate blank fields and duplicate names with `normalizeCharacterText`, and push a new active character with `sort_order`, `kind`, `status: "active"`, and `retired_at: null`.

- [ ] **Step 8: Run backend tests again**

Run: `npm test -- tests/integration/resolve-prompt.test.ts tests/integration/gameplay-rpc-guards.test.ts tests/integration/archive-rules.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/chronicles/resolvePrompt.ts src/lib/chronicles/memoryRules.ts supabase/migrations/0013_prompt_created_characters.sql src/lib/supabase/e2e.ts tests/integration/resolve-prompt.test.ts tests/integration/gameplay-rpc-guards.test.ts tests/integration/archive-rules.test.ts
git commit -m "feat: persist prompt-created characters"
```

## Task 3: Play-Surface Character Composer

**Files:**
- Create: `src/components/ritual/PromptCharacterComposer.tsx`
- Modify: `src/lib/chronicles/localDrafts.ts`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `tests/integration/setup-flow.test.tsx`

- [ ] **Step 1: Write play-surface tests**

Add these play-surface tests:

```ts
it("reveals prompt-created character fields on demand and sends newCharacter in the request body", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({
      archiveEvents: [{ eventType: "prompt_resolved", summary: "The entry has been set into memory." }],
      nextPrompt: { encounterIndex: 1, promptNumber: 4 },
    }), { headers: { "Content-Type": "application/json" }, status: 200 }),
  );

  render(
    <PlaySurface
      chronicleId="chronicle-1"
      existingCharacterNames={["Marta"]}
      initialSessionId="ae7810a8-c50f-4790-9d09-8e8968f6a7a1"
    />,
  );

  fireEvent.change(screen.getByLabelText("Player entry"), {
    target: { value: "The clerk saw the blood and chose silence." },
  });
  fireEvent.change(screen.getByLabelText("Experience text"), {
    target: { value: "I spared Elias so my secret would have a witness." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add a character from this prompt" }));
  fireEvent.change(screen.getByLabelText("Character name"), {
    target: { value: "Elias Voss" },
  });
  fireEvent.change(screen.getByLabelText("Who they are"), {
    target: { value: "A parish clerk who saw my hunger and chose silence." },
  });
  fireEvent.click(screen.getByLabelText("Immortal"));
  fireEvent.click(screen.getByRole("button", { name: "Set the entry into memory" }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const payload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as { newCharacter?: unknown };
  expect(payload.newCharacter).toEqual({
    description: "A parish clerk who saw my hunger and chose silence.",
    kind: "immortal",
    name: "Elias Voss",
  });

  fetchMock.mockRestore();
});
```

Add these companion play-surface tests:

```ts
it("blocks duplicate prompt-created character names before submitting", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));

  render(
    <PlaySurface
      chronicleId="chronicle-1"
      existingCharacterNames={["Elias Voss"]}
      initialSessionId="ae7810a8-c50f-4790-9d09-8e8968f6a7a1"
    />,
  );

  fireEvent.change(screen.getByLabelText("Player entry"), {
    target: { value: "The clerk saw the blood and chose silence." },
  });
  fireEvent.change(screen.getByLabelText("Experience text"), {
    target: { value: "I spared Elias so my secret would have a witness." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add a character from this prompt" }));
  fireEvent.change(screen.getByLabelText("Character name"), {
    target: { value: "Elias Voss" },
  });
  fireEvent.change(screen.getByLabelText("Who they are"), {
    target: { value: "A parish clerk who saw my hunger and chose silence." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Set the entry into memory" }));

  expect(fetchMock).not.toHaveBeenCalled();
  expect(
    screen.getByText("That character name is already in the chronicle. Choose different wording."),
  ).toBeInTheDocument();

  fetchMock.mockRestore();
});

it("preserves prompt-created character draft fields after a failed submission", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ error: "The prompt could not be resolved." }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    }),
  );

  render(
    <PlaySurface
      chronicleId="chronicle-1"
      initialSessionId="ae7810a8-c50f-4790-9d09-8e8968f6a7a1"
    />,
  );

  fireEvent.change(screen.getByLabelText("Player entry"), {
    target: { value: "The clerk saw the blood and chose silence." },
  });
  fireEvent.change(screen.getByLabelText("Experience text"), {
    target: { value: "I spared Elias so my secret would have a witness." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add a character from this prompt" }));
  fireEvent.change(screen.getByLabelText("Character name"), {
    target: { value: "Elias Voss" },
  });
  fireEvent.change(screen.getByLabelText("Who they are"), {
    target: { value: "A parish clerk who saw my hunger and chose silence." },
  });
  fireEvent.click(screen.getByLabelText("Immortal"));
  fireEvent.click(screen.getByRole("button", { name: "Set the entry into memory" }));

  await screen.findByText("The prompt could not be resolved.");
  expect(screen.getByLabelText("Character name")).toHaveValue("Elias Voss");
  expect(screen.getByLabelText("Who they are")).toHaveValue(
    "A parish clerk who saw my hunger and chose silence.",
  );
  expect(screen.getByLabelText("Immortal")).toBeChecked();

  vi.restoreAllMocks();
});

it("clears prompt-created character draft fields when the character is removed", () => {
  render(
    <PlaySurface
      chronicleId="chronicle-1"
      initialSessionId="ae7810a8-c50f-4790-9d09-8e8968f6a7a1"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Add a character from this prompt" }));
  fireEvent.change(screen.getByLabelText("Character name"), {
    target: { value: "Elias Voss" },
  });
  fireEvent.change(screen.getByLabelText("Who they are"), {
    target: { value: "A parish clerk who saw my hunger and chose silence." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Remove the new character" }));
  fireEvent.click(screen.getByRole("button", { name: "Add a character from this prompt" }));

  expect(screen.getByLabelText("Character name")).toHaveValue("");
  expect(screen.getByLabelText("Who they are")).toHaveValue("");
  expect(screen.getByLabelText("Mortal")).toBeChecked();
});
```

- [ ] **Step 2: Run the failing UI tests**

Run: `npm test -- tests/integration/setup-flow.test.tsx`

Expected: FAIL because `existingCharacterNames`, `PromptCharacterComposer`, and `newCharacter` UI state do not exist yet.

- [ ] **Step 3: Create the composer**

Create `src/components/ritual/PromptCharacterComposer.tsx` with the same structure as `PromptMarkComposer`. Use a button label `Add a character from this prompt`, inputs labeled `Character name` and `Who they are`, and radio buttons labeled `Mortal` and `Immortal`.

- [ ] **Step 4: Extend draft persistence**

In `src/lib/chronicles/localDrafts.ts`, add `newCharacterDescription`, `newCharacterKind`, `newCharacterName`, and `shouldCreateCharacter` to `PromptDraft`.

- [ ] **Step 5: Wire PlaySurface state and validation**

In `src/components/ritual/PlaySurface.tsx`, add props `existingCharacterNames?: string[]`, Character state initialized from `initialDraft`, duplicate-name validation, `newCharacter` in the fetch payload when open, reset behavior after success, and composer rendering near the other prompt-created trait composers.

- [ ] **Step 6: Run UI tests again**

Run: `npm test -- tests/integration/setup-flow.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ritual/PromptCharacterComposer.tsx src/lib/chronicles/localDrafts.ts src/components/ritual/PlaySurface.tsx tests/integration/setup-flow.test.tsx
git commit -m "feat: add prompt-created character composer"
```

## Task 4: Play Page Data Loading

**Files:**
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Modify: `tests/integration/setup-flow.test.tsx`

- [ ] **Step 1: Write page regression**

Add a test beside the existing play-page label loading regressions proving the page queries `characters`, orders by `sort_order`, and passes `existingCharacterNames` into `PlaySurface`.

- [ ] **Step 2: Run the failing page test**

Run: `npm test -- tests/integration/setup-flow.test.tsx`

Expected: FAIL because the play page does not load Character names yet.

- [ ] **Step 3: Load Character names on the play page**

In `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`, add a `CharacterNameLookupClient`, query `characters.select("name").eq("chronicle_id", chronicleId).order("sort_order", { ascending: true })`, include it in `Promise.all`, and pass `(charactersResult.data ?? []).map((character) => character.name)` to `PlaySurface`.

- [ ] **Step 4: Run the page test again**

Run: `npm test -- tests/integration/setup-flow.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(app)/chronicles/[chronicleId]/play/page.tsx' tests/integration/setup-flow.test.tsx
git commit -m "feat: load character names for play"
```

## Task 5: Documentation And UAT

**Files:**
- Modify: `docs/thousand-year-old-vampire-rules-coverage-audit.md`
- Create: `docs/uat-report-2026-04-26-prompt-created-characters.md`

- [ ] **Step 1: Update the coverage audit**

Change the Character row `If a prompt requires a Character and none is available, create one.` from Missing to Automated, cite the new composer, validation, migration, and tests. Remove `No in-play creation of characters` from the biggest gaps list or rewrite it as covered. Update the executive summary so prompt-created Characters are no longer named as missing active-play support.

- [ ] **Step 2: Run focused test suite**

Run:

```bash
npm test -- tests/integration/chronicle-validation.test.ts tests/integration/resolve-prompt.test.ts tests/integration/gameplay-rpc-guards.test.ts tests/integration/archive-rules.test.ts tests/integration/setup-flow.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Run browser UAT**

Start the app with `npm run dev`. In the browser, create or open a chronicle, resolve a prompt with `Add a character from this prompt`, verify duplicate names are blocked, verify mortal/immortal selection persists through a failed submission, resolve successfully, and confirm the new Character appears in the ledger.

- [ ] **Step 5: Write UAT report**

Create `docs/uat-report-2026-04-26-prompt-created-characters.md` with sections:

```md
# Prompt-Created Characters UAT

**Date:** 2026-04-26
**Branch:** codex/prompt-created-characters

## Scope

Deep UAT for creating a Character from the active prompt surface and confirming the result persists into the chronicle.

## Scenarios

| Scenario | Result | Notes |
| --- | --- | --- |
| Composer opens and validates required fields | Pass | |
| Duplicate Character names are blocked before submit | Pass | |
| Mortal/immortal kind selection is included in payload | Pass | |
| Failed submission preserves local draft | Pass | |
| Successful prompt resolution creates the Character | Pass | |
| New Character appears in ledger/archive surfaces | Pass | |

## Verification

- `npm test -- tests/integration/chronicle-validation.test.ts tests/integration/resolve-prompt.test.ts tests/integration/gameplay-rpc-guards.test.ts tests/integration/archive-rules.test.ts tests/integration/setup-flow.test.tsx`
- `npm run lint`
- Browser UAT on local dev server
```

- [ ] **Step 6: Commit docs and UAT**

```bash
git add docs/thousand-year-old-vampire-rules-coverage-audit.md docs/uat-report-2026-04-26-prompt-created-characters.md
git commit -m "docs: update coverage for prompt-created characters"
```

## Task 6: Final Verification And PR

**Files:**
- No new source files unless verification exposes a bug.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm test
npm run lint
```

Expected: PASS.

- [ ] **Step 2: Inspect git state**

Run: `git status --short --branch`

Expected: branch `codex/prompt-created-characters` with only the two pre-existing untracked plan docs left outside this work.

- [ ] **Step 3: Push branch**

Run: `git push -u origin codex/prompt-created-characters`

Expected: branch is pushed.

- [ ] **Step 4: Open ready-for-review PR**

Open a non-draft PR from `codex/prompt-created-characters` into `main` with a summary of the feature, docs update, and UAT/testing evidence. The repository instruction forbids draft PRs, so the PR must be ready for review.
