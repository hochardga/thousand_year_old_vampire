# UAT Report - April 25, 2026 Second Pass

## Scope

Performed a fresh UAT pass against the current PR branch in test-auth/mock mode.

Covered:

- Sign-in and chronicle creation
- Guided setup through all six thresholds
- Prompt 1 resolution with required `Bloodthirsty` skill guidance
- Prompt 4 resolution with required stationary resource guidance
- Prompt advancement after Prompt 4
- Ledger, archive, recap, and beta feedback
- Focused regression tests and full verification

Environment:

- Worktree: `/Users/gregoryhochard/.codex/worktrees/f73f/thousand_year_old_vampire`
- Local URL: `http://localhost:3000`
- Runtime flags: `ENABLE_TEST_AUTH=1 TYOV_E2E_MOCKS=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=e2e-anon-key`
- Browser pass used a narrow/mobile-like Chromium viewport.

## Verification Summary

| Check | Result | Notes |
| --- | --- | --- |
| Browser UAT script | Passed | Setup, two prompt resolutions, ledger, archive, recap, and feedback completed. |
| Focused regression tests | Passed | 26 files, 140 tests during targeted integration run. |
| `npm run lint` | Passed | ESLint completed cleanly. |
| `npm run test` | Passed | 26 files, 140 tests. |
| `npm run test:e2e` | Passed | 5 Chromium tests. |
| `npm run build` | Passed | Next.js production build completed. |
| `npm audit --audit-level=moderate` | Known advisory remains | Moderate Next/PostCSS advisory; force fix would install `next@9.3.3`. |

## Findings Addressed

### P1 - Mock prompt progression looped Prompt 4 back to Prompt 4

After resolving Prompt 4 in mock mode, the consequence panel still said `Continue to prompt 4`. This made the second prompt resolution feel like another stale-state loop, even though the client stale-result fix was working.

Cause:

- `src/lib/supabase/e2e.ts` hard-coded every prompt resolution to next prompt 4.
- The mock prompt catalog only included Prompt 1 and Prompt 4, so it could not represent the next step in this UAT path.

Fix:

- Added Prompt 7 to the mock prompt catalog.
- Replaced hard-coded mock progression with a small next-prompt resolver aligned with the SQL RPC behavior.
- Added integration coverage that resolves Prompt 1 to Prompt 4, then Prompt 4 to Prompt 7.

### P2 - Archive showed setup memory entries as pending in mock mode

The archive showed the setup memory title, but displayed `Entry text pending` even though setup saved the memory entry text.

Cause:

- The E2E mock query layer did not understand nested selects such as `memory_entries(id, position, entry_text)`.
- The archive route was asking for the right data, but the mock returned memories without joined entries.

Fix:

- Added nested select parsing for `memory_entries(...)` in the E2E mock.
- Added integration coverage that completes setup and verifies archive-style memory queries include joined entries.

### P2 - Archive and recap chrome still exposed encounter notation

The generated recap prose had been cleaned up, but archive and recap chrome still displayed `Current place: prompt 4.1`.

Cause:

- `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx` and `src/components/ritual/RecapBlock.tsx` still rendered prompt number plus encounter index.

Fix:

- Updated both surfaces to render `Current place: Prompt N`.
- Added page-level integration assertions for archive and recap.

## Passed UAT Checks

- Prompt 1 requirement guidance appeared and pre-filled `Bloodthirsty`.
- Prompt 1 success hid the writing form and advanced cleanly to Prompt 4.
- Prompt 4 requirement guidance appeared and preselected `Stationary`.
- Prompt 4 success advanced cleanly to Prompt 7.
- Current-state memory count refreshed from 2 memories on Prompt 4 to 3 memories on Prompt 7.
- Ledger showed setup-created characters and marks plus prompt-created skill/resource.
- Archive showed setup and prompt memory entry text without `0 entries kept here` or pending copy.
- Recap avoided encounter notation and mechanical movement prose.
- Feedback expansion and submission completed successfully.

## Remaining Known Issue

The dependency audit advisory remains tracked upstream:

- `postcss <8.5.10`
- Advisory: `GHSA-qx2v-qp2m-jg93`
- `npm audit fix --force` suggests installing `next@9.3.3`, which is not an appropriate fix path for this app.
