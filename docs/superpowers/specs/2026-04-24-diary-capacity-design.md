# Diary Capacity Design

**Date:** 2026-04-24  
**Status:** Approved  

## Context

The current product already supports opening a single active diary and moving in-mind memories into it when the mind is full. That covers part of the source rule, but it does not enforce the rule that a normal diary may hold only four memories. The result is a play loop that preserves memories too easily and removes pressure that the original game intends to create.

The source material also includes later prompt-specific exceptions, including diary states that temporarily expand beyond four memories or create a diary-like container with a different limit. This design needs to enforce the normal rule now without closing off those later cases.

## Goal

Support the base game rule that a diary may hold up to four memories while keeping the implementation flexible enough to support later prompt effects that change diary capacity.

## Decision

The diary remains a first-class model, but its capacity becomes explicit and authoritative in durable state.

Instead of treating diary presence as a simple yes-or-no condition, the system should track the active diary's current usage and capacity. The backend should enforce the rule during prompt resolution, and the UI should reflect that rule clearly enough that the player understands which choices are legal before they submit.

## Approaches Considered

### 1. UI-only guard

Count diary memories on the play page, disable moving a memory into the diary when the count reaches four, and leave the backend unchanged.

This is the smallest change, but it makes the rule advisory instead of authoritative. It is vulnerable to stale tabs, future refactors, and any backend path that bypasses the play page.

### 2. Diary-owned capacity

Store diary capacity on the diary record, default it to four, enforce it in the prompt-resolution helpers, and pass usage data to the UI.

This is the selected approach. It keeps the rule authoritative, fits the existing diary model, and creates a clean extension point for later prompt effects that expand a diary to six memories or otherwise alter capacity.

### 3. General memory-container system

Replace the current diary-specific handling with a more general model for memory-bearing containers that can be lost, expanded, or specialized.

This would be the most flexible long term, but it is too broad for this slice. It would pull this focused rules fix into a much larger redesign before there is a concrete need.

## Approved Design

### Data Model

- Add `memory_capacity integer not null default 4` to `public.diaries`.
- Keep memory membership derived from `public.memories.diary_id`; do not add a stored count column.
- Keep one normal active diary per chronicle as the current product rule.
- Treat later prompt exceptions as diary mutations, usually by changing `memory_capacity`, rather than by hard-coding special UI logic.

### Backend Rule Enforcement

- Add a helper that loads the active diary for a chronicle together with the number of memories currently linked to it.
- When `move-to-diary` is requested and no active diary exists, create a new diary with `memory_capacity = 4` and allow the move.
- When an active diary exists and `memoryCount < memoryCapacity`, allow the move as usual.
- When an active diary exists and `memoryCount >= memoryCapacity`, reject the move with a dedicated rule error such as `The diary is already full.`
- Keep the RPC layer authoritative so stale UI state or concurrent tabs cannot bypass the rule.

### Player Experience

- Replace the play page's binary `hasActiveDiary` state with an `activeDiary` object that includes `id`, `title`, `memoryCount`, and `memoryCapacity`, or `null` when no diary exists.
- Keep the current overflow ritual: the player still chooses whether to forget a memory or move one into the diary.
- If the diary has room, keep the `move-to-diary` option enabled.
- If the diary is full, keep the option visible but disabled, with explanatory copy that makes the legal state clear without sounding mechanical.
- If no diary exists yet, continue offering the move option as the path that creates a new diary.
- Update the current-state summary from a generic `Diary present` message to a usage-aware summary such as `Diary 3 of 4 memories`.
- Show the same usage context in the archive near the diary heading so the limit feels like part of the chronicle's state, not just a hidden play-screen rule.

### Error Handling

- Map the new backend diary-full error to calm, player-facing copy on the play surface.
- Avoid collapsing diary-full failures into the generic prompt-resolution error.
- Preserve the current guidance pattern where the interface explains the legal next move instead of exposing raw system language.

### Legacy Data Handling

- Backfill `memory_capacity = 4` for all existing diaries.
- If an existing chronicle already has more than four diary memories, preserve that state rather than mutating or trimming memories.
- Treat those diaries as over-capacity legacy states that cannot accept additional diary moves until a later prompt effect or manual intervention changes their capacity or usage.

## Out of Scope

- Diary loss and the cascading loss of linked memories
- Prompt parsing and automatic application of prompt-specific diary mutations
- Support for multiple simultaneous normal diaries
- Generalized container systems beyond the diary model

## Testing Strategy

- Integration coverage for `move-to-diary` when no diary exists, when the diary has room, and when the diary is full
- Regression coverage confirming the same active diary is reused until it reaches capacity
- Play-page coverage confirming the server data shape includes diary count and capacity, not only diary presence
- UI coverage for enabled, disabled, and create-a-new-diary overflow states
- Archive or presentation coverage confirming diary usage is shown consistently outside the play surface

## Why This Design

This design keeps the change small enough to ship as a focused rules fix while still respecting the shape of the source material. The rule lives in durable state and backend enforcement rather than only in React, but the model is not widened into a general system before the product needs one.

Most importantly, it preserves a clean path for later prompt-specific exceptions. The base rule remains "a diary holds four memories," while future content can change that by mutating diary capacity rather than by layering one-off exceptions into the UI.
