# Vercel and Supabase Setup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Link the local repository to the existing Vercel and Supabase projects, fix auth callback URL resolution for Vercel previews, and enable local development with synced environment variables without changing GitHub-driven deployments.

**Architecture:** Add one focused helper for public-site URL resolution, update the sign-in flow to use it, verify the behavior with failing-then-passing tests, and then complete local CLI linkage for Vercel and Supabase. Keep deployment ownership in GitHub/Vercel and use `.env.local` only for local development.

**Tech Stack:** Next.js App Router, TypeScript, Supabase SSR/Auth, Vitest, Vercel CLI, Supabase CLI

---

## File Map

- Create: `src/lib/site-url.ts`, `tests/integration/site-url.test.ts`
- Modify: `src/app/(auth)/sign-in/page.tsx`, `.env.example`
- Write: `docs/superpowers/specs/2026-04-20-vercel-supabase-setup-design.md`
- Use local tooling against: `.env.local`, `.vercel/`, `supabase/config.toml`

## Chunk 1: Environment-Aware Auth URLs

### Task 1: Public site URL helper

**Files:**
- Create: `src/lib/site-url.ts`
- Test: `tests/integration/site-url.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/integration/site-url.test.ts` covering:

- production URL from `NEXT_PUBLIC_SITE_URL`
- preview fallback from `NEXT_PUBLIC_VERCEL_URL`
- localhost fallback
- normalization of missing protocol and trailing slash

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/site-url.test.ts`
Expected: FAIL because the helper does not exist yet

- [ ] **Step 3: Write the minimal implementation**

Implement a focused helper that resolves the base public URL in this order:

1. `NEXT_PUBLIC_SITE_URL`
2. `NEXT_PUBLIC_VERCEL_URL`
3. `http://localhost:3000`

Ensure non-localhost values are normalized to `https://` and all outputs end with `/`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/site-url.test.ts`
Expected: PASS

### Task 2: Sign-in flow uses the helper

**Files:**
- Modify: `src/app/(auth)/sign-in/page.tsx`
- Modify: `.env.example`

- [ ] **Step 1: Update the sign-in flow to use the helper**

Replace the inline `NEXT_PUBLIC_SITE_URL` fallback logic with the shared helper when building the `/auth/callback` URL.

- [ ] **Step 2: Keep local env documentation aligned**

Update `.env.example` comments or values so local developers understand:

- `NEXT_PUBLIC_SITE_URL` is the production URL
- Vercel preview URLs come from `NEXT_PUBLIC_VERCEL_URL`
- `.env.local` is the local file to use

- [ ] **Step 3: Verify the affected tests stay green**

Run: `npx vitest run tests/integration/site-url.test.ts tests/integration/sign-in.test.tsx tests/integration/auth-redirect.test.ts`
Expected: PASS

## Chunk 2: Hosted Tooling Linkage

### Task 3: Link local repo to Vercel project

**Files:**
- Write locally as needed: `.vercel/`, `.env.local`

- [ ] **Step 1: Verify or install Vercel CLI**

Run: `command -v vercel || npm install -g vercel`
Expected: Vercel CLI available locally

- [ ] **Step 2: Authenticate with Vercel**

Run: `vercel login`
Expected: successful login after browser-based auth

- [ ] **Step 3: Link this directory to the existing project**

Run: `vercel link`
Expected: local directory linked to the already-existing Vercel project

- [ ] **Step 4: Pull development variables**

Run: `vercel env pull .env.local`
Expected: `.env.local` created or updated with Development environment variables from the linked Vercel project

### Task 4: Link local Supabase project

**Files:**
- Use existing: `supabase/config.toml`, `supabase/migrations/`

- [ ] **Step 1: Verify or install Supabase CLI**

Run: `command -v supabase || npm install -g supabase`
Expected: Supabase CLI available locally

- [ ] **Step 2: Authenticate with Supabase**

Run: `supabase login`
Expected: successful login with a browser flow or access token entry

- [ ] **Step 3: Link the local project to the hosted project**

Run: `supabase link --project-ref <project-ref>`
Expected: local `supabase/` directory linked to the hosted Supabase project

## Chunk 3: Verification

### Task 5: Code and config verification

**Files:**
- Verify: `src/lib/site-url.ts`, `src/app/(auth)/sign-in/page.tsx`, `.env.example`

- [ ] **Step 1: Run targeted tests**

Run: `npx vitest run tests/integration/site-url.test.ts tests/integration/sign-in.test.tsx tests/integration/auth-redirect.test.ts`
Expected: PASS

- [ ] **Step 2: Run the full build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Summarize remaining manual follow-up**

Document any provider-auth or project-selection steps that could not be completed automatically during CLI linkage.
