# Thousand Year Old Vampire Rules Coverage Audit

## Scope

This audit compares the rules in `docs/source_material/ThousandYearOldVampire Rules without prompts.md` against the current application code, schema, routes, and tests.

I treated coverage in five buckets:

| Status | Meaning |
| --- | --- |
| Automated | The current app flow enforces or persists the rule without extra player bookkeeping. |
| Intentionally Unsupported | The source text mentions this, but supporting it would cut against the current product direction, so it is not a target for this edition. |
| Manual | The player can satisfy the rule in the current UI, but the app does not validate or automate it. |
| Partial | Some support exists, but the normal product flow does not fully cover the rule. |
| Missing | The current product flow does not meaningfully support the rule. |

Important judgment call: if a route or type exists but the first-party UI never exposes it, I counted that as `Partial`, not `Automated`.

I also used `Intentionally Unsupported` sparingly. I only applied it where the current product direction clearly prefers a narrower, writing-first, archive-centric edition over supporting every mode the book allows.

## Executive Summary

The current app does **not** cover all of the rules yet, and a small number of source-text features also look intentionally out of scope for this edition.

What is already strong:

| Strongly covered area | Current state |
| --- | --- |
| Prompt movement | The app rolls `d10 - d6`, moves forward or backward, tracks repeat encounters, and skips to the next available prompt entry. |
| Memory pressure | The app enforces three entries per memory, five in-mind memories, four-memory diary capacity, forgetting, and moving memories into a diary. |
| Archive continuity | Prompt history, memory entries, forgotten memories, diary memories, and archive events are all persisted and visible. |

What is only partly covered:

| Partly covered area | Why it is only partial |
| --- | --- |
| Setup fidelity | The data model can hold more than the UI currently gathers, but the guided setup only asks for one skill, one resource, one mortal, one mark, and one memory. |
| Trait changes during play | The play UI now supports prompt-created skills and resources, but it still submits empty mutation arrays and offers no normal controls for most prompt-driven checks, losses, character changes, or mark updates. |
| Character and mark upkeep | Existing characters and marks can be edited after the fact in the ledger, but creation and many prompt-specific changes are not surfaced in active play. |

What is still missing or materially incomplete:

| Missing area | Why it matters |
| --- | --- |
| Normal UI support for adding an Experience to an existing memory | This is a core memory rule in the book, but the play UI only creates new memories or handles overflow. |
| Book-faithful setup end state | The book expects 5 starting memories, 3 skills, 3 resources, at least 3 mortals, and 1 immortal; the default setup flow does not. |
| Skill/resource substitution and end-game rules | The app does not parse prompt costs, apply substitution rules, or end the game when those costs become impossible. |
| Diary loss cascading to stored memories | Normal four-memory diary capacity is now enforced, but diary loss and the loss of preserved memories tied to it are still not implemented. |

What now looks intentionally unsupported:

| Intentionally unsupported area | Why it looks like a deliberate non-goal |
| --- | --- |
| Aloud-only prompt answering | The product is centered on authored written entries and a durable archive, not ephemeral spoken play. |
| Quick Game mode | The current edition is built around journaling surfaces, archive continuity, and preserved writing rather than a lighter memory-area-only mode. |
| Retroactive journal rewriting | Preserving the archive as a durable artifact appears more aligned with the product than editable historical prompt entries. |
| Full appendix reproduction inside the app | The product vision is still a narrow digital edition of the core ritual loop, even though the app now includes its own safety framing and play guidance. |

## Overall Verdict

The app currently implements a **promising but narrower rules slice** of *Thousand Year Old Vampire*.

It is already good at the memory engine: prompt lookup, movement, repeated encounters, creating memories, forgetting memories, four-memory diary overflow, and preserving the archive across sessions. That part is real and backed by schema, RPCs, and tests.

It is not yet a full digital implementation of the rules text. The biggest genuine gaps are setup fidelity, append-to-existing-memory in the normal UI, prompt-driven creation and mutation of traits, substitution logic, diary-loss consequences, and game-ending conditions.

## Detailed Breakdown

### 1. Materials, Framing, and Core Premise

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The player needs a way to record the vampire's story. | Automated | The product supplies durable writing surfaces plus archive and recap storage. | `src/components/ritual/PlaySurface.tsx`, `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`, `supabase/migrations/0002_core_gameplay_schema.sql` |
| The player needs a `d10` and `d6`, or another randomizer. | Automated | The app internalizes the roll inside `resolve_prompt_run`, so physical dice are no longer required. | `supabase/migrations/0007_memory_rule_helpers.sql` |
| The game is a solo, mature, emotionally challenging experience. | Partial | The setup flow now includes a deliberate safety checkpoint before the first prompt, but emotional pacing and self-regulation still rely primarily on player judgment. | `src/components/ritual/SafetyCheckpointPanel.tsx`, `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`, `docs/product-vision.md` |
| The player can answer prompts in writing. | Automated | The product is explicitly built around written `playerEntry` and `experienceText` fields. | `src/lib/validation/play.ts`, `src/components/ritual/PlaySurface.tsx` |
| The player can answer prompts aloud. | Intentionally Unsupported | The product direction is centered on authored writing and a durable chronicle artifact, so an aloud-only mode does not look like a target for this edition. | `src/components/ritual/PlaySurface.tsx`, `docs/product-vision.md`, `docs/superpowers/specs/2026-04-19-thousand-year-old-vampire-digital-adaptation-design.md` |
| Safety tools and appendix material are available in the book. | Partial | The app now provides first-session safety framing and compact in-play guidance, but it still does not reproduce the book's appendix material wholesale. | `src/components/ritual/SafetyCheckpointPanel.tsx`, `src/components/ritual/PlayGuidancePanel.tsx`, `docs/product-vision.md` |

### 2. Canonical Trait Model and Trait Mutation Conventions

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The vampire is represented by Memories, Skills, Resources, Characters, and Marks. | Automated | All five trait families exist in the schema and app surfaces. | `supabase/migrations/0002_core_gameplay_schema.sql`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx`, `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| Lost traits should remain legible. | Automated | Lost skills, resources, characters, forgotten memories, and diary memories remain stored and visible. | `src/components/archive/TraitItem.tsx`, `src/components/archive/MemoryCard.tsx`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Prompts may impose dramatic changes beyond simple check or strikeout. | Partial | The schema can mutate existing traits, but the active play UI does not expose most of those operations. | `src/types/chronicle.ts`, `src/lib/validation/play.ts`, `src/components/ritual/PlaySurface.tsx` |
| Prompt-specific instructions take precedence over general rules. | Manual | Prompt text is shown, but the app does not parse prompt instructions into structured actions. The player must interpret them. | `src/components/ritual/PromptCard.tsx`, `supabase/migrations/0002_core_gameplay_schema.sql` |

### 3. Experiences, Memories, and Memory Pressure

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Every prompt answer creates an Experience unless instructed otherwise. | Partial | The app always requires `experienceText`, but it cannot represent prompt-specific exceptions. | `src/lib/validation/play.ts`, `src/components/ritual/PlaySurface.tsx` |
| An Experience should be a single evocative sentence in first person. | Manual | The UI hints at this but does not enforce sentence count or point of view. | `src/components/ritual/PlaySurface.tsx` |
| An Experience must be placed into a Memory immediately. | Automated | Prompt resolution writes the prompt run and memory entry in one transaction. | `supabase/migrations/0007_memory_rule_helpers.sql`, `src/lib/chronicles/resolvePrompt.ts` |
| A Memory may contain up to 3 Experiences. | Automated | The RPC rejects a fourth entry on the same memory. | `supabase/migrations/0007_memory_rule_helpers.sql`, `tests/integration/archive-rules.test.ts` |
| The vampire may have up to 5 active memories in mind. | Automated | The schema and helper functions treat five in-mind memories as the limit. | `supabase/migrations/0002_core_gameplay_schema.sql`, `supabase/migrations/0007_memory_rule_helpers.sql`, `src/components/ritual/MemoryDecisionPanel.tsx` |
| If a new Experience fits an existing Memory, it may be added there. | Partial | The backend supports `append-existing`, but the current play UI never offers that choice. In normal use, the player can only create a new memory and then handle overflow. | `src/types/chronicle.ts`, `src/lib/validation/play.ts`, `supabase/migrations/0007_memory_rule_helpers.sql`, `src/components/ritual/PlaySurface.tsx` |
| If all five memories are full, the player chooses what to forget unless instructed otherwise. | Automated | When the mind is full, the UI requires the player to choose a memory to forget or move into the diary. | `src/components/ritual/MemoryDecisionPanel.tsx`, `supabase/migrations/0007_memory_rule_helpers.sql`, `tests/integration/setup-flow.test.tsx` |
| Forgetting is a player choice, not a conscious vampire choice. | Manual | The product copy supports this mood, but the distinction is not mechanically modeled. | `src/components/ritual/MemoryDecisionPanel.tsx` |
| Forgotten memories remain readable. | Automated | Forgotten memories remain in the archive with `location = 'forgotten'`. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`, `src/components/archive/MemoryCard.tsx` |
| Lost traits may later be restored by prompts. | Partial | The app preserves old records, but it has no memory-restore flow and no prompt parser to trigger restoration. | `src/app/api/chronicles/[chronicleId]/skills/[skillId]/route.ts`, `src/app/api/chronicles/[chronicleId]/resources/[resourceId]/route.ts`, `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |

#### Memory assessment

This is the strongest implemented rules cluster in the whole app. The database logic, archive UI, and tests all agree on the memory cap, overflow handling, diary movement, and prompt history.

The biggest memory gap is also an important one: the book expects the player to decide whether a new Experience belongs in an existing Memory, but the normal play UI does not expose that choice. The backend can do it, yet the first-party interface does not.

### 4. Diary Rules

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The vampire may have one Diary at a time. | Automated | Only one active diary is allowed per chronicle, and overflow logic reuses it instead of creating duplicates. | `supabase/migrations/0002_core_gameplay_schema.sql`, `supabase/migrations/0007_memory_rule_helpers.sql`, `tests/integration/archive-rules.test.ts` |
| A Diary is created when needed and becomes a physical preserved object. | Partial | The app auto-creates a generic diary titled `The Diary`, but the player does not describe it in the flow and it is not tracked as a normal resource entry. | `supabase/migrations/0007_memory_rule_helpers.sql`, `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| A Diary must contain at least one Memory. | Automated | The diary is only created during a move-to-diary operation, so it never exists empty at creation time. | `supabase/migrations/0007_memory_rule_helpers.sql` |
| A Diary may hold up to 4 memories. | Automated | Diary capacity is now durable state on the diary record, overflow resolution rejects illegal move-to-diary choices once the active diary is full, and the play/archive UI shows current diary usage. | `supabase/migrations/0009_diary_capacity.sql`, `src/components/ritual/MemoryDecisionPanel.tsx`, `src/components/ritual/MemoryMeter.tsx`, `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`, `tests/integration/archive-rules.test.ts`, `tests/integration/gameplay-rpc-guards.test.ts` |
| A Memory moved to the Diary is no longer in the vampire's head. | Automated | Moving to diary clears `slot_index` and changes `location` to `diary`. | `supabase/migrations/0007_memory_rule_helpers.sql` |
| Once in the Diary, a Memory cannot gain new Experiences. | Automated | Appending is restricted to in-mind memories only. | `supabase/migrations/0007_memory_rule_helpers.sql`, `tests/integration/archive-rules.test.ts` |
| If the Diary is lost, the Memories in it are lost too. | Missing | There is no diary-loss route, no diary-loss UI, and no cascade from diary loss to memory loss. | `supabase/migrations/0002_core_gameplay_schema.sql`, absence of any diary loss handler |
| The vampire accepts the contents of the Diary as truth. | Manual | This is narrative guidance only in the current app. | No mechanical representation |

### 5. Skills

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Skills are named capabilities tied to context. | Partial | Skills exist in setup, schema, ledger storage, and prompt resolution, but the guided setup still only asks for one initial skill instead of the book's fuller starting state. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts`, `src/components/ritual/PromptSkillComposer.tsx`, `supabase/migrations/0010_prompt_created_skills.sql` |
| A Skill may be checked once. | Partial | The model has a `checked` state, so repeated checkmarks are not represented, but there is no play UI enforcing legal check choices. | `supabase/migrations/0002_core_gameplay_schema.sql`, `src/app/api/chronicles/[chronicleId]/skills/[skillId]/route.ts` |
| Losing a Skill strikes it out but keeps it readable. | Partial | The status model supports `lost`, but there is no first-party play UI for prompt-driven skill loss. | `src/types/chronicle.ts`, `src/app/api/chronicles/[chronicleId]/skills/[skillId]/route.ts`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Checked skills flavor later prompt answers. | Manual | This remains entirely with the player. | No automation |
| Prompts can create new Skills during play. | Automated | The play surface exposes an optional prompt-created skill flow, and prompt resolution persists the new skill transactionally with the prompt answer. | `src/components/ritual/PromptSkillComposer.tsx`, `src/components/ritual/PlaySurface.tsx`, `src/lib/validation/play.ts`, `supabase/migrations/0010_prompt_created_skills.sql` |

### 6. Resources

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Resources are named assets that matter mechanically. | Partial | Resources exist in the schema, setup, ledger, and prompt resolution, but the guided setup still only asks for one initial resource instead of the book's fuller starting state. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts`, `src/components/ritual/PromptResourceComposer.tsx`, `supabase/migrations/0011_prompt_created_resources.sql` |
| Resources can be stationary. | Automated | `is_stationary` is modeled and surfaced in the ledger. | `src/types/chronicle.ts`, `src/lib/validation/setup.ts`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Losing a Resource strikes it out but keeps it readable. | Partial | The status model supports `lost`, but the normal play UI has no resource-loss controls. | `src/types/chronicle.ts`, `src/app/api/chronicles/[chronicleId]/resources/[resourceId]/route.ts`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Not every fictional possession must be a Resource. | Manual | This remains a player judgment call. | No automation |
| Prompts can create new Resources during play. | Automated | The play surface now supports prompt-created resources, including stationary resources, and prompt resolution persists them transactionally with the prompt answer. | `src/components/ritual/PromptResourceComposer.tsx`, `src/components/ritual/PlaySurface.tsx`, `src/lib/validation/play.ts`, `supabase/migrations/0011_prompt_created_resources.sql` |

### 7. Characters

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Characters are named and described. | Automated | Characters exist in the schema and ledger view. | `supabase/migrations/0002_core_gameplay_schema.sql`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Characters may be mortal or immortal. | Automated | `character_kind` is modeled and displayed. | `supabase/migrations/0002_core_gameplay_schema.sql`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Character descriptions may accumulate detail over time. | Manual | The ledger editor lets the player revise descriptions after the fact. | `src/components/archive/CharacterEditor.tsx`, `src/app/api/chronicles/[chronicleId]/characters/[characterId]/route.ts` |
| If a prompt requires a Character and none is available, create one. | Missing | There is no character-creation UI or route during play. The only character route is an item-level `PATCH` route. | `src/app/api/chronicles/[chronicleId]/characters/[characterId]/route.ts`, `src/components/ritual/PlaySurface.tsx` |
| Mortals occasionally die of old age. | Manual | The player can mark a character dead in the ledger or through hidden trait mutations, but there is no automatic cadence or reminder. | `src/components/archive/CharacterEditor.tsx`, `src/types/chronicle.ts` |
| Characters cannot otherwise be killed unless a prompt says so. | Manual | The editor allows `dead` or `lost` at any time; the app does not police whether a prompt authorized it. | `src/components/archive/CharacterEditor.tsx`, `src/app/api/chronicles/[chronicleId]/characters/[characterId]/route.ts` |

### 8. Marks

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The vampire carries a Mark throughout existence. | Partial | Marks are stored durably, but the app also introduces an `is_active` / dormant state that the source rules do not define. | `supabase/migrations/0002_core_gameplay_schema.sql`, `src/components/archive/MarkEditor.tsx` |
| The player should consider whether the Mark is concealed. | Partial | Concealment exists in the model and ledger editor, but the guided setup does not ask about concealment and defaults to `true`. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts`, `src/components/archive/MarkEditor.tsx` |
| Prompts may change a Mark. | Partial | Existing marks can be updated through `traitMutations` or the ledger editor, but there is no normal in-play mark-edit UI. | `src/types/chronicle.ts`, `src/lib/validation/play.ts`, `src/components/archive/MarkEditor.tsx` |
| Prompts may create a new Mark. | Missing | There is no mark-creation flow during prompt resolution. The only mark route is an item-level `PATCH` route. | `src/app/api/chronicles/[chronicleId]/marks/[markId]/route.ts`, `src/components/ritual/PlaySurface.tsx` |

### 9. What Counts as a Vampire

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The vampire should prey on humans, camouflage itself, have once been human, be vulnerable to dangers like sunlight, be practically immortal, and be mostly a loner. | Manual | These are thematic assumptions from the source text. The app does not validate them beyond tone and prose prompts. | `src/app/(app)/chronicles/[chronicleId]/setup/page.tsx`, `src/app/(app)/chronicles/[chronicleId]/play/page.tsx` |

### 10. Setup: Creating the Vampire

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Imagine a person in the distant past and summarize their mortal life. | Partial | The app collects `mortalSummary`, but not as a required first Memory Experience and not with dedicated fields for birthplace, era, or original identity. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts`, `supabase/migrations/0003_fix_setup_summary_ambiguity.sql` |
| Start with one first Memory containing that mortal-life Experience. | Partial | The setup API can create memories, but the UI only collects one memory and does not ensure it is specifically the mortal-life summary. | `src/components/ritual/SetupStepper.tsx`, `supabase/migrations/0003_fix_setup_summary_ambiguity.sql` |
| Create at least 3 Mortal Characters. | Missing in normal flow | The schema allows arrays, but validation only requires `min(1)` and the UI collects exactly one mortal. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx`, `tests/e2e/first-session.spec.ts` |
| Create 3 Skills. | Missing in normal flow | The schema allows arrays, but validation only requires `min(1)` and the UI collects exactly one skill. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx`, `tests/e2e/first-session.spec.ts` |
| Create 3 Resources. | Missing in normal flow | Same issue as skills: one in UI, one minimum in validation, three in the book. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx` |
| Create 3 more Experiences, each in a separate Memory, combining existing traits. | Missing | The setup UI only collects one memory and does not scaffold the trait-combination exercise. | `src/components/ritual/SetupStepper.tsx`, `supabase/migrations/0003_fix_setup_summary_ambiguity.sql` |
| Create 1 Immortal who made the vampire. | Automated | The setup flow does collect one immortal. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts` |
| Create 1 Mark. | Automated | The setup flow collects one mark label and description. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts` |
| Create an Experience explaining the becoming-undead moment and the Mark. | Partial | The UI does not explicitly ask for a separate turning Experience. The player can fold it into the single memory, but the app does not require the book's five-memory setup end state. | `src/components/ritual/SetupStepper.tsx`, `supabase/migrations/0003_fix_setup_summary_ambiguity.sql` |
| Finish setup with 5 Memories, 3 Skills, 3 Resources, at least 3 Mortals, and 1 Immortal. | Missing in normal flow | The normal setup flow does not produce this state. The backend can accept up to five setup memories, but the UI and validation minimums are well below the source rules. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx`, `tests/integration/chronicle-validation.test.ts` |
| Begin play at the first prompt. | Automated | The app sets current prompt number and encounter to `1.1`. This is a product decision because the source rules text itself notes prompt-start ambiguity. | `supabase/migrations/0003_fix_setup_summary_ambiguity.sql`, `docs/thousand-year-old-vampire-rules-spec.md` |

#### Setup assessment

Setup is the clearest gap between the source rules and the current first-party experience.

The data structures are broad enough to hold a richer starting state, but the shipped setup flow intentionally narrows the entry ritual to a single example of most things. That may be good for onboarding, but it is not yet a faithful implementation of the book's setup rules.

### 11. Prompt Play Loop and Prompt Movement

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The current prompt is presented to the player. | Automated | The play page loads from `prompt_catalog` using current prompt number and encounter index. | `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`, `src/lib/prompts/catalog.ts` |
| The player answers the prompt and records chronology. | Automated | The app saves `player_entry`, `experience_text`, prompt number, encounter index, and created time. | `supabase/migrations/0007_memory_rule_helpers.sql`, `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| The app rolls `d10` and `d6`, then moves by `d10 - d6`. | Automated | This happens inside `resolve_prompt_run`, and the result is returned and stored. | `supabase/migrations/0007_memory_rule_helpers.sql` |
| Positive movement goes forward, negative goes backward, `0` repeats the prompt. | Automated | The RPC applies signed movement, clamps at prompt 1, and preserves current-prompt encounter rules for same-prompt rerolls. | `supabase/migrations/0007_memory_rule_helpers.sql`, `tests/integration/gameplay-rpc-guards.test.ts` |
| Prompts have first, second, and third entries based on repeated encounters. | Automated | Encounter index is loaded from `prompt_catalog` and advanced via prior `prompt_runs`. | `src/lib/prompts/catalog.ts`, `supabase/migrations/0007_memory_rule_helpers.sql` |
| If a prompt has no remaining entry, move to the next prompt. | Automated with interpretation | The app skips forward until it finds the next available prompt entry. That is a concrete product interpretation of a source rule the spec already marked as somewhat ambiguous. | `supabase/migrations/0007_memory_rule_helpers.sql`, `tests/integration/gameplay-rpc-guards.test.ts` |
| Prompt entries should be numbered chronologically. | Automated | The archive keeps chronological prompt history without asking the player to number entries manually. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| Prompt-specific trait gains, losses, and checks happen during resolution. | Partial | The payload format supports mutation of existing traits, but prompt text is plain markdown and the play UI exposes no trait controls. The player must interpret the prompt and cannot fully enact many outcomes in the current UI. | `src/components/ritual/PromptCard.tsx`, `src/types/chronicle.ts`, `src/components/ritual/PlaySurface.tsx` |
| The player does not have to answer every question in a prompt. | Manual | This remains up to the player in freeform writing. | `src/components/ritual/PlaySurface.tsx` |

### 12. Skill and Resource Substitution Rules

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| If asked to check a Skill and none are available, lose a Resource instead. | Missing | The app does not parse prompt costs or inspect current checked/lost states during prompt resolution. | `src/components/ritual/PromptCard.tsx`, `src/components/ritual/PlaySurface.tsx`, `supabase/migrations/0007_memory_rule_helpers.sql` |
| If asked to lose a Resource and none are available, check a Skill instead. | Missing | Same issue: there is no prompt-rule engine for substitution. | Same evidence as above |
| Only Skills and Resources may substitute for each other. | Missing | No substitution enforcement exists. | Same evidence as above |
| When substitution occurs, narrate the worst possible outcome. | Manual | The player can do this in prose, but the app does not detect or prompt for it. | `src/components/ritual/PlaySurface.tsx` |
| If no legal Skill/Resource substitution remains, the game ends. | Missing | There is no end-condition handler for impossible prompt costs. Prompt resolution advances play state but never evaluates or transitions to a rules-driven game-over state. | `supabase/migrations/0007_memory_rule_helpers.sql`, `src/components/ritual/PlaySurface.tsx`, `src/components/ritual/PromptCard.tsx` |
| Losing a Skill with no Skill available ends the game. | Missing | There is no game-over logic for this condition. | `supabase/migrations/0007_memory_rule_helpers.sql`, `src/components/ritual/PlaySurface.tsx`, `src/components/ritual/PromptCard.tsx` |

### 13. End Conditions

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The game ends if a prompt explicitly says so. | Missing | Prompt text is unstructured markdown and prompt resolution never interprets prompt content into a chronicle completion transition. | `src/components/ritual/PromptCard.tsx`, `supabase/migrations/0007_memory_rule_helpers.sql` |
| The game ends if the player cannot legally satisfy a required Skill/Resource change. | Missing | No such rules engine exists today. Prompt resolution updates memories and next-prompt state, but it does not evaluate impossible prompt costs. | `supabase/migrations/0007_memory_rule_helpers.sql`, `src/components/ritual/PlaySurface.tsx` |
| On a forced game end, the player narrates the vampire's demise using the prompt for inspiration. | Missing | No game-over screen, completion route, or demise flow exists in the current play loop. | `src/components/ritual/PlaySurface.tsx`, `src/app/(app)/chronicles/[chronicleId]/play/page.tsx` |

### 14. Two Styles of Play

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Quick Game: resolve directly in the memory area without a separate journal. | Intentionally Unsupported | The current edition is built around written entries, archive continuity, and rereadable authored history rather than a lighter quick-play mode. | `src/lib/validation/play.ts`, `src/components/ritual/PlaySurface.tsx`, `docs/product-vision.md` |
| Journaling Game: keep a separate journal entry plus an Experience. | Partial | The current play surface behaves like a hybrid journaling mode by requiring both a larger entry and a distilled Experience. | `src/components/ritual/PlaySurface.tsx`, `supabase/migrations/0007_memory_rule_helpers.sql` |
| Memories and Experiences take precedence over journal detail. | Partial | Structurally, memories and prompt runs are stored separately, but the rule is not surfaced explicitly in UI. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| Earlier journal entries may be modified or ignored later. | Intentionally Unsupported | Allowing retroactive editing of past prompt entries appears to run against the product's archive-first direction, where the written chronicle is meant to remain a durable artifact. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`, `docs/product-vision.md` |
| Memories may not be modified unless a prompt says so. | Partial | The current product effectively keeps memories and prompt history read-only, but it does not model prompt-specific exceptions that would allow controlled memory rewriting. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`, `src/components/archive/MemoryCard.tsx` |

### 15. Answering Prompts, Time, and Narrative Guidance

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Answer prompts naturally rather than force continuity. | Manual | Entirely player-judged. | `src/components/ritual/PlaySurface.tsx` |
| Use existing traits and past events when relevant. | Manual | The archive and ledger make this possible, but the app does not validate it. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Not every prompt answer needs to matter equally. | Manual | Player judgment only. | No automation |
| The player may reinterpret earlier journal details gently. | Manual | Possible only mentally; no edit tool. | No automation |
| The vampire's life should span loose centuries. | Manual | The app stores real timestamps, not fictional dates. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| Mortals should occasionally die of old age, roughly every 4 or 5 prompts. | Manual | No cadence, reminder, or automation exists. | `src/components/archive/CharacterEditor.tsx` |
| Historical events and changing society should be worked in when useful. | Manual | The player must do this in prose. | `src/components/ritual/PlaySurface.tsx` |
| The first 7 or 8 prompts usually cover the early undead years. | Manual | No fictional-time tracker exists. | No automation |

## Biggest Rule Gaps

These are the highest-value mismatches between the source rules and the current product.

| Gap | Why it matters now |
| --- | --- |
| No normal UI for `append-existing` memory placement | This changes the core rhythm of how memories are supposed to form. The book expects clustering into thematic memories; the current play UI mostly pushes toward one new memory per prompt until overflow. |
| Guided setup does not produce the book's required starting state | A player who only uses the first-party setup flow begins with a simpler chronicle than the rules describe. |
| No in-play creation of characters or marks | Skills and resources now have first-party prompt-resolution flows, but many prompts still depend on creating characters or marks in active play. |
| No skill/resource substitution engine | The game-ending pressure around dwindling traits is one of the book's core mechanics, and it is currently absent. |
| Diary loss and cascading memory loss are still missing | Diary capacity pressure now exists, but losing the diary and the memories preserved in it is still absent from the rules loop. |
| No end-game flow | The app has statuses for `completed`, but no prompt-driven or rules-driven completion path in play. |

## Areas That Are Already Quite Faithful

The current build is closest to the source text in these places:

| Area | What is already faithful |
| --- | --- |
| Prompt navigation | Prompt number, encounter index, repeat encounters, and movement all exist as durable state rather than ad hoc client logic. |
| Memory stack | Three-entry memory limit, five in-mind memory limit, forgetting, and diary overflow are backed by transactional database logic. |
| Archive readability | Forgotten memories remain readable, prompt history is preserved, and immediate consequences are surfaced as archive events. |
| Durable state | The system consistently treats the chronicle as something preserved over time rather than a transient text box. |

## Final Assessment

If the question is "can a player use the app today to play a recognizable slice of *Thousand Year Old Vampire*?", the answer is yes.

If the question is "are all of the rules from the source text currently covered either by code or by the normal player flow inside the app?", the answer is no.

The app currently covers the **memory-and-movement backbone** of the game much more completely than it covers the **full trait economy, book-faithful setup, substitution pressure, and end-state rules**. A few other source-text options, like aloud play and quick-game mode, now look less like missing work and more like conscious non-goals for a writing-first digital edition. In other words: it already has a strong ritual shell and archive engine, but it is not yet a full rules-complete digital edition of the source text.
