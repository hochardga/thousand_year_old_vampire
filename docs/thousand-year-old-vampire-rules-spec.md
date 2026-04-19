# Thousand Year Old Vampire Rules Specification

## Purpose

This document restates the core rules from [docs/source_material/ThousandYearOldVampire Rules without prompts.md](./source_material/ThousandYearOldVampire%20Rules%20without%20prompts.md) in a spec-oriented format.

Its purpose is to describe the intended game logic and player-facing rules of *Thousand Year Old Vampire* without assuming any particular software architecture, automation level, or enforcement strategy.

This document is limited to the supplied rules text and does not attempt to restate the prompt content or appendix material.

## Interpretation Notes

- `must` indicates a rule stated directly in the source text.
- `may` indicates a player option stated directly in the source text.
- `should` indicates guidance or strong play advice from the source text rather than a hard mechanical requirement.
- Prompt-specific instructions take precedence over the general rules in this document.
- Lost traits should remain legible unless a prompt explicitly says otherwise, because the source text allows them to matter later.

## Core Premise

*Thousand Year Old Vampire* is a solo narrative roleplaying game about chronicling a vampire's existence across centuries, from the loss of mortality to eventual destruction.

The game assumes the vampire:

- preys on human beings for sustenance,
- attempts to camouflage itself among those it feeds upon,
- was once human and retains human needs in some form,
- is vulnerable to dangers that ordinary mortals may ignore, such as sunlight,
- is practically immortal,
- is mostly a loner.

The game is not primarily aimed at stories of dense immortal faction politics. Its core focus is memory, predation, reinvention, loneliness, and decline over time.

## Required Play Materials

Players need:

- one `d10`,
- one `d6`,
- a way to record the vampire's state and story.

If physical dice are unavailable, another randomization method may be used.

## Canonical Game State

The core state of play consists of:

- a vampire record,
- a current position within the prompt list,
- encounter progress for prompts that have been landed on multiple times,
- a chronology of prompt answers,
- optionally, a separate journal if using journaling play.

### Traits

The vampire is represented by five trait families:

1. Memories
2. Skills
3. Resources
4. Characters
5. Marks

Most prompt resolutions modify one or more of these traits.

### Trait Mutation Conventions

The source text uses a small set of state-change conventions across traits:

- checking a Skill means placing a checkmark next to it,
- losing a trait generally means striking it out,
- struck-out traits should remain readable,
- prompts may occasionally impose more dramatic trait changes than a simple check or strikeout.

### Experience

An Experience is a single written statement describing the resolution of a prompt.

An Experience:

- must be written in the first person from the vampire's point of view,
- should be a single evocative sentence,
- does not need to answer every question asked by the prompt,
- should capture both what happened and why it mattered to the vampire,
- must be placed into a Memory immediately when it is created, unless a prompt says otherwise.

An Experience may cover any amount of fictional time, from moments to centuries.

### Memory

A Memory is a container for related Experiences.

A Memory:

- may contain up to 3 Experiences,
- should be linked by a theme, trait, subject, or other intelligible connection,
- does not need to be internally chronological,
- exists either in the vampire's mind or in a Diary.

The vampire may have up to 5 active Memories in mind at once.

If a new Experience clearly belongs in an existing Memory, it may be added there, provided that Memory is not already full.

If a new Experience does not fit an existing Memory, it must begin a new Memory. If all 5 in-mind Memory slots are already occupied, the player must either:

- strike out one existing in-mind Memory to make room, or
- move one existing in-mind Memory into a Diary, if that is possible and desired.

Unless a prompt says otherwise, the player chooses which Memory is forgotten. This is a player decision, not a conscious decision by the vampire.

### Diary

A Diary is a special Resource that preserves Memories outside the vampire's mind.

Diary rules:

- the vampire may have only 1 Diary at a time,
- a Diary must contain at least 1 Memory,
- a Diary may hold up to 4 Memories,
- the player may create a Diary when they need to move a Memory into it,
- creating a Diary also adds that Diary to the Resource list with a short description,
- a Memory stored in a Diary is no longer in the vampire's head,
- once a Memory has been moved into a Diary, no new Experiences may be added to that Memory,
- the vampire accepts the contents of the Diary as truth,
- if the Diary is lost, all Memories stored in it are also lost.

### Skill

A Skill is a capability, tendency, or characteristic of the vampire.

Skill rules:

- Skills should be contextually appropriate to the vampire and the prompt that created them,
- a Skill may be checked at most once,
- a checked Skill represents something the vampire has done and continues to carry as part of their identity,
- if a Skill is lost, it is struck out and no longer affects the vampire.

### Resource

A Resource is an asset, structure, possession, or valued thing that matters mechanically to the vampire.

Resource rules:

- Resources should be contextually appropriate,
- a Resource may be portable or stationary,
- a stationary Resource is still a Resource, but one that cannot simply be carried away,
- if a Resource is lost, it is struck out but should remain legible,
- not every fictional possession must be recorded as a Resource,
- only recorded Resources matter for the game's explicit mechanical costs and losses.

### Character

A Character is a named person or being with whom the vampire has a relationship.

Character rules:

- each Character should have a name and a short descriptive fragment,
- the description may accumulate more detail over time,
- Characters may be Mortal or Immortal,
- if a prompt requires including a Character and none is available, a new Character should be created,
- a Mortal will occasionally die of old age and should then be struck out,
- outside of age-related death, Characters should not be killed unless a prompt explicitly says so.

Mortals aging out is intentionally approximate rather than exact. The source text suggests this may happen every 4 or 5 prompts.

### Mark

A Mark is a visible sign of the vampire's unnatural state or some other feature that sets them apart from mortals.

Mark rules:

- the vampire carries a Mark throughout their existence,
- when a Mark is created, the player should also consider whether and how it is concealed,
- Marks are intended to persist unless a prompt explicitly changes them.

## Setup: Creating the Vampire

Before prompt play begins, create the vampire as follows:

1. Imagine a human person in the distant past who will become the vampire.
2. Create the first Experience as a broad summary of that person's mortal life.
3. Place that Experience into the first Memory.
4. Create at least 3 Mortal Characters with meaningful relationships to the vampire-to-be.
5. Create 3 Skills appropriate to the vampire's mortal life.
6. Create 3 Resources appropriate to the vampire's mortal life.
7. Create 3 additional Experiences, each combining 2 existing traits, and place each of those Experiences into its own separate Memory.
8. Create 1 Immortal Character who cursed or gifted the vampire with unlife.
9. Create 1 Mark.
10. Create 1 Experience explaining how the vampire became undead and how the Mark arose.
11. Place that final Experience into the remaining empty Memory.

At the end of setup, the vampire should have:

- 5 Memories, each containing exactly 1 Experience,
- 3 Skills,
- 3 Resources,
- 1 Mark,
- at least 3 Mortal Characters,
- 1 Immortal Character.

## Play Loop

During play, the player answers prompts and updates the vampire's state.

### Prompt Resolution Sequence

For each prompt answer:

1. Read the applicable prompt entry.
2. Resolve the prompt fictionally in whatever way feels natural.
3. Apply any trait gains, losses, checks, or other changes required by the prompt.
4. Create an Experience describing the resolution, unless the prompt explicitly says not to.
5. Place that Experience into a Memory immediately.
6. Record the answer in chronological order.
7. Roll movement to determine the next prompt.

The source text encourages the player to let prompts drive events rather than forcing tight continuity.

### Writing an Experience

When answering a prompt:

- existing Characters, Resources, and prior events should be incorporated when relevant,
- the player does not need to answer every sub-question in the prompt,
- the player may allow small contradictions or unresolved details to exist,
- the player may reinterpret prior journal details to better fit later developments,
- the player may not alter Memories unless a prompt explicitly instructs it.

### Prompt Movement

After answering a prompt:

1. Roll `d10`.
2. Roll `d6`.
3. Compute `d10 - d6`.
4. If the result is positive, move forward that many prompts.
5. If the result is negative, move backward that many prompts.
6. If the result is `0`, remain on the same prompt and encounter it again.

Each prompt may have multiple entries:

- first entry on the first encounter,
- second entry on the second encounter,
- third entry on the third encounter.

If the player lands on a prompt and has already used all of its entries, they move on to the next prompt instead.

## Skill and Resource Substitution Rules

Only Skills and Resources may substitute for each other, and only in the specific ways stated below.

### If a Prompt Requires Checking a Skill

- If at least 1 unchecked Skill exists, the player must check one.
- If no unchecked Skill exists, the player must lose a Resource instead.
- If no unchecked Skill exists and no Resource can be lost, the game ends.

### If a Prompt Requires Losing a Resource

- If at least 1 Resource exists that can be lost, the player must lose one.
- If no Resource can be lost, the player must check a Skill instead.
- If no Resource can be lost and no unchecked Skill exists, the game ends.

### If a Prompt Requires Losing a Skill

- The player must lose a Skill.
- The source text does not provide a substitution rule for losing a Skill.
- If no Skill can be lost, the game ends.

### General Substitution Constraints

- Characters, Memories, and Marks may not be lost in place of a Skill or Resource.
- Whenever a Skill/Resource substitution occurs, the player should narrate the worst possible outcome.

## Losing and Preserving Memories

Memory pressure is a central part of the game.

When a new Experience must start a new Memory and all 5 in-mind Memories are already occupied:

- the player may strike out any existing in-mind Memory to make room, or
- the player may move an existing in-mind Memory into the Diary instead, if the vampire has a Diary with available space or creates one now.

Forgetting is not framed as a conscious choice by the vampire. It is an outcome chosen by the player as part of the game's pressure system.

## Play Styles

The game supports two styles of play.

### Quick Game

- Resolve prompts directly in the character record's Memory area.
- No separate journal is required.

### Journaling Game

- Write a short journal entry for each prompt answer.
- Also create an Experience for each prompt as normal.
- If a journal entry conflicts with Memories or Experiences, the Memories and Experiences take precedence.
- Earlier journal entries may be reinterpreted or ignored later.
- Memories may not be rewritten unless a prompt explicitly allows it.

## End Conditions

The game ends if either of the following is true:

- a prompt explicitly states that the game has ended,
- the player is required to check or lose a Skill or Resource and no legal way remains to satisfy that requirement.

When the game ends because a required Skill or Resource change cannot be satisfied, the player narrates the vampire's demise using the current prompt as inspiration.

## Time and Historical Framing

Time in the game is intentionally elastic.

- A single Experience may cover a moment or centuries.
- Several prompts may combine into a short arc lasting days or decades.
- Long gaps between prompts are normal.
- The first 7 or 8 prompts are generally expected to cover the vampire's early undead years.
- Late-game Experiences may occur in the early 21st century, but this is guidance rather than a hard requirement.

Historical events and changing societies should be brought in when useful, but the player should not over-focus on exact years.

## Narrative Guidance That Affects Play

The source text repeatedly frames the following as central to correct play:

- answers should feel natural rather than forced,
- not every prompt answer needs to be equally important,
- unresolved events and abandoned Characters/Resources are acceptable,
- the player should allow discomfort, predation, and moral ugliness to emerge,
- the game should be treated as a story of erosion, reinvention, and tragic continuity rather than tidy plot construction.

These are not strict mechanical constraints, but they are part of the intended use of the system.

## Intentionally Loose or Ambiguous Areas

The source text leaves several areas to player judgment. A future implementation should not assume these are fully deterministic unless a separate product decision standardizes them.

- The provided source text does not explicitly state which prompt number begins play.
- The source text says to move to "the next Prompt" when landing on an exhausted prompt, but does not further define direction-sensitive skipping behavior.
- The game relies on human judgment to decide whether a new Experience belongs in an existing Memory.
- The source text implies, but does not separately formalize, what to do when an Experience thematically fits a Memory that already contains 3 Experiences.
- Mortal death by old age is intentionally approximate, not scheduled by a precise timer.
- The amount of fictional time between prompts is intentionally loose.
- Players are explicitly allowed to leave some questions partially answered and to gently reinterpret non-Memory details later.

## Practical Summary

In mechanical terms, the game is a repeating loop of:

1. encounter a prompt entry,
2. narrate an outcome,
3. mutate traits as instructed,
4. create and place an Experience,
5. manage limited Memory capacity,
6. roll to move through the prompt list,
7. continue until the vampire is destroyed or a prompt ends the game.

The most important persistent pressure systems are:

- finite Memory capacity,
- one-time Skill checking,
- loss of Resources,
- death of Mortal Characters through time,
- eventual failure to satisfy prompt costs.
