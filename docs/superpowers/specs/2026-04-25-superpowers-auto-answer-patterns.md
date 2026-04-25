# Superpowers Auto-Answer Patterns

Date: 2026-04-25

## Scope

This analysis is based on local Codex session logs under `~/.codex/sessions` for threads whose names mention `superpower` or `using-superpowers`.

- 41 indexed Superpowers-related sessions
- 157 assistant-question -> user-answer pairs from available session logs
- 58 question/answer pairs specifically tied to `thousand_year_old_vampire`

The goal is not to guess product decisions universally. The goal is to separate:

1. high-confidence process answers that the user repeats often enough to automate
2. repo-specific product preferences that can be reused when a future question matches the same decision shape

## High-Confidence Process Patterns

These are the safest candidates for automatic answers because the user answered them the same way repeatedly across sessions.

### 1. Visual companion opt-in: default to `Yes`

Repeated question:

> "Some of what we're working on might be easier to explain if I can show it to you in a web browser... Want to try it?"

Observed answers:

- Overall: 10 direct `yes/Yes` answers out of 12
- `thousand_year_old_vampire`: 4 positive answers out of 5

Suggested auto-answer:

- `Yes`

Exception:

- Do not auto-answer `Yes` if the session already indicates the chat is being restarted or the browser flow is broken.

### 2. Design approval checkpoints: default to approval

Repeated question shape:

- `Does this ... look right so far?`
- `**Design: ...**`
- `**Section ...**`

Observed answers:

- Overall: 37 checkpoints, overwhelmingly `Looks right`, `Yes`, or `Approved`
- `thousand_year_old_vampire`: 22 checkpoints, overwhelmingly `Looks right`

Suggested auto-answer:

- `Looks right`

Interpretation:

- Once direction is established, the user rarely asks for revisions at each intermediate design checkpoint.

### 3. Recommended-option questions: choose the recommendation

Repeated question shape:

- `Recommended: ...`
- `I recommend option 1`
- `Here are the three viable ways...`

Observed answers:

- `thousand_year_old_vampire`: 6 clear recommended-option questions, all answered with option `1`
- Cross-project parseable sample: 3 out of 3 numeric answers matched the explicit recommendation

Suggested auto-answer:

- Pick the explicitly recommended option.

Interpretation:

- The user tends to let Superpowers choose the implementation path when the trade-off has already been framed well.

### 4. Worktree location: prefer repo-local `.worktrees/`

Repeated question shape:

- `Where should I create the isolated worktree?`

Observed answers:

- Overall: `1`, `project-local`, or `in the repo`
- `thousand_year_old_vampire`: both examples chose repo-local worktrees

Suggested auto-answer:

- Use `.worktrees/` inside the repo.

### 5. Post-implementation branch action: choose PR creation

Repeated question shape:

> "Implementation complete. What would you like to do?"

Observed answers:

- Overall: 7 of 8 answers selected option `2`
- The one variant still selected `2`, but added a note to remember that response pattern

Suggested auto-answer:

- `2`

Interpretation:

- The user's default finish preference is to push and open a PR rather than merge locally or leave the branch hanging.

Note for this repo:

- `AGENTS.md` requires ready-for-review PRs, never drafts.

### 6. Plan execution gate: continue immediately

Repeated question shape:

- `Ready to execute?`
- `Ready for me to execute the plan?`

Observed answers:

- Overall: every captured answer moved directly into execution, usually by invoking `$executing-plans`

Suggested auto-answer:

- Continue into execution immediately.

## Session-Level Override Patterns

These are strong signals that later Superpowers prompts in the same session should be auto-approved or auto-answered.

Repeated user instructions found in logs:

- `Auto approve your recommendations for further prompts`
- `Auto approve and follow your recommendations`
- `For this brainstorming, I auto approve all of your recommendations`
- `I won't be able to respond to any prompts or questions`
- `go with whatever you recommend`

Suggested rule:

- If the user says any of the above, treat later recommendation-selection and design-approval questions in that session as implicitly approved unless the question introduces a new high-risk product trade-off.

## Repo-Specific Preference Patterns For `thousand_year_old_vampire`

These should not be treated as universal defaults across unrelated repos, but they are good candidate auto-answers when future questions in this repo match the same shape.

### Product and architecture preferences

- Prefer the richer, more polished ritual experience over the leanest acceptable slice.
- Prefer real end-to-end Supabase integration over temporary demo-only fallbacks.
- Prefer seeding the full local prompt source, not a minimal prompt subset.
- Prefer server-rendered, reading-first surfaces when the feature is archive/ledger/recap oriented.
- Prefer calmer compact UI treatments over louder or denser history displays.

### Guidance and onboarding preferences

- Favor inline guidance woven into setup over separate manuals.
- Add one deliberate safety checkpoint before the first prompt.
- Teach some underlying rules during setup rather than hiding all system logic.

### Scope and extensibility preferences

- Prefer forward-compatible solutions over the narrowest one-off fix.
- Prefer backend-enforced rule changes over UI-only guards.
- Prefer extending the main prompt-resolution flow instead of creating a detached side flow when the feature belongs to the same ritual action.

### Interaction details already chosen

- Keep the latest active chronicle in the main list even if it also appears in a top shortcut panel.
- When a prompt creates a new skill, ask for both the skill name and a short description.
- Show the "new skill" affordance as an optional reveal inside the play form rather than an always-visible field or a ledger detour.

## Practical Auto-Answer Strategy

### Safe to automate now

- Visual companion consent -> `Yes`
- Design checkpoint approval -> `Looks right`
- Explicitly recommended option -> choose recommended option
- Worktree location -> repo-local `.worktrees/`
- Execution gate after a plan -> continue
- Finish action after successful implementation -> create PR

### Safe only with repo memory

- Product-direction choices inside `thousand_year_old_vampire` when they match an already-decided preference above

### Do not automate blindly

- New product trade-offs with no prior equivalent
- Naming questions with multiple plausible brand consequences
- Questions that change release posture, legal stance, monetization, or irreversible data migration behavior

## Suggested Implementation Shape

The best structure is a two-layer policy:

1. **Global process defaults**
   Apply the high-confidence process rules above everywhere.
2. **Repo-scoped preference memory**
   Match future questions in this repo against previously chosen preference shapes, and only auto-answer when the new question is semantically close to an existing decision.

If no high-confidence match exists, ask the question normally.
