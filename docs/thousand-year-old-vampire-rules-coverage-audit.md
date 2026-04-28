# Thousand Year Old Vampire Rules Coverage Audit

## Scope

This audit compares the rules in `docs/source_material/ThousandYearOldVampire Rules without prompts.md` against the current application code, schema, routes, tests, and first-party UI.

I treated coverage in five buckets:

| Status | Meaning |
| --- | --- |
| Automated | The current app flow enforces or persists the rule without extra player bookkeeping. |
| Intentionally Unsupported | The source text mentions this, but supporting it would cut against the current product direction, so it is not a target for this edition. |
| Manual | The player can satisfy the rule in the current UI or prose, but the app does not validate or automate it. |
| Partial | Some support exists, but the normal product flow does not fully cover the rule. |
| Missing | The current product flow does not meaningfully support the rule. |

Important judgment calls for this pass:

- I did **not** treat optional UI controls as `Automated` unless the app actually recognizes that the current prompt requires the action.
- I counted backend routes and payload types as `Partial` when no first-party UI exposes them.
- I counted rules covered only through prose as `Manual`, even when the app provides the text box where the player can write the answer.
- I challenged the prior audit rather than inheriting its statuses.

## Executive Summary

The current app does **not** cover all rules yet. It covers the memory-and-movement backbone well, but most of the trait economy still depends on the player reading the prompt text and doing the right thing manually.

What is already strong:

| Strongly covered area | Current state |
| --- | --- |
| Prompt movement | The app rolls `d10 - d6`, moves forward or backward, tracks repeated encounters, and skips to the next available prompt entry. |
| Memory pressure | The app enforces three Experiences per Memory, five in-mind Memory slots, forgetting, moving Memories into a Diary, and the four-Memory Diary capacity. |
| Archive continuity | Prompt history, Memory entries, forgotten Memories, Diary Memories, Characters, Resources, Skills, Marks, and archive events are persisted and visible. |

What is only partly covered:

| Partly covered area | Why it is only partial |
| --- | --- |
| Setup fidelity | The backend accepts arrays, but the guided setup UI asks for one Skill, one Resource, one Mortal, one Mark, and one Memory, not the book's full starting state. |
| Prompt-created traits | The play UI can create new Skills, Resources, Characters, and Marks, but only base Prompt 1 and base Prompt 4 receive special prompt-effect guidance. Most prompt-required creations are manual player interpretation. |
| Existing trait mutation | Play now exposes a rules-aware Skill/Resource change panel, and ledger editors expose Characters and Marks, but most non-Skill/Resource prompt mutations still require player interpretation or after-the-fact ledger edits. |
| Appendix prompt support | Alternate Appendix I prompts exist in `supabase/seed.sql`, but normal setup pins chronicles to `prompt_version = 'base'`, so alternate prompts are not a normal player-facing option. |

What is still missing or materially incomplete:

| Missing area | Why it matters |
| --- | --- |
| Book-faithful setup end state | The book expects 5 starting Memories, 3 Skills, 3 Resources, at least 3 Mortals, 1 Immortal, and 1 Mark. The first-party setup flow does not produce that state. |
| Diary as a Resource, plus Diary loss | The app has a `diaries` table, but the Diary is not added as a normal Resource, cannot be described by the player, and cannot be lost with cascading loss of stored Memories. |
| Prompt-specific exceptions | The app always requires an Experience and cannot model prompt text that says to skip, rewrite, restore, merge, swap, or otherwise alter Memories outside the standard flow. |
| Structured prompt-instruction parsing | The player still declares which Skill/Resource change the prompt requires; the app does not yet parse every prompt into required mechanical effects. |

What looks intentionally unsupported:

| Intentionally unsupported area | Why it looks deliberate |
| --- | --- |
| Aloud-only prompt answering | The product is centered on authored written entries and a durable archive, not ephemeral spoken play. |
| Quick Game mode | The current edition is built around a journaling surface plus archive continuity rather than a lighter memory-area-only mode. |
| Multiplayer and full appendix reproduction | `docs/product-vision.md` explicitly lists multiplayer and prompt-pack/platform-style expansion as out of scope for this release, even though the app adds its own safety framing. |

## Overall Verdict

The app implements a recognizable, useful slice of *Thousand Year Old Vampire*, but it is not rules-complete.

The memory engine is the most faithful part: prompt lookup, dice movement, encounter advancement, creating or extending Memories, overflow decisions, Diary capacity, forgotten-Memory readability, and durable archive storage are real code-backed behavior.

The weakest areas are setup fidelity, prompt-driven non-Skill/Resource trait mutation, structured prompt parsing, Diary-as-Resource handling, and broad game-ending conditions. Those are not small edge cases; they are central to the tabletop rules' pressure system.

## Challenge Log

This pass corrected or sharpened several claims from the previous audit:

| Prior claim to challenge | Updated finding |
| --- | --- |
| Prompt-created Skills, Resources, Characters, and Marks were listed as `Automated`. | Downgraded to `Partial`: the app can persist them, but most prompt-required creations are optional controls that the player must choose manually. |
| Trait mutation was described as broadly present through schema and payloads. | Kept `Partial`, but clarified that Skill/Resource changes now have a first-party panel while most other prompt-driven mutations remain manual. |
| Character and Mark upkeep was treated similarly to Skill and Resource upkeep. | Split the finding: Character and Mark editors exist in the ledger, while Skills and Resources have PATCH routes but no first-party editor. |
| Appendix support was summarized as general non-support. | Nuanced: alternate Appendix I prompts are seeded, but normal chronicles are forced to `base`; multiplayer and broader appendix material remain out of scope. |
| Memory overflow language implied all five Memories must be individually full. | Corrected to occupied in-mind Memory slots. The source pressure triggers when a new Memory is needed and all five slots are occupied, not only when every Memory has three Experiences. |

## Detailed Breakdown

### 1. Materials, Framing, and Core Premise

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The player needs a way to record the vampire's story. | Automated | The product supplies durable writing surfaces, prompt history, archive, ledger, and recap storage. | `src/components/ritual/PlaySurface.tsx`, `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx`, `supabase/migrations/0002_core_gameplay_schema.sql` |
| The player needs a `d10` and `d6`, or another randomizer. | Automated | The app rolls internally inside `resolve_prompt_run`, stores `d10_roll`, `d6_roll`, and `movement`, and advances the chronicle. | `supabase/migrations/0013_prompt_created_characters.sql`, `src/lib/chronicles/resolvePrompt.ts` |
| The game is solo. | Automated | The product models one user's private chronicles and `docs/product-vision.md` explicitly excludes multiplayer. | `docs/product-vision.md`, `src/app/api/chronicles/route.ts`, `supabase/migrations/0001_initial_profiles_chronicles.sql` |
| The game is mature and emotionally challenging. | Partial | The setup flow includes a deliberate safety checkpoint, but emotional pacing and self-regulation remain player judgment. | `src/components/ritual/SafetyCheckpointPanel.tsx`, `src/components/ritual/PlayGuidancePanel.tsx` |
| The player can answer prompts in writing. | Automated | Prompt resolution requires `playerEntry` and `experienceText`. | `src/lib/validation/play.ts`, `src/components/ritual/PlaySurface.tsx` |
| The player can answer prompts aloud. | Intentionally Unsupported | The product direction is written, persistent, and archive-first. | `src/components/ritual/PlaySurface.tsx`, `docs/product-vision.md` |
| Safety tools and appendix material are available in the book. | Partial | The app supplies its own safety checkpoint and compact guidance. It does not reproduce the book's Appendix II random tables, Appendix Three safety text, examples of play, context essays, or multiplayer rules. | `src/components/ritual/SafetyCheckpointPanel.tsx`, `src/components/ritual/PlayGuidancePanel.tsx`, `docs/product-vision.md` |
| Additional Appendix I prompts are available after a few plays. | Partial | Alternate Appendix I prompts are seeded as `alternate_appendix_i`, but normal setup sets `prompt_version = 'base'` and no first-party selector exists. | `supabase/seed.sql`, `supabase/migrations/0013_prompt_created_characters.sql`, `src/app/(app)/chronicles/[chronicleId]/play/page.tsx` |

### 2. Canonical Trait Model and Trait Mutation Conventions

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The vampire is represented by Memories, Skills, Resources, Characters, and Marks. | Automated | All five trait families exist in the schema and archive/ledger surfaces. | `supabase/migrations/0002_core_gameplay_schema.sql`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx`, `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| Most prompts modify one or more traits. | Partial | The app shows prompt text and can persist some new traits, but it does not parse prompt instructions into required trait actions. | `src/components/ritual/PromptCard.tsx`, `src/components/ritual/PlaySurface.tsx`, `src/lib/prompts/effects.ts` |
| Checking a Skill means marking it as used once. | Partial | `checked` is modeled, and normal play can now check a Skill through the player-declared Skill/Resource rules panel. The app still does not parse prompt text to decide when a Skill check is required. | `src/types/chronicle.ts`, `src/lib/validation/play.ts`, `src/components/ritual/SkillResourceChangePanel.tsx`, `src/app/api/chronicles/[chronicleId]/play/resolve/route.ts` |
| Losing a trait means striking it out while keeping it readable. | Partial | The status/location model preserves lost or forgotten records, and normal play can now lose Skills and Resources through the Skill/Resource rules panel. Non-Skill/Resource losses still rely on after-the-fact ledger edits or hidden mutation payloads. | `src/components/archive/TraitItem.tsx`, `src/components/archive/MemoryCard.tsx`, `src/components/ritual/SkillResourceChangePanel.tsx`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Prompts may impose dramatic changes beyond simple check or strikeout. | Partial | Character and Mark ledger editors support some after-the-fact changes, and `traitMutations` has hidden support, but there is no prompt-specific UI for most dramatic changes such as converting a Character to a Resource or merging Memories. | `src/components/archive/CharacterEditor.tsx`, `src/components/archive/MarkEditor.tsx`, `src/lib/validation/play.ts` |
| Prompt-specific instructions take precedence over general rules. | Manual | Prompt text is shown, but the app does not understand or enforce those instructions. | `src/components/ritual/PromptCard.tsx`, `src/lib/prompts/effects.ts` |

### 3. Experiences, Memories, and Memory Pressure

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Every prompt answer creates an Experience unless instructed otherwise. | Partial | The app always requires `experienceText`, which covers the usual rule but cannot represent prompt-specific exceptions. | `src/lib/validation/play.ts`, `src/components/ritual/PlaySurface.tsx` |
| An Experience should be a single evocative sentence in first person. | Manual | The UI asks for a distilled sentence, but sentence count and point of view are not enforced. | `src/components/ritual/PlaySurface.tsx`, `src/components/ritual/PlayGuidancePanel.tsx` |
| An Experience must be placed into a Memory immediately. | Automated | Prompt resolution creates the prompt run and Memory entry transactionally. | `supabase/migrations/0013_prompt_created_characters.sql`, `src/lib/chronicles/resolvePrompt.ts` |
| A Memory may contain up to 3 Experiences. | Automated | Append logic rejects a fourth entry, and full Memories are disabled in the placement UI. | `supabase/migrations/0013_prompt_created_characters.sql`, `src/components/ritual/MemoryPlacementPanel.tsx`, `tests/integration/archive-rules.test.ts` |
| The vampire may have up to 5 active Memories in mind. | Automated | In-mind Memory slots are limited to 1-5; overflow is required once all five are occupied. | `supabase/migrations/0002_core_gameplay_schema.sql`, `supabase/migrations/0013_prompt_created_characters.sql`, `src/components/ritual/MemoryDecisionPanel.tsx` |
| If a new Experience fits an existing Memory, it may be added there. | Automated | The player can append to an in-mind Memory that is not full; the backend confirms it is still in mind and under capacity. | `src/components/ritual/MemoryPlacementPanel.tsx`, `supabase/migrations/0013_prompt_created_characters.sql`, `tests/integration/archive-rules.test.ts` |
| If a new Experience does not fit and all five in-mind slots are occupied, the player chooses what to forget or move to the Diary. | Automated | The UI requires a forget-or-Diary decision before creating a new Memory at capacity. | `src/components/ritual/MemoryDecisionPanel.tsx`, `src/components/ritual/PlaySurface.tsx`, `supabase/migrations/0013_prompt_created_characters.sql` |
| Forgetting is a player choice, not a conscious vampire choice. | Manual | The UI's framing supports the mood, but this distinction is narrative rather than mechanical. | `src/components/ritual/MemoryDecisionPanel.tsx` |
| Forgotten Memories remain readable. | Automated | Forgotten Memories remain stored with `location = 'forgotten'` and appear in the archive. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`, `src/components/archive/MemoryCard.tsx` |
| Lost or forgotten Memories may later be restored, swapped, rewritten, or merged by prompts. | Missing | The app has no first-party flow for prompt-specific Memory restoration, swapping, rewriting, merging, or conversion to Skill. | `src/components/archive/MemoryCard.tsx`, `src/components/ritual/PlaySurface.tsx`, `supabase/seed.sql` |

#### Memory assessment

This remains the strongest implemented rules cluster. The main caveat is that the app implements the standard memory-pressure loop, not the full set of prompt-specific Memory exceptions found in the prompt catalog.

### 4. Diary Rules

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The vampire may have one Diary at a time. | Automated | A unique active-Diary index and helper function prevent multiple active Diaries per chronicle. | `supabase/migrations/0002_core_gameplay_schema.sql`, `supabase/migrations/0009_diary_capacity.sql` |
| The player may create a Diary when they need to move a Memory into it. | Partial | The app creates an active Diary during `move-to-diary`, but it is auto-named `The Diary` and not described by the player. | `supabase/migrations/0009_diary_capacity.sql`, `src/components/ritual/MemoryDecisionPanel.tsx` |
| Creating a Diary adds it to the Resource list. | Missing | Diaries are stored in a separate `diaries` table and do not create a corresponding Resource row. | `supabase/migrations/0002_core_gameplay_schema.sql`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| A Diary must contain at least one Memory. | Automated | The normal flow only creates a Diary as part of moving a Memory into it. | `supabase/migrations/0009_diary_capacity.sql` |
| A Diary may hold up to 4 Memories. | Automated | `memory_capacity` defaults to 4, and overflow rejects moves into a full active Diary. | `supabase/migrations/0009_diary_capacity.sql`, `tests/integration/archive-rules.test.ts`, `tests/integration/gameplay-rpc-guards.test.ts` |
| A Memory moved to the Diary is no longer in the vampire's head. | Automated | Moving to Diary clears `slot_index` and sets `location = 'diary'`. | `supabase/migrations/0009_diary_capacity.sql` |
| Once in the Diary, a Memory cannot gain new Experiences. | Automated | Append targets must be in-mind Memories. | `supabase/migrations/0013_prompt_created_characters.sql`, `tests/integration/archive-rules.test.ts` |
| If the Diary is lost, the Memories in it are lost too. | Missing | `diary_status = 'lost'` exists, but there is no UI, route, helper, or cascade that loses stored Memories. | `supabase/migrations/0002_core_gameplay_schema.sql`, absence of a diary-loss handler |
| The vampire accepts the contents of the Diary as truth. | Manual | The app stores Diary Memories, but this is narrative guidance for the player. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |

### 5. Skills

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Skills are named capabilities tied to context. | Partial | Skills are modeled and displayed, but guided setup only asks for one starting Skill. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| A Skill may be checked once. | Partial | The state model has `checked`, and the Skill/Resource rules panel offers only active Skills for checking. Coverage remains partial because the player declares the required prompt action. | `src/types/chronicle.ts`, `src/components/ritual/SkillResourceChangePanel.tsx`, `src/lib/chronicles/skillResourceRules.ts` |
| Losing a Skill strikes it out but keeps it readable. | Partial | `lost` is modeled, visible in the ledger, and available in the Skill/Resource rules panel when a prompt requires Skill loss. Coverage remains partial because prompt parsing is still manual. | `src/app/api/chronicles/[chronicleId]/skills/[skillId]/route.ts`, `src/components/archive/TraitItem.tsx`, `src/components/ritual/SkillResourceChangePanel.tsx` |
| Checked Skills flavor later prompt answers. | Manual | The app can show checked Skills, but using them as later narrative color is player judgment. | `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Prompts can create new Skills during play. | Partial | The play surface can persist one new Skill transactionally. Base Prompt 1 is specifically guided and required by `getPromptEffectByPosition`; other prompt-required Skills rely on the player opening the optional composer. | `src/lib/prompts/effects.ts`, `src/components/ritual/PromptSkillComposer.tsx`, `src/components/ritual/PlaySurface.tsx`, `supabase/migrations/0010_prompt_created_skills.sql` |

### 6. Resources

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Resources are named assets that matter mechanically. | Partial | Resources are modeled and displayed, but guided setup only asks for one starting Resource. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Resources can be stationary. | Partial | `is_stationary` is modeled and visible, but guided setup does not expose a stationary/portable choice for the first Resource. Prompt 4 does require a stationary Resource. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx`, `src/lib/prompts/effects.ts`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Losing a Resource strikes it out but keeps it readable. | Partial | `lost` is modeled, visible, and available in the Skill/Resource rules panel when a prompt requires Resource loss or a legal substitution spends a Resource. Coverage remains partial because prompt parsing is still manual. | `src/app/api/chronicles/[chronicleId]/resources/[resourceId]/route.ts`, `src/components/archive/TraitItem.tsx`, `src/components/ritual/SkillResourceChangePanel.tsx` |
| Not every fictional possession must be a Resource. | Manual | This remains a player judgment call. | `src/components/ritual/PlaySurface.tsx` |
| Prompts can create new Resources during play. | Partial | The play surface can persist one new Resource transactionally. Base Prompt 4 is specifically guided and required as stationary; other prompt-required Resources rely on the player opening the optional composer. | `src/lib/prompts/effects.ts`, `src/components/ritual/PromptResourceComposer.tsx`, `supabase/migrations/0011_prompt_created_resources.sql` |

### 7. Characters

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Characters are named and described. | Automated | Characters are modeled and shown in the ledger. | `supabase/migrations/0002_core_gameplay_schema.sql`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Characters may be Mortal or Immortal. | Automated | `character_kind` is modeled and displayed. | `supabase/migrations/0002_core_gameplay_schema.sql`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Character descriptions may accumulate detail over time. | Partial | The ledger editor lets the player revise descriptions after the fact, but active prompt resolution does not prompt for accumulated detail. | `src/components/archive/CharacterEditor.tsx`, `src/app/api/chronicles/[chronicleId]/characters/[characterId]/route.ts` |
| If a prompt requires a Character and none is available, create one. | Partial | The play surface can create a new Character, but it is optional and prompt text is not parsed to require it when needed. | `src/components/ritual/PromptCharacterComposer.tsx`, `src/components/ritual/PlaySurface.tsx`, `supabase/migrations/0013_prompt_created_characters.sql` |
| Mortals occasionally die of old age. | Manual | The player can mark Characters dead in the ledger, but there is no cadence, reminder, or automation every four or five prompts. | `src/components/archive/CharacterEditor.tsx`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Characters cannot otherwise be killed unless a prompt says so. | Manual | The app cannot know whether a prompt authorized death; the ledger editor allows status changes at any time. | `src/components/archive/CharacterEditor.tsx`, `src/app/api/chronicles/[chronicleId]/characters/[characterId]/route.ts` |

### 8. Marks

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The vampire carries a Mark throughout existence. | Partial | Marks are stored durably, but the app also has an `is_active`/dormant state not described by the source rules. | `supabase/migrations/0002_core_gameplay_schema.sql`, `src/components/archive/MarkEditor.tsx` |
| The player should consider whether the Mark is concealed. | Partial | Concealment is modeled and editable in the ledger, but setup defaults the starting Mark to concealed and does not ask the player. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts`, `src/components/archive/MarkEditor.tsx` |
| Prompts may change a Mark. | Partial | Existing Marks can be edited through the ledger and hidden `traitMutations`, but active play has no existing-Mark mutation control. | `src/components/archive/MarkEditor.tsx`, `src/lib/validation/play.ts`, `src/components/ritual/PlaySurface.tsx` |
| Prompts may create a new Mark. | Partial | The play surface can create a new Mark, but it is optional and prompt text is not parsed to require it. | `src/components/ritual/PromptMarkComposer.tsx`, `supabase/migrations/0012_prompt_created_marks.sql` |

### 9. What Counts as a Vampire

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The vampire should prey on humans, camouflage itself, have once been human, be vulnerable to dangers like sunlight, be practically immortal, and be mostly a loner. | Manual | These are thematic assumptions. The app can invite this tone, but it does not validate vampire ontology. | `src/components/ritual/SetupStepper.tsx`, `src/components/ritual/PlaySurface.tsx` |
| The game is not tuned for complex immortal faction politics. | Manual | This is player-facing premise guidance, not an app-enforced constraint. | `src/components/ritual/PlaySurface.tsx`, `docs/product-vision.md` |

### 10. Setup: Creating the Vampire

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Imagine a person in the distant past and summarize their mortal life. | Partial | The app collects `mortalSummary`, but it does not require explicit birthplace, era, original identity, or that the summary become the first Memory Experience. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts`, `supabase/migrations/0013_prompt_created_characters.sql` |
| Start with one first Memory containing that mortal-life Experience. | Partial | The setup API can create setup Memories, but the UI only collects one freeform Memory and does not tie it structurally to `mortalSummary`. | `src/components/ritual/SetupStepper.tsx`, `src/lib/chronicles/setup.ts` |
| Create at least 3 Mortal Characters. | Partial | The backend accepts 1-8 initial Characters, but the UI collects exactly one Mortal in normal setup. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx` |
| Create 3 Skills. | Partial | The backend accepts 1-8 initial Skills, but the UI collects exactly one Skill in normal setup. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx` |
| Create 3 Resources. | Partial | The backend accepts 1-8 initial Resources, but the UI collects exactly one Resource in normal setup. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx` |
| Create 3 more Experiences, each in a separate Memory, combining existing traits. | Partial | The backend accepts multiple setup Memories, but the UI collects one and does not scaffold the trait-combination exercise. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx` |
| Create 1 Immortal who made the vampire. | Automated | The setup flow collects one Immortal. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts` |
| Create 1 Mark. | Automated | The setup flow collects one Mark label and description. | `src/components/ritual/SetupStepper.tsx`, `src/lib/validation/setup.ts` |
| Create an Experience explaining the becoming-undead moment and the Mark. | Partial | The player can write this in the one Memory field, but the UI does not require a distinct turning Experience. | `src/components/ritual/SetupStepper.tsx` |
| Finish setup with 5 Memories, 3 Skills, 3 Resources, at least 3 Mortals, 1 Immortal, and 1 Mark. | Partial | The backend can accept enough entries to represent this state, but normal setup produces a smaller onboarding state and validation does not require the book minimums. | `src/lib/validation/setup.ts`, `src/components/ritual/SetupStepper.tsx`, `tests/integration/chronicle-validation.test.ts` |
| Begin play at the first prompt. | Automated | The app sets current prompt number and encounter to `1.1`; the supplied rules text does not explicitly define a starting prompt number, so this is a product interpretation. | `supabase/migrations/0013_prompt_created_characters.sql`, `docs/thousand-year-old-vampire-rules-spec.md` |

#### Setup assessment

Setup is still the clearest mismatch between source rules and the current first-party product. The backend shape is more permissive than the UI, but normal players are guided into a deliberately lighter starting state.

### 11. Prompt Play Loop and Prompt Movement

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The current prompt is presented to the player. | Automated | The play page loads the prompt from `prompt_catalog` by current prompt number, encounter index, and prompt version. | `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`, `src/lib/prompts/catalog.ts` |
| The player answers the prompt and records chronology. | Automated | Prompt runs store prompt number, encounter index, prompt markdown, player entry, Experience text, rolls, movement, and creation time. | `supabase/migrations/0013_prompt_created_characters.sql`, `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| Roll `d10` and `d6`, then move by `d10 - d6`. | Automated | The RPC rolls, computes `movement`, stores it, and updates current prompt state. | `supabase/migrations/0013_prompt_created_characters.sql` |
| Positive movement goes forward, negative goes backward, `0` repeats the prompt. | Automated | The RPC applies signed movement and same-prompt encounter advancement. It also clamps below prompt 1, which is a product interpretation. | `supabase/migrations/0013_prompt_created_characters.sql`, `tests/integration/gameplay-rpc-guards.test.ts` |
| Prompts have repeated entries based on repeated encounters. | Automated | Encounter index is loaded from `prompt_catalog` and derived from prior prompt runs. | `src/lib/prompts/catalog.ts`, `supabase/migrations/0013_prompt_created_characters.sql` |
| If a prompt has no remaining entry, move to the next prompt. | Automated | The app scans forward until it finds an available entry. The source does not define direction-sensitive skip behavior, so this is a product interpretation. | `supabase/migrations/0013_prompt_created_characters.sql`, `tests/integration/gameplay-rpc-guards.test.ts` |
| Prompt entries should be numbered chronologically. | Automated | The archive keeps chronological prompt history without asking the player to number entries manually. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| Prompt-specific trait gains, losses, checks, conversions, and special instructions happen during resolution. | Partial | New trait creation and player-declared Skill/Resource changes are available, but the app still does not parse prompt text into every required trait effect. | `src/components/ritual/PromptCard.tsx`, `src/components/ritual/PlaySurface.tsx`, `src/components/ritual/SkillResourceChangePanel.tsx`, `src/lib/validation/play.ts` |
| The player does not have to answer every question in a prompt. | Manual | Freeform writing allows this; the app does not inspect whether every sub-question was answered. | `src/components/ritual/PlaySurface.tsx` |

### 12. Skill and Resource Substitution Rules

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| If asked to check a Skill and none are available, lose a Resource instead. | Partial | The play surface lets the player declare that the prompt requires a Skill check; the shared rules helper detects when no unchecked Skill is available, offers Resource loss as the only legal substitution, and the resolve route validates the mutation against current ledger state. The app still does not parse prompt text into this requirement automatically. | `src/components/ritual/SkillResourceChangePanel.tsx`, `src/lib/chronicles/skillResourceRules.ts`, `src/app/api/chronicles/[chronicleId]/play/resolve/route.ts`, `tests/integration/skill-resource-rules.test.ts` |
| If asked to lose a Resource and none are available, check a Skill instead. | Partial | The same player-declared rules panel substitutes an unchecked Skill when no Resource can be lost, and route validation converts that choice into a Skill check mutation. Prompt parsing remains manual. | `src/components/ritual/SkillResourceChangePanel.tsx`, `src/lib/chronicles/skillResourceRules.ts`, `tests/integration/setup-flow.test.tsx` |
| Only Skills and Resources may substitute for each other. | Partial | The substitution helper exposes only Skill and Resource targets and rejects illegal action/target combinations before prompt resolution. This is enforced for the new panel, but not for arbitrary prompt instructions the app does not yet understand. | `src/lib/chronicles/skillResourceRules.ts`, `src/app/api/chronicles/[chronicleId]/play/resolve/route.ts` |
| When substitution occurs, narrate the worst possible outcome. | Partial | Substitution choices require a dedicated worst-outcome narration before submission. The text remains player-authored, as in the source rules. | `src/components/ritual/SkillResourceChangePanel.tsx`, `src/components/ritual/PlaySurface.tsx`, `tests/integration/setup-flow.test.tsx` |
| If no legal Skill/Resource substitution remains, the game ends. | Partial | When a declared Skill/Resource requirement has no legal primary or substitute target, the play surface exposes a demise narration flow and a completion endpoint marks the chronicle completed. The app still relies on the player to identify that the current prompt requires the exhausted change. | `src/components/ritual/SkillResourceChangePanel.tsx`, `src/app/api/chronicles/[chronicleId]/play/end/route.ts`, `tests/integration/setup-flow.test.tsx` |
| Losing a Skill with no Skill available ends the game. | Partial | Required Skill loss does not substitute to Resource loss; when no Skill can be lost, the same no-legal-action completion flow is available. | `src/lib/chronicles/skillResourceRules.ts`, `src/components/ritual/PlaySurface.tsx` |

### 13. End Conditions

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| The game ends if a prompt explicitly says so. | Missing | Prompt text includes game-over prompts, but the app does not parse them into chronicle completion. | `supabase/seed.sql`, `src/components/ritual/PromptCard.tsx`, `supabase/migrations/0013_prompt_created_characters.sql` |
| The game ends if the player cannot legally satisfy a required Skill/Resource change. | Partial | The new player-declared Skill/Resource panel can detect exhaustion and complete the chronicle, but the app does not yet parse prompt text to trigger this automatically. | `src/lib/chronicles/skillResourceRules.ts`, `src/app/api/chronicles/[chronicleId]/play/end/route.ts`, `src/components/ritual/PlaySurface.tsx` |
| On a forced game end, the player narrates the vampire's demise using the prompt for inspiration. | Partial | The exhausted Skill/Resource flow now requires demise narration before completing the chronicle, but explicit game-ending prompts still have no dedicated prompt-parsed demise flow. | `src/components/ritual/PlaySurface.tsx`, `src/app/api/chronicles/[chronicleId]/play/end/route.ts` |

### 14. Two Styles of Play

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Quick Game: resolve directly in the Memory area without a separate journal. | Intentionally Unsupported | The app requires both `playerEntry` and `experienceText`, favoring a journaling/archive experience. | `src/lib/validation/play.ts`, `src/components/ritual/PlaySurface.tsx`, `docs/product-vision.md` |
| Journaling Game: keep a journal entry plus an Experience. | Automated | The current play surface requires a larger player entry and a distilled Experience. | `src/components/ritual/PlaySurface.tsx`, `src/lib/validation/play.ts`, `supabase/migrations/0013_prompt_created_characters.sql` |
| Memories and Experiences take precedence over journal detail. | Partial | Memories and prompt entries are structurally separate, but the precedence rule is not surfaced as a rules reminder. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| Earlier journal entries may be modified or ignored later. | Partial | The player can mentally ignore or reinterpret older entries, but the app does not support retroactive journal editing; that appears aligned with the archive-first product direction. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`, `docs/product-vision.md` |
| Memories may not be modified unless a prompt says so. | Partial | Memories are effectively read-only in the UI, which covers the prohibition, but prompt-specific rewrite permissions are also unsupported. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`, `src/components/archive/MemoryCard.tsx` |

### 15. Answering Prompts, Time, and Narrative Guidance

| Rule from source text | Status | Assessment | Evidence |
| --- | --- | --- | --- |
| Answer prompts naturally rather than force continuity. | Manual | Entirely player-judged. | `src/components/ritual/PlaySurface.tsx` |
| Use existing traits and past events when relevant. | Manual | Archive and ledger make this possible, but the app does not validate it. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`, `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx` |
| Not every prompt answer needs to matter equally. | Manual | Player judgment only. | `src/components/ritual/PlaySurface.tsx` |
| The player may reinterpret earlier journal details gently. | Manual | Possible as player interpretation, but not supported by editing tools. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| The vampire's life should span loose centuries. | Manual | The app stores real creation timestamps, not fictional dates or eras. | `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` |
| Mortals should occasionally die of old age, roughly every four or five prompts. | Manual | No cadence, reminder, or automation exists. | `src/components/archive/CharacterEditor.tsx` |
| Historical events and changing society should be worked in when useful. | Manual | The player must do this in prose. | `src/components/ritual/PlaySurface.tsx` |
| The first seven or eight prompts usually cover the early undead years. | Manual | No fictional-time tracker exists. | `src/components/ritual/PlaySurface.tsx` |
| The player should allow discomfort, predation, moral ugliness, loose ends, and unresolved events. | Manual | The app's tone supports this, but it is not enforceable. | `src/components/ritual/SafetyCheckpointPanel.tsx`, `src/components/ritual/PlaySurface.tsx` |

## Biggest Rule Gaps

These are the highest-value mismatches between the source rules and the current product.

| Gap | Why it matters now |
| --- | --- |
| Guided setup does not produce the book's required starting state | A player who only follows the first-party setup flow starts with a simpler chronicle than the source rules describe. |
| Prompt instructions are not parsed or enforced | Most checks, losses, conversions, restorations, swaps, deaths, and special cases remain manual or impossible to record faithfully. |
| Skill/Resource substitution is player-declared rather than prompt-parsed | The core substitution pressure now exists, but the player still tells the app which Skill/Resource rule the current prompt requires. |
| Diary is not a normal Resource and cannot be lost | The app covers Diary capacity but not the full Diary risk loop. |
| End-game flow is narrow | Exhausted Skill/Resource changes can complete a chronicle, but explicit game-ending prompts and broader demise flows are still unsupported. |

## Areas That Are Already Quite Faithful

The current build is closest to the source text in these places:

| Area | What is already faithful |
| --- | --- |
| Prompt navigation | Prompt number, encounter index, repeated encounters, and dice movement are durable state, not client-only guesswork. |
| Memory stack | Three-Experience Memory limit, five in-mind Memory slots, forgetting, Diary movement, and Diary capacity are backed by transactional database logic. |
| Archive readability | Forgotten Memories remain readable, prompt history is preserved, and the ledger keeps visible state for traits. |
| Written journaling flow | The app's `playerEntry` plus `experienceText` split maps well to the book's journaling-game style. |

## Final Assessment

If the question is "can a player use the app today to play a recognizable slice of *Thousand Year Old Vampire*?", the answer is yes.

If the question is "are all rules from the supplied source text covered either by app code or by normal manual player action inside the app?", the answer is no.

The app covers the **memory-and-movement backbone** much more completely than it covers the **full trait economy, book-faithful setup, prompt-instruction parsing, Diary-as-Resource handling, prompt-specific exceptions, and broad end-state rules**. It is a strong ritual shell and archive engine with a real Skill/Resource substitution loop, but not yet a full rules-complete digital edition.
