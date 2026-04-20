# Phase 0 Foundation and Ritual Shell Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 0 of the roadmap as a polished ritual-first foundation with a real Supabase-backed auth and chronicle shell.

**Architecture:** Scaffold a Next.js App Router application under `src/`, establish the approved design tokens and shell primitives, wire Supabase SSR auth plus the initial schema, and land a protected chronicle list/create loop with baseline integration and e2e coverage. Work strictly in roadmap order and update the roadmap after each completed task.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Supabase SSR/Auth/Postgres, Zod, React Hook Form, Lucide, Vitest, Playwright

---

## File Map

- Create: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `eslint.config.mjs`, `next-env.d.ts`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/(marketing)/layout.tsx`, `src/app/(marketing)/page.tsx`, `src/app/(auth)/sign-in/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/(app)/chronicles/page.tsx`, `src/app/api/chronicles/route.ts`
- Create: `src/components/marketing/HeroPanel.tsx`, `src/components/ui/AuthForm.tsx`, `src/components/ui/PageShell.tsx`, `src/components/ui/SurfacePanel.tsx`, `src/components/ritual/ChronicleCard.tsx`
- Create: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/lib/utils.ts`
- Create: `src/middleware.ts`, `src/test/setup.ts`, `vitest.config.ts`, `playwright.config.ts`, `tests/integration/chronicles.test.ts`, `tests/e2e/smoke.spec.ts`
- Create: `supabase/config.toml`, `supabase/migrations/0001_initial_profiles_chronicles.sql`, `.env.example`
- Modify: `docs/product-roadmap.md`

## Chunk 1: Scaffold, Dependencies, and Tokens

### Task 1: `TASK-001` Next.js workspace scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `eslint.config.mjs`, `next-env.d.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Generate a failing existence check for the scaffold**

Run: `test -f package.json && test -f src/app/layout.tsx`
Expected: exit status non-zero before the scaffold exists

- [ ] **Step 2: Create the Next.js scaffold with App Router, TypeScript, Tailwind, ESLint, and `src/` layout**

Implement the minimal app structure and scripts needed for `next dev`, `next build`, and `next lint`.

- [ ] **Step 3: Verify the scaffold exists**

Run: `test -f package.json && test -f src/app/layout.tsx && test -f tsconfig.json`
Expected: exit status zero

- [ ] **Step 4: Boot the app**

Run: `npm run dev`
Expected: Next.js dev server starts successfully

### Task 2: `TASK-002` Baseline dependencies and test tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `playwright.config.ts`, `src/test/setup.ts`

- [ ] **Step 1: Add a dependency presence check that fails first**

Run: `node -e "const pkg=require('./package.json'); const deps=['@supabase/supabase-js','@supabase/ssr','react-hook-form','zod','lucide-react','class-variance-authority','clsx','tailwind-merge']; process.exit(deps.every((name)=>pkg.dependencies?.[name]||pkg.devDependencies?.[name])?0:1)"`
Expected: exit status non-zero before dependencies are added

- [ ] **Step 2: Add the required runtime and test dependencies**

Include the roadmap dependency set plus `vitest`, `@playwright/test`, and supporting TypeScript/testing packages.

- [ ] **Step 3: Add baseline Vitest and Playwright config**

Create the config files and shared test setup.

- [ ] **Step 4: Verify dependency and test setup**

Run: `npm install`
Expected: install succeeds

Run: `node --test tests/validate-vision.test.js`
Expected: existing vision validation tests still pass

### Task 3: `TASK-003` Global visual foundation

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/globals.css`, `tailwind.config.ts`
- Create: `src/components/ui/PageShell.tsx`, `src/components/ui/SurfacePanel.tsx`, `src/lib/utils.ts`

- [ ] **Step 1: Add a failing visual-token test/check**

Run: `node -e "const fs=require('fs'); const css=fs.readFileSync('src/app/globals.css','utf8'); process.exit(css.includes('--color-bg')&&css.includes('--font-heading')?0:1)"`
Expected: exit status non-zero before tokens are added

- [ ] **Step 2: Implement the approved tokens, fonts, and shell primitives**

Use `next/font/google` for `Cormorant Garamond`, `Newsreader`, and `IBM Plex Mono`. Add CSS variables and Tailwind theme extensions for the approved colors, spacing, radius, shadow, and motion values.

- [ ] **Step 3: Verify tokenized shell output**

Run: `node -e "const fs=require('fs'); const css=fs.readFileSync('src/app/globals.css','utf8'); process.exit(css.includes('--color-bg')&&css.includes('--font-heading')&&css.includes('--space-1')?0:1)"`
Expected: exit status zero

## Chunk 2: Supabase Auth and Initial Schema

### Task 4: `TASK-004` Supabase helpers, env handling, and middleware

**Files:**
- Create: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`, `.env.example`

- [ ] **Step 1: Write a failing auth-protection test**

Create: `tests/integration/auth-redirect.test.ts`

```ts
import { describe, expect, it } from "vitest";

describe("protected routing", () => {
  it("documents that unauthenticated users are redirected to sign-in", () => {
    expect(true).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to confirm RED**

Run: `npx vitest run tests/integration/auth-redirect.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement browser/server clients, middleware helpers, and env scaffolding**

Support destination-aware redirects for protected routes.

- [ ] **Step 4: Update the test to assert the real redirect behavior and make it pass**

Run: `npx vitest run tests/integration/auth-redirect.test.ts`
Expected: PASS

### Task 5: `TASK-005` Initial migration for `profiles` and `chronicles`

**Files:**
- Create: `supabase/migrations/0001_initial_profiles_chronicles.sql`, `supabase/config.toml`

- [ ] **Step 1: Write a failing schema smoke check**

Run: `test -f supabase/migrations/0001_initial_profiles_chronicles.sql`
Expected: exit status non-zero before the migration exists

- [ ] **Step 2: Implement the initial schema and RLS policies**

Create `profiles` and `chronicles`, add ownership-based RLS, and include helpful indexes or update triggers only if needed for Phase 0.

- [ ] **Step 3: Verify the migration file exists and is structurally complete**

Run: `node -e "const fs=require('fs'); const sql=fs.readFileSync('supabase/migrations/0001_initial_profiles_chronicles.sql','utf8'); process.exit(sql.includes('CREATE TABLE profiles')&&sql.includes('CREATE TABLE chronicles')&&sql.includes('ENABLE ROW LEVEL SECURITY')?0:1)"`
Expected: exit status zero

## Chunk 3: Marketing, Auth, and Chronicle Shell

### Task 6: `TASK-006` Marketing shell

**Files:**
- Create: `src/app/(marketing)/layout.tsx`, `src/app/(marketing)/page.tsx`, `src/components/marketing/HeroPanel.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write a failing landing-page content test**

Create: `tests/integration/marketing-shell.test.tsx`

```tsx
import { describe, expect, it } from "vitest";

describe("marketing shell", () => {
  it("documents the approved hero headline", () => {
    expect("Enter the vampire's life before the rules get in the way.").toContain("Begin");
  });
});
```

- [ ] **Step 2: Run the test to confirm RED**

Run: `npx vitest run tests/integration/marketing-shell.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement the marketing layout and hero shell**

Use the approved tagline, headline, subhead, and a single primary CTA.

- [ ] **Step 4: Replace the temporary test with a real render assertion and verify GREEN**

Run: `npx vitest run tests/integration/marketing-shell.test.tsx`
Expected: PASS

### Task 7: `TASK-007` Sign-in flow and callback

**Files:**
- Create: `src/app/(auth)/sign-in/page.tsx`, `src/app/auth/callback/route.ts`, `src/components/ui/AuthForm.tsx`

- [ ] **Step 1: Write a failing sign-in interaction test**

Create: `tests/integration/sign-in.test.tsx`

```tsx
import { describe, expect, it } from "vitest";

describe("sign-in shell", () => {
  it("starts red until the auth form exists", () => {
    expect(false).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to confirm RED**

Run: `npx vitest run tests/integration/sign-in.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement the auth form and callback route**

Keep copy quiet and make first-login profile creation part of the callback flow.

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run tests/integration/sign-in.test.tsx`
Expected: PASS

### Task 8: `TASK-008` Protected chronicle list and creation flow

**Files:**
- Create: `src/app/(app)/chronicles/page.tsx`, `src/app/api/chronicles/route.ts`, `src/components/ritual/ChronicleCard.tsx`

- [ ] **Step 1: Write a failing chronicle flow test**

Create: `tests/integration/chronicles.test.ts`

```ts
import { describe, expect, it } from "vitest";

describe("chronicle creation", () => {
  it("starts red before the route and page exist", () => {
    expect(false).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to confirm RED**

Run: `npx vitest run tests/integration/chronicles.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement protected list rendering and draft chronicle creation**

Support empty, loading, and populated list states.

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run tests/integration/chronicles.test.ts`
Expected: PASS

## Chunk 4: Confidence and Phase Completion

### Task 9: `TASK-009` Baseline automated coverage and verification commands

**Files:**
- Modify: `package.json`
- Create: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write the smoke spec before implementing helper wiring**

Add a minimal e2e smoke path for protected-route redirect or landing-page render.

- [ ] **Step 2: Run the targeted test to confirm RED where applicable**

Run: `npx playwright test tests/e2e/smoke.spec.ts --project=chromium`
Expected: initial failure until the flow is fully wired

- [ ] **Step 3: Finalize package scripts and test wiring**

Provide developer-facing verification commands for lint, unit/integration tests, and Playwright.

- [ ] **Step 4: Run the phase verification suite**

Run: `npm run lint`
Expected: PASS

Run: `npx vitest run`
Expected: PASS

Run: `node --test tests/validate-vision.test.js`
Expected: PASS

- [ ] **Step 5: Update the roadmap after each completed task and confirm all Phase 0 boxes are checked**

Run: `rg -n "TASK-00[1-9].*\\[ \\]" docs/product-roadmap.md`
Expected: no matches

## Execution Notes

- Work on branch `phase-0/foundation-and-ritual-shell` in the dedicated `.worktrees/` workspace.
- Keep commits focused and frequent, but do not stop until the full phase is implemented and verified unless blocked.
- Use real Supabase wiring, but keep the schema limited to `profiles` and `chronicles` in this phase.
- Preserve the approved literary tone and avoid generic dashboard or SaaS styling.
