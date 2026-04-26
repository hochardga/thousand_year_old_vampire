# Prompt-Created Characters UAT

**Date:** 2026-04-26
**Branch:** `codex/prompt-created-characters`

## Scope

Deep UAT for creating a Character from the active prompt surface and confirming the result persists into the chronicle ledger.

## Scenarios

| Scenario | Result | Notes |
| --- | --- | --- |
| Composer opens and validates required fields | Pass | Character fields open from the play surface and participate in submission validation. |
| Composer removal clears local fields | Pass | Removing and reopening the composer reset name, description, and kind to the Mortal default. |
| Duplicate Character names are blocked before submit | Pass | Existing setup Character `Marta` blocked reuse with the calm duplicate-name message. |
| Mortal/immortal kind selection is included in payload | Pass | The UAT selected Immortal and confirmed that choice persisted after a failed submission and successful resolution. |
| Failed submission preserves local draft | Pass | A forced `500` from `/play/resolve` left the Character name, description, and Immortal selection intact. |
| Successful prompt resolution creates the Character | Pass | The second submission completed through the real local route in E2E mock mode. |
| New Character appears in ledger/archive surfaces | Pass | `Elias Voss` appeared in the ledger with the submitted description and an Immortal badge. |

## Verification

- `npm test -- tests/integration/chronicle-validation.test.ts tests/integration/resolve-prompt.test.ts tests/integration/gameplay-rpc-guards.test.ts tests/integration/archive-rules.test.ts tests/integration/setup-flow.test.tsx`
- `npm run lint`
- Browser UAT on `http://localhost:3000` with `ENABLE_TEST_AUTH=1 TYOV_E2E_MOCKS=1`

## Browser UAT Notes

The browser pass reset E2E state, signed in through testing auth, completed setup, resolved Prompt 1 with a prompt-created Character, and checked the resulting ledger entry. The successful run used chronicle `ec5baf93-400f-4bf1-9813-388e2ff6f13b` in local mock state.
