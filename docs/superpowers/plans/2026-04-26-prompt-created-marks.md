# Prompt-Created Marks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-party support for prompt-created Marks during active prompt resolution.

**Architecture:** Follow the shipped prompt-created Skills and Resources pattern. The play form owns optional mark input state, `PromptResolutionPayload` carries a separate optional `newMark` object, and `resolve_prompt_run` creates the Mark transactionally through a dedicated Supabase helper.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Supabase PL/pgSQL migrations, Vitest, Testing Library.

---

## File Map

- Create `src/components/ritual/PromptMarkComposer.tsx`: focused play-surface composer for prompt-created mark fields.
- Modify `src/types/chronicle.ts`: add `PromptCreatedMarkInput` and `newMark`.
- Modify `src/lib/validation/play.ts`: validate optional `newMark`.
- Modify `src/lib/chronicles/resolvePrompt.ts`: pass `new_mark` to the RPC.
- Modify `src/lib/chronicles/memoryRules.ts`: normalize duplicate mark server errors.
- Modify `src/lib/chronicles/localDrafts.ts`: persist mark draft state.
- Modify `src/components/ritual/PlaySurface.tsx`: add mark state, validation, duplicate handling, payload wiring, and reset/clear behavior.
- Modify `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`: load existing mark labels and pass them to `PlaySurface`.
- Create `supabase/migrations/0012_prompt_created_marks.sql`: helper and `resolve_prompt_run` signature update.
- Modify `src/lib/supabase/e2e.ts`: keep the local Supabase mock aligned with `new_mark`.
- Modify tests:
  - `tests/integration/chronicle-validation.test.ts`
  - `tests/integration/resolve-prompt.test.ts`
  - `tests/integration/gameplay-rpc-guards.test.ts`
  - `tests/integration/archive-rules.test.ts`
  - `tests/integration/setup-flow.test.tsx`
- Modify `docs/thousand-year-old-vampire-rules-coverage-audit.md`: mark the prompt-created Mark rule automated and update the summary gap list.

## Task 1: Validation and Type Contract

**Files:**
- Modify: `src/types/chronicle.ts`
- Modify: `src/lib/validation/play.ts`
- Test: `tests/integration/chronicle-validation.test.ts`

- [ ] **Step 1: Add failing validation tests**

Add tests after the prompt-created resource tests in `tests/integration/chronicle-validation.test.ts`:

```ts
  it("keeps prompt-created marks in the parsed prompt resolution payload", () => {
    const result = promptResolutionSchema.safeParse({
      experienceText: "I learned to hide the wound beneath velvet and ash.",
      memoryDecision: {
        mode: "create-new",
      },
      newMark: {
        description: "A crescent scar that opens when I hunger.",
        isConcealed: true,
        label: "Moon-Scarred Throat",
      },
      playerEntry: "The prompt leaves my throat remade by silver moonlight.",
      sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
      traitMutations: {
        characters: [],
        marks: [],
        resources: [],
        skills: [],
      },
    });

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error("Expected prompt-created mark payload to parse.");
    }

    expect(result.data.newMark).toEqual({
      description: "A crescent scar that opens when I hunger.",
      isConcealed: true,
      label: "Moon-Scarred Throat",
    });
  });

  it("trims prompt-created mark fields in the parsed payload", () => {
    const result = promptResolutionSchema.safeParse({
      experienceText: "I learned to hide the wound beneath velvet and ash.",
      memoryDecision: {
        mode: "create-new",
      },
      newMark: {
        description: "  A crescent scar that opens when I hunger.  ",
        isConcealed: true,
        label: "  Moon-Scarred Throat  ",
      },
      playerEntry: "The prompt leaves my throat remade by silver moonlight.",
      sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
      traitMutations: {
        characters: [],
        marks: [],
        resources: [],
        skills: [],
      },
    });

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error("Expected trimmed prompt-created mark payload to parse.");
    }

    expect(result.data.newMark).toEqual({
      description: "A crescent scar that opens when I hunger.",
      isConcealed: true,
      label: "Moon-Scarred Throat",
    });
  });

  it("rejects prompt-created marks with missing description text", () => {
    const result = promptResolutionSchema.safeParse({
      experienceText: "I learned to hide the wound beneath velvet and ash.",
      memoryDecision: {
        mode: "create-new",
      },
      newMark: {
        description: "",
        isConcealed: true,
        label: "Moon-Scarred Throat",
      },
      playerEntry: "The prompt leaves my throat remade by silver moonlight.",
      sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
      traitMutations: {
        characters: [],
        marks: [],
        resources: [],
        skills: [],
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects prompt-created marks with labels longer than 120 characters", () => {
    const result = promptResolutionSchema.safeParse({
      experienceText: "I learned to hide the wound beneath velvet and ash.",
      memoryDecision: {
        mode: "create-new",
      },
      newMark: {
        description: "A crescent scar that opens when I hunger.",
        isConcealed: false,
        label: "M".repeat(121),
      },
      playerEntry: "The prompt leaves my throat remade by silver moonlight.",
      sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
      traitMutations: {
        characters: [],
        marks: [],
        resources: [],
        skills: [],
      },
    });

    expect(result.success).toBe(false);
  });
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- tests/integration/chronicle-validation.test.ts`

Expected: FAIL because `newMark` is stripped from the parsed payload and `result.data.newMark` is undefined.

- [ ] **Step 3: Add the type and schema**

In `src/types/chronicle.ts`, add:

```ts
export type PromptCreatedMarkInput = {
  description: string;
  isConcealed: boolean;
  label: string;
};
```

Add `newMark?: PromptCreatedMarkInput;` to `PromptResolutionPayload`.

In `src/lib/validation/play.ts`, import `PromptCreatedMarkInput`, add:

```ts
const newMarkSchema: z.ZodType<PromptCreatedMarkInput> = z.object({
  description: z.string().trim().min(1).max(280),
  isConcealed: z.boolean(),
  label: z.string().trim().min(1).max(120),
});
```

Then add `newMark: newMarkSchema.optional(),` to `promptResolutionSchema`.

- [ ] **Step 4: Re-run focused tests and verify pass**

Run: `npm test -- tests/integration/chronicle-validation.test.ts`

Expected: PASS.

## Task 2: Resolver Payload and Error Normalization

**Files:**
- Modify: `src/lib/chronicles/resolvePrompt.ts`
- Modify: `src/lib/chronicles/memoryRules.ts`
- Test: `tests/integration/resolve-prompt.test.ts`

- [ ] **Step 1: Add failing resolver tests**

In `tests/integration/resolve-prompt.test.ts`, add:

```ts
  it("passes prompt-created marks into the resolve_prompt_run RPC payload", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        archiveEvents: [],
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
      },
      error: null,
    });

    await resolvePrompt(
      { rpc },
      "chronicle-1",
      {
        ...payload,
        newMark: {
          description: "A crescent scar that opens when I hunger.",
          isConcealed: true,
          label: "Moon-Scarred Throat",
        },
      },
    );

    expect(rpc).toHaveBeenCalledWith(
      "resolve_prompt_run",
      expect.objectContaining({
        new_mark: {
          description: "A crescent scar that opens when I hunger.",
          isConcealed: true,
          label: "Moon-Scarred Throat",
        },
      }),
    );
  });

  it("normalizes duplicate prompt-created mark failures into calm copy", async () => {
    const supabase = {
      rpc: async () => ({
        data: null,
        error: {
          message: "A mark with this name already exists.",
        },
      }),
    };

    await expect(
      resolvePrompt(supabase, "chronicle-1", {
        ...payload,
        newMark: {
          description: "A crescent scar that opens when I hunger.",
          isConcealed: true,
          label: "Moon-Scarred Throat",
        },
      }),
    ).rejects.toThrow(
      "That mark name is already in the chronicle. Choose different wording.",
    );
  });
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- tests/integration/resolve-prompt.test.ts`

Expected: FAIL because `new_mark` is not sent and duplicate mark errors are not normalized.

- [ ] **Step 3: Pass `new_mark` through the resolver**

In `src/lib/chronicles/resolvePrompt.ts`, add:

```ts
    new_mark: payload.newMark ?? null,
```

inside the `resolve_prompt_run` RPC argument object.

- [ ] **Step 4: Normalize duplicate mark errors**

In `src/lib/chronicles/memoryRules.ts`, add a branch:

```ts
  if (message.includes("A mark with this name already exists.")) {
    return "That mark name is already in the chronicle. Choose different wording.";
  }
```

- [ ] **Step 5: Re-run focused tests and verify pass**

Run: `npm test -- tests/integration/resolve-prompt.test.ts`

Expected: PASS.

## Task 3: Database Migration and Local RPC Mock

**Files:**
- Create: `supabase/migrations/0012_prompt_created_marks.sql`
- Modify: `src/lib/supabase/e2e.ts`
- Test: `tests/integration/gameplay-rpc-guards.test.ts`
- Test: `tests/integration/archive-rules.test.ts`

- [ ] **Step 1: Add failing migration guard tests**

In `tests/integration/gameplay-rpc-guards.test.ts`, add a path constant and reader for `0012_prompt_created_marks.sql`, then add:

```ts
  it("adds a prompt-created mark helper and wires a new_mark argument into resolve_prompt_run", () => {
    const sql = readPromptCreatedMarksMigration();

    expect(sql).toMatch(
      /create or replace function public\.create_prompt_mark\(\s*target_chronicle_id uuid,\s*new_mark jsonb\s*\)[\s\S]*?if new_mark is null then[\s\S]*?return null;[\s\S]*?select \*\s*into locked_chronicle\s*from public\.chronicles[\s\S]*?where id = target_chronicle_id[\s\S]*?for update;/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.resolve_prompt_run\(\s*target_chronicle_id uuid,\s*target_session_id uuid,\s*player_entry text,\s*experience_text text,\s*memory_decision jsonb default null,\s*trait_mutations jsonb default '\{\}'::jsonb,\s*new_skill jsonb default null,\s*new_resource jsonb default null,\s*new_mark jsonb default null\s*\)/i,
    );
    expect(sql).toMatch(
      /perform public\.create_prompt_skill\(target_chronicle_id, new_skill\);\s*perform public\.create_prompt_resource\(target_chronicle_id, new_resource\);\s*perform public\.create_prompt_mark\(target_chronicle_id, new_mark\);\s*insert into public\.archive_events/i,
    );
  });

  it("rejects duplicate mark labels and assigns the next mark sort order", () => {
    const sql = readPromptCreatedMarksMigration();

    expect(sql).toMatch(
      /create or replace function public\.create_prompt_mark[\s\S]*?if exists \([\s\S]*?from public\.marks[\s\S]*?where chronicle_id = target_chronicle_id[\s\S]*?and btrim\(label\) = new_mark_label[\s\S]*?\) then[\s\S]*?raise exception 'A mark with this name already exists\.'[\s\S]*?end if;/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.create_prompt_mark[\s\S]*?select coalesce\(max\(sort_order\), -1\) \+ 1[\s\S]*?into new_sort_order[\s\S]*?from public\.marks[\s\S]*?where chronicle_id = target_chronicle_id;/i,
    );
  });
```

- [ ] **Step 2: Add failing archive rules tests**

Add tests after the prompt-created resource tests in `tests/integration/archive-rules.test.ts`:

```ts
  it("creates prompt-created marks at the next sort order", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    state.marks.push({
      chronicle_id: chronicleId,
      description: "The first mark left by undeath.",
      id: randomUUID(),
      is_active: true,
      is_concealed: false,
      label: "Bloodless Reflection",
      sort_order: 0,
    });

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      {
        description: "  A crescent scar that opens when I hunger.  ",
        isConcealed: true,
        label: "  Moon-Scarred Throat  ",
      },
    );

    expect(result.error).toBeNull();
    expect(state.marks).toHaveLength(2);
    expect(state.marks.at(-1)).toMatchObject({
      chronicle_id: chronicleId,
      description: "A crescent scar that opens when I hunger.",
      is_active: true,
      is_concealed: true,
      label: "Moon-Scarred Throat",
      sort_order: 1,
    });
  });

  it("rejects duplicate prompt-created mark labels within the same chronicle", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    state.marks.push({
      chronicle_id: chronicleId,
      description: "A crescent scar that opens when I hunger.",
      id: randomUUID(),
      is_active: true,
      is_concealed: true,
      label: "Moon-Scarred Throat",
      sort_order: 0,
    });

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      {
        description: "  The same wound trying to enter the chronicle twice.  ",
        isConcealed: true,
        label: "  Moon-Scarred Throat  ",
      },
    );

    expect(result.error).toMatchObject({
      message: "A mark with this name already exists.",
    });
    expect(state.marks).toHaveLength(1);
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("rejects prompt-created marks with a blank trimmed label", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      {
        description: "A crescent scar that opens when I hunger.",
        isConcealed: true,
        label: "   ",
      },
    );

    expect(result.error).toMatchObject({
      message: "A mark name is required.",
    });
    expect(state.marks).toHaveLength(1);
    expect(state.prompt_runs).toHaveLength(0);
  });

  it("rejects prompt-created marks with a blank trimmed description", async () => {
    const { chronicleId, client, sessionId, state } = await createActiveChronicle(
      1,
      [],
    );

    const result = await resolvePromptRun(
      client,
      chronicleId,
      sessionId,
      { mode: "create-new" },
      undefined,
      undefined,
      {
        description: "   ",
        isConcealed: true,
        label: "Moon-Scarred Throat",
      },
    );

    expect(result.error).toMatchObject({
      message: "A mark description is required.",
    });
    expect(state.marks).toHaveLength(1);
    expect(state.prompt_runs).toHaveLength(0);
  });
```

- [ ] **Step 3: Run focused tests and verify they fail**

Run: `npm test -- tests/integration/gameplay-rpc-guards.test.ts tests/integration/archive-rules.test.ts`

Expected: FAIL because the migration does not exist, helper readers are missing, and the e2e mock has no `new_mark` behavior.

- [ ] **Step 4: Add the migration**

Create `supabase/migrations/0012_prompt_created_marks.sql` by copying the full current contents of `supabase/migrations/0011_prompt_created_resources.sql` into the new file, then make these exact edits:

- Insert this helper at the top of the file before the existing `drop function` statement.
- Change the drop signature to `drop function if exists public.resolve_prompt_run(uuid, uuid, text, text, jsonb, jsonb, jsonb, jsonb);`.
- Add `new_mark jsonb default null` after `new_resource jsonb default null` in the `resolve_prompt_run` signature.
- Add `perform public.create_prompt_mark(target_chronicle_id, new_mark);` immediately after `perform public.create_prompt_resource(target_chronicle_id, new_resource);`.

The new helper is:

```sql
create or replace function public.create_prompt_mark(
  target_chronicle_id uuid,
  new_mark jsonb
)
returns uuid
language plpgsql
as $$
declare
  created_mark_id uuid;
  locked_chronicle public.chronicles%rowtype;
  new_mark_description text;
  new_mark_is_concealed boolean;
  new_mark_label text;
  new_sort_order integer;
begin
  if new_mark is null then
    return null;
  end if;

  select *
  into locked_chronicle
  from public.chronicles
  where id = target_chronicle_id
  for update;

  if not found then
    raise exception 'Chronicle not found.'
      using errcode = 'P0001';
  end if;

  new_mark_label := btrim(coalesce(new_mark->>'label', ''));
  new_mark_description := btrim(coalesce(new_mark->>'description', ''));
  new_mark_is_concealed := coalesce((new_mark->>'isConcealed')::boolean, false);

  if new_mark_label = '' then
    raise exception 'A mark name is required.'
      using errcode = 'P0001';
  end if;

  if new_mark_description = '' then
    raise exception 'A mark description is required.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.marks
    where chronicle_id = target_chronicle_id
      and btrim(label) = new_mark_label
  ) then
    raise exception 'A mark with this name already exists.'
      using errcode = 'P0001';
  end if;

  select coalesce(max(sort_order), -1) + 1
  into new_sort_order
  from public.marks
  where chronicle_id = target_chronicle_id;

  insert into public.marks (
    chronicle_id,
    label,
    description,
    is_concealed,
    sort_order
  )
  values (
    target_chronicle_id,
    new_mark_label,
    new_mark_description,
    new_mark_is_concealed,
    new_sort_order
  )
  returning id into created_mark_id;

  return created_mark_id;
end;
$$;
```

- [ ] **Step 5: Update the local Supabase mock**

In `src/lib/supabase/e2e.ts`, extend the mock RPC argument handling to read `new_mark`, validate trimmed `label` and `description`, reject duplicate labels in `state.marks`, and push:

```ts
state.marks.push({
  chronicle_id: targetChronicleId,
  description: trimmedDescription,
  id: randomUUID(),
  is_active: true,
  is_concealed: Boolean(newMark.isConcealed),
  label: trimmedLabel,
  sort_order: nextSortOrder,
});
```

The mock should return the same error messages as the migration:

```ts
"A mark name is required."
"A mark description is required."
"A mark with this name already exists."
```

- [ ] **Step 6: Re-run focused tests and verify pass**

Run: `npm test -- tests/integration/gameplay-rpc-guards.test.ts tests/integration/archive-rules.test.ts`

Expected: PASS.

## Task 4: Play Surface UI and Draft Behavior

**Files:**
- Create: `src/components/ritual/PromptMarkComposer.tsx`
- Modify: `src/lib/chronicles/localDrafts.ts`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Test: `tests/integration/setup-flow.test.tsx`

- [ ] **Step 1: Add failing play-surface tests**

In `tests/integration/setup-flow.test.tsx`, add these tests after the prompt-created resource tests:

```ts
  it("reveals prompt-created mark fields on demand and sends newMark in the request body", async () => {
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
        existingMarkLabels={["Bloodless Reflection"]}
        initialSessionId="session-1"
      />,
    );

    expect(screen.queryByLabelText("Mark name")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a mark from this prompt",
      }),
    );

    fireEvent.change(screen.getByLabelText("Mark name"), {
      target: { value: "Moon-Scarred Throat" },
    });
    fireEvent.change(screen.getByLabelText("What changed"), {
      target: { value: "A crescent scar that opens when I hunger." },
    });
    fireEvent.click(screen.getByLabelText("Concealed"));
    fireEvent.change(screen.getByLabelText("Player entry"), {
      target: {
        value: "The prompt leaves my throat remade by silver moonlight.",
      },
    });
    fireEvent.change(screen.getByLabelText("Experience text"), {
      target: {
        value: "I learned to hide the wound beneath velvet and ash.",
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
      newMark?: {
        description: string;
        isConcealed: boolean;
        label: string;
      };
    };

    expect(payload.newMark).toEqual({
      description: "A crescent scar that opens when I hunger.",
      isConcealed: true,
      label: "Moon-Scarred Throat",
    });

    fetchMock.mockRestore();
  });

  it("blocks duplicate prompt-created mark labels before submitting", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const { PlaySurface } = await import("@/components/ritual/PlaySurface");

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        existingMarkLabels={["Bloodless Reflection", "Moon-Scarred Throat"]}
        initialSessionId="session-1"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a mark from this prompt",
      }),
    );
    fireEvent.change(screen.getByLabelText("Mark name"), {
      target: { value: "Moon-Scarred Throat" },
    });
    fireEvent.change(screen.getByLabelText("What changed"), {
      target: { value: "A crescent scar that opens when I hunger." },
    });
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
      screen.getByText(
        "That mark name is already in the chronicle. Choose different wording.",
      ),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockRestore();
  });

  it("preserves prompt-created mark draft fields after a failed submission", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "That mark name is already in the chronicle. Choose different wording.",
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 500,
          },
        ),
      );

    const { PlaySurface } = await import("@/components/ritual/PlaySurface");
    const view = render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        existingMarkLabels={["Bloodless Reflection"]}
        initialSessionId="session-1"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a mark from this prompt",
      }),
    );
    fireEvent.change(screen.getByLabelText("Mark name"), {
      target: { value: "Moon-Scarred Throat" },
    });
    fireEvent.change(screen.getByLabelText("What changed"), {
      target: { value: "A crescent scar that opens when I hunger." },
    });
    fireEvent.click(screen.getByLabelText("Concealed"));
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
      expect(
        screen.getByText(
          "That mark name is already in the chronicle. Choose different wording.",
        ),
      ).toBeInTheDocument();
    });

    view.unmount();

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        existingMarkLabels={["Bloodless Reflection"]}
        initialSessionId="session-1"
      />,
    );

    expect(screen.getByLabelText("Mark name")).toHaveValue("Moon-Scarred Throat");
    expect(screen.getByLabelText("What changed")).toHaveValue(
      "A crescent scar that opens when I hunger.",
    );
    expect(screen.getByLabelText("Concealed")).toBeChecked();

    fetchMock.mockRestore();
  });

  it("clears prompt-created mark draft fields when the mark is removed", async () => {
    const { PlaySurface } = await import("@/components/ritual/PlaySurface");
    const view = render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        existingMarkLabels={["Bloodless Reflection"]}
        initialSessionId="session-1"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a mark from this prompt",
      }),
    );
    fireEvent.change(screen.getByLabelText("Mark name"), {
      target: { value: "Moon-Scarred Throat" },
    });
    fireEvent.change(screen.getByLabelText("What changed"), {
      target: { value: "A crescent scar that opens when I hunger." },
    });
    fireEvent.click(screen.getByLabelText("Concealed"));

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove the new mark",
      }),
    );

    expect(screen.queryByLabelText("Mark name")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a mark from this prompt",
      }),
    );

    expect(screen.getByLabelText("Mark name")).toHaveValue("");
    expect(screen.getByLabelText("What changed")).toHaveValue("");
    expect(screen.getByLabelText("Concealed")).not.toBeChecked();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove the new mark",
      }),
    );

    view.unmount();

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        existingMarkLabels={["Bloodless Reflection"]}
        initialSessionId="session-1"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a mark from this prompt",
      }),
    );

    expect(screen.getByLabelText("Mark name")).toHaveValue("");
    expect(screen.getByLabelText("What changed")).toHaveValue("");
    expect(screen.getByLabelText("Concealed")).not.toBeChecked();
  });
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run: `npm test -- tests/integration/setup-flow.test.tsx`

Expected: FAIL because `PromptMarkComposer`, `existingMarkLabels`, and mark draft state do not exist.

- [ ] **Step 3: Create `PromptMarkComposer`**

Create `src/components/ritual/PromptMarkComposer.tsx` with:

```tsx
"use client";

import { RitualTextarea } from "@/components/ritual/RitualTextarea";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type PromptMarkComposerProps = {
  description: string;
  errorMessage?: string | null;
  isConcealed: boolean;
  isOpen: boolean;
  label: string;
  onConcealedChange: (value: boolean) => void;
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onToggle: () => void;
};

export function PromptMarkComposer({
  description,
  errorMessage = null,
  isConcealed,
  isOpen,
  label,
  onConcealedChange,
  onDescriptionChange,
  onLabelChange,
  onToggle,
}: PromptMarkComposerProps) {
  return (
    <SurfacePanel className="space-y-4 border-gold/18 bg-gold/6 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Prompt-created mark
          </p>
          <h3 className="mt-3 font-heading text-2xl text-ink">
            Let the prompt leave a new sign behind.
          </h3>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-soft border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition-colors duration-160 ease-ritual hover:border-gold/40"
          onClick={onToggle}
          type="button"
        >
          {isOpen ? "Remove the new mark" : "Add a mark from this prompt"}
        </button>
      </div>

      {isOpen ? (
        <div className="space-y-4">
          <label className="block space-y-3">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
              Mark name
            </span>
            <input
              className="min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
              name="newMarkLabel"
              onChange={(event) => onLabelChange(event.target.value)}
              placeholder="Name the sign the prompt leaves on the vampire."
              type="text"
              value={label}
            />
          </label>

          <RitualTextarea
            label="What changed"
            name="newMarkDescription"
            onChange={onDescriptionChange}
            placeholder="Describe the visible or hidden mark and what it means."
            rows={4}
            value={description}
          />

          <label className="flex items-start gap-3 rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-ink shadow-inner shadow-ink/5">
            <input
              aria-label="Concealed"
              checked={isConcealed}
              className="mt-1 h-4 w-4 rounded border-ink/20 text-nocturne focus:ring-gold/50"
              name="newMarkConcealed"
              onChange={(event) => onConcealedChange(event.target.checked)}
              type="checkbox"
            />
            <span className="space-y-1">
              <span className="block font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
                Concealed
              </span>
              <span className="block text-sm leading-relaxed text-ink-muted">
                Use this when the mark can be hidden from ordinary witnesses.
              </span>
            </span>
          </label>

          {errorMessage ? <p className="text-sm text-ink">{errorMessage}</p> : null}
        </div>
      ) : null}
    </SurfacePanel>
  );
}
```

- [ ] **Step 4: Wire `PlaySurface` state and payload**

In `src/lib/chronicles/localDrafts.ts`, extend `PromptDraft` with:

```ts
  newMarkDescription: string;
  newMarkIsConcealed: boolean;
  newMarkLabel: string;
  shouldCreateMark: boolean;
```

In `src/components/ritual/PlaySurface.tsx`, import `PromptMarkComposer`, add this prop, and default it in the function signature:

```ts
  existingMarkLabels?: string[];
```

```ts
  existingMarkLabels = [],
```

Add mark state beside the resource and skill state:

```ts
  const [isAddingMark, setIsAddingMark] = useState(
    () => initialDraft?.shouldCreateMark ?? false,
  );
  const [newMarkLabel, setNewMarkLabel] = useState(
    () => initialDraft?.newMarkLabel ?? "",
  );
  const [newMarkDescription, setNewMarkDescription] = useState(
    () => initialDraft?.newMarkDescription ?? "",
  );
  const [newMarkIsConcealed, setNewMarkIsConcealed] = useState(
    () => initialDraft?.newMarkIsConcealed ?? false,
  );
  const [markErrorMessage, setMarkErrorMessage] = useState<string | null>(null);
```

Include `newMarkDescription`, `newMarkIsConcealed`, `newMarkLabel`, and `shouldCreateMark` in `syncPromptDraft`, dependency arrays, and `hasAnyDraftContent`.

Add validation and duplicate copy:

```ts
    const normalizedExistingMarkLabels = existingMarkLabels.map((label) =>
      label.trim(),
    );

    if (isAddingMark) {
      const normalizedNewMarkLabel = newMarkLabel.trim();
      const normalizedNewMarkDescription = newMarkDescription.trim();

      if (!normalizedNewMarkLabel || !normalizedNewMarkDescription) {
        setMarkErrorMessage(
          "Name the mark and describe what this prompt changed.",
        );
        return;
      }

      if (normalizedExistingMarkLabels.includes(normalizedNewMarkLabel)) {
        setMarkErrorMessage(
          "That mark name is already in the chronicle. Choose different wording.",
        );
        return;
      }
    }
```

Add `newMark` to the request body:

```ts
            newMark: isAddingMark
              ? {
                  description: newMarkDescription,
                  isConcealed: newMarkIsConcealed,
                  label: newMarkLabel,
                }
              : undefined,
```

Handle the server duplicate error:

```ts
        if (
          payload.error ===
          "That mark name is already in the chronicle. Choose different wording."
        ) {
          setMarkErrorMessage(payload.error);
          return;
        }
```

Reset successful submissions with:

```ts
      setIsAddingMark(false);
      setNewMarkDescription("");
      setNewMarkIsConcealed(false);
      setNewMarkLabel("");
      setMarkErrorMessage(null);
```

Add this toggle handler:

```ts
  function handleMarkComposerToggle() {
    if (isAddingMark) {
      syncPromptDraft({
        newMarkDescription: "",
        newMarkIsConcealed: false,
        newMarkLabel: "",
        shouldCreateMark: false,
      });

      setIsAddingMark(false);
      setNewMarkDescription("");
      setNewMarkIsConcealed(false);
      setNewMarkLabel("");
      setMarkErrorMessage(null);
      return;
    }

    setIsAddingMark(true);
    setMarkErrorMessage(null);
  }
```

Render the composer after `<PromptResourceComposer />`:

```tsx
          <PromptMarkComposer
            description={newMarkDescription}
            errorMessage={markErrorMessage}
            isConcealed={newMarkIsConcealed}
            isOpen={isAddingMark}
            label={newMarkLabel}
            onConcealedChange={setNewMarkIsConcealed}
            onDescriptionChange={setNewMarkDescription}
            onLabelChange={setNewMarkLabel}
            onToggle={handleMarkComposerToggle}
          />
```

- [ ] **Step 5: Load existing marks in the play page**

In `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`, query mark labels alongside resources and skills:

```ts
const marksResult = await supabase
  .from("marks")
  .select("label")
  .eq("chronicle_id", chronicleId)
  .order("sort_order", { ascending: true });
```

Pass:

```tsx
existingMarkLabels={(marksResult.data ?? []).map((mark) => mark.label)}
```

- [ ] **Step 6: Re-run focused tests and verify pass**

Run: `npm test -- tests/integration/setup-flow.test.tsx`

Expected: PASS.

## Task 5: Audit Update and Verification

**Files:**
- Modify: `docs/thousand-year-old-vampire-rules-coverage-audit.md`

- [ ] **Step 1: Update the audit**

Change the row for `Prompts may create a new Mark.` from `Missing` to `Automated`, with evidence including:

```md
`src/components/ritual/PromptMarkComposer.tsx`, `src/components/ritual/PlaySurface.tsx`, `src/lib/validation/play.ts`, `supabase/migrations/0012_prompt_created_marks.sql`
```

Update the gap summary line that says Skills and resources have first-party prompt-resolution flows but characters or marks do not. It should now say Skills, resources, and marks have first-party flows, while characters remain missing.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test -- tests/integration/chronicle-validation.test.ts tests/integration/resolve-prompt.test.ts tests/integration/gameplay-rpc-guards.test.ts tests/integration/archive-rules.test.ts tests/integration/setup-flow.test.tsx
npm run lint
```

Expected: PASS for both commands.

- [ ] **Step 3: Commit implementation**

Run:

```bash
git add src tests supabase docs/thousand-year-old-vampire-rules-coverage-audit.md docs/superpowers/plans/2026-04-26-prompt-created-marks.md
git commit -m "feat: support prompt-created marks"
```
