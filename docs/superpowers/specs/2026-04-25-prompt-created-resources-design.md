# Prompt-Created Resources Design

**Date:** 2026-04-25  
**Status:** Approved

## Context

The rules audit still identifies a closely related gap next to the newly shipped prompt-created skill flow: prompts can also tell the player to create a new Resource during play, but the active play loop cannot do that yet.

Today, the play surface only sends `traitMutations.resources` for existing resources by `id`, the prompt-resolution schema has no creation payload for resources, and the only first-party resource route is an item-level `PATCH` route in the ledger. That means a common source-text outcome like "Create a stationary Resource which shelters you" still requires off-script bookkeeping.

The product now has a strong precedent for solving this class of rule. Prompt-created skills already use an optional, collapsed-by-default play-surface composer, a separate payload shape from ordinary trait mutations, and a transactional backend write inside prompt resolution.

## Goal

Support the base game rule that prompts can create new Resources during play, including stationary resources, without introducing prompt parsing, ledger detours, or multi-step saves that break the ritual flow of resolving a prompt.

## Decision

Add an optional resource-creation path directly to the play surface and persist it through the same prompt-resolution transaction that already records the prompt run, player entry, experience text, memory decision, existing trait mutations, and optional prompt-created skill.

The player still interprets the prompt manually. This slice does not attempt to parse prompt text or infer when a resource should be created.

## Approaches Considered

### 1. Extend prompt resolution with an optional `newResource` object

This is the selected approach. The play form gains an optional reveal for creating a resource from the current prompt, the request payload carries that new resource alongside the rest of the prompt answer, and the backend creates the resource inside the same authoritative resolution flow.

This matches the new skill pattern, preserves one-prompt-one-transaction ritual integrity, and covers both ordinary and stationary resources without creating partial success states.

### 2. Add a separate create-resource save path from the play page

This would reuse more existing ledger concepts, but it would split one rules event into multiple writes. That creates awkward failure cases where the prompt resolves without the resource, or the resource is created even though prompt resolution fails.

### 3. Jump straight to a generic "create any trait" prompt composer

This could reduce repetition later, but it would expand scope sharply before the second trait-creation pattern is proven. It would also force us to solve divergent field sets for resources, characters, and marks in one pass when the current product already has a simpler, lower-risk pattern to extend.

## Approved Design

### Player Experience

- Add an optional reveal inside the play form labeled in plain language, such as `Add a resource from this prompt`.
- Keep the reveal collapsed by default so prompts that do not create resources feel unchanged.
- When opened, show three fields:
  - `Resource name`
  - `Why it matters`
  - `Stationary`
- Use a single checkbox or toggle for the stationary flag, phrased in the same reading-first voice as the rest of the ritual surface.
- Keep the control on the play surface rather than sending the player to the ledger.
- Preserve draft text and stationary selection when validation or submission fails so the player does not lose momentum.

### Validation Rules

- If the resource-creation reveal is closed, no resource-creation validation runs.
- If the reveal is open, both text fields are required.
- Trim leading and trailing whitespace before validation and persistence.
- Bound the new resource to the same setup-era limits already used elsewhere:
  - `label` max `120`
  - `description` max `280`
- Block duplicate resource labels within the same chronicle after trim normalization.
- Duplicate blocking in this slice is exact-label matching after trim normalization. Case-only variants are not treated as duplicates unless the broader repository standard changes later.
- When a duplicate is blocked, ask the player to choose different wording rather than silently merging or creating a second entry.

### Data Contract

- Add an optional `newResource` object to `PromptResolutionPayload`.
- Keep `traitMutations.resources` limited to mutations on existing resources.
- The new object should contain:
  - `label: string`
  - `description: string`
  - `isStationary: boolean`
- In the validation schema, `newResource` is optional, but when present all fields are required and the text fields are trimmed and bounded to the same limits used at setup.

This keeps creation and mutation conceptually separate and prevents the existing mutation array from becoming a mixed bag of unrelated operations.

### Backend Behavior

- Extend the prompt-resolution schema, route, and resolver to accept the optional `newResource` object.
- Pass the object through `resolvePrompt()` into the prompt-resolution RPC.
- Create the resource inside the same database transaction that resolves the prompt.
- If the new resource fails validation or uniqueness checks, reject the entire prompt resolution so no partial outcome is written.
- Assign the new resource a chronicle-scoped `sort_order` that places it after existing resources, matching the ledger's current ordered presentation.
- Persist the `is_stationary` field directly from the submitted payload so prompts like "Create a stationary Resource which shelters you" can be represented without extra interpretation.

### Transaction Boundaries

Prompt resolution remains the single authoritative write path for this rule. A successful submission should durably produce all of the following together:

- the prompt run
- the player entry
- the experience text
- the memory decision outcome
- any existing trait mutations
- the newly created skill, if requested
- the newly created resource, if requested

If any one of those pieces fails, none of them should persist.

### Error Handling

- Treat incomplete resource fields as ordinary form validation errors on the play surface.
- Render duplicate-label feedback near the new-resource inputs instead of only as a page-level failure when the client can detect it early.
- If the server rejects the request after client-side validation passed, return calm, resource-specific duplicate copy rather than collapsing to `The prompt could not be resolved.`
- Preserve local draft content for `playerEntry`, `experienceText`, prompt-created skill inputs, and prompt-created resource inputs when submission fails.

### Testing Strategy

- Add schema tests for the optional `newResource` payload shape.
- Add validation coverage for required fields and stationary flag handling when the reveal is used.
- Add resolver tests proving a successful prompt resolution passes the new resource into the RPC.
- Add route or e2e-backed prompt-resolution tests proving a successful prompt resolution creates the resource at the next sort order.
- Add route or e2e-backed tests proving duplicate labels reject the full prompt resolution and do not create the resource.
- Add play-surface tests covering:
  - reveal hidden by default
  - reveal opens on demand
  - required field validation
  - stationary toggle persistence
  - duplicate-label blocking
  - request payload includes `newResource` only when the reveal is used
- Add a play-page regression asserting chronicle resource labels are loaded for duplicate checking.
- Add a ledger-visibility regression asserting the newly created resource appears in the chronicle after prompt resolution.

## Out of Scope

- Prompt parsing or structured prompt-action metadata
- Automatic suggestions or prefilled resource text from prompt content
- Prompt-created Characters or Marks
- Resource-loss substitution rules and game-over handling
- Reworking setup to share the same UI unless a small extraction falls out naturally
- A full generic "create any trait" prompt-composer abstraction

## Why This Design

This solves a real rules gap with the same product shape that now works for prompt-created skills. It keeps the player inside the prompt ritual, treats prompt resolution as the authoritative transaction boundary, and supports stationary resources without asking the user to leave the play surface or keep separate mental bookkeeping.

Just as importantly, it stays disciplined about scope. The app still does not parse prompt text, but it now gives the player a first-party way to capture a prompt-created resource at the moment the story creates it.
