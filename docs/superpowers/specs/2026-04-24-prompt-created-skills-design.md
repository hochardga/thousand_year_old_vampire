# Prompt-Created Skills Design

**Date:** 2026-04-24  
**Status:** Approved

## Context

The rules audit identified a clear gap in the active play loop: prompts can tell the player to create a new Skill during play, but the current product only supports mutating existing skills by `id`. The play surface submits empty `traitMutations.skills`, the prompt-resolution schema only accepts update-style skill mutations, and the ledger route only exposes item-level `PATCH` for existing skills.

This leaves an important part of the source rules unsupported even though the product already has the right broad shape for solving it. Prompt resolution is already the authoritative, transactional place where the app records a prompt answer, applies memory consequences, and persists trait changes.

## Goal

Support the base game rule that a prompt can create a new Skill during play without introducing prompt parsing, ledger detours, or multi-step saves that break the ritual flow of resolving a prompt.

## Decision

Add an optional skill-creation path directly to the play surface and persist it through the same prompt-resolution transaction that already records the prompt run, player entry, experience text, memory decision, and existing trait mutations.

The player remains responsible for interpreting the prompt. The app does not attempt to parse prompt text into structured actions in this slice.

## Approaches Considered

### 1. Extend prompt resolution with an optional `newSkill` object

This is the selected approach. The play form gains an optional reveal for creating a skill from the current prompt, the request payload carries that new skill alongside the rest of the prompt answer, and the backend creates the skill inside the same authoritative resolution flow.

This fits the current architecture, preserves the feeling of one ritual action producing one durable result, and avoids partial success states.

### 2. Add a separate create-skill save path from the play page

This would likely require less SQL change at first, but it splits one game event into multiple writes. That creates awkward failure modes where a skill could be created even if prompt resolution fails, or where the prompt resolves but the skill does not get created.

### 3. Send the player to the ledger to create skills manually

This would reuse existing ledger surfaces, but it breaks the active play ritual, forces navigation away from the prompt, and makes a core rules action feel bolted on instead of native to prompt resolution.

## Approved Design

### Player Experience

- Add an optional reveal inside the play form labeled in plain language, such as `Add a skill from this prompt`.
- Keep the reveal collapsed by default so prompts that do not create a skill feel exactly as they do today.
- When opened, show two fields:
  - `Skill name`
  - `Why this skill now`
- Require both fields when the reveal is open.
- Keep the control on the play surface rather than routing the player to the ledger.
- Preserve draft text when validation fails so the player does not lose writing momentum.

### Validation Rules

- If the skill-creation reveal is closed, no skill-creation validation runs.
- If the reveal is open, both fields are required.
- Trim leading and trailing whitespace before validation and persistence.
- Block duplicate skill labels within the same chronicle after trim normalization.
- Duplicate blocking in this slice is exact-label matching after trim normalization; case-only variants are not treated as duplicates unless a broader repository convention later requires that change.
- When a duplicate is blocked, ask the player to choose different wording rather than silently merging or allowing a second entry.

### Data Contract

- Add an optional `newSkill` object to `PromptResolutionPayload`.
- Keep `traitMutations.skills` limited to operations on existing skills.
- The new object should contain:
  - `label: string`
  - `description: string`
- In the validation schema, `newSkill` is optional, but when present both fields are required, trimmed, and bounded to the existing setup-era skill limits: `label` max `120` and `description` max `280`.

This separation keeps creation and mutation conceptually clean and avoids overloading the existing mutation array with mixed responsibilities.

### Backend Behavior

- Extend the prompt-resolution schema and route to accept the optional `newSkill` object.
- Pass the object through `resolvePrompt()` into the prompt-resolution RPC.
- Create the skill inside the same database transaction that resolves the prompt.
- If the new skill fails validation or uniqueness checks, reject the entire prompt resolution so no partial outcome is written.
- Assign the new skill a chronicle-scoped `sort_order` that places it after existing skills, matching the ledger's current ordered presentation.

### Transaction Boundaries

Prompt resolution remains the single authoritative write path for this rule. A successful submission should durably produce all of the following together:

- the prompt run
- the player entry
- the experience text
- the memory decision outcome
- any existing trait mutations
- the newly created skill, if requested

If any one of those pieces fails, none of them should persist.

### Error Handling

- Treat incomplete skill fields as ordinary form validation errors on the play surface.
- Render duplicate-label feedback near the new-skill inputs instead of as a generic page-level failure when the client can detect it early.
- If the server rejects the request after client-side validation passed, return calm, specific copy for the duplicate case rather than collapsing to `The prompt could not be resolved.`
- Preserve local draft content for `playerEntry`, `experienceText`, and the new skill inputs when submission fails.

### Testing Strategy

- Add schema tests for the optional `newSkill` payload shape.
- Add validation coverage for required fields when the reveal is used.
- Add route or resolver tests proving a successful prompt resolution creates the skill.
- Add route or resolver tests proving duplicate labels reject the full prompt resolution and do not create the skill.
- Add play-surface tests covering:
  - reveal hidden by default
  - reveal opens on demand
  - required field validation
  - duplicate-label blocking
  - request payload includes `newSkill` only when the reveal is used
- Add a ledger-visibility regression asserting the newly created skill appears where the chronicle already lists skills after prompt resolution.

## Out of Scope

- Prompt parsing or structured prompt-action metadata
- Automatic suggestions or prefilled skill text from prompt content
- Prompt-created Resources, Characters, or Marks
- Reworking setup to share the same UI unless that falls out naturally as a very small refactor
- Skill and Resource substitution rules
- End-game rules tied to missing Skills or Resources

## Why This Design

This design solves the missing rules coverage with the smallest change that still feels native to the product. It lets the player stay inside the writing ritual, keeps the backend authoritative, and preserves the app's existing pattern of treating prompt resolution as one transactional event instead of a chain of loosely related saves.

Just as importantly, it does not pretend to solve prompt parsing before the product is ready for it. The player still interprets the prompt, but the app now gives them a first-party way to record the resulting skill at the right moment in play.
