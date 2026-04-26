# Append Existing Memory Placement Design

## Context

The coverage audit identifies "normal UI support for adding an Experience to an existing memory" as a core missing rule. The backend already accepts a `memoryDecision` with `mode: "append-existing"` and `targetMemoryId`, and tests already cover the RPC guardrails. The first-party play UI, however, only submits `create-new` unless the mind is full, where it asks which older memory to forget or move to the diary.

This causes normal play to drift away from the book's intended rhythm. A player should decide whether each new Experience opens a new Memory or joins a Memory that already holds related Experiences.

## Recommended Approach

Add a memory-placement choice to the active play surface:

- Default to creating a new Memory, preserving the current low-friction path.
- Offer every in-mind Memory as an append target when the Memory is not full.
- Show full Memories as unavailable when entry counts are known, instead of hiding them.
- Keep the existing overflow panel only for the create-new path when the mind already holds five Memories.
- Preserve backend validation as the final authority for full, forgotten, diary, or invalid targets.

This is more impactful than another prompt-created trait composer because it touches the core ritual on every prompt. It is also much smaller and safer than implementing skill/resource substitution or end-game rules.

## Components

`ChroniclePlayPage` will fetch Memory entry counts with the in-mind Memory records and pass those counts into `PlaySurface`.

`PlaySurface` will own a new placement state:

- `create-new`
- `append-existing`
- selected append target Memory id

The surface will build `memoryDecision` from that state:

- `create-new` without overflow: `{ mode: "create-new" }`
- `create-new` with overflow: `{ mode: "forget-existing" | "move-to-diary", memoryId }`
- `append-existing`: `{ mode: "append-existing", targetMemoryId }`

A focused placement panel will sit near the Experience field, before prompt-created trait composers and overflow resolution. The existing overflow component remains responsible only for resolving the consequence of creating a new Memory while the mind is already full.

## Player Experience

After writing the journal entry and Experience, the player chooses where the Experience settles. The copy should frame this as a meaningful memory choice, not a database operation.

The default remains "begin a new Memory." If the player chooses an existing Memory, they select from their in-mind Memories. Each option shows the slot, title, and known entry usage such as "2 of 3 Experiences." Full Memories are disabled with a short explanation.

When appending is selected, overflow choices disappear because no sixth in-mind Memory is being created. When creating a new Memory while already at five Memories, the existing overflow panel appears and behaves as it does today.

## Error Handling

Client validation should block submit when:

- append-existing is selected but no append target is chosen
- create-new is selected while the mind is full but no overflow mode and memory are chosen
- the chosen append target is known to be full

Server responses from existing memory-rule guards should still be surfaced through the general error banner. This protects against stale page state, concurrent changes, or missing entry counts in tests.

## Testing

Add integration coverage for:

- placement UI renders in-mind Memories and submits an `append-existing` payload
- full Memories are disabled and cannot be chosen when entry counts show 3 of 3
- append mode does not require overflow even when five Memories are in mind
- create-new mode still requires an overflow decision when five Memories are in mind
- the play page passes entry counts into the play surface from the Memory query

Run focused integration tests first, then the full test and lint suites. For UAT, run the app locally and use the browser to exercise a prompt resolution that appends an Experience to an existing Memory and one that creates a new Memory from a full mind.
