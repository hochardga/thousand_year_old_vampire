# Phase 1 Becoming Undead and First Prompt Design

**Date:** 2026-04-20  
**Status:** Approved  
**Phase:** 1 — Becoming Undead & First Prompt

## Goal

Ship a review-ready Phase 1 slice in which a new player can authenticate, complete guided setup, resolve the first prompt, and immediately feel the chronicle become durable and alive.

## Chosen Approach

Three approaches were considered for Phase 1:

1. **Vertical slice in roadmap order** — seed prompts, land the gameplay schema, then build setup, play, consequence feedback, retry handling, and tests
2. **UI-first with mocked gameplay internals** — build the setup/play shell first, then replace placeholders later
3. **Backend-first with placeholder surfaces** — land the full data layer first, then add the product experience afterward

The selected approach is **vertical slice in roadmap order**. It keeps the roadmap intact, avoids temporary prompt logic, and lets each task produce something real and verifiable on the path to the product's magic moment.

## Architecture

Phase 1 stays server-led and chronicle-centered.

- `prompt_catalog` becomes the only durable source of prompt content, seeded from the full local prompt source rather than hard-coded into UI files
- the `chronicles` row remains the top-level pointer for current prompt number, encounter index, status, and active session linkage
- shared TypeScript types and `zod` schemas define request and response boundaries before route handlers or UI flows expand
- setup completion and prompt resolution use transactional database functions so multi-entity writes succeed or fail together

The phase divides into three layers:

1. `src/lib/prompts/*`, `src/types/*`, and `src/lib/validation/*` for prompt access and request contracts
2. `src/lib/chronicles/*` plus route handlers for setup completion and prompt resolution
3. App Router pages and ritual components for guided setup, active play, consequence feedback, and local draft persistence

## Components and Data Flow

### Prompt Catalog

`TASK-010` seeds the full local prompt source into `prompt_catalog` through `scripts/seed-prompts.mjs` and `supabase/seed.sql`. `src/lib/prompts/catalog.ts` becomes the reusable prompt-loading utility used by route handlers and server-rendered pages. Prompt text should never be duplicated inside UI components.

### Gameplay Schema

`TASK-011` extends the database with the gameplay entities from the PRD:

- `prompt_catalog`
- `sessions`
- `prompt_runs`
- `memories`
- `memory_entries`
- `diaries`
- `skills`
- `resources`
- `characters`
- `marks`
- `archive_events`
- the remaining enums and indexes required for gameplay state

The migration should also add ownership-based RLS policies consistent with Phase 0 and database functions for:

1. completing setup atomically
2. resolving a prompt atomically

### Setup Flow

The setup route should feel editorial rather than procedural. `SetupStepper` groups the player journey into calm narrative sections:

1. mortal summary
2. initial skills and resources
3. characters and immortal origin
4. mark and becoming-undead details
5. setup memories

Local setup persistence is keyed by `chronicleId` so refreshes, navigation, or auth interruptions do not erase work. The completion route validates the payload with `zod`, calls the setup database function, clears the local draft, and routes directly into active play.

### Active Play

The play route server-loads:

- chronicle state
- current session
- prompt content from `prompt_catalog`
- compact support state such as in-mind memory count and diary presence

The interface stays centered on writing:

- `PromptCard` for the current prompt
- `RitualTextarea` for the entry and experience text
- `MemoryMeter` for compact support state
- `ConsequencePanel` for immediate post-resolution feedback

Prompt submission validates on the server, calls the prompt-resolution database function, and returns the next prompt state plus archive consequence summaries without routing the player through a dashboard or separate confirmation screen.

## Error Handling

Failure states should remain quiet, local, and recoverable.

- setup drafts persist locally per `chronicleId`
- prompt drafts persist locally until a resolution succeeds
- failed prompt resolution shows a retry path without erasing unsent text
- expired auth preserves destination and lets local drafts survive the return through sign-in
- a missing prompt in `prompt_catalog` is treated as a blocking system fault with calm copy because seeded data should make it exceptional

Rules enforcement belongs to the server and database:

- duplicate prompt submissions are idempotent by session plus prompt number
- in-mind memories never exceed five
- memory entries never exceed three
- diary creation reuses an existing active diary instead of creating a second one
- UI surfaces only legal choices, but the browser is never the final authority

## Task Sequencing

Phase 1 should be executed strictly in roadmap order:

1. `TASK-010` prompt seed and loader
2. `TASK-011` gameplay schema and transactional SQL functions
3. `TASK-012` shared types and validation
4. `TASK-013` guided setup UI with local persistence
5. `TASK-014` setup completion route and server orchestration
6. `TASK-015` active play route and writing surface
7. `TASK-016` prompt resolution route and server orchestration
8. `TASK-017` immediate consequence feedback
9. `TASK-018` draft-preserving retry flow
10. `TASK-019` integration and e2e coverage for the full first-session path

After each roadmap task is verified, `docs/product-roadmap.md` must be updated immediately before moving to the next unchecked task.

## Verification

Verification should prove the full magic-moment path rather than isolated code edits:

- prompt seed verification proves prompt 1 is available through the shared loader
- migration verification proves gameplay tables, indexes, RLS, and transactional SQL functions exist cleanly
- validation tests prove setup and prompt-resolution payloads accept legal inputs and reject invalid shapes
- integration tests cover setup completion, invalid payload rejection, prompt loading, and prompt resolution side effects
- e2e coverage walks sign-in, chronicle creation, setup completion, and first prompt resolution
- failure-path checks prove that prompt submission retries preserve local draft text

## Definition of Done

Phase 1 is done when:

- a new player can move from sign-in to first resolved prompt in one calm flow
- prompt content is loaded from seeded database rows, not UI constants
- setup completion and prompt resolution are durable, validated, and atomic
- consequence feedback appears inline without breaking immersion
- local drafts survive transient failure conditions
- tests cover the first-session path end-to-end
- the roadmap is checked through `TASK-019`
- the branch is ready for review as a coherent Phase 1 deliverable
