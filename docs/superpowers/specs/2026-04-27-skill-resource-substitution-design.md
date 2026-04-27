# Skill and Resource Substitution Rules Design

## Context

Section 12 of `docs/thousand-year-old-vampire-rules-coverage-audit.md` identifies a missing rules loop: when a prompt requires a Skill or Resource change, the app currently has no first-party way to check or lose an existing Skill or Resource, no substitution guidance, and no game-ending guard when no legal Skill/Resource change remains.

The current backend already accepts `traitMutations` during prompt resolution and can mark Skills as `checked` or `lost` and Resources as `lost`. The play surface, however, always submits empty mutation arrays. This design exposes that capability through a focused rules panel and adds shared legality checks so the selected action is enforceable rather than merely descriptive.

## Goals

- Let a player satisfy prompt instructions to check a Skill, lose a Skill, or lose a Resource during prompt resolution.
- Apply the book's Skill/Resource substitution rules when the primary action is unavailable.
- Keep substitution limited to Skills and Resources.
- Prompt the player to narrate the worst possible outcome when a substitution occurs.
- Surface a clear game-ending state when no legal Skill/Resource action remains.
- Update the coverage audit after implementation and UAT.

## Non-Goals

- Do not parse every prompt into structured effect metadata in this pass.
- Do not implement Character, Mark, Memory, Diary, or prompt-specific exception automation beyond the Skill/Resource substitution loop.
- Do not add a full game-over route unless needed to represent the no-legal-action state cleanly in the existing play flow.

## Approach

Add a `skillResourceChange` selection to the play form, separate from freeform prompt text and existing new-trait composers. The player chooses the action the current prompt requires:

- Check a Skill.
- Lose a Skill.
- Lose a Resource.

The panel lists only legal targets for the current chronicle state. Unchecked active Skills are available for checking. Active or checked Skills are available for losing. Active Resources are available for losing. If the selected primary action has no legal target, the panel offers the book's legal substitution:

- A required Skill check can substitute by losing an available Resource.
- A required Resource loss can substitute by checking an available unchecked Skill.

Skill loss does not substitute to Resource loss; if no Skill can be lost, the game-ending state is reached. Substitution never offers Characters, Marks, Memories, or Diaries.

## Data Flow

The play page loads Skill and Resource records with `id`, `label`, `description`, `status`, `is_stationary`, and `sort_order`, not just labels.

The client derives a validated `skillResourceChange` object:

- `requiredAction`: `check-skill`, `lose-skill`, or `lose-resource`
- `resolutionAction`: `check-skill`, `lose-skill`, or `lose-resource`
- `targetId`: selected Skill or Resource id
- `isSubstitution`: boolean
- `worstOutcomeNarration`: required text when `isSubstitution` is true

The existing `traitMutations` payload remains the low-level RPC bridge. The client converts a valid `skillResourceChange` into the corresponding Skill or Resource mutation, and shared validation rejects malformed or cross-family substitutions before calling the RPC.

## Error Handling

- If a player chooses an action but no legal primary or substitute target exists, show a no-legal-action panel that explains the chronicle has reached the Skill/Resource end condition.
- If a substitution is selected without worst-outcome narration, block submit with inline copy.
- If stale state makes a selected target invalid by submit time, return a calm route error and leave the draft intact.
- Backend validation rejects impossible combinations such as losing a Resource to satisfy a Skill loss, checking a Resource, or substituting with non-Skill/Resource traits.

## Testing

- Unit test the Skill/Resource rule derivation and payload conversion.
- Integration test validation for legal primary actions, legal substitutions, required substitution narration, and illegal cross-family substitutions.
- Integration test that `resolvePrompt` forwards the converted trait mutation payload.
- UAT with realistic play states:
  - Unchecked Skill available, check Skill.
  - No unchecked Skill, Resource available, substitute by losing Resource.
  - Resource unavailable, unchecked Skill available, substitute by checking Skill.
  - No legal Skill/Resource action, end-state message.
  - Existing prompt-created trait controls still work.

## Documentation

After implementation and UAT, update section 12 of the coverage audit to reflect the new enforced player-declared substitution flow and the remaining limitation that prompt text is not fully parsed into structured requirements.
