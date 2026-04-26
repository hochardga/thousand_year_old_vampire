# Prompt-Created Marks Design

**Date:** 2026-04-26
**Status:** Approved

## Context

The rules coverage audit already shows prompt-created Skills and prompt-created Resources as automated. The closest remaining gap in the same family is prompt-created Marks: prompts may leave a new physical, social, or supernatural sign on the vampire during active play, but the play loop cannot create that Mark while resolving the prompt.

Today, the schema supports marks and prompt resolution can update existing marks through `traitMutations.marks`, but there is no first-party prompt-resolution path for creating a new mark. The only mark route is item-level editing from the archive or ledger surface. That means a player who receives a prompt that creates a new mark must resolve the prompt first and remember to patch the chronicle elsewhere.

## Goal

Support the base game rule that prompts can create a new Mark during play without prompt parsing, ledger detours, or multi-step writes that can leave the prompt answer and trait state out of sync.

## Decision

Add an optional mark-creation path directly to the play surface and persist it through the same prompt-resolution transaction that already records the prompt run, player entry, experience text, memory decision, existing trait mutations, prompt-created skills, and prompt-created resources.

The player still interprets prompt text manually. This slice does not infer whether a prompt requires a new mark.

## Approaches Considered

### 1. Extend prompt resolution with an optional `newMark` object

This is the selected approach. The play form gains an optional reveal for creating a mark from the current prompt, the request payload carries that mark alongside the rest of the prompt answer, and the backend creates the mark inside the authoritative prompt-resolution transaction.

This matches the shipped Skills and Resources pattern, keeps the player in the prompt ritual, and avoids partial outcomes.

### 2. Add a separate create-mark route from the play page

This would be quick to wire, but it would split one rules event into multiple writes. The prompt could resolve without the mark, or the mark could be created while prompt resolution fails.

### 3. Build a generic prompt-created trait composer

A generic composer could eventually reduce repetition across Skills, Resources, Characters, and Marks. It is too broad for this slice because marks have their own field set and creation semantics, and the current code already has small, explicit composers for the two existing prompt-created trait types.

## Approved Design

### Player Experience

- Add an optional reveal inside the play form labeled `Add a mark from this prompt`.
- Keep it collapsed by default.
- When opened, show three inputs:
  - `Mark name`
  - `What changed`
  - `Concealed`
- Use a checkbox for the concealed flag, matching setup and archive mark editing semantics.
- Keep the control on the play surface so the prompt can be fully resolved in one flow.
- Preserve mark draft fields when validation or submission fails.

### Validation Rules

- If the mark-creation reveal is closed, no mark-creation validation runs.
- If the reveal is open, mark name and description are required.
- Trim leading and trailing whitespace before validation and persistence.
- Bound fields to the existing mark limits:
  - `label` max `120`
  - `description` max `280`
- Block duplicate mark labels within the same chronicle after trim normalization.
- Duplicate blocking is exact-label matching after trim normalization, consistent with prompt-created Skills and Resources.

### Data Contract

- Add an optional `newMark` object to `PromptResolutionPayload`.
- Keep `traitMutations.marks` limited to mutations on existing marks.
- The new object contains:
  - `label: string`
  - `description: string`
  - `isConcealed: boolean`
- In the validation schema, `newMark` is optional, but when present all fields are required and text fields are trimmed and bounded.

### Backend Behavior

- Add a `create_prompt_mark(target_chronicle_id uuid, new_mark jsonb)` helper in a new Supabase migration.
- Extend `resolve_prompt_run` with a `new_mark jsonb default null` parameter.
- Create the mark inside the same database transaction as prompt resolution.
- If validation or duplicate-label checks fail, reject the entire prompt resolution and persist nothing from that submission.
- Assign the new mark the next chronicle-scoped `sort_order`.
- Persist `is_concealed` from the submitted payload and leave `is_active` at its default active state.

### Error Handling

- Treat incomplete mark fields as form-level validation near the mark composer.
- Render duplicate-label feedback near the new-mark inputs when the client can detect it.
- Normalize server duplicate errors into calm copy: `That mark name is already in the chronicle. Choose different wording.`
- Preserve local draft content for prompt text, prompt-created skill inputs, prompt-created resource inputs, and prompt-created mark inputs when submission fails.

### Testing Strategy

- Add schema tests for optional `newMark` validation, trimming, missing fields, and length limits.
- Add resolver tests proving `new_mark` reaches the RPC payload and duplicate errors are normalized.
- Add migration guard tests for the new helper, new function signature, duplicate rejection, and next sort order.
- Add in-memory archive rules tests proving prompt-created marks are created transactionally, sorted after existing marks, trimmed, and duplicate/blank cases reject the full resolution.
- Add play-surface tests covering reveal behavior, required field validation, duplicate blocking, draft persistence, clearing behavior, and request payload shape.
- Add a play-page regression ensuring existing mark labels are loaded for duplicate detection.

## Out of Scope

- Prompt parsing or automatic mark suggestions.
- Prompt-created Characters.
- Generic prompt-created trait abstraction.
- Existing mark mutation UI in active play.
- Skill/resource substitution and game-over rules.

## Why This Design

Prompt-created Marks are the same kind of rule gap as prompt-created Skills and Resources: the source rules ask the player to change the vampire during prompt resolution, and the product should make that change durable in the same moment. The selected design keeps one prompt outcome inside one transaction, follows the codebase's current explicit-composer pattern, and moves the audit one step closer to covering prompt-created trait changes without widening scope into a broader rules engine.
