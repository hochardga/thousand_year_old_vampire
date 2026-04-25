# UAT Report Fixes Design

## Context

The April 25 UAT report covers a complete local test-auth playthrough. The actionable issues fall into five groups: stale play-state after prompt resolution, setup-created ledger data missing from the mock path, archive and recap copy that undermines the reading surface, prompt-effect guidance that is too generic for known prompts, and small accessibility/lint/audit hygiene items.

## Chosen Approach

Implement one cohesive UAT stabilization pass rather than splitting P1 and P2 findings into separate branches. This keeps the tested journey coherent: setup data appears in the ledger, prompt resolution has one clear post-submit state, archive/recap pages read as player-facing surfaces, and known prompt requirements are surfaced before submission.

The dependency audit finding will be documented in the report as intentionally tracked upstream. The forced audit fix is out of scope because it would install an incompatible dependency path.

## Behavior Design

After a prompt resolves successfully, the writing form becomes inactive and the consequence panel becomes the single next action. The link refreshes the play route into the next prompt and the current-state memory count is recalculated from server data. Client-side result state is also cleared when the active prompt/session changes.

Setup completion persists the initial mortal character, immortal maker, mark, skills, resources, and memories in both the SQL implementation and the E2E mock. The ledger should show those setup-created characters and marks immediately after setup.

Archive memory cards should never imply missing writing when the memory has no joined entries. Prompt-created memories continue to store their entry text; if an entry join is absent, the card uses neutral language instead of saying zero entries were kept.

Recap prose should hide encounter indexes and movement arithmetic. It should say the chronicle waits at Prompt N, then summarize recent concrete experience text and deduplicated non-generic archive changes.

Known prompt effects are handled with a small base-catalog helper, not a full rules engine. Prompt 1 highlights the required Bloodthirsty skill and can prefill the prompt-created skill composer. Prompt 4 highlights a stationary resource requirement and preselects stationary when the resource composer opens.

Setup keeps one page-level `h1`; setup step headings become `h2`. The play-surface draft persistence warning is resolved by stabilizing the draft sync callback.

## Testing

Add or update integration tests for play-surface post-submit state, setup route/mock persistence, archive memory-card fallback language, recap copy, prompt-effect guidance, and setup heading hierarchy. Update E2E coverage so the first-session flow verifies the stale consequence panel disappears after continuing and the memory count refreshes.

Run lint, unit/integration tests, E2E tests, build, and audit. Audit may remain blocked by the upstream Next/PostCSS advisory and should be reported explicitly.
