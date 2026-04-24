# First-Session Guidance and Safety Design

**Date:** 2026-04-23  
**Status:** Approved  
**Topic:** First-session guidance, safety framing, and lightweight rules support

## Goal

Ship a review-ready design in which first-time players can start *Thousand Year Old Vampire: Digital Edition* with more confidence, more first-party guidance, and a clearer sense of emotional safety without turning the product into a handbook or flattening the ritual tone.

The primary outcome is not rules completeness in the abstract. It is a calmer, better-supported first session.

## Chosen Approach

Three approaches were considered:

1. **Pure inline teaching** - keep all new guidance inside setup steps and add a brief safety note before play
2. **Inline-first ritual plus small reference** - teach the game lightly inside setup, add a deliberate safety checkpoint before Prompt 1, and keep a compact later reorientation surface in play
3. **Guided manual inside the app** - add a dedicated before-you-begin rules page plus lighter inline setup copy

The selected approach is **inline-first ritual plus small reference**.

It best matches the product vision and the current implementation. It keeps the first session focused on becoming undead rather than studying the game, while still giving players more explicit support than the current product provides.

## Product Constraints

This design assumes the following constraints remain true:

- the product should help players start without requiring an external rules reference
- the product should remain a guided digital ritual, not a PDF wrapper or rules encyclopedia
- setup should openly teach a little of the underlying rules as it goes
- safety framing should feel deliberate and humane, not hidden in fine print and not written like legal copy
- the play surface should stay focused on prompt, writing, and consequence rather than expanding into a large help center
- this pass should improve the audit item around safety and appendix material without attempting to reproduce the book's appendices inside the app

## Architecture

This feature should remain a presentation-and-flow enhancement layered on top of the current route structure rather than a new subsystem.

- `src/components/ritual/SetupStepper.tsx` remains the primary first-session teaching surface
- the setup flow gains one new deliberate safety checkpoint before redirecting into play
- `src/app/(app)/chronicles/[chronicleId]/play/page.tsx` keeps its current structure and gains one compact rules-orientation support surface in the secondary column
- no new persistence model, prompt metadata model, or content management system is required for this pass

The main structural decision is to keep the safety checkpoint inside the existing setup flow rather than introducing a standalone route. This preserves the current ritual arc, keeps local draft behavior simple, and avoids adding another detour before the first prompt.

## Components and Flow

### First-Session Sequence

The recommended first-session sequence is:

1. The life you had before
2. What you can still carry
3. Who stood beside you
4. What the night left on you
5. First memory fragments
6. A dedicated safety checkpoint before Prompt 1
7. Prompt 1

This keeps setup as the main teaching surface. The player learns the game in the same order they are asked to create their chronicle, and the first explicit safety moment lands at the threshold between setup and active play.

### Setup Teaching Pattern

Each setup step should gain one small structured teaching block.

Each block should include:

- a short label such as `How this works`
- one or two sentences of plain-language explanation
- optional field-level helper text only where the player benefits from a concrete nudge

The copy pattern should be:

1. ritual-facing step heading
2. short atmospheric setup copy
3. compact rules-purpose explanation
4. field group

The helper block should explain why the player is being asked for this material, not restate the entire rules text. Examples:

- skills and resources are part of the living record and should feel defining rather than exhaustive
- characters matter both mechanically and emotionally, so early relationships should be chosen with care
- memories are built from experiences, and setup is establishing the first fragments the chronicle will carry forward

### Safety Checkpoint

The safety checkpoint should be a full threshold inside setup, not a dismissible banner or inline footnote.

It should communicate four things:

1. this is mature, solitary, emotionally difficult material
2. the player can stop here or step away later without penalty
3. the player may reduce detail, pause after hard prompts, or return another night
4. continuing is a deliberate choice

The page should present:

- a headline that treats the material seriously
- a short explanatory paragraph in the product's gentle ritual voice
- a small set of grounding suggestions
- one clear primary action to continue to the first prompt
- one clear secondary action to return or leave the flow

The checkpoint should not require a persisted acknowledgement or create extra account state in this pass.

### Small Later Reference Surface

Once play begins, the main page should remain focused. The product should not fall back to a large rules drawer or help center.

Instead, the play route should expose one compact support panel that answers only the immediate loop questions:

- what belongs in the player entry
- what an experience is
- how memories fill
- what happens when the mind is full

This panel should live in the secondary column alongside the existing memory-state surface rather than replacing the prompt or writing areas.

### Scope Guardrails

This pass should add meaningful first-party support without expanding into broader documentation work.

In scope:

- one helper block per setup step
- one deliberate safety checkpoint before Prompt 1
- one compact later reorientation surface in play

Out of scope:

- a full rules manual
- a dedicated before-you-begin article
- appendix reproduction
- prompt-by-prompt safety classification
- new archive or ledger help systems
- a persisted safety acknowledgement model

## Error Handling

Error handling should follow the existing calm product voice.

- setup validation errors should continue to appear inline inside the current step
- the safety checkpoint should not introduce new blocking logic beyond the existing setup submission path
- if setup submission fails after the safety checkpoint, the player should remain inside the setup flow with the same error treatment already used today
- the compact play guidance surface should never block writing or prompt resolution if its content fails to render; it should fail safe by simply not appearing

## Testing

This design should be verified at three levels:

1. **Component or integration coverage for setup guidance**
   Verify that the guided setup renders the new helper blocks and includes the added safety checkpoint as part of the step sequence.

2. **End-to-end first-session verification**
   Update the first-session flow so it confirms the player reaches the safety checkpoint after the memory step and before the first prompt, then continues successfully into play.

3. **Play-route support verification**
   Verify that the play page shows the compact guidance surface alongside the current memory-state panel without displacing the main writing flow.

## Definition of Done

This design is done when:

- setup teaches a little of the underlying rules as the player moves through each step
- the product includes a deliberate safety checkpoint before Prompt 1
- first-time players can reach the first prompt with more guidance and without leaving the ritual flow
- the play page exposes a compact reorientation surface for the active loop
- the added support remains small, readable, and tone-safe rather than drifting into a handbook
- no new persistence or prompt-rule systems are introduced for this pass
- the work can be implemented within the current setup and play architecture without a route redesign

## Audit Impact

If implemented, this design should change the current audit interpretation for `Materials, Framing, and Core Premise` in two ways:

- the product would offer first-party safety framing rather than relying only on tone and implication
- the product would provide meaningful first-party guidance for beginning play without attempting to reproduce the book's appendix material wholesale

That would move this area away from `Intentionally Unsupported` and toward a narrower but meaningful supported interpretation aligned with the product's digital-edition scope.
