# AGENTS.md

- Never create draft pull requests.
- Any pull request opened from this repository must be ready for review.
- If a draft pull request already exists, convert it to ready before finishing the task.

## Superpowers Auto-Answer Defaults

- For routine Superpowers process questions, apply these defaults instead of asking again unless the current session says otherwise.
- Default `Yes` to the visual companion/browser offer.
- Default `Looks right` for low-risk design-approval checkpoints once the overall direction is established.
- When Superpowers presents options and explicitly recommends one, choose the recommended option.
- Prefer repo-local `.worktrees/` when asked where to create a worktree.
- If a plan is complete and the next question is whether to execute it, continue into execution.
- After successful implementation, prefer pushing the branch and opening a ready-for-review pull request.
- Do not auto-answer when the choice affects release posture, legal scope, monetization, destructive migrations, or naming/brand decisions, or when the current session clearly indicates a different preference.

## Superpowers Repo Preferences

- Prefer the richer, more polished ritual experience over the leanest acceptable slice.
- Prefer real end-to-end Supabase integration over temporary demo-only fallbacks.
- Prefer server-rendered, reading-first surfaces for archive, ledger, and recap routes.
- Prefer inline guidance during setup plus one deliberate safety checkpoint before the first prompt.
- Prefer forward-compatible, backend-enforced solutions over narrow UI-only guards.
