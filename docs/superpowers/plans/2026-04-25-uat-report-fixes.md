# UAT Report Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the app-actionable issues in `docs/uat-report-2026-04-25.md` and ship them in a ready-for-review PR.

**Architecture:** Make the play route refresh from server state after successful prompt resolution and use a resolved client state to prevent duplicate submission. Keep prompt-effect guidance small and catalog-driven for the known base prompts. Align E2E mock persistence with SQL behavior, then polish reading surfaces and accessibility details through focused component/server tests.

**Tech Stack:** Next.js App Router, React 19, Supabase RPCs plus local E2E mock, Vitest, Testing Library, Playwright, ESLint.

---

## File Structure

- Modify `src/components/ritual/PlaySurface.tsx`: resolved-state behavior, prompt-effect guidance props, draft callback stability.
- Modify `src/components/ritual/ConsequencePanel.tsx`: refresh-driven next action.
- Create `src/lib/prompts/effects.ts`: known prompt effect metadata for base prompts.
- Modify `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`: pass prompt effect metadata into the play surface.
- Modify `src/lib/supabase/e2e.ts`: persist setup characters, marks, resources, and accurate created counts.
- Modify `src/components/archive/MemoryCard.tsx`: neutral zero-entry fallback.
- Modify `src/lib/recap/buildRecap.ts`: player-facing recap prose.
- Modify `src/components/ritual/SetupStepper.tsx`: setup step headings use `h2`.
- Modify `docs/uat-report-2026-04-25.md`: mark each finding addressed or intentionally tracked.
- Add or update tests in `tests/integration/setup-flow.test.tsx`, `tests/integration/archive-page.test.tsx`, `tests/integration/build-recap.test.ts`, and `tests/e2e/first-session.spec.ts`.

## Tasks

### Task 1: Play Resolve State

**Files:**
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `src/components/ritual/ConsequencePanel.tsx`
- Test: `tests/integration/setup-flow.test.tsx`
- Test: `tests/e2e/first-session.spec.ts`

- [ ] Write a failing integration test that renders `PlaySurface`, submits a prompt, expects the success panel, expects the submit button/form fields to be absent or disabled, then rerenders with a new prompt number and expects the stale success panel to disappear.
- [ ] Run `npm run test:integration -- tests/integration/setup-flow.test.tsx` and confirm the new test fails.
- [ ] Stabilize `syncPromptDraft` with `useCallback`, add `resolvedPromptNumber/sessionId` state, hide or disable the form once `result` is set, and clear `result` when `currentPromptNumber` or `initialSessionId` changes.
- [ ] Update `ConsequencePanel` to use a small client click handler or URL refresh behavior so continuing to the same route fetches fresh server state.
- [ ] Extend `tests/e2e/first-session.spec.ts` so clicking `Continue to prompt 4` verifies Prompt 4 is visible, the old consequence panel is gone, and the memory meter shows two held memories.
- [ ] Run the integration test and the first-session E2E test.

### Task 2: Setup Persistence

**Files:**
- Modify: `src/lib/supabase/e2e.ts`
- Test: `tests/e2e/first-session.spec.ts`
- Test: `tests/integration/setup-flow.test.tsx`

- [ ] Write a failing test or E2E assertion that after setup the ledger contains the mortal character, immortal maker, and mark.
- [ ] Run the targeted test and confirm it fails in mock mode.
- [ ] Update `applySetupCompletion` to insert `initial_resources`, `initial_characters`, `immortal_character`, and `mark` into mock state, matching the SQL function.
- [ ] Ensure `createdEntities.characters`, `createdEntities.resources`, and `createdEntities.skills` count only inserted non-empty entities.
- [ ] Run targeted setup tests and the ledger assertion.

### Task 3: Archive And Recap Reading Surfaces

**Files:**
- Modify: `src/components/archive/MemoryCard.tsx`
- Modify: `src/lib/recap/buildRecap.ts`
- Test: `tests/integration/archive-page.test.tsx`
- Test: `tests/integration/build-recap.test.ts`

- [ ] Add a memory-card/archive test for an empty `memory_entries` join that expects neutral copy such as `Entry text has not been joined to this memory yet.`
- [ ] Add recap expectations that reject `prompt 7.1`, `moved the chronicle forward`, and repeated generic `The entry has been set into memory.` prose.
- [ ] Run targeted tests and confirm failure.
- [ ] Update memory-card zero-entry copy to avoid saying `0 entries kept here`.
- [ ] Rework `buildRecap` to say `Prompt N`, list recent concrete experience text, deduplicate archive events, and filter generic prompt-resolved summaries when prompt runs are available.
- [ ] Run targeted tests.

### Task 4: Prompt-Effect Guidance

**Files:**
- Create: `src/lib/prompts/effects.ts`
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Test: `tests/integration/setup-flow.test.tsx`

- [ ] Add failing tests for Prompt 1 guidance naming `Bloodthirsty` and Prompt 4 guidance indicating a stationary resource.
- [ ] Run the targeted integration test and confirm failure.
- [ ] Add `getPromptEffectByPosition(promptNumber, encounterIndex, promptVersion)` with base prompt metadata for Prompt 1 and Prompt 4.
- [ ] Pass effect metadata from the play page to `PlaySurface`.
- [ ] Render an inline guidance panel and prefill `Bloodthirsty` or stationary resource defaults when opening the relevant composer.
- [ ] Run targeted integration tests.

### Task 5: Setup Headings And UAT Report

**Files:**
- Modify: `src/components/ritual/SetupStepper.tsx`
- Modify: `docs/uat-report-2026-04-25.md`
- Test: `tests/integration/setup-flow.test.tsx`

- [ ] Add or update a setup test that expects one page-level `h1` and step headings at heading level 2.
- [ ] Run the targeted setup test and confirm failure.
- [ ] Change setup step headings from `h1` to `h2`, leaving the safety checkpoint heading consistent.
- [ ] Update the UAT report findings with resolution notes, including the upstream-tracked audit advisory.
- [ ] Run targeted setup tests.

### Task 6: Verification And PR

**Files:**
- No code files unless verification finds a regression.

- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run test:e2e`.
- [ ] Run `npm run build`.
- [ ] Run `npm audit --audit-level=moderate` and record the expected upstream advisory if it still fails.
- [ ] Commit implementation changes.
- [ ] Push `codex/address-uat-report-2026-04-25`.
- [ ] Open a ready-for-review pull request.

## Self-Review

Spec coverage: all stale play state, setup persistence, archive/recap copy, prompt-effect guidance, heading/lint/audit, verification, and PR requirements are covered.

Placeholder scan: no placeholders remain.

Type consistency: planned props and helper names are stable across tasks.
