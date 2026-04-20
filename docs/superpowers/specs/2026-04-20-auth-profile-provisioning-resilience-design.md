# Auth Profile Provisioning Resilience Design

**Date:** 2026-04-20  
**Status:** Approved

## Goal

Make magic-link authentication resilient when `public.profiles` provisioning is unavailable or transiently failing, so users can still complete sign-in and enter the app on Vercel preview deployments.

## Chosen Approach

Three approaches were considered:

1. **Resilient sign-in with lazy profile repair**  
   Complete authentication as soon as the auth session is exchanged, then ensure the profile exists from the first authenticated app touchpoint. This keeps sign-in available even when profile provisioning is temporarily unhealthy.
2. **Harden callback-owned provisioning**  
   Keep profile creation inside the auth callback, but replace the current `upsert` path with a more defensive read-then-write flow and retries. This is smaller in scope, but it still blocks sign-in on profile write failures.
3. **Database-owned provisioning**  
   Move profile creation fully into Supabase-side triggers or a privileged server path tied to `auth.users`. This is the strongest separation long term, but it is more invasive and adds migration and operations complexity.

The selected approach is **approach 1**. It fixes the user-facing bug fastest, keeps authentication independent from profile provisioning, and gives the rest of the app an idempotent way to repair missing profiles.

## Architecture

Add one focused helper under `src/lib/profiles/` that guarantees an authenticated user has a `public.profiles` row. The helper should accept the server Supabase client plus the current user identity, read for an existing profile, and insert one when none is present.

The auth callback should only:

- exchange the code for a session
- fetch the authenticated user
- redirect to the requested next route

Profile provisioning should move out of the callback and into protected app entry points and authenticated write APIs. That keeps sign-in resilient while still ensuring later queries against `chronicles.user_id -> profiles.id` remain valid.

## Components and Data Flow

### Auth callback

- Remove the profile `upsert` from `src/app/auth/callback/route.ts`
- Keep the existing expired-link and missing-user handling
- Always redirect into the signed-in app flow when session exchange succeeds

### Shared profile repair helper

- Create `src/lib/profiles/ensureProfile.ts`
- Derive the display name the same way the callback currently does
- Look up `profiles.id = auth.uid()`
- If found, return it unchanged
- If missing, insert the new profile row and return it

The helper must be safe to call repeatedly and must not rewrite existing profiles unless we intentionally add refresh behavior later.

### Protected routes and APIs

Call the helper anywhere an authenticated user may reach the app before a profile is guaranteed to exist:

- the chronicles shell page
- chronicle creation API
- any authenticated setup or play API that depends on an existing profile or chronicle ownership path

This makes deep links and first-session flows self-healing. A user who lands in `/chronicles` immediately after magic-link sign-in gets their profile provisioned there instead of failing in the callback.

## Error Handling

If profile repair fails after the user is signed in, do not bounce them back through auth. Instead, surface a signed-in application error such as:

- "We signed you in, but your profile could not be loaded yet."

That keeps the failure localized to profile provisioning and avoids confusing the user with a second auth failure after the magic link already succeeded.

The helper should remain idempotent:

- existing profile: return success without mutation
- missing profile: create exactly one row
- provisioning error: bubble a clear error to the protected route or API

## Testing Strategy

Use TDD for the bug fix:

1. Add a failing integration test that captures the current broken behavior and the new desired behavior for missing-profile sign-in.
2. Add focused tests for the shared profile helper:
   - existing profile remains untouched
   - missing profile is created
   - derived display name is used for new profiles
3. Update auth callback and protected-route tests to reflect the new contract:
   - callback succeeds without profile provisioning
   - first protected route repairs the missing profile

## Verification

Verification should cover both the direct bug and the surrounding auth flow:

- targeted integration tests for callback and profile repair
- existing auth and chronicles tests still passing
- `npm run build` passing
- Playwright preview-style sign-in flow still working end to end

## Definition of Done

This work is complete when:

- magic-link authentication no longer fails solely because `public.profiles` provisioning is unavailable in the callback
- the first authenticated app touchpoint creates a missing profile automatically
- existing profiles remain stable across repeated authenticated requests
- the production build and relevant automated tests pass
