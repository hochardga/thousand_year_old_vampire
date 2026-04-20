# Preview Test Auth Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a preview/dev-only password-based test sign-in path that preserves the existing magic-link MVP flow and is never available in production.

**Architecture:** Keep `/sign-in` magic-link auth as the primary path, add one server-owned guard that enables a secondary password form only outside production when `ENABLE_TEST_AUTH=1`, and sign in through normal Supabase sessions so middleware and protected routes continue working unchanged. Drive the work with failing tests first, then verify the full auth flow in browser automation and the production build.

**Tech Stack:** Next.js App Router, TypeScript, Supabase SSR/Auth, Zod, Vitest, Playwright

---

## File Map

- Create: `src/lib/auth/testAuth.ts`
- Modify: `src/app/(auth)/sign-in/page.tsx`
- Modify: `src/components/ui/AuthForm.tsx`
- Modify: `src/lib/supabase/e2e.ts`
- Modify: `.env.example`
- Test: `tests/integration/sign-in.test.tsx`
- Test: `tests/integration/test-auth.test.ts`
- Verify: `tests/e2e/smoke.spec.ts`
- Verify: `tests/e2e/first-session.spec.ts`
- Write: `docs/superpowers/specs/2026-04-20-preview-test-auth-design.md`

## Chunk 1: Guard the Feature Server-Side

### Task 1: Lock in the environment contract

**Files:**
- Create: `src/lib/auth/testAuth.ts`
- Test: `tests/integration/test-auth.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests that prove:

- `ENABLE_TEST_AUTH=1` enables the feature in local or preview-like environments
- production deployment disables the feature even when the flag is set
- the guard returns `false` when the flag is absent

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/test-auth.test.ts`
Expected: FAIL because the helper does not exist yet

- [ ] **Step 3: Write the minimal implementation**

Create a helper that exposes:

- whether test auth is enabled for the current runtime
- a small assertion/helper the server action can use to fail closed

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/test-auth.test.ts`
Expected: PASS

## Chunk 2: Add the Secondary Sign-In Path

### Task 2: Lock in the sign-in UI contract

**Files:**
- Modify: `src/app/(auth)/sign-in/page.tsx`
- Modify: `src/components/ui/AuthForm.tsx`
- Test: `tests/integration/sign-in.test.tsx`

- [ ] **Step 1: Extend the failing tests**

Add sign-in page coverage for:

- magic-link form still renders by default
- test-auth panel is hidden when disabled
- test-auth panel renders with testing-only labeling when enabled

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/sign-in.test.tsx`
Expected: FAIL because the page and form do not expose the new contract yet

- [ ] **Step 3: Write the minimal implementation**

Update the sign-in UI so it:

- keeps the current magic-link copy and button labels
- renders a second form with email and password inputs only when enabled
- marks that section as testing-only without overpowering the primary tone

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/sign-in.test.tsx`
Expected: PASS

### Task 3: Implement password sign-in behavior

**Files:**
- Modify: `src/app/(auth)/sign-in/page.tsx`
- Modify: `src/lib/supabase/e2e.ts`
- Test: `tests/integration/sign-in.test.tsx`

- [ ] **Step 1: Add failing action-focused tests**

Cover:

- successful password sign-in redirects to the requested `next` route
- invalid credentials redirect back to `/sign-in` with a testing-only error
- disabled test auth rejects use of the password action even if a request is crafted manually

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/sign-in.test.tsx`
Expected: FAIL because no password sign-in action exists yet

- [ ] **Step 3: Write the minimal implementation**

Implement the server action with:

- `zod` validation for `email`, `password`, and `next`
- test-auth guard enforcement
- `supabase.auth.signInWithPassword`
- redirect success to `next`
- redirect failures back to `/sign-in` with a clear testing-only error

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/sign-in.test.tsx`
Expected: PASS

## Chunk 3: Browser Coverage and Regression Verification

### Task 4: Extend e2e coverage

**Files:**
- Modify: `src/lib/supabase/e2e.ts`
- Verify: `tests/e2e/smoke.spec.ts`
- Verify: `tests/e2e/first-session.spec.ts`

- [ ] **Step 1: Update the e2e mock support**

Extend the mocked Supabase auth client so the test-auth server action can complete during Playwright runs.

- [ ] **Step 2: Add or update browser assertions**

Cover that:

- `/sign-in` shows the testing-only panel when e2e runs enable test auth
- the password path can enter the protected flow without touching email delivery

- [ ] **Step 3: Run the browser suite**

Run: `npx playwright test tests/e2e/smoke.spec.ts tests/e2e/first-session.spec.ts`
Expected: PASS

### Task 5: Full verification and docs

**Files:**
- Modify: `.env.example`
- Verify: `src/lib/auth/testAuth.ts`
- Verify: `src/app/(auth)/sign-in/page.tsx`
- Verify: `src/components/ui/AuthForm.tsx`
- Verify: `src/lib/supabase/e2e.ts`

- [ ] **Step 1: Document the environment flag**

Add `ENABLE_TEST_AUTH` to `.env.example` with a note that it is preview/dev-only and must stay disabled in production.

- [ ] **Step 2: Run targeted integration coverage**

Run: `npx vitest run tests/integration/test-auth.test.ts tests/integration/sign-in.test.tsx tests/integration/auth-redirect.test.ts tests/integration/chronicles.test.ts tests/integration/auth-callback.test.ts`
Expected: PASS

- [ ] **Step 3: Run the full test suite and build**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-preview-test-auth-design.md docs/superpowers/plans/2026-04-20-preview-test-auth.md src/lib/auth/testAuth.ts src/app/(auth)/sign-in/page.tsx src/components/ui/AuthForm.tsx src/lib/supabase/e2e.ts .env.example tests/integration/test-auth.test.ts tests/integration/sign-in.test.tsx tests/e2e/smoke.spec.ts tests/e2e/first-session.spec.ts
git commit -m "feat: add preview test auth flow"
```
