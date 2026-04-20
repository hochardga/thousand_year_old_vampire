# Vercel and Supabase Setup Design

**Date:** 2026-04-20  
**Status:** Approved

## Goal

Connect the existing GitHub-driven Vercel project and Vercel-managed Supabase project to this local repository in a way that preserves secure hosted deployment behavior, enables local development against the hosted backend, and keeps auth redirects correct across localhost, preview deployments, and production.

## Chosen Approach

Three approaches were considered:

1. **Manual dashboard-only setup**  
   Fastest initially, but it increases drift risk between local development and the hosted Vercel project because environment values must be copied manually.
2. **Vercel-linked local workflow**  
   Link the local repository to the existing Vercel project, pull development environment variables locally, and update application auth URL handling so previews and production both work cleanly.
3. **Vercel-linked local workflow plus Supabase CLI linkage**  
   Extend the recommended Vercel-linked workflow with a local Supabase CLI link so the checked-in `supabase/migrations/` directory can remain the intentional source of truth for schema changes.

The selected approach is **approach 3**. It preserves the user's existing GitHub-based Vercel deployment pipeline while adding the local tooling needed for development, testing, and future migration management.

## Deployment Ownership

- Vercel deployments remain GitHub-driven.
- This local repository is not used as the deployment source for Vercel.
- Local Vercel CLI usage is limited to authentication, project linkage, and development environment synchronization.
- Supabase remains the hosted backend provisioned through the Vercel Marketplace integration.

## Environment Strategy

- Keep `.env.example` as the committed template.
- Keep real secrets out of Git via ignored local env files.
- Use `.env.local` for local development instead of a tracked `.env` file.
- Treat Vercel as the hosted source of truth for application environment variables because the Supabase Marketplace integration already syncs relevant Supabase variables into the Vercel project.
- Pull Vercel development environment variables into `.env.local` for local parity.

Expected runtime variables include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server-only workflows if needed later
- `NEXT_PUBLIC_SITE_URL` as a production-only Vercel variable set to the stable production Vercel domain

## Auth URL Handling

The current sign-in flow builds magic-link callback URLs from `NEXT_PUBLIC_SITE_URL` only. That creates a mismatch for Vercel preview deployments, because preview sign-ins would redirect users back to the production domain.

The application should resolve its public base URL in this order:

1. `NEXT_PUBLIC_SITE_URL`
2. `NEXT_PUBLIC_VERCEL_URL`
3. `http://localhost:3000`

This gives the correct behavior in each environment:

- local development uses localhost
- Vercel preview deployments use the active preview hostname
- production uses the stable production Vercel domain

This change should be implemented through a focused helper so the URL logic is easy to test and reuse.

## Provider Integration Assumptions

- The Supabase Vercel Marketplace integration is expected to continue syncing core environment variables into the linked Vercel project.
- The integration may also auto-manage preview redirect URLs in Supabase, but the application should still generate environment-correct callback URLs itself instead of relying on dashboard magic.
- The default Vercel project URL is the canonical production URL for this app.

## Local Tooling

### Vercel CLI

Use Vercel CLI locally to:

- authenticate the local machine
- link this repository to the existing Vercel project
- pull development environment variables into `.env.local`

This local linkage does not change deployment ownership.

### Supabase CLI

Use Supabase CLI locally to:

- authenticate the local machine
- link this repository's `supabase/` directory to the hosted Supabase project

This step is recommended because the repository already contains checked-in migrations and should be able to manage schema changes intentionally over time.

## Verification

Verification should cover both code and tooling:

- focused tests for the new public-site URL resolution helper
- existing sign-in and auth redirect tests still passing
- project build succeeding with the new URL handling
- Vercel project linkage established locally
- local development environment variables pulled successfully into `.env.local`
- Supabase linkage completed if credentials and project metadata are available

## Definition of Done

This setup work is complete when:

- the code resolves auth callback base URLs correctly across local, preview, and production environments
- local development can read the hosted Supabase and site variables from `.env.local`
- the repository is linked locally to the existing Vercel project without changing GitHub-driven deployment behavior
- the local Supabase project is linked to the hosted project when feasible
- verification commands pass, or any remaining provider-auth/manual blockers are clearly documented
