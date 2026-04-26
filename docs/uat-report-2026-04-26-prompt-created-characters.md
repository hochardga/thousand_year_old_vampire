# Prompt-Created Characters UAT

**Date:** 2026-04-26
**Branch:** codex/prompt-created-characters-impl

## Scope

Deep UAT for creating a Character from the active prompt surface and confirming the result persists into the chronicle ledger.

## Environment

- Local app: `http://localhost:3000`
- Flags: `ENABLE_TEST_AUTH=1`, `TYOV_E2E_MOCKS=1`
- Chronicle used: `aeefad6b-ac09-4ddc-b5d1-e91291331cd8`

## Scenarios

| Scenario | Result | Notes |
| --- | --- | --- |
| Test sign-in and setup reach Prompt 1 | Pass | Created a fresh chronicle through the normal first-session setup flow. |
| Composer opens and validates required fields | Pass | `Add a character from this prompt` opened name, description, and mortal/immortal controls. |
| Duplicate Character names are blocked before submit | Pass | Entering `Marta`, an existing setup Character, showed `That character name is already in the chronicle. Choose different wording.` |
| Mortal/immortal kind selection is included in the created Character | Pass | Selected `Immortal`; ledger later showed `Elias Voss` as `Immortal`. |
| Failed validation preserves local draft | Pass | After duplicate-name blocking, the Character composer remained open with the entered description and kind selection. |
| Successful prompt resolution creates the Character | Pass | Changed the name to `Elias Voss`, resolved Prompt 1, and saw the immediate consequence panel. |
| New Character appears in ledger | Pass | Ledger showed `Elias Voss`, `Active`, `Immortal`, and `A parish clerk who saw my hunger and chose silence.` |

## Verification

- `npm test -- tests/integration/chronicle-validation.test.ts tests/integration/resolve-prompt.test.ts tests/integration/gameplay-rpc-guards.test.ts tests/integration/archive-rules.test.ts tests/integration/setup-flow.test.tsx`
- `npm run lint`
- Browser UAT in the Codex in-app browser against the local dev server
