# Phase 1 Becoming Undead and First Prompt Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first complete gameplay slice so a player can finish guided setup, resolve the first prompt, and see the chronicle update around that writing.

**Architecture:** Seed the full local prompt source into Supabase, extend the gameplay schema with ownership-safe tables and transactional SQL functions, then layer shared validation, guided setup, active play, consequence feedback, and retry-safe local drafts on top of the existing Phase 0 chronicle shell. Durable state stays server-side; browser storage is used only for resumable setup input and unsent prompt drafts.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Supabase Postgres/Auth/SSR, SQL migrations and functions, Zod, React Hook Form, Vitest, Playwright

---

## File Map

- Create: `scripts/seed-prompts.mjs`, `supabase/seed.sql`, `src/lib/prompts/catalog.ts`
- Create: `supabase/migrations/0002_core_gameplay_schema.sql`
- Create: `src/types/chronicle.ts`, `src/lib/validation/setup.ts`, `src/lib/validation/play.ts`
- Create: `src/app/(app)/chronicles/[chronicleId]/setup/page.tsx`, `src/components/ritual/SetupStepper.tsx`, `src/components/ritual/RitualTextarea.tsx`
- Create: `src/app/api/chronicles/[chronicleId]/setup/complete/route.ts`, `src/lib/chronicles/setup.ts`
- Create: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`, `src/components/ritual/PromptCard.tsx`, `src/components/ritual/MemoryMeter.tsx`
- Create: `src/app/api/chronicles/[chronicleId]/play/resolve/route.ts`, `src/lib/chronicles/resolvePrompt.ts`
- Create: `src/components/ritual/ConsequencePanel.tsx`, `src/lib/chronicles/localDrafts.ts`
- Create: `tests/integration/setup-flow.test.ts`, `tests/e2e/first-session.spec.ts`
- Modify: `src/app/(app)/chronicles/page.tsx`, `src/components/ritual/ChronicleCard.tsx`, `package.json`, `docs/product-roadmap.md`

## Chunk 1: Prompt Catalog and Gameplay Schema

### Task 1: `TASK-010` Seed the prompt catalog and add the loader

**Files:**
- Create: `scripts/seed-prompts.mjs`
- Create: `supabase/seed.sql`
- Create: `src/lib/prompts/catalog.ts`

- [ ] **Step 1: Write a failing prompt-loader test**

Create `tests/integration/prompt-catalog.test.ts` with an assertion that `getPromptByPosition` returns prompt 1 from mocked Supabase data.

- [ ] **Step 2: Run the prompt-loader test to confirm RED**

Run: `npx vitest run tests/integration/prompt-catalog.test.ts`
Expected: FAIL because the loader module does not exist yet

- [ ] **Step 3: Inspect the local prompt source and define the seed format**

Read `docs/source_material/ThousandYearOldVampire Prompts.md` and map each prompt into `prompt_number`, `encounter_index`, `prompt_markdown`, and `prompt_version`

- [ ] **Step 4: Write `scripts/seed-prompts.mjs`**

Implement a reproducible script that parses the full local prompt source and emits deterministic SQL tuples or `upsert` statements for the prompt catalog

- [ ] **Step 5: Write `supabase/seed.sql`**

Reference the generated prompt catalog inserts so local Supabase seeding can load the full prompt source without UI duplication

- [ ] **Step 6: Implement `src/lib/prompts/catalog.ts`**

Add a focused loader API such as `getPromptByPosition(supabase, promptNumber, encounterIndex)` that returns one prompt row or `null`

- [ ] **Step 7: Re-run the prompt-loader test to verify GREEN**

Run: `npx vitest run tests/integration/prompt-catalog.test.ts`
Expected: PASS

- [ ] **Step 8: Verify the seed output contains prompt 1**

Run: `node scripts/seed-prompts.mjs`
Expected: process completes successfully and the generated seed content includes prompt 1

### Task 2: `TASK-011` Expand the gameplay schema

**Files:**
- Create: `supabase/migrations/0002_core_gameplay_schema.sql`

- [ ] **Step 1: Write a failing schema smoke check**

Run: `test -f supabase/migrations/0002_core_gameplay_schema.sql`
Expected: non-zero exit status before the migration exists

- [ ] **Step 2: Draft the enum and table layout from the PRD**

Map every required enum, table, foreign key, index, and ownership constraint from the approved spec into the migration outline before writing SQL

- [ ] **Step 3: Implement the migration**

Create enums, `prompt_catalog`, gameplay tables, indexes, `updated_at` triggers where needed, RLS policies, and transactional SQL functions for setup completion and prompt resolution

- [ ] **Step 4: Add idempotency and legality guards inside the SQL functions**

Ensure prompt resolution guards against duplicate submission, memory overflow, excess memory entries, and duplicate active diaries

- [ ] **Step 5: Verify the migration file structure**

Run: `node -e "const fs=require('fs'); const sql=fs.readFileSync('supabase/migrations/0002_core_gameplay_schema.sql','utf8'); process.exit(sql.includes('create table public.prompt_catalog')&&sql.includes('create table public.sessions')&&sql.includes('enable row level security')&&sql.includes('create or replace function public.complete_chronicle_setup')&&sql.includes('create or replace function public.resolve_prompt_run')?0:1)"`
Expected: exit status zero

- [ ] **Step 6: Verify the prompt catalog seed file references the new table**

Run: `node -e "const fs=require('fs'); const sql=fs.readFileSync('supabase/seed.sql','utf8'); process.exit(sql.includes('prompt_catalog')?0:1)"`
Expected: exit status zero

## Chunk 2: Contracts, Setup UI, and Setup Completion

### Task 3: `TASK-012` Shared types and validation

**Files:**
- Create: `src/types/chronicle.ts`
- Create: `src/lib/validation/setup.ts`
- Create: `src/lib/validation/play.ts`
- Test: `tests/integration/chronicle-validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create `tests/integration/chronicle-validation.test.ts` with one valid and one invalid payload for setup completion, plus one valid and one invalid payload for prompt resolution

- [ ] **Step 2: Run the validation tests to confirm RED**

Run: `npx vitest run tests/integration/chronicle-validation.test.ts`
Expected: FAIL because the schema modules do not exist yet

- [ ] **Step 3: Implement chronicle domain types**

Add shared TypeScript types for setup payloads, prompt resolution payloads, trait mutation actions, prompt rows, and compact play summaries

- [ ] **Step 4: Implement `zod` schemas**

Match the request shapes from `docs/prd.md` exactly, including legal enum values and required nested objects

- [ ] **Step 5: Re-run the validation tests to verify GREEN**

Run: `npx vitest run tests/integration/chronicle-validation.test.ts`
Expected: PASS

### Task 4: `TASK-013` Guided setup UI with local persistence

**Files:**
- Create: `src/app/(app)/chronicles/[chronicleId]/setup/page.tsx`
- Create: `src/components/ritual/SetupStepper.tsx`
- Create: `src/components/ritual/RitualTextarea.tsx`
- Create: `src/lib/chronicles/localDrafts.ts`
- Test: `tests/integration/setup-flow.test.ts`

- [ ] **Step 1: Write a failing guided-setup test**

Create `tests/integration/setup-flow.test.ts` with assertions that the page renders editorial step labels and that saved local setup state can hydrate after a refresh

- [ ] **Step 2: Run the guided-setup test to confirm RED**

Run: `npx vitest run tests/integration/setup-flow.test.ts`
Expected: FAIL because the route and components do not exist yet

- [ ] **Step 3: Implement local draft helpers**

Add `src/lib/chronicles/localDrafts.ts` helpers for saving, loading, and clearing setup drafts and prompt drafts with storage keys scoped by `chronicleId`

- [ ] **Step 4: Implement `RitualTextarea`**

Build the shared writing surface primitive used by setup and play, with calm copy, accessible labels, and strong focus treatment

- [ ] **Step 5: Implement `SetupStepper`**

Build the editorial multi-step form with grouped sections for mortal summary, traits/resources, characters, mark, and setup memories

- [ ] **Step 6: Implement the setup page**

Load the draft chronicle server-side, render the stepper, and hydrate it from local storage without turning the flow into a generic dashboard form

- [ ] **Step 7: Re-run the guided-setup test to verify GREEN**

Run: `npx vitest run tests/integration/setup-flow.test.ts`
Expected: PASS

### Task 5: `TASK-014` Setup completion route and server orchestration

**Files:**
- Create: `src/app/api/chronicles/[chronicleId]/setup/complete/route.ts`
- Create: `src/lib/chronicles/setup.ts`
- Modify: `tests/integration/setup-flow.test.ts`

- [ ] **Step 1: Extend the setup integration test with a failing submission case**

Assert that a valid setup payload calls the server path and an invalid payload returns the standard validation error shape

- [ ] **Step 2: Run the setup integration test to confirm RED**

Run: `npx vitest run tests/integration/setup-flow.test.ts`
Expected: FAIL on the new submission assertions

- [ ] **Step 3: Implement `src/lib/chronicles/setup.ts`**

Add a focused server helper that checks chronicle ownership and calls the setup SQL function with validated payload data

- [ ] **Step 4: Implement the setup completion route**

Validate request JSON with `zod`, call the helper, clear the local draft on success, and return the next route to `/chronicles/:id/play`

- [ ] **Step 5: Re-run the setup integration test to verify GREEN**

Run: `npx vitest run tests/integration/setup-flow.test.ts`
Expected: PASS

- [ ] **Step 6: Update the chronicle list resume behavior**

Modify `src/app/(app)/chronicles/page.tsx` and `src/components/ritual/ChronicleCard.tsx` so draft chronicles route into setup and active chronicles route into play

## Chunk 3: Active Play, Consequences, Retry, and End-to-End Flow

### Task 6: `TASK-015` Active prompt route and writing surface

**Files:**
- Create: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Create: `src/components/ritual/PromptCard.tsx`
- Create: `src/components/ritual/MemoryMeter.tsx`
- Modify: `tests/integration/setup-flow.test.ts`

- [ ] **Step 1: Add a failing active-play integration assertion**

Extend `tests/integration/setup-flow.test.ts` to require the first prompt and compact state summary after successful setup completion

- [ ] **Step 2: Run the setup/play integration test to confirm RED**

Run: `npx vitest run tests/integration/setup-flow.test.ts`
Expected: FAIL because the play route and components do not exist yet

- [ ] **Step 3: Implement the prompt card and memory meter**

Build restrained editorial components that keep the writing surface central and supporting state compact

- [ ] **Step 4: Implement the play page**

Load chronicle state, current session, and prompt 1 server-side through `src/lib/prompts/catalog.ts`, then render the first active prompt for a newly completed chronicle

- [ ] **Step 5: Re-run the setup/play integration test to verify GREEN**

Run: `npx vitest run tests/integration/setup-flow.test.ts`
Expected: PASS

### Task 7: `TASK-016` Prompt resolution transaction

**Files:**
- Create: `src/app/api/chronicles/[chronicleId]/play/resolve/route.ts`
- Create: `src/lib/chronicles/resolvePrompt.ts`
- Modify: `tests/integration/setup-flow.test.ts`

- [ ] **Step 1: Extend integration coverage with a failing resolution test**

Assert that valid prompt resolution stores roll data, advances prompt position, and returns archive consequence summaries while invalid payloads fail validation

- [ ] **Step 2: Run the integration test to confirm RED**

Run: `npx vitest run tests/integration/setup-flow.test.ts`
Expected: FAIL on resolution assertions

- [ ] **Step 3: Implement `src/lib/chronicles/resolvePrompt.ts`**

Add a focused server helper that checks chronicle ownership and calls the prompt-resolution SQL function with validated payload data

- [ ] **Step 4: Implement the prompt resolution route**

Validate JSON, call the helper, and return prompt run, rolled values, next prompt state, and archive events in the response shape from the PRD

- [ ] **Step 5: Re-run the integration test to verify GREEN**

Run: `npx vitest run tests/integration/setup-flow.test.ts`
Expected: PASS

### Task 8: `TASK-017` Consequence feedback and `TASK-018` draft-preserving retry

**Files:**
- Create: `src/components/ritual/ConsequencePanel.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Modify: `src/components/ritual/RitualTextarea.tsx`
- Modify: `src/lib/chronicles/localDrafts.ts`
- Modify: `tests/integration/setup-flow.test.ts`

- [ ] **Step 1: Add failing UI assertions for consequence feedback and retry-preserved drafts**

Extend `tests/integration/setup-flow.test.ts` so a successful resolution must render quiet consequence language and a simulated failed submission must keep the unsent draft text available

- [ ] **Step 2: Run the integration test to confirm RED**

Run: `npx vitest run tests/integration/setup-flow.test.ts`
Expected: FAIL on the new consequence and retry assertions

- [ ] **Step 3: Implement `ConsequencePanel`**

Render immediate, restrained summaries of changed memories, traits, and prompt movement without breaking the play surface

- [ ] **Step 4: Extend local draft helpers for prompt drafts**

Store, restore, and clear unsent prompt content keyed by chronicle and prompt position

- [ ] **Step 5: Wire consequence feedback and retry behavior into the play route**

Show inline consequence feedback after success, keep prompt drafts on failure, and clear them only after successful prompt resolution

- [ ] **Step 6: Re-run the integration test to verify GREEN**

Run: `npx vitest run tests/integration/setup-flow.test.ts`
Expected: PASS

### Task 9: `TASK-019` Full first-session coverage

**Files:**
- Modify: `tests/integration/setup-flow.test.ts`
- Create: `tests/e2e/first-session.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing e2e first-session spec**

Create `tests/e2e/first-session.spec.ts` to cover sign-in entry, chronicle creation, guided setup completion, first prompt render, and first prompt resolution

- [ ] **Step 2: Run the new e2e spec to confirm RED**

Run: `npx playwright test tests/e2e/first-session.spec.ts`
Expected: FAIL before the flow is fully wired

- [ ] **Step 3: Add any missing test helpers or npm scripts**

Update `package.json` only if the new integration/e2e flow needs explicit verification commands

- [ ] **Step 4: Re-run focused integration coverage**

Run: `npx vitest run tests/integration/prompt-catalog.test.ts tests/integration/chronicle-validation.test.ts tests/integration/setup-flow.test.ts`
Expected: PASS

- [ ] **Step 5: Re-run the first-session e2e spec**

Run: `npx playwright test tests/e2e/first-session.spec.ts`
Expected: PASS in local/dev CI conditions

- [ ] **Step 6: Update the roadmap through `TASK-019`**

Modify `docs/product-roadmap.md` so `TASK-010` through `TASK-019` are marked complete only after their verification passes

- [ ] **Step 7: Commit the completed Phase 1 slice**

Run: `git add docs/product-roadmap.md docs/superpowers/specs/2026-04-20-phase-1-becoming-undead-and-first-prompt-design.md docs/superpowers/plans/2026-04-20-phase-1-becoming-undead-and-first-prompt.md scripts/seed-prompts.mjs supabase/seed.sql supabase/migrations/0002_core_gameplay_schema.sql src tests package.json package-lock.json`
Expected: staged changes include the full Phase 1 first-session slice

Run: `git commit -m "feat: implement phase 1 first-session flow"`
Expected: commit succeeds with the verified Phase 1 work

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-phase-1-becoming-undead-and-first-prompt.md`. Ready to execute?
