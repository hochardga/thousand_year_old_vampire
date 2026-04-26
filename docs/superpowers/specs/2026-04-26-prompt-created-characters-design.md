# Prompt-Created Characters Design

**Date:** 2026-04-26
**Status:** Approved

## Context

The rules coverage audit still identifies in-play character creation as a missing feature. Skills, Resources, and Marks can now be created from the active prompt surface, but prompts that introduce or require a new Character still send the player into off-script bookkeeping.

This gap is especially visible because Characters are the game's most relational trait family. A new mortal witness, victim, descendant, rival, or immortal patron can change the emotional center of a chronicle more than another object or capability. The app already stores Characters, distinguishes mortal and immortal kinds, and exposes ledger editing, but active play has no first-party creation path.

## Goal

Support prompt-created Characters during play without prompt parsing, ledger detours, or multi-step writes that can leave the prompt answer and character state out of sync.

## Decision

Add an optional Character creation path directly to the play surface and persist it through the same prompt-resolution transaction that records the prompt run, player entry, experience text, memory decision, existing trait mutations, and optional prompt-created Skills, Resources, and Marks.

The player still interprets prompt text manually. This slice does not infer when a prompt requires a new Character.

## Approaches Considered

### 1. Extend prompt resolution with an optional `newCharacter` object

This is the selected approach. The play form gains an optional reveal for creating a Character from the current prompt, the request payload carries that Character alongside the rest of the prompt answer, and the backend creates it inside the authoritative prompt-resolution transaction.

This follows the shipped prompt-created trait pattern and keeps one prompt outcome inside one durable write.

### 2. Add a separate create-character route from the play page

This would be quick, but it would split one rules event into multiple writes. The prompt could resolve without the Character, or the Character could be created while prompt resolution fails.

### 3. Expand setup fidelity first

Book-faithful setup is an important audit gap, but it changes the first-session ritual and onboarding burden. Prompt-created Characters is a smaller slice with a high player payoff because it enriches active play immediately.

## Approved Design

### Player Experience

- Add an optional reveal inside the play form labeled `Add a character from this prompt`.
- Keep it collapsed by default.
- When opened, show:
  - `Character name`
  - `Who they are`
  - kind selection between `Mortal` and `Immortal`
- Default kind to `Mortal`, since the source rules most often ask for mortals during play and existing setup already creates the maker immortal.
- Keep the control near the existing prompt-created trait composers.
- Preserve character draft fields when validation or submission fails.

### Validation Rules

- If the reveal is closed, no Character creation validation runs.
- If the reveal is open, name and description are required.
- Trim leading and trailing whitespace before validation and persistence.
- Bound fields to the existing setup-era limits:
  - `name` max `120`
  - `description` max `280`
- Allow only `mortal` or `immortal` for kind.
- Block duplicate Character names within the same chronicle after trim normalization.

### Data Contract

- Add an optional `newCharacter` object to `PromptResolutionPayload`.
- Keep `traitMutations.characters` limited to changes on existing Characters.
- The new object contains:
  - `name: string`
  - `description: string`
  - `kind: "mortal" | "immortal"`
- In the validation schema, `newCharacter` is optional, but when present all fields are required and text fields are trimmed and bounded.

### Backend Behavior

- Add a `create_prompt_character(target_chronicle_id uuid, new_character jsonb)` helper in a new Supabase migration.
- Extend `resolve_prompt_run` with a `new_character jsonb default null` parameter.
- Create the Character inside the same database transaction as prompt resolution.
- If validation or duplicate-name checks fail, reject the entire prompt resolution and persist nothing from that submission.
- Assign the new Character the next chronicle-scoped `sort_order`.
- Persist `character_kind` from the submitted payload and leave status at the default active state.

### Error Handling

- Treat incomplete Character fields as form validation near the Character composer.
- Render duplicate-name feedback near the new Character inputs when the client can detect it.
- Normalize server duplicate errors into calm copy: `That character name is already in the chronicle. Choose different wording.`
- Preserve local draft content for prompt text, prompt-created trait inputs, and memory placement when submission fails.

### Testing Strategy

- Add schema tests for optional `newCharacter` validation, trimming, missing fields, invalid kind, and length limits.
- Add resolver tests proving `new_character` reaches the RPC payload and duplicate errors are normalized.
- Add migration guard tests for the new helper, new function signature, duplicate rejection, and next sort order.
- Add archive rules tests proving prompt-created Characters are created transactionally, sorted after existing Characters, trimmed, and duplicate/blank cases reject the full resolution.
- Add play-surface tests covering reveal behavior, required field validation, duplicate blocking, draft persistence, clearing behavior, kind selection, and request payload shape.
- Add a play-page regression ensuring existing Character names are loaded for duplicate detection.
- Include browser UAT for a player resolving a prompt with a newly created Character and confirming the Character appears in the ledger/archive surface.

## Out of Scope

- Prompt parsing or automatic Character suggestions.
- Existing Character mutation UI in active play.
- Mortal age-out reminders.
- Book-faithful setup expansion.
- Skill/resource substitution and game-over rules.
- Generic prompt-created trait abstraction.

## Why This Design

Prompt-created Characters are the most engaging next audit gap because they turn a prompt outcome into a durable relationship at the moment the player writes it. The design follows the app's current explicit-composer pattern, keeps prompt resolution transactional, and completes the set of first-party prompt-created trait flows without widening scope into a broader rules engine.
