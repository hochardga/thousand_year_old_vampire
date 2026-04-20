# Auth Profile Provisioning Resilience Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple profile provisioning from magic-link completion so preview sign-in succeeds and the first authenticated request repairs any missing `public.profiles` row.

**Architecture:** Remove profile creation from the auth callback, add one shared `ensureProfile` helper for authenticated server flows, and wire that helper into the chronicles shell plus authenticated routes that may be a user's first app touchpoint. Drive the change with failing tests first, then verify the production build and browser auth flow.

**Tech Stack:** Next.js App Router, TypeScript, Supabase SSR/Auth, Vitest, Playwright

---

## File Map

- Create: `src/lib/profiles/ensureProfile.ts`
- Modify: `src/app/auth/callback/route.ts`
- Modify: `src/app/(app)/chronicles/page.tsx`
- Modify: `src/app/api/chronicles/route.ts`
- Modify: `src/lib/supabase/e2e.ts`
- Test: `tests/integration/auth-callback.test.ts`
- Test: `tests/integration/chronicles.test.ts`
- Verify: `tests/e2e/first-session.spec.ts`
- Write: `docs/superpowers/specs/2026-04-20-auth-profile-provisioning-resilience-design.md`

## Chunk 1: Callback No Longer Owns Profile Creation

### Task 1: Lock in the callback behavior with a failing test

**Files:**
- Create: `tests/integration/auth-callback.test.ts`
- Modify: `src/lib/supabase/e2e.ts`

- [ ] **Step 1: Write the failing test**

Add a callback-focused integration test that proves:

- a successful auth code exchange redirects to the requested `next` path
- the callback no longer fails when profile provisioning would have failed before

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/auth-callback.test.ts`
Expected: FAIL because the callback still writes `profiles`

- [ ] **Step 3: Write the minimal implementation**

Update `src/app/auth/callback/route.ts` so it:

- exchanges the auth code
- reads the current user
- redirects to `next`
- does not write to `public.profiles`

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/auth-callback.test.ts`
Expected: PASS

## Chunk 2: Add Shared Profile Repair

### Task 2: Introduce the profile helper with TDD

**Files:**
- Create: `src/lib/profiles/ensureProfile.ts`
- Modify: `src/lib/supabase/e2e.ts`
- Test: `tests/integration/chronicles.test.ts`

- [ ] **Step 1: Extend the failing test coverage**

Add or update chronicles integration coverage so the first authenticated page load with a missing profile causes one to be created automatically.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/chronicles.test.ts`
Expected: FAIL because no helper repairs the missing profile yet

- [ ] **Step 3: Write the minimal implementation**

Create `ensureProfile` with these behaviors:

- derive a display name from the email local part
- read `profiles` by `id`
- return the existing row unchanged when present
- insert a new row when missing
- throw a clear error when the profile cannot be created

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/chronicles.test.ts`
Expected: PASS

### Task 3: Wire profile repair into authenticated flows

**Files:**
- Modify: `src/app/(app)/chronicles/page.tsx`
- Modify: `src/app/api/chronicles/route.ts`
- Modify: `src/lib/supabase/e2e.ts`

- [ ] **Step 1: Call `ensureProfile` before chronicle reads**

Update the chronicles shell page so authenticated users repair their profile before querying `chronicles`.

- [ ] **Step 2: Call `ensureProfile` before chronicle creation writes**

Update the chronicle creation API so authenticated users repair their profile before inserting into `chronicles`.

- [ ] **Step 3: Verify targeted auth and chronicles tests**

Run: `npx vitest run tests/integration/auth-callback.test.ts tests/integration/chronicles.test.ts tests/integration/sign-in.test.tsx tests/integration/auth-redirect.test.ts`
Expected: PASS

## Chunk 3: Regression Verification

### Task 4: End-to-end verification

**Files:**
- Verify: `src/app/auth/callback/route.ts`
- Verify: `src/lib/profiles/ensureProfile.ts`
- Verify: `src/app/(app)/chronicles/page.tsx`
- Verify: `src/app/api/chronicles/route.ts`

- [ ] **Step 1: Run the relevant unit and integration tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Run the preview-style browser flow**

Run: `npx playwright test tests/e2e/smoke.spec.ts tests/e2e/first-session.spec.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/profiles/ensureProfile.ts src/app/auth/callback/route.ts src/app/(app)/chronicles/page.tsx src/app/api/chronicles/route.ts src/lib/supabase/e2e.ts tests/integration/auth-callback.test.ts tests/integration/chronicles.test.ts
git commit -m "fix: make profile provisioning resilient after sign-in"
```
