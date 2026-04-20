# Preview Test Auth Design

**Date:** 2026-04-20  
**Status:** Approved

## Goal

Add a preview/dev-only password-based sign-in path for manual testing and browser automation without changing the Supabase magic-link MVP flow or making the test path reachable in production.

## Chosen Approach

Three approaches were considered:

1. **Preview-only Supabase password sign-in alongside magic links**  
   Keep magic links as the primary production path, but expose a second password form only when a server-side environment guard explicitly enables it outside production. This uses normal Supabase sessions and keeps protected-route behavior unchanged.
2. **Application-owned test login bypass**  
   Add a dedicated test endpoint that issues an app-specific session or bypass token. This is faster to wire up, but it creates a parallel auth system and is easier to misconfigure.
3. **Broaden the existing e2e cookie mock for human use**  
   Reuse the Playwright cookie shim beyond automated tests. This would be convenient, but it would not exercise real Supabase auth and would weaken preview confidence.

The selected approach is **approach 1**. It keeps the testing path as close as possible to production behavior, limits the feature behind explicit environment controls, and avoids replacing or weakening magic-link auth.

## Architecture

Introduce a small server-only helper that answers one question: should test auth be available for this runtime? The helper should only return `true` when:

- `ENABLE_TEST_AUTH=1`
- the deployment environment is not Vercel production

The `/sign-in` page should continue rendering the existing magic-link form exactly as the primary path. When the helper enables test auth, the page should additionally render a clearly marked secondary form for testing-only password sign-in.

That secondary form should call `supabase.auth.signInWithPassword` through the existing server Supabase client so the result is a normal Supabase session. After sign-in, the user should redirect to the same destination-aware protected flow used by magic links.

## Components and Data Flow

### Environment guard

- Create a focused helper under `src/lib/auth/`
- Keep the logic server-owned so the UI cannot accidentally decide availability on the client
- Treat any production deployment as disabled even if `ENABLE_TEST_AUTH=1` is set

### Sign-in page

- Preserve the existing magic-link copy and form as the first, quiet ritual path
- Add a separate testing-only section beneath it when test auth is enabled
- Keep the testing section visibly distinct so it cannot be mistaken for the intended public flow
- Reuse the existing `next` redirect behavior

### Test-auth submit flow

- Validate email, password, and destination with `zod`
- Call `supabase.auth.signInWithPassword`
- On success, redirect to the requested app route
- On failure, return the user to `/sign-in` with a testing-specific error message and preserve `next`

Because this path uses a normal Supabase session, the existing middleware, `getUser()` checks, and lazy profile repair stay unchanged.

### E2E support

The repo already has a Playwright-only cookie mock path. Keep that for the main end-to-end suite, but extend the mocked Supabase client enough to cover `signInWithPassword` so browser automation can exercise the testing-only form contract without depending on email delivery.

## Error Handling

The testing-only path must fail closed:

- production runtime: the UI does not render the test form and the server action rejects attempts to use it
- missing or invalid credentials: return to `/sign-in` with a test-auth-specific error
- disabled feature flag: return to `/sign-in` with the normal magic-link path still available

This should never degrade the magic-link experience. If test auth is misconfigured, the primary sign-in flow must still work exactly as before.

## Testing Strategy

Use TDD for the feature:

1. Add integration tests for the environment guard and sign-in page contract.
2. Add integration coverage for the password server action:
   - enabled outside production renders the testing-only form
   - production never renders it
   - successful password sign-in redirects to the requested route
   - failures preserve the sign-in page with a clear test-only error
3. Extend the Playwright suite to cover the testing-only path when the flag is enabled in e2e mock mode.

## Verification

Verification should prove both safety and usability:

- targeted integration tests for auth guard and sign-in behavior
- existing auth redirect and chronicles coverage still passing
- Playwright smoke and first-session flows still passing
- production build passing

## Definition of Done

This work is complete when:

- magic-link auth remains the primary and unchanged sign-in path
- a second password-based path appears only when explicitly enabled outside production
- production renders no test-auth UI and rejects the path server-side
- the password path produces a normal Supabase-backed session that works with existing protected routes
- automated tests and manual verification cover the new flow end to end
