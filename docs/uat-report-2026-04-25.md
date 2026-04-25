# UAT Report - April 25, 2026

## Scope

Performed a user acceptance pass against the local app in test-auth/mock mode.

Covered:

- Marketing landing page
- Sign-in and test-auth entry
- Chronicle creation
- Guided setup through all six thresholds
- First prompt resolution with prompt-created skill
- Subsequent prompt resolution with prompt-created stationary resource
- Archive, ledger, recap, and feedback expansion
- Automated verification, production build, and dependency audit

Environment:

- Worktree: `/Users/gregoryhochard/.codex/worktrees/e981/thousand_year_old_vampire`
- Local URL: `http://localhost:3000`
- Runtime flags: `ENABLE_TEST_AUTH=1 TYOV_E2E_MOCKS=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=e2e-anon-key`
- Browser pass used a narrow/mobile-like viewport in the Codex in-app browser.

## Verification Summary

| Check | Result | Notes |
| --- | --- | --- |
| `npm install` | Passed | Installed local dependencies. `npm audit` reports the tracked 2 moderate advisories. |
| `npm run lint` | Passed | React hooks dependency warning in `src/components/ritual/PlaySurface.tsx` is resolved. |
| `npm run test` | Passed | 26 test files, 138 tests. |
| `npm run test:e2e` | Passed | 5 Chromium e2e tests, including stale play-state and setup-ledger assertions. |
| `npm run build` | Passed | Production build completed successfully. |
| `npm audit --audit-level=moderate` | Failed | Tracked moderate PostCSS advisory via Next's nested dependency; suggested forced fix would install `next@9.3.3`, which is a breaking/inappropriate path. |

## Findings

### P1 - Play success panel remains stale after advancing to the next prompt

After resolving Prompt 1, the app shows an "Immediate consequence" success panel with a `Continue to prompt 4` link. Clicking it advances the server state to Prompt 4, but the success panel remains visible on the Prompt 4 screen and still says `Continue to prompt 4`.

Why this matters:

- It makes the user wonder whether they have actually advanced.
- It creates a loop-like call to action on the current prompt.
- It leaves stale success copy mixed with the next active writing surface.

Observed path:

1. Complete setup.
2. Resolve Prompt 1.
3. Click `Continue to prompt 4`.
4. Prompt heading updates to `Prompt 4`, but the old consequence panel remains with `Continue to prompt 4`.

Likely area:

- `src/components/ritual/PlaySurface.tsx` keeps the client-side `result` state after the route refresh/advance.
- `src/components/ritual/ConsequencePanel.tsx` links back to the same play route without enough prompt/session context to suppress stale consequence UI.

Recommendation:

- Clear the consequence/result state when the active prompt number changes, or redirect/navigate in a way that remounts the play surface after prompt advancement.
- Consider hiding the writing form once a prompt is successfully resolved until the user advances.

Resolution:

- Fixed in this branch. The post-resolve form is hidden, the consequence link performs a fresh navigation to the play route, and the client result state is cleared when the active prompt/session context changes.

### P1 - Current-state memory count is stale immediately after resolving a prompt

After resolving Prompt 1, the play route's `Current state` still displayed `1 memory held in mind` even though the archive later showed the setup memory plus the resolved prompt memory. After resolving Prompt 4, the play route still displayed `2 memories held in mind` while the archive showed 3 held memories.

Why this matters:

- Memory capacity is a core game mechanic.
- Users rely on this count before making overflow/diary decisions.
- The UI appears to contradict the successful resolution message.

Observed path:

1. Finish setup with one initial memory.
2. Resolve Prompt 1.
3. The success message appears, but `Current state` remains at 1.
4. Advance/visit archive and the added memory appears.
5. Resolve Prompt 4.
6. `Current state` remains at 2 while archive shows 3 memories.

Recommendation:

- Refresh/revalidate the memory summary after a successful resolve.
- If the product intentionally waits for the user to advance before recomputing state, adjust the success state copy so the pending update is clear.

Resolution:

- Fixed in this branch. Continuing after resolution reloads the play route from server state, so the `Current state` memory count reflects the newly created memory on the next prompt.

### P1 - Setup-created characters and marks do not appear in the ledger

During setup, the flow asks the player to record a mortal character, an immortal maker, and a mark. After completing setup and resolving prompts, the ledger showed skills and resources but displayed empty states for `Characters` and `Marks`.

Why this matters:

- The setup copy implies these details become part of the chronicle record.
- Prompt 1 asks the player to kill a mortal character, but the character entered during setup is not available in the ledger afterward.
- The ledger feels incomplete and may undermine trust in the setup flow.

Observed setup data:

- Mortal character: `Sister Elian`
- Immortal maker: `Lord Corvin`
- Mark: `Cold Reflection`

Observed ledger result:

- Skills: `Careful Listening`, `Bloodthirsty`
- Resources: `Abbey Cistern`
- Characters: empty state
- Marks: empty state

Recommendation:

- Ensure `complete_chronicle_setup` persists initial characters, immortal maker, and mark into the same tables read by the ledger.
- Add e2e coverage that completes setup and asserts characters/marks are visible on the ledger.

Resolution:

- Fixed in this branch for the test-auth/mock path that produced the UAT finding. The SQL RPC already persisted these rows; the E2E mock now persists setup-created resources, characters, immortal maker, and mark into the same mock tables read by the ledger, with E2E coverage for ledger visibility.

### P2 - Archive memory cards show "0 entries kept here" for memories created from entries

The archive memory stack showed each held memory with `0 entries kept here`, including memories created from resolved prompt experiences. The prompt history correctly showed the full player entry and experience text.

Why this matters:

- A memory card titled by the experience but claiming zero entries feels contradictory.
- The player may assume their writing was only partially saved.
- The archive is intended to be the trusted reading surface.

Observed archive examples:

- `The bell below the crypt` - `0 entries kept here`
- `The bell rang once each dawn until I forgot her voice.` - `0 entries kept here`
- `The cistern became a chapel for hunger and secrecy.` - `0 entries kept here`

Recommendation:

- Either store the corresponding entry text in `memory_entries`, or revise the memory-card language so a single-title memory does not imply missing content.
- Consider surfacing the prompt-run entry inside the memory card when the memory came from a resolved prompt.

Resolution:

- Fixed in this branch. Prompt-created memories continue to store memory entries, and the archive card now uses neutral fallback copy when an entry join is absent instead of claiming `0 entries kept here`.

### P2 - Recap copy exposes internal mechanics and reads awkwardly

The recap successfully summarized the session, but the generated prose included mechanical phrasing:

- `Current place: prompt 4.1`
- `Prompt 4.1 moved the chronicle forward by 3`
- `Prompt 1.1 moved the chronicle forward by 3`
- `The latest changes around the archive: The entry has been set into memory. The entry has been set into memory.`

Why this matters:

- The recap is a reading-first return surface; internal encounter/movement numbers break the tone.
- Repeated generic event summaries make the recap less useful than the prompt history.

Recommendation:

- Translate encounter/movement metadata into player-facing prose.
- Prefer the concrete prompt entry/experience over repeated generic archive event summaries.
- Consider "You are at Prompt 4" unless the encounter index is meaningful to the player.

Resolution:

- Fixed in this branch. Recap prose now says `Prompt N`, summarizes concrete prompt experiences, deduplicates archive changes, and filters repeated generic prompt-resolved event summaries when prompt runs are available.

### P2 - Prompt-required trait changes are not guided strongly enough

Prompt 1 instructs the user to `Take the skill Bloodthirsty`, and Prompt 4 instructs the user to create a stationary resource. The UI offers generic `Add a skill from this prompt` and `Add a resource from this prompt` controls, but it does not pre-fill, highlight, or enforce the specific instruction.

Why this matters:

- Users can easily miss mandatory prompt consequences.
- The app is supposed to carry rules burden while preserving authorship.
- This is especially important for prompts that instruct skill/resource/character/mark changes.

Recommendation:

- Parse or catalog prompt effects and make required actions explicit in the writing surface.
- For known prompt effects, pre-fill labels such as `Bloodthirsty` and pre-check `Stationary` where appropriate.
- If enforcement is out of scope, add inline confirmation that the player has handled the prompt's trait/resource instruction.

Resolution:

- Fixed in this branch for known base prompts. Prompt 1 now highlights `Bloodthirsty` and pre-fills the prompt-created skill composer; Prompt 4 highlights the stationary resource requirement and preselects `Stationary`.

### P2 - Prompt resolve form remains active after successful submission

After a successful prompt resolve, the form is cleared and the `Set the entry into memory` button becomes active again while the success panel is still visible.

Why this matters:

- The user can submit another entry against a prompt that has already been resolved in the current UI state.
- It is unclear whether the next submission would duplicate, overwrite, or resolve the next prompt.

Recommendation:

- Disable or hide the form once a prompt has been resolved and show a single next action.
- Alternatively, immediately refresh into the next prompt state.

Resolution:

- Fixed in this branch. The resolve form is hidden after successful submission and the consequence panel is the only active next action.

### P3 - Setup page has repeated high-level headings in the DOM

On setup, the page-level hero uses an `h1`, and each setup step also uses high-level headings. Step 1 appeared with another `h1`; the final checkpoint used an `h2`.

Why this matters:

- The flow is still keyboard-accessible in e2e, but the document outline may be confusing to screen-reader users.
- The heading hierarchy shifts between setup steps.

Recommendation:

- Keep one page-level `h1`, then use consistent `h2` headings for individual setup steps.
- Add an accessibility assertion around heading outline if feasible.

Resolution:

- Fixed in this branch. Setup step headings now render as `h2`, matching the final checkpoint and preserving the page-level `h1`.

### P3 - Lint warning in play surface

`npm run lint` passes but reports:

`src/components/ritual/PlaySurface.tsx:139:6 - React Hook useEffect has a missing dependency: 'syncPromptDraft'.`

Why this matters:

- The warning may be benign, but the surrounding area controls local prompt draft persistence.
- Draft persistence bugs would be costly in a long-form writing flow.

Recommendation:

- Stabilize `syncPromptDraft` with `useCallback`, move it inside the effect, or otherwise satisfy the hook dependency rule deliberately.

Resolution:

- Fixed in this branch. `syncPromptDraft` is stabilized with `useCallback` and the draft persistence effect depends on the stable callback.

### P3 - Dependency audit reports moderate PostCSS advisory through Next

`npm audit --audit-level=moderate` reports a moderate PostCSS advisory nested under Next:

- `postcss <8.5.10`
- Advisory: `GHSA-qx2v-qp2m-jg93`
- `npm audit fix --force` suggests a breaking/inappropriate Next install path.

Why this matters:

- It may not be directly exploitable in this app, but it blocks a clean audit.
- The suggested automated fix is unsafe.

Recommendation:

- Track the upstream Next/PostCSS resolution.
- Avoid `npm audit fix --force` unless the dependency graph is reviewed manually.

Resolution:

- Tracked intentionally. The forced audit fix is still unsafe for this app; verification records the remaining upstream advisory instead of applying `npm audit fix --force`.

## Positive UAT Notes

- The setup flow has a strong ritual tone and moves in useful, digestible thresholds.
- The deliberate safety checkpoint before the first prompt is clear and well placed.
- The test-auth path is easy to use locally and does not appear in the default public sign-in contract unless enabled.
- Prompt-created skills and resources persisted to the ledger once entered manually.
- Archive, ledger, and recap routes are server-rendered and load cleanly after navigation.
- Automated coverage is broad for the current beta slice.

## Suggested Follow-Up Order

1. Fix stale play success/result state and current-state memory count after prompt resolution.
2. Confirm setup-created characters and marks are persisted and visible in the ledger.
3. Improve archive memory-card content so saved writing feels fully present.
4. Rewrite recap prose to hide internal encounter/movement mechanics.
5. Strengthen prompt-effect guidance for required skills/resources/characters/marks.
6. Clean up heading hierarchy, hook warning, and dependency-audit tracking.
