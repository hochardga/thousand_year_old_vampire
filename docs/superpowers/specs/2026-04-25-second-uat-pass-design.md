# Second UAT Pass Design

## Scope

Run a fresh end-to-end UAT pass on the current PR branch after the April 25 fixes. Cover the user journey from landing page through sign-in, chronicle setup, prompt resolution, ledger, archive, recap, and feedback in test-auth/mock mode.

## Approach

Use the app as a narrow/mobile-like player first, then verify desktop-sensitive surfaces where needed. Treat broken flows, stale state, missing persisted data, inaccessible controls, confusing copy, and verification failures as findings. Fix app-actionable issues in this branch with focused regression coverage.

## Deliverables

- A new UAT report under `docs/`.
- Targeted fixes for confirmed findings.
- Fresh verification results for lint, tests, E2E, build, and audit.
- A pushed update to the existing ready-for-review PR.
