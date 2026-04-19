# Phase 0 Foundation and Ritual Shell Design

**Date:** 2026-04-19  
**Status:** Approved  
**Phase:** 0 — Foundation & Ritual Shell

## Goal

Ship a review-ready Phase 0 foundation that already feels like *Thousand Year Old Vampire: Digital Edition*, while wiring a real Supabase backend end-to-end. The phase should end with a usable protected chronicle shell, not placeholder scaffolding.

## Chosen Approach

Three approaches were considered for Phase 0:

1. **Ritual-first foundation** — real infrastructure with product-shaped shell work from the start
2. **Infra-first minimal shell** — correct plumbing with intentionally thin UI
3. **Shell-first with delayed backend wiring** — polished surfaces before real data integration

The selected approach is **ritual-first foundation**. It best matches the roadmap, the approved product direction, and the requirement to use a real Supabase project end-to-end without letting the phase feel skeletal.

## Architecture

Phase 0 uses a three-group App Router structure:

- `src/app/(marketing)` for the public landing experience
- `src/app/(auth)` for sign-in and auth callback flow
- `src/app/(app)` for protected chronicle routes

The runtime stack should center on:

- global layout and tokenized visual foundation in `src/app/layout.tsx` and `src/app/globals.css`
- Supabase browser/server helpers in `src/lib/supabase/`
- middleware-based auth refresh and route protection in `src/middleware.ts`
- route-handler writes for chronicle creation and auth side effects

The core request flow is:

1. Player lands on the marketing shell
2. Player enters the magic-link sign-in flow
3. Auth callback exchanges the code and ensures a `profiles` row exists
4. Protected routes load with the authenticated session server-side
5. Chronicle creation writes a `draft` chronicle and routes the player into the protected experience

## Ritual Shell

Phase 0 should already establish the product's editorial shell across three surfaces:

- **Marketing shell** — restrained landing page with the approved headline/subhead/CTA and light atmospheric framing
- **Auth shell** — calm magic-link form using the "gentle ritual guide" voice
- **Chronicle shell** — protected chronicle list with polished empty, loading, and populated states

Shared primitives should keep these surfaces consistent:

- `PageShell` for layout width, gutters, and rhythm
- `SurfacePanel` for document-like panels with minimal ornament
- feature components such as `AuthForm` and `ChronicleCard` built on those primitives

## Visual Direction

Phase 0 should apply the approved design tokens from the vision doc immediately:

- `Cormorant Garamond` for headings
- `Newsreader` for body copy
- `IBM Plex Mono` for metadata
- warm paper backgrounds and surfaces
- nocturne accents for shell framing and primary actions
- gold focus treatment
- oxblood reserved for destructive or loss-adjacent states

The UI should feel editorial and literary rather than like dark SaaS or themed horror packaging.

## Data and Auth Boundaries

The Phase 0 backend stays intentionally narrow:

- `profiles` is created or upserted on first successful auth callback
- `chronicles` is the only additional product table in this phase
- ownership is direct and row-level-security-driven
- protected reads happen server-side with the authenticated Supabase client
- protected writes happen through validated route handlers only

Failure handling should stay calm and product-shaped:

- unauthenticated protected access redirects to sign-in with destination preserved
- invalid callback states return to sign-in with clear, restrained copy
- chronicle creation failures surface inline and avoid partial writes
- missing environment variables fail obviously for developers without leaking internal details into user-facing copy

## Task Sequencing

Phase 0 should be executed in four passes while preserving roadmap order:

1. **Foundation pass** — `TASK-001` to `TASK-003`
2. **Backend pass** — `TASK-004` and `TASK-005`
3. **Product-shell pass** — `TASK-006` to `TASK-008`
4. **Confidence pass** — `TASK-009`

After each roadmap task is finished, `docs/product-roadmap.md` must be updated immediately before moving to the next task.

## Verification

Verification should happen continuously:

- app scaffold boots and renders
- baseline dependency/test setup preserves existing vision checks
- design tokens render correctly in the shell
- protected routes redirect when unauthenticated
- Supabase migration applies cleanly
- signed-in users can create and view draft chronicles
- integration and smoke tests exist before the phase is declared complete

## Definition of Done

Phase 0 is done when:

- the app already feels like this product
- Supabase is real and wired end-to-end
- auth and ownership boundaries are enforced
- the first protected chronicle workflow is usable
- verification commands pass
- the roadmap is checked off through `TASK-009`
- the branch is ready for review as a coherent phase deliverable
