# Thousand Year Old Vampire: Digital Adaptation Design

**Date:** 2026-04-19  
**Status:** Approved  
**Founder:** Gerg

## Context

This project is a digital adaptation of *Thousand Year Old Vampire*, a solitary gothic journaling game about memory loss, identity erosion, reinvention, and centuries of accumulated experience. The product goal is not to generalize the game into a narrative engine or flatten it into a convenience app. The goal is to preserve the literary, lonely, ritualistic character of the original while removing the analog friction that stops many digital-native players before the experience becomes emotionally alive.

The target audience is not only existing fans of the tabletop game. The primary user is a reflective player who is drawn to intimate narrative play but bounces off handwriting, manual bookkeeping, or rules overhead. The digital product therefore succeeds when it gets the player into the fiction quickly and keeps them there, not when it exposes every mechanic as a visible system.

## Product Direction

Three approaches were considered:

1. **Faithful Ritual Adaptation** — a guided digital edition of the original play loop with strong atmosphere, automatic state handling, and a living archive.
2. **Accessibility-First Onramp** — a lighter, tutorialized entry product focused mainly on lowering the first-session barrier.
3. **Living Chronicle Product** — an archive-centric interpretation where long-term record-keeping becomes the dominant feature.

The selected direction is **Faithful Ritual Adaptation**, with enough archive depth in the MVP that the chronicle already feels special instead of merely functional. This gives the product the clearest scope, the strongest alignment with the source material, and the best chance of becoming a proud first released creative work rather than an overbuilt prototype.

## Product Principles

- **Automation handles scaffolding, not authorship.** The app should never write the player's story for them. It should frame, preserve, and structure their writing.
- **Fast entry into fiction matters more than feature breadth.** The product's magic moment is getting a new player to feel they are already inside a vampire's life before the rules feel heavy.
- **The archive is part of the experience, not an admin surface.** Memories, losses, diary entries, and chronology should feel like artifacts.
- **The UI should guide legal moves rather than expose raw rules machinery.** Constraint should feel ritualistic, not procedural.

## Experience Architecture

The application is organized around three layers:

### 1. Ritual Layer

The active play surface: setup, becoming undead, prompt presentation, writing, dice resolution, and immediate consequences. This layer should feel focused, intimate, and low-noise.

### 2. Archive Layer

The long-lived chronicle: memories, diary entries, characters, resources, skills, marks, and timeline history. This should read as a personal ledger rather than a dashboard, even though it rests on structured data underneath.

### 3. Return Layer

The continuity system: resumable sessions, recaps, and re-immersion after days or weeks away. This layer exists so interrupted real life does not break the emotional thread of the chronicle.

## MVP Scope

The MVP includes:

- Guided setup and becoming-undead flow
- Prompt-by-prompt play with writing input
- Dice and movement handling
- Automatic tracking for memories, skills, resources, characters, and marks
- Diary support
- Session recaps and resumable chronicle state
- Rereadable archive views

The MVP excludes:

- Multiplayer or social features
- AI-authored writing assistance
- Community discovery and sharing systems
- Content-authoring tools for new prompt sets
- Native mobile or desktop shells
- Monetization systems
- Gamified reward mechanics

## Core Screen Set

- Landing / resume chronicle
- Guided setup / becoming-undead flow
- Active prompt screen
- Memory / archive view
- Character and trait ledger
- Session close / recap view

The screen set is intentionally small. The product should feel authored and coherent, not wide.

## State Model

The durable state model should remain explicit even if the interface stays atmospheric:

- `Chronicle`
- `PromptPosition`
- `Experiences`
- `Memories` with slot capacity and forgotten state
- `Diary`
- `Skills`
- `Resources`
- `Characters`
- `Marks`
- `SessionSnapshots`
- `ArchiveEvents`

This split is essential: the player experiences writing and remembering; the system manages durable structured state.

## Interaction and Tone

The product voice is a **gentle ritual guide**. It should be calm, intimate, and emotionally serious. It should not sound like a task manager, game launcher, or tutorial robot. Copy should support the fiction without obscuring clarity.

Key interaction rules:

- Keep the player in one emotional lane at a time. During active play, avoid surfacing excessive ledger detail.
- Make state changes felt, not merely shown. Forgetting a memory or creating a diary should read as a meaningful event.
- Design for interrupted play. Returning players need recap and context, not just raw state restoration.
- Prefer guided choices over visible rules widgets. If the game requires a legal transition, guide it in place.

## Edge Cases

- Blank or underwritten entries should prompt gently rather than fail abruptly.
- Memory overflow must be handled in-context through forgetting or diary placement, not by forcing the player to hunt through the archive.
- Returning after a long gap should trigger recap-first re-entry.
- Mobile layouts must protect the writing surface instead of compressing the archive into tiny controls.

## Testing Strategy

The build should verify:

- A new user can create an account, start a chronicle, complete setup, and resolve the first prompt
- Memory overflow and diary rules behave correctly
- A player can stop and resume across sessions without losing current state
- Responsive layouts preserve readability and touch targets on mobile
- Tone-critical copy and archive presentation remain intact after implementation changes

## Open Questions

- What is the legal/licensing posture of the adaptation: official, licensed, or private prototype? This affects prompt distribution, launch scope, and GTM tactics.
- Should the first release require authentication before the first writing moment, or should it allow a short local draft before sign-in?
- How much of the original prompt text should be visible at once on small screens without collapsing the mood into a card stack?
