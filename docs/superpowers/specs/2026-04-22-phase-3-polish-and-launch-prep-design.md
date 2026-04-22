# Phase 3 Polish and Launch Prep Design

**Date:** 2026-04-22  
**Status:** Approved  
**Phase:** 3 - Polish & Launch Prep

## Goal

Ship a review-ready Phase 3 slice in which the MVP feels beta-ready: route states are consistent, the public surface communicates the product clearly, analytics and feedback loops are in place, and accessibility, performance, SEO, and launch verification are all strong enough to support a rights-aware beta.

## Chosen Approach

Three approaches were considered for Phase 3:

1. **Bespoke task-by-task polish** - implement each roadmap task mostly in isolation as it comes
2. **Shared launch foundation first** - establish common state, launch, analytics, and verification seams, then apply them across the roadmap
3. **Instrumentation-first hardening** - prioritize analytics, accessibility, and performance infrastructure before user-facing polish

The selected approach is **shared launch foundation first**. It fits the roadmap order, preserves the existing editorial shell, and gives the later Phase 3 tasks reusable seams instead of duplicating state handling, copy patterns, and launch posture in each route.

## Product Constraints

Phase 3 should assume the following product constraints:

- the roadmap order remains authoritative, beginning with `TASK-029`
- the launch posture is beta/private until licensing is explicitly settled
- the primary public CTA remains direct sign-in rather than a waitlist-first flow
- tone is a feature, so new states and launch copy must remain calm, intimate, and literary rather than sounding like generic SaaS software
- analytics and feedback flows must never capture authored prompt or journal text

## Architecture

Phase 3 should be a thin, shared layer on top of the existing route structure rather than a redesign.

- App Router pages continue to own data fetching, route decisions, and redirects
- shared UI primitives own the presentation of empty, loading, success, and error states
- shared launch helpers own beta/private copy, metadata defaults, and Open Graph posture
- shared analytics and feedback helpers own instrumentation and storage boundaries

The phase divides into four small layers:

1. `src/components/ui/*` for reusable route-state, feedback, and alert primitives
2. `src/components/marketing/*` plus marketing route files for launch-surface polish
3. `src/lib/analytics/*` and provider wiring for safe event capture
4. route-local updates plus e2e/integration coverage for accessibility, performance, SEO, and launch checks

This keeps each layer understandable in isolation and avoids introducing a heavyweight global state framework for problems the current server-led architecture already handles well.

## Components and Flow

### Shared Route States

`TASK-029` should establish three reusable presentation primitives:

- `EmptyState` for route-specific no-content moments
- `QuietAlert` for recoverable warnings, errors, and confirmations
- `SkeletonBlock` for restrained loading placeholders

These components should standardize tone, spacing, and interaction affordances without forcing identical layouts across routes. Chronicle list, setup, play, archive, ledger, recap, and landing should each keep route-specific copy and structure while sharing the same visual grammar for:

- loading
- empty
- populated
- error

The routes should not all look the same. They should all feel like they belong to the same product.

### Launch-Ready Marketing Surface

`TASK-030` should refine the landing page into a stronger beta launch surface while preserving the current direct sign-in flow.

The marketing page should include:

- a sharper hero that keeps the approved headline/subhead and direct sign-in CTA
- a feature band that communicates the three core value propositions in launch language
- atmospheric product surfaces or screenshots showing play, archive, and recap rather than abstract promises
- supporting copy that signals private-beta or rights-aware launch posture without becoming defensive legal copy

The landing page should feel like a crafted literary product, not a generalized startup homepage. Specificity, screenshots, and tone-safe beta framing should do the persuasive work.

### Analytics Boundary

`TASK-031` should add a minimal analytics system with strict event boundaries.

Instrumentation should include only the roadmap funnel events:

- sign-in started or completed
- chronicle created
- setup completed
- first prompt resolved
- archive opened
- recap opened
- second-session return

Implementation should use:

- a client provider for browser capture
- a tiny shared helper or wrapper for event names and property validation
- environment-aware no-op behavior when analytics keys are absent

Authored content must never be passed to analytics. Prompt text, journal text, diary text, and memory prose are out of scope for event properties.

### Feedback Capture

`TASK-032` should create a lightweight beta feedback path that stays outside the main writing ritual.

The primary feedback entry point should be the recap route, where the player has enough context to comment without being interrupted mid-entry. A secondary lower-pressure entry point may live on a non-writing surface such as the chronicle list or account-adjacent shell if the product needs broader access.

Feedback storage should be chronicle-aware but optional. A feedback record should carry:

- `user_id`
- optional `chronicle_id`
- source route or entry point
- category or sentiment when helpful
- free-text feedback
- timestamps

Feedback capture should be intentionally simple and easy to review. It is a beta learning tool, not a new subsystem.

### Accessibility and Performance Passes

`TASK-033` and `TASK-034` should operate as targeted passes over the now-shared Phase 3 surfaces.

Accessibility priorities:

- visible focus treatment against both light and nocturne surfaces
- full keyboard navigation across sign-in, chronicle list, setup, play, archive, ledger, and recap
- durable labels for all form controls and route actions
- minimum 44x44 touch targets
- reduced-motion behavior for transitions and route-level reveals

Performance priorities:

- keep the marketing page and play route as the first optimization targets
- avoid unnecessary client-side work on server-led pages
- keep prompt loading and route hydration boundaries narrow
- verify build output and route behavior against the PRD thresholds rather than assuming the existing performance is acceptable

### SEO, Metadata, and Launch Posture

`TASK-035` should make the product legible to humans and link previews without overstating launch maturity or rights status.

This includes:

- route-level metadata for the marketing surface
- Open Graph assets based on product surfaces rather than generic fantasy art
- `robots.ts` and `sitemap.ts` aligned with the beta/private posture, indexing only the public marketing surface and excluding authenticated app routes
- legal or licensing placeholder copy that clearly describes the current state without implying an official release

The page should be discoverable enough to explain what the product is, while remaining honest that this is a beta launch contingent on licensing clarity.

### Final QA and Manual Readiness

`TASK-036` should formalize the last mile rather than relying on memory.

The beta launch checklist should cover:

- sign-in flow
- chronicle creation
- setup completion
- first prompt resolution
- memory overflow flow
- archive access
- recap return path
- feedback submission
- second-session resume

The final smoke suite should mirror that checklist so manual QA and automated QA reinforce the same launch promise.

## Error Handling

Phase 3 error handling should stay quiet, actionable, and context-aware.

- route errors should prefer `QuietAlert` with retry or safe fallback actions
- landing-page auth-aware failures should degrade to the direct sign-in CTA without blocking the page
- analytics initialization failures should no-op rather than breaking rendering
- feedback submission failures should preserve entered feedback long enough for retry
- SEO and OG generation should fail safe to basic metadata rather than leaving the marketing surface empty

State handling should remain route-local in authority. Shared components can render the state, but they should not become a central source of truth for loading or error conditions.

## Task Sequencing

Phase 3 should be executed strictly in roadmap order:

1. `TASK-029` shared empty, loading, and error states
2. `TASK-030` landing page launch polish and visual surfaces
3. `TASK-031` PostHog analytics boundary and provider wiring
4. `TASK-032` feedback schema, route, and form
5. `TASK-033` accessibility pass
6. `TASK-034` performance pass
7. `TASK-035` SEO, Open Graph, and beta-accurate legal placeholder copy
8. `TASK-036` beta-readiness checklist and final smoke verification

After each roadmap task is verified, `docs/product-roadmap.md` must be updated immediately before moving to the next unchecked task.

## Verification

Verification for Phase 3 should prove launch readiness, not just code compilation.

- component or integration coverage for shared route-state primitives
- smoke validation that major routes each exhibit loading, populated, empty, and error behavior where applicable
- analytics smoke checks that the expected funnel events fire with safe properties only
- feedback submission verification with and without chronicle context
- keyboard-only checks across all major routes
- reduced-motion verification for shared transitions
- production build verification plus route-level performance checks for landing, chronicle list, and play
- metadata, OG asset, `robots`, and `sitemap` checks from rendered output
- final end-to-end beta smoke coverage aligned with the manual checklist

## Definition of Done

Phase 3 is done when:

- every major route has consistent, tone-safe loading, empty, populated, and error treatment where appropriate
- the landing page clearly communicates the product with atmospheric specificity and a direct sign-in CTA
- analytics capture the launch funnel without collecting authored player writing
- beta feedback can be submitted and stored with optional chronicle context
- core routes pass keyboard, focus, label, touch-target, and reduced-motion checks
- production build and route behavior satisfy the critical launch performance targets
- marketing metadata and OG assets reflect an honest beta/private posture
- the beta launch checklist exists and the final smoke suite passes
- the roadmap is checked through `TASK-036`
- the branch is ready for review as a coherent Phase 3 deliverable
