# Phase 2 TASK-020 Memory Rules Design

**Date:** 2026-04-20  
**Status:** Approved  
**Phase:** 2 — Archive, Memory Loss & Return

## Goal

Ship the rule-enforcement layer for Phase 2 so the chronicle can safely handle memory overflow, diary placement, and entry limits before the archive and resume surfaces build on top of it.

## Chosen Approach

Three approaches were considered for `TASK-020`:

1. **Expand `resolve_prompt_run` directly** so every new rule branch stays inside the existing RPC
2. **Introduce reusable SQL helpers plus a thin TypeScript server contract** for memory legality and overflow transitions
3. **Move the rules into route-level TypeScript helpers** and keep SQL focused on persistence only

The selected approach is **reusable SQL helpers plus a thin TypeScript server contract**.

This preserves the product requirement that illegal states cannot be saved, keeps the rule engine close to the data it protects, and leaves a reusable path for the dedicated overflow endpoint and Phase 2 UI work that follow. It also avoids turning `resolve_prompt_run` into an even larger one-off function that later routes cannot share cleanly.

## Architecture

`TASK-020` should add two complementary layers:

1. a new migration that introduces focused SQL helper functions for memory validation and overflow transitions
2. `src/lib/chronicles/memoryRules.ts` as the application-facing rule contract that documents valid inputs, invokes the database boundary, and normalizes rule failures into predictable messages

The existing `public.resolve_prompt_run` RPC remains the transaction entry point for prompt submission, but it should delegate memory-specific decisions to helper functions rather than containing every branch inline.

The rule layer must enforce these invariants:

- a chronicle can have at most five in-mind memories
- a memory can have at most three entries
- only one active diary can exist per chronicle
- diary memories cannot receive new entries
- overflow decisions can only target memories currently in mind
- moving a memory to diary or forgetting it must free a legal in-mind slot before a new memory is created

## Components and Data Flow

### SQL Helper Surface

The migration should introduce small, composable helper functions that `resolve_prompt_run` can call inside the same transaction. The exact names may vary, but the responsibilities should be stable:

- validate whether a target memory belongs to the chronicle and is eligible for append
- count existing entries and reject a fourth entry
- validate whether the chronicle is at memory capacity
- create or reuse the active diary
- apply the overflow action to the selected in-mind memory
- return the next available in-mind slot for the new memory

These helpers should raise precise exceptions when the caller attempts an illegal state rather than silently no-oping or failing later on a generic slot lookup.

### TypeScript Contract

`src/lib/chronicles/memoryRules.ts` should provide the server-facing contract for memory rule operations.

For `TASK-020`, that file does not need to expose a broad public API yet. It primarily exists to:

- centralize rule terminology used by route handlers and future UI work
- keep RPC argument/response typing readable
- map known database rule errors into calm, product-appropriate messages
- give future endpoints such as `/api/chronicles/:chronicleId/memories/overflow` a single place to reuse the same rule language

### Prompt Resolution Flow

When prompt resolution attempts to create a new memory:

1. `resolve_prompt_run` creates the `prompt_runs` row as it does now
2. if the decision is `append-existing`, the helper validates the target memory is in mind and below three entries, then inserts the next ordered entry
3. if the decision is `create-new`, the helper confirms the chronicle has an open in-mind slot
4. if the mind is full, the helper requires either `forget-existing` or `move-to-diary`
5. the overflow helper validates the selected memory is currently in mind, then either marks it forgotten or moves it to the active diary
6. the new memory is created in the freed slot and receives its first entry
7. archive event payloads reflect the real transition that happened

This keeps prompt resolution transactional while moving the rule complexity into focused, reusable boundaries.

## Error Handling

Rule failures should become explicit and stable:

- appending to a missing memory should fail with a memory-target error
- appending to a diary or forgotten memory should fail because only in-mind memories can accept entries
- appending to a full memory should fail before insert
- selecting an overflow target that is not currently in mind should fail clearly
- attempting to create a sixth in-mind memory without a legal overflow decision should fail clearly
- attempting to create a second active diary should reuse the first diary rather than error or duplicate

The product voice for surfaced errors should stay brief and grounded. Internally, the TypeScript helper should distinguish rule failures from unexpected infrastructure failures so later UI can decide whether to show an inline correction or a general retry panel.

## Testing

`TASK-020` should land with targeted automated coverage around the rule boundary before any Phase 2 UI assumes the logic is correct.

The minimum verification set should cover:

- append succeeds for an in-mind memory with fewer than three entries
- append is rejected for a memory that already has three entries
- append is rejected for diary memories
- a new memory can be created while fewer than five memories are in mind
- a sixth in-mind memory requires a legal overflow decision
- `move-to-diary` creates a diary only when none exists and otherwise reuses the active diary
- only one active diary remains after repeated move-to-diary flows
- `forget-existing` moves the selected memory to `forgotten` and clears its slot

Where possible, tests should assert both persisted state and returned archive event summaries so later recap and archive tasks can rely on the same event stream.

## Definition of Done

`TASK-020` is done when:

- memory and diary invariants are enforced at the database boundary
- prompt resolution cannot save illegal overflow or append states
- a reusable server-side contract exists in `src/lib/chronicles/memoryRules.ts`
- automated coverage proves the main legal and illegal transitions
- `docs/product-roadmap.md` is checked for `TASK-020` immediately after verification
