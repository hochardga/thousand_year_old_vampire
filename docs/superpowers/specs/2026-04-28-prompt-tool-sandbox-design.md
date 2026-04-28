# Prompt Tool Sandbox Design

## Context

`docs/thousand-year-old-vampire-rules-coverage-audit.md` repeatedly notes that the app does not parse prompt text into every required mechanical action. A context pass confirmed that this is the right boundary to preserve for now. Some prompt text is simple, such as "Check a Skill" or "Lose a Resource", but many prompts include branches, counts, conditions, optional effects, unsupported Memory changes, Character conversions, Diary changes, and explicit game-end instructions. A partial parser would be brittle and could imply more rules coverage than the product actually provides.

The current play surface already has useful prompt-resolution tools: create a Skill, Resource, Character, or Mark; declare and resolve Skill/Resource checks and losses; and apply legal Skill/Resource substitutions when the chosen requirement cannot be met directly. The product should lean into those tools as a player-directed sandbox instead of trying to infer intent from prompt prose.

## Goals

- Make prompt-resolution tools consistently available so the player can handle prompt text according to their reading.
- Stop treating Prompt 1 and Prompt 4 as enforced special cases in the play UI.
- Keep the prompt text as the source of truth and the player as interpreter.
- Preserve rule validation for the action the player explicitly chooses, especially Skill/Resource legality and substitution.
- Update the audit language so it reflects the sandbox model rather than promising future automatic parsing.

## Non-Goals

- Do not build a full prompt parser.
- Do not hand-author metadata for the entire prompt catalog.
- Do not infer prompt-required actions from text at runtime.
- Do not implement currently unsupported effects such as Memory restoration, Memory merging, Diary loss cascades, Character conversion flows, or prompt-driven explicit game-over handling.
- Do not remove backend validation for submitted trait mutations.

## Approach

Use an always-available, non-enforcing prompt tool sandbox. The play surface should keep all existing prompt tools available during normal resolution:

- add a Skill from the prompt,
- add a Resource from the prompt,
- add a Character from the prompt,
- add a Mark from the prompt,
- declare a Skill check, Skill loss, or Resource loss,
- use the existing no-legal-Skill/Resource end-state flow when the player has declared that kind of required action and no legal target or substitution remains.

The app should not automatically open, prefill, or require tools based on the current prompt position. Prompt 1 should no longer force the `Bloodthirsty` skill composer, and Prompt 4 should no longer force a stationary Resource composer. The prompt requirement callout that depends on prompt-position metadata should be removed from active play.

## Data Flow

No schema changes are required. The prompt catalog continues to provide prompt text only. Remove `getPromptEffectByPosition` from the active play path, and delete the helper if no other call sites remain.

The play page passes chronicle state, existing traits, Skills, Resources, Memories, and active Diary summary to `PlaySurface`. `PlaySurface` owns which optional tools the player opens and submits.

Prompt-created trait payloads remain optional:

- `newSkill`
- `newResource`
- `newCharacter`
- `newMark`

Skill/Resource rule payloads remain optional:

- `skillResourceChange`
- generated low-level `traitMutations`

The player only submits data for tools they chose to use. Existing prompt resolution keeps writing the prompt run, player entry, Experience, Memory decision, rolls, movement, and submitted trait side effects transactionally.

## Components

`PlaySurface` becomes the main sandbox container. It should stop accepting prompt-position effect metadata and stop deriving required tool state from it. Tool panels remain optional and user-controlled.

`PromptSkillComposer`, `PromptResourceComposer`, `PromptCharacterComposer`, and `PromptMarkComposer` remain focused panels for adding one prompt-created trait each. They should continue validating label/name and description only when open.

`SkillResourceChangePanel` remains the rules-aware mutation tool. It should still begin at "No Skill or Resource change" and only validate once the player selects a required action. Its legal-target and substitution logic remains authoritative for that selected action.

`PromptCard` stays unchanged: it displays the prompt without trying to annotate parsed requirements.

## Error Handling

Optional tools should not block submission unless the player opens or selects them. Once selected, each tool keeps its current validation:

- created traits need required text fields and unique labels/names,
- selected Skill/Resource requirements need a legal target,
- substitutions need worst-outcome narration,
- no-legal-action Skill/Resource states route through the existing chronicle-end flow.

Server-side validation continues to reject stale or impossible mutation payloads. This protects data integrity without pretending the app understood the prompt text.

## Testing

Update integration coverage around the play surface:

- Prompt 1 no longer automatically opens or requires the `Bloodthirsty` skill composer.
- Prompt 4 no longer automatically opens or requires the stationary Resource composer.
- The player can still manually open Skill and Resource composers and submit valid prompt-created traits.
- The Skill/Resource panel still defaults to no change and still validates legal selected actions and substitutions.
- Existing tests for prompt-created Character and Mark flows continue to pass.

Update any tests that asserted required Prompt 1/Prompt 4 metadata behavior so they assert sandbox availability instead.

## Documentation

Revise `docs/thousand-year-old-vampire-rules-coverage-audit.md` to say the app deliberately provides a manual prompt tool sandbox rather than parsing prompt text automatically. Rows for prompt-created traits and Skill/Resource substitution should remain partial where the app can represent and validate player-selected outcomes, but they should no longer frame automatic parsing as the next expected implementation step.
