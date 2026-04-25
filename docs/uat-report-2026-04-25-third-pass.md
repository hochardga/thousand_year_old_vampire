# UAT Report - April 25, 2026 Third Pass

## Scope

Performed a fresh UAT pass against the current PR branch in local test-auth/mock mode.

Covered:

- Testing-only sign-in and chronicle creation
- Guided setup through the safety checkpoint
- Prompt 1 requirement guidance and required skill capture
- Prompt 4 requirement guidance and required stationary resource capture
- Prompt advancement from Prompt 1 to Prompt 4 to Prompt 7
- Ledger, archive, recap, resume, and beta feedback flows
- Full local verification after fixes

Environment:

- Worktree: `/Users/gregoryhochard/.codex/worktrees/f73f/thousand_year_old_vampire`
- Local URL: `http://localhost:3000`
- Runtime flags: `ENABLE_TEST_AUTH=1 TYOV_E2E_MOCKS=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=e2e-anon-key`
- Browser pass used a narrow/mobile-like Chromium viewport.

## Verification Summary

| Check | Result | Notes |
| --- | --- | --- |
| Browser UAT script | Passed after fixes | Setup, two prompt resolutions, prompt-created skill/resource capture, ledger, archive, recap, resume, and feedback completed. |
| `npm run lint` | Passed | ESLint completed cleanly. |
| `npm run test` | Passed | 26 files, 140 tests. |
| `npm run test:e2e` | Passed | 5 Chromium tests. |
| `npm run build` | Passed | Next.js production build completed. |
| `npm audit --audit-level=moderate` | Known advisory remains | Moderate Next/PostCSS advisory; force fix would install `next@9.3.3`. |

## Finding Addressed

### P1 - Required prompt-created traits could be bypassed

Prompt 1 and Prompt 4 displayed requirement guidance, but the related prompt-created skill/resource fields remained collapsed. A player could submit Prompt 1 without recording `Bloodthirsty`, and Prompt 4 without recording a stationary shelter resource. In mock mode this meant the ledger lacked the required prompt-created trait even though the prompt text said it was required.

Cause:

- `PlaySurface` only prefilled known prompt effects after the player manually opened the composer.
- The submit path only validated prompt-created skill/resource details when the composer was already open.
- The E2E journeys had been resolving these prompts without filling the required prompt-created details.

Fix:

- Known prompt effects now open their relevant composer by default.
- Prompt 1 prefills `Bloodthirsty` and requires the player to explain why the skill now exists.
- Prompt 4 preselects `Stationary` and requires the player to name and explain the sheltering resource.
- Required prompt-effect composers cannot be removed while the prompt requires them.
- Integration coverage now proves the required fields are visible and block submission until completed.
- E2E coverage now fills the required skill/resource details and verifies the corrected journey.

## Passed UAT Checks

- Safety checkpoint appeared before the first prompt.
- Prompt 1 showed Bloodthirsty guidance, prefilled `Bloodthirsty`, and marked the field as required.
- Prompt 1 success hid the writing form and advanced to Prompt 4.
- Prompt 4 showed stationary resource guidance, opened the resource composer, and preselected `Stationary`.
- Prompt 4 success advanced to Prompt 7.
- Memory counts refreshed from 2 memories on Prompt 4 to 3 memories on Prompt 7.
- Ledger showed setup-created skill/resource and prompt-created `Bloodthirsty` plus the stationary refuge.
- Archive showed setup and prompt memory entry text without pending or zero-entry copy.
- Archive and recap avoided internal encounter notation.
- Recap avoided mechanical dice/movement prose and resumed back to Prompt 7.
- Beta feedback submission completed successfully.

## Remaining Known Issue

The dependency audit advisory remains tracked upstream:

- `postcss <8.5.10`
- Advisory: `GHSA-qx2v-qp2m-jg93`
- `npm audit fix --force` suggests installing `next@9.3.3`, which is not an appropriate fix path for this app.
