# Phase 3 Polish and Launch Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the full Phase 3 beta-readiness slice so the product has consistent route states, clearer launch messaging, safe analytics, beta feedback capture, accessibility and performance hardening, honest SEO metadata, and a final launch checklist with smoke coverage.

**Architecture:** Keep the current App Router structure and add a thin shared launch layer instead of redesigning the app. `TASK-029` establishes shared route-state primitives and route-level loading/error boundaries, then later tasks layer landing polish, analytics, feedback, accessibility, performance, SEO, and QA on top of those seams while preserving the existing editorial tone.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Supabase Postgres/Auth/SSR, Zod, posthog-js, posthog-node, Vitest, Playwright

---

## Scope Choice

Phase 3 touches several cross-cutting concerns, but it should stay as one implementation plan because the roadmap order is doing real work:

- `TASK-029` creates the shared route-state foundation
- `TASK-030` and `TASK-035` depend on that foundation for the public launch surface
- `TASK-031` and `TASK-032` depend on stable route boundaries for tracking and feedback entry points
- `TASK-033`, `TASK-034`, and `TASK-036` are hardening passes over the same updated routes

Do not split this into separate execution plans unless the spec changes. Keep the roadmap order intact.

## Execution Setup

- Work from a dedicated worktree before touching code. Preferred branch name: `phase-3/polish-and-launch-prep`.
- Keep `docs/product-roadmap.md` open during execution. After every completed roadmap task, flip that task to `- [x]` before committing.
- The next migration number is `0008_feedback.sql`. The roadmap text says `0004_feedback.sql`, but the repository already has migrations through `0007_memory_rule_helpers.sql`.
- Open any final PR as ready for review. This repository does not allow draft PRs.

## File Map

### Shared Route-State Foundation

- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/QuietAlert.tsx`
- Create: `src/components/ui/SkeletonBlock.tsx`
- Create: `src/app/(marketing)/loading.tsx`
- Create: `src/app/(marketing)/error.tsx`
- Create: `src/app/(app)/chronicles/loading.tsx`
- Create: `src/app/(app)/chronicles/error.tsx`
- Create: `src/app/(app)/chronicles/[chronicleId]/loading.tsx`
- Create: `src/app/(app)/chronicles/[chronicleId]/error.tsx`
- Modify: `src/app/(marketing)/page.tsx`
- Modify: `src/app/(app)/chronicles/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/setup/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/recap/page.tsx`

### Marketing and Launch Surface

- Create: `src/components/marketing/FeatureBand.tsx`
- Create: `public/og/play-surface.png`
- Create: `public/og/archive-surface.png`
- Create: `public/og/recap-surface.png`
- Modify: `src/components/marketing/HeroPanel.tsx`
- Modify: `src/app/(marketing)/page.tsx`

### Analytics

- Create: `src/lib/analytics/posthog.ts`
- Create: `src/components/providers/PostHogProvider.tsx`
- Create: `src/components/analytics/TrackEventOnMount.tsx`
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/setup/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Modify: `src/components/ui/AuthForm.tsx`
- Modify: `src/components/ritual/SetupStepper.tsx`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `src/app/(app)/chronicles/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/recap/page.tsx`

### Feedback

- Create: `supabase/migrations/0008_feedback.sql`
- Create: `src/app/api/feedback/route.ts`
- Create: `src/components/ui/FeedbackForm.tsx`
- Modify: `src/components/ritual/RecapBlock.tsx`
- Modify: `src/lib/supabase/e2e.ts`

### Accessibility, Performance, SEO, and Final QA

- Modify: `src/app/globals.css`
- Modify: `src/components/archive/EventTimeline.tsx`
- Modify: `src/components/archive/LedgerSection.tsx`
- Modify: `src/components/archive/MemoryCard.tsx`
- Modify: `src/components/marketing/FeatureBand.tsx`
- Modify: `src/components/marketing/HeroPanel.tsx`
- Modify: `src/components/ritual/ChronicleCard.tsx`
- Modify: `src/components/ritual/ConsequencePanel.tsx`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `src/components/ritual/RecapBlock.tsx`
- Modify: `src/components/ritual/SetupStepper.tsx`
- Modify: `src/components/ui/AuthForm.tsx`
- Modify: `src/components/ui/FeedbackForm.tsx`
- Modify: `src/lib/prompts/catalog.ts`
- Modify: `next.config.ts`
- Modify: `src/app/(marketing)/layout.tsx`
- Create: `src/app/robots.ts`
- Create: `src/app/sitemap.ts`
- Create: `public/og/tyov-beta-card.png`
- Create: `docs/beta-launch-checklist.md`

### Tests

- Create: `tests/integration/route-state-primitives.test.tsx`
- Create: `tests/integration/posthog.test.tsx`
- Create: `tests/integration/feedback-route.test.ts`
- Create: `tests/integration/marketing-metadata.test.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/beta-smoke.spec.ts`
- Modify: `tests/integration/marketing-shell.test.tsx`
- Modify: `tests/integration/chronicles.test.ts`
- Modify: `tests/integration/archive-page.test.tsx`
- Modify: `tests/integration/ledger-page.test.tsx`
- Modify: `tests/integration/recap-page.test.tsx`
- Modify: `tests/integration/setup-flow.test.tsx`
- Modify: `docs/product-roadmap.md`

## Task 1: `TASK-029` Shared Route-State Foundation

**Files:**
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/QuietAlert.tsx`
- Create: `src/components/ui/SkeletonBlock.tsx`
- Create: `src/app/(marketing)/loading.tsx`
- Create: `src/app/(marketing)/error.tsx`
- Create: `src/app/(app)/chronicles/loading.tsx`
- Create: `src/app/(app)/chronicles/error.tsx`
- Create: `src/app/(app)/chronicles/[chronicleId]/loading.tsx`
- Create: `src/app/(app)/chronicles/[chronicleId]/error.tsx`
- Modify: `src/app/(marketing)/page.tsx`
- Modify: `src/app/(app)/chronicles/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/setup/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/ledger/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/recap/page.tsx`
- Test: `tests/integration/route-state-primitives.test.tsx`
- Test: `tests/integration/chronicles.test.ts`
- Test: `tests/integration/archive-page.test.tsx`
- Test: `tests/integration/ledger-page.test.tsx`
- Test: `tests/integration/recap-page.test.tsx`

- [ ] **Step 1: Write failing tests for the new state primitives and one route-level empty/error retrofit**

Create `tests/integration/route-state-primitives.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuietAlert } from "@/components/ui/QuietAlert";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

describe("phase 3 route-state primitives", () => {
  it("renders route-safe empty-state copy and CTA", () => {
    render(
      <EmptyState
        eyebrow="Empty state"
        title="No chronicle has been opened yet."
        body="Begin the first one when you are ready."
        actionHref="/sign-in"
        actionLabel="Begin the Chronicle"
      />,
    );

    expect(screen.getByText("Empty state")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No chronicle has been opened yet." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Begin the Chronicle" }),
    ).toHaveAttribute("href", "/sign-in");
  });

  it("renders quiet retry messaging without raw error text", () => {
    render(
      <QuietAlert
        title="The chronicle ledger could not be read just now."
        body="Try again when you are ready."
        actionLabel="Try again"
      />,
    );

    expect(screen.getByText("Try again when you are ready.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("marks skeleton regions as decorative placeholders", () => {
    const { container } = render(<SkeletonBlock className="h-20 w-full" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
```

Extend `tests/integration/chronicles.test.ts` with one assertion that the empty chronicle-list state comes from a dedicated `EmptyState` component and one assertion that error copy is route-safe:

```ts
expect(
  screen.getByRole("heading", { name: "No chronicle has been opened yet." }),
).toBeInTheDocument();
expect(
  screen.getByText("Begin the first one when you are ready. The ledger will keep the life for you once it starts."),
).toBeInTheDocument();
```

- [ ] **Step 2: Run the state tests to verify RED**

Run:

```bash
npx vitest run \
  tests/integration/route-state-primitives.test.tsx \
  tests/integration/chronicles.test.ts
```

Expected: FAIL because the new UI components and route-state usage do not exist yet.

- [ ] **Step 3: Implement the reusable state primitives**

Create `src/components/ui/EmptyState.tsx`, `src/components/ui/QuietAlert.tsx`, and `src/components/ui/SkeletonBlock.tsx` with stable interfaces:

```tsx
import Link from "next/link";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  body: string;
  className?: string;
  eyebrow: string;
  title: string;
};

export function EmptyState({
  actionHref,
  actionLabel,
  body,
  className,
  eyebrow,
  title,
}: EmptyStateProps) {
  return (
    <SurfacePanel className={cn("max-w-reading px-6 py-8 sm:px-8", className)}>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-heading text-3xl text-ink">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-ink-muted">{body}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92"
        >
          {actionLabel}
        </Link>
      ) : null}
    </SurfacePanel>
  );
}
```

```tsx
type QuietAlertProps = {
  actionLabel?: string;
  body: string;
  onAction?: () => void;
  title: string;
  tone?: "error" | "info" | "warning";
};

export function QuietAlert({
  actionLabel,
  body,
  onAction,
  title,
  tone = "error",
}: QuietAlertProps) {
  const toneClasses =
    tone === "warning"
      ? "border-warning/25 bg-warning/10"
      : tone === "info"
        ? "border-info/25 bg-info/10"
        : "border-error/20 bg-error/10";

  return (
    <SurfacePanel className={`space-y-3 px-5 py-4 ${toneClasses}`}>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
        Quiet alert
      </p>
      <h2 className="font-heading text-2xl leading-tight text-ink">{title}</h2>
      <p className="text-sm leading-relaxed text-ink">{body}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-4 py-2 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92"
        >
          {actionLabel}
        </button>
      ) : null}
    </SurfacePanel>
  );
}
```

```tsx
import { cn } from "@/lib/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-panel bg-surface-muted/70",
        className,
      )}
    />
  );
}
```

- [ ] **Step 4: Add route-level loading and error boundaries**

Create lightweight loading/error files that use the shared components instead of ad hoc markup:

```tsx
// src/app/(app)/chronicles/loading.tsx
import { PageShell } from "@/components/ui/PageShell";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

export default function ChroniclesLoading() {
  return (
    <PageShell className="gap-6 py-8">
      <SurfacePanel tone="nocturne" className="px-6 py-8 sm:px-8">
        <SkeletonBlock className="h-3 w-28 bg-gold/20" />
        <SkeletonBlock className="mt-4 h-16 w-full max-w-[38rem] bg-surface/20" />
        <SkeletonBlock className="mt-4 h-6 w-full max-w-[32rem] bg-surface/20" />
      </SurfacePanel>
      <SkeletonBlock className="h-40 w-full" />
      <SkeletonBlock className="h-40 w-full" />
    </PageShell>
  );
}
```

```tsx
// src/app/(app)/chronicles/error.tsx
"use client";

import { PageShell } from "@/components/ui/PageShell";
import { QuietAlert } from "@/components/ui/QuietAlert";

export default function ChroniclesError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <PageShell className="gap-6 py-8">
      <QuietAlert
        title="The chronicle ledger could not be read just now."
        body="Try again when you are ready."
        actionLabel="Try again"
        onAction={reset}
      />
    </PageShell>
  );
}
```

Mirror that pattern for `(marketing)` and `[chronicleId]` segment boundaries.

- [ ] **Step 5: Retrofit the major routes to use the shared state layer**

Replace ad hoc empty/error panels in route pages with `EmptyState` and `QuietAlert`, while preserving route-specific tone:

```tsx
// src/app/(app)/chronicles/page.tsx
{params.error ? (
  <QuietAlert
    title="The chronicle ledger could not be read just now."
    body={params.error}
    tone="error"
  />
) : null}

{chronicles.length === 0 ? (
  <EmptyState
    eyebrow="Empty state"
    title="No chronicle has been opened yet."
    body="Begin the first one when you are ready. The ledger will keep the life for you once it starts."
  />
) : (
  <div className="grid gap-4">
    {chronicles.map((chronicle) => (
      <ChronicleCard
        key={chronicle.id}
        actionLabel={resolveChronicleActionLabel(chronicle)}
        createdAt={chronicle.created_at}
        href={resolveChronicleHref(chronicle)}
        highlight={params.created === chronicle.id}
        lastPlayedAt={chronicle.last_played_at}
        status={chronicle.status}
        title={chronicle.title}
        vampireName={chronicle.vampire_name}
      />
    ))}
  </div>
)}
```

```tsx
// src/app/(app)/chronicles/[chronicleId]/play/page.tsx
{prompt ? (
  <PromptCard
    promptMarkdown={prompt.prompt_markdown}
    promptNumber={prompt.prompt_number}
  />
) : (
  <QuietAlert
    title="The prompt could not be found just now."
    body="Return when the chronicle is ready."
    tone="error"
  />
)}
```

Apply the same cleanup to setup, archive, ledger, and recap so all route states share the same visual contract.

- [ ] **Step 6: Re-run targeted tests to verify GREEN**

Run:

```bash
npx vitest run \
  tests/integration/route-state-primitives.test.tsx \
  tests/integration/chronicles.test.ts \
  tests/integration/archive-page.test.tsx \
  tests/integration/ledger-page.test.tsx \
  tests/integration/recap-page.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Mark the roadmap task complete and commit**

Update `docs/product-roadmap.md` so `TASK-029` is `- [x]`, then commit:

```bash
git add \
  docs/product-roadmap.md \
  src/components/ui/EmptyState.tsx \
  src/components/ui/QuietAlert.tsx \
  src/components/ui/SkeletonBlock.tsx \
  'src/app/(marketing)/loading.tsx' \
  'src/app/(marketing)/error.tsx' \
  'src/app/(app)/chronicles/loading.tsx' \
  'src/app/(app)/chronicles/error.tsx' \
  'src/app/(app)/chronicles/[chronicleId]/loading.tsx' \
  'src/app/(app)/chronicles/[chronicleId]/error.tsx' \
  tests/integration/route-state-primitives.test.tsx
git commit -m "feat: add shared route state primitives"
```

## Task 2: `TASK-030` Landing Page Launch Polish

**Files:**
- Create: `src/components/marketing/FeatureBand.tsx`
- Create: `public/og/play-surface.png`
- Create: `public/og/archive-surface.png`
- Create: `public/og/recap-surface.png`
- Modify: `src/app/(marketing)/page.tsx`
- Modify: `src/components/marketing/HeroPanel.tsx`
- Test: `tests/integration/marketing-shell.test.tsx`

- [ ] **Step 1: Extend the marketing integration test with the launch-ready content contract**

Add assertions to `tests/integration/marketing-shell.test.tsx`:

```tsx
import MarketingPage from "@/app/(marketing)/page";

it("renders the three launch value bands and beta posture note", () => {
  render(<MarketingPage />);

  expect(
    screen.getByRole("heading", { name: "Start quickly without losing the mood" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Let the archive carry the centuries" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Preserve authorship" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/private beta/i),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the marketing test to verify RED**

Run:

```bash
npx vitest run tests/integration/marketing-shell.test.tsx
```

Expected: FAIL because the feature band and beta launch copy are not in place yet.

- [ ] **Step 3: Add the launch-ready feature band**

Create `src/components/marketing/FeatureBand.tsx` with three launch panels plus atmospheric product surfaces:

```tsx
import Image from "next/image";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

const featureBands = [
  {
    title: "Start quickly without losing the mood",
    body: "Guided setup gets you into the fiction in minutes without flattening the ritual.",
    image: "/og/play-surface.png",
    alt: "The active prompt writing surface",
  },
  {
    title: "Let the archive carry the centuries",
    body: "Memories, losses, and return paths stay readable without becoming admin.",
    image: "/og/archive-surface.png",
    alt: "The archive route with memory cards and event timeline",
  },
  {
    title: "Preserve authorship",
    body: "The product holds the rules and consequences still. The writing remains yours.",
    image: "/og/recap-surface.png",
    alt: "The recap route leading back into the current prompt",
  },
];

export function FeatureBand() {
  return (
    <section className="mx-auto grid max-w-shell gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-3 lg:px-10">
      {featureBands.map((feature) => (
        <SurfacePanel key={feature.title} className="overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-panel border border-ink/8">
            <Image
              src={feature.image}
              alt={feature.alt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 30vw, 100vw"
            />
          </div>
          <h2 className="mt-4 font-heading text-3xl leading-tight text-ink">
            {feature.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            {feature.body}
          </p>
        </SurfacePanel>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Refine the hero and landing route around direct sign-in**

Update `HeroPanel` and `src/app/(marketing)/page.tsx` so the product reads as a rights-aware private beta while keeping direct sign-in primary:

```tsx
// src/components/marketing/HeroPanel.tsx
<p className="font-mono text-xs uppercase tracking-[0.22em] text-surface/60">
  Private beta. Cross-device. Quietly guided.
</p>
<p className="mt-4 max-w-reading text-base leading-relaxed text-surface/76">
  Built for players who want the literary depth of the original without the analog burden, while the launch remains deliberately small.
</p>
```

```tsx
// src/app/(marketing)/page.tsx
import { FeatureBand } from "@/components/marketing/FeatureBand";

export default function MarketingPage() {
  return (
    <main className="pb-12">
      <HeroPanel />
      <FeatureBand />
      <div className="mx-auto max-w-shell px-4 sm:px-6 lg:px-10">
        <SurfacePanel className="px-6 py-6 sm:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Beta posture
          </p>
          <h2 className="mt-3 font-heading text-3xl text-ink">
            A careful launch for a careful adaptation.
          </h2>
          <p className="mt-3 max-w-reading text-base leading-relaxed text-ink-muted">
            This release is a private beta focused on onboarding, prompt flow, archive return, and product tone while licensing posture remains explicit.
          </p>
        </SurfacePanel>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Add the launch surface assets**

Create three real product-surface PNGs under `public/og/` with these exact names and roles:

- `public/og/play-surface.png` - crop of the active prompt writing surface
- `public/og/archive-surface.png` - crop of the archive route with memory and timeline sections
- `public/og/recap-surface.png` - crop of the recap route with resume affordance

Keep them warm-paper/nocturne, 1600px wide, and free of browser chrome.

- [ ] **Step 6: Re-run the marketing test to verify GREEN**

Run:

```bash
npx vitest run tests/integration/marketing-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Mark the roadmap task complete and commit**

Update `docs/product-roadmap.md` so `TASK-030` is `- [x]`, then commit:

```bash
git add \
  docs/product-roadmap.md \
  src/components/marketing/FeatureBand.tsx \
  src/components/marketing/HeroPanel.tsx \
  'src/app/(marketing)/page.tsx' \
  public/og/play-surface.png \
  public/og/archive-surface.png \
  public/og/recap-surface.png \
  tests/integration/marketing-shell.test.tsx
git commit -m "feat: polish landing page for beta launch"
```

## Task 3: `TASK-031` Product Analytics

**Files:**
- Create: `src/lib/analytics/posthog.ts`
- Create: `src/components/providers/PostHogProvider.tsx`
- Create: `src/components/analytics/TrackEventOnMount.tsx`
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/setup/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Modify: `src/components/ui/AuthForm.tsx`
- Modify: `src/components/ritual/SetupStepper.tsx`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `src/app/(app)/chronicles/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/archive/page.tsx`
- Modify: `src/app/(app)/chronicles/[chronicleId]/recap/page.tsx`
- Test: `tests/integration/posthog.test.tsx`

- [ ] **Step 1: Write failing analytics tests around safe event capture**

Create `tests/integration/posthog.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const capture = vi.fn();
const init = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    capture,
    init,
  },
}));

describe("posthog helpers", () => {
  beforeEach(() => {
    capture.mockReset();
    init.mockReset();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  it("does not initialize when public env vars are absent", async () => {
    const { initPostHog } = await import("@/lib/analytics/posthog");
    initPostHog();
    expect(init).not.toHaveBeenCalled();
  });

  it("tracks only the allowed funnel properties", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";
    const { trackAnalyticsEvent } = await import("@/lib/analytics/posthog");

    trackAnalyticsEvent("chronicle_created", {
      chronicleId: "chronicle-1",
      source: "chronicle-list",
      playerEntry: "this must be dropped",
    });

    expect(capture).toHaveBeenCalledWith("chronicle_created", {
      chronicleId: "chronicle-1",
      source: "chronicle-list",
    });
  });
});
```

- [ ] **Step 2: Run the analytics tests to verify RED**

Run:

```bash
npx vitest run tests/integration/posthog.test.tsx
```

Expected: FAIL because the analytics helper and provider modules do not exist yet.

- [ ] **Step 3: Add the dependencies and analytics helper**

Update `package.json` and install the new packages:

```json
{
  "dependencies": {
    "posthog-js": "^1.246.1",
    "posthog-node": "^5.8.4"
  }
}
```

Then create `src/lib/analytics/posthog.ts`:

```ts
"use client";

import posthog from "posthog-js";

export type AnalyticsEventName =
  | "sign_in_requested"
  | "chronicle_created"
  | "setup_completed"
  | "first_prompt_resolved"
  | "archive_opened"
  | "recap_opened"
  | "second_session_return";

type SafeProperties = {
  chronicleId?: string;
  promptNumber?: number;
  source?: "archive" | "chronicle-list" | "recap" | "sign-in" | "setup";
};

export function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key || !host) {
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    person_profiles: "identified_only",
  });
}

export function trackAnalyticsEvent(
  event: AnalyticsEventName,
  properties: SafeProperties = {},
) {
  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  );

  posthog.capture(event, safeProperties);
}
```

- [ ] **Step 4: Wire the provider and route-level event markers**

Create `PostHogProvider` and `TrackEventOnMount`, then mount them in `src/app/layout.tsx`:

```tsx
// src/components/providers/PostHogProvider.tsx
"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/analytics/posthog";

export function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}
```

```tsx
// src/components/analytics/TrackEventOnMount.tsx
"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent, type AnalyticsEventName } from "@/lib/analytics/posthog";

export function TrackEventOnMount({
  event,
  onceKey,
  properties,
}: {
  event: AnalyticsEventName;
  onceKey?: string;
  properties?: {
    chronicleId?: string;
    promptNumber?: number;
    source?: "archive" | "chronicle-list" | "recap" | "sign-in" | "setup";
  };
}) {
  useEffect(() => {
    if (onceKey && window.sessionStorage.getItem(onceKey)) {
      return;
    }

    trackAnalyticsEvent(event, properties);

    if (onceKey) {
      window.sessionStorage.setItem(onceKey, "1");
    }
  }, [event, onceKey, properties]);

  return null;
}
```

```tsx
// src/app/layout.tsx
import { PostHogProvider } from "@/components/providers/PostHogProvider";

<body className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
  <PostHogProvider>{children}</PostHogProvider>
</body>
```

- [ ] **Step 5: Add analytics hooks only at the approved funnel boundaries**

Use existing client seams instead of instrumenting raw text inputs:

```tsx
// src/components/ui/AuthForm.tsx
<form
  action={action}
  className="space-y-5"
  onSubmit={() => trackAnalyticsEvent("sign_in_requested", { source: "sign-in" })}
>
```

```tsx
// src/components/ritual/SetupStepper.tsx
trackAnalyticsEvent("setup_completed", {
  chronicleId,
  source: "setup",
});
window.location.assign(payload.nextRoute);
```

```tsx
// src/app/(app)/chronicles/[chronicleId]/setup/page.tsx
type SetupPageProps = {
  params: Promise<{ chronicleId: string }>;
  searchParams: Promise<{ created?: string }>;
};

{created === "1" ? (
  <TrackEventOnMount
    event="chronicle_created"
    onceKey={`chronicle-created:${chronicleId}`}
    properties={{ chronicleId, source: "setup" }}
  />
) : null}
```

```tsx
// src/app/(app)/chronicles/[chronicleId]/play/page.tsx
<PlaySurface
  chronicleId={chronicleId}
  currentPromptNumber={chronicle.current_prompt_number}
  hasActiveDiary={diaryCount > 0}
  initialSessionId={chronicle.current_session_id}
  mindMemories={mindMemories.map((memory) => ({
    id: memory.id,
    slotIndex: memory.slot_index,
    title: memory.title,
  }))}
/>
```

```tsx
// src/components/ritual/PlaySurface.tsx
if (currentPromptNumber === 1) {
  trackAnalyticsEvent("first_prompt_resolved", {
    chronicleId,
    promptNumber: currentPromptNumber,
  });
}
```

```tsx
// src/app/(app)/chronicles/[chronicleId]/archive/page.tsx
<TrackEventOnMount
  event="archive_opened"
  onceKey={`archive-opened:${chronicleId}`}
  properties={{ chronicleId, source: "archive" }}
/>
```

```tsx
// src/app/(app)/chronicles/page.tsx
function resolveChronicleHref(chronicle: ChronicleRecord) {
  if (chronicle.status === "draft") {
    return `/chronicles/${chronicle.id}/setup`;
  }

  return `/chronicles/${chronicle.id}/recap?returned=1`;
}
```

```tsx
// src/app/(app)/chronicles/[chronicleId]/recap/page.tsx
<TrackEventOnMount
  event="recap_opened"
  onceKey={`recap-opened:${chronicleId}`}
  properties={{ chronicleId, source: "recap" }}
/>
{returned === "1" ? (
  <TrackEventOnMount
    event="second_session_return"
    onceKey={`second-session:${chronicleId}`}
    properties={{ chronicleId, source: "recap" }}
  />
) : null}
```

Also update the "Resume the last active chronicle" CTA on the chronicle list page so it links to `/chronicles/:id/recap?returned=1`.

Also add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example`.

- [ ] **Step 6: Re-run analytics tests and smoke the app build**

Run:

```bash
npx vitest run tests/integration/posthog.test.tsx
npm run build
```

Expected: PASS for the test file and successful production build.

- [ ] **Step 7: Mark the roadmap task complete and commit**

Update `docs/product-roadmap.md` so `TASK-031` is `- [x]`, then commit:

```bash
git add \
  docs/product-roadmap.md \
  package.json \
  .env.example \
  src/lib/analytics/posthog.ts \
  src/components/providers/PostHogProvider.tsx \
  src/components/analytics/TrackEventOnMount.tsx \
  src/app/layout.tsx \
  'src/app/(app)/chronicles/[chronicleId]/setup/page.tsx' \
  'src/app/(app)/chronicles/[chronicleId]/play/page.tsx' \
  'src/app/(app)/chronicles/[chronicleId]/archive/page.tsx' \
  'src/app/(app)/chronicles/[chronicleId]/recap/page.tsx' \
  'src/app/(app)/chronicles/page.tsx' \
  src/components/ui/AuthForm.tsx \
  src/components/ritual/SetupStepper.tsx \
  src/components/ritual/PlaySurface.tsx \
  tests/integration/posthog.test.tsx
git commit -m "feat: add launch funnel analytics"
```

## Task 4: `TASK-032` Feedback Capture

**Files:**
- Create: `supabase/migrations/0008_feedback.sql`
- Create: `src/app/api/feedback/route.ts`
- Create: `src/components/ui/FeedbackForm.tsx`
- Modify: `src/components/ritual/RecapBlock.tsx`
- Modify: `src/lib/supabase/e2e.ts`
- Test: `tests/integration/feedback-route.test.ts`
- Test: `tests/integration/recap-page.test.tsx`

- [ ] **Step 1: Write failing route and recap tests for beta feedback**

Create `tests/integration/feedback-route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

describe("feedback route", () => {
  beforeEach(() => {
    createServerSupabaseClient.mockReset();
  });

  it("returns 401 for unauthenticated feedback", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const { POST } = await import("@/app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          category: "friction",
          body: "The recap helped, but I still wanted more context.",
          source: "recap",
        }),
      }),
    );

    expect(response.status).toBe(401);
  });
});
```

Extend `tests/integration/recap-page.test.tsx`:

```tsx
expect(
  screen.getByRole("button", { name: "Share beta feedback" }),
).toBeInTheDocument();
```

- [ ] **Step 2: Run the feedback tests to verify RED**

Run:

```bash
npx vitest run \
  tests/integration/feedback-route.test.ts \
  tests/integration/recap-page.test.tsx
```

Expected: FAIL because the feedback route, form, and recap entry point do not exist yet.

- [ ] **Step 3: Add the feedback table migration**

Create `supabase/migrations/0008_feedback.sql`:

```sql
create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chronicle_id uuid references public.chronicles (id) on delete set null,
  source text not null check (source in ('recap')),
  category text not null check (category in ('delight', 'friction', 'bug', 'question')),
  body text not null check (char_length(trim(body)) between 20 and 4000),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.feedback_submissions enable row level security;

create policy "Users can insert their own feedback"
on public.feedback_submissions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    chronicle_id is null
    or exists (
      select 1
      from public.chronicles
      where chronicles.id = feedback_submissions.chronicle_id
        and chronicles.user_id = auth.uid()
    )
  )
);
```

- [ ] **Step 4: Implement the route and recap form**

Create `src/app/api/feedback/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const feedbackSchema = z.object({
  body: z.string().trim().min(20).max(4000),
  category: z.enum(["delight", "friction", "bug", "question"]),
  chronicleId: z.string().uuid().optional(),
  source: z.literal("recap"),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { error } = await supabase.from("feedback_submissions").insert({
    body: parsed.data.body,
    category: parsed.data.category,
    chronicle_id: parsed.data.chronicleId ?? null,
    source: parsed.data.source,
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: "The feedback could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

Create `src/components/ui/FeedbackForm.tsx` and render it from `RecapBlock` behind a user-opened button:

```tsx
"use client";

import { useState } from "react";
import { QuietAlert } from "@/components/ui/QuietAlert";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

export function FeedbackForm({ chronicleId }: { chronicleId?: string }) {
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<"delight" | "friction" | "bug" | "question">("friction");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body,
        category,
        chronicleId,
        source: "recap",
      }),
    });

    setStatus(response.ok ? "saved" : "error");
    if (response.ok) {
      setBody("");
    }
  }

  return (
    <SurfacePanel className="space-y-4 px-6 py-6 sm:px-8">
      <h2 className="font-heading text-3xl text-ink">Share beta feedback</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="feedback-category" className="block">
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            What kind of note is this?
          </span>
          <select
            id="feedback-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as typeof category)}
            className="mt-3 min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3"
          >
            <option value="friction">Friction</option>
            <option value="delight">Delight</option>
            <option value="bug">Bug</option>
            <option value="question">Question</option>
          </select>
        </label>
        <label htmlFor="feedback-body" className="block">
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Your note
          </span>
          <textarea
            id="feedback-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="mt-3 min-h-32 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3"
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface"
          disabled={status === "saving"}
        >
          {status === "saving" ? "Setting your note down..." : "Set the note down"}
        </button>
      </form>
      {status === "saved" ? (
        <QuietAlert
          title="Your note has been set down."
          body="Thank you for helping shape the beta."
          tone="info"
        />
      ) : null}
    </SurfacePanel>
  );
}
```

- [ ] **Step 5: Extend the E2E Supabase mock so beta smoke can submit feedback**

Update `src/lib/supabase/e2e.ts` with a new feedback row type and table handling:

```ts
type FeedbackSubmissionRow = {
  body: string;
  category: "bug" | "delight" | "friction" | "question";
  chronicle_id: string | null;
  created_at: string;
  id: string;
  source: "recap";
  user_id: string;
};

type E2EState = {
  feedback_submissions: FeedbackSubmissionRow[];
  archive_events: ArchiveEventRow[];
  characters: Array<Record<string, unknown>>;
  chronicles: ChronicleRow[];
  diaries: DiaryRow[];
  marks: Array<Record<string, unknown>>;
  memory_entries: MemoryEntryRow[];
  memories: MemoryRow[];
  prompt_catalog: PromptCatalogRow[];
  prompt_runs: PromptRunRow[];
  profiles: ProfileRow[];
  resources: Array<Record<string, unknown>>;
  sessions: SessionRow[];
  skills: Array<Record<string, unknown>>;
};
```

```ts
function selectRowsForTable(table: string) {
  switch (table) {
    case "feedback_submissions":
      return state.feedback_submissions;
    case "archive_events":
      return state.archive_events;
    case "chronicles":
      return state.chronicles;
    case "diaries":
      return state.diaries;
    case "memory_entries":
      return state.memory_entries;
    case "memories":
      return state.memories;
    case "prompt_catalog":
      return state.prompt_catalog;
    case "prompt_runs":
      return state.prompt_runs;
    case "profiles":
      return state.profiles;
    case "sessions":
      return state.sessions;
    default:
      return [];
  }
}
```

Also add an insert path mirroring the existing chronicle/profile insert builders.

- [ ] **Step 6: Re-run the feedback tests to verify GREEN**

Run:

```bash
npx vitest run \
  tests/integration/feedback-route.test.ts \
  tests/integration/recap-page.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Mark the roadmap task complete and commit**

Update `docs/product-roadmap.md` so `TASK-032` is `- [x]`, then commit:

```bash
git add \
  docs/product-roadmap.md \
  supabase/migrations/0008_feedback.sql \
  src/app/api/feedback/route.ts \
  src/components/ui/FeedbackForm.tsx \
  src/components/ritual/RecapBlock.tsx \
  src/lib/supabase/e2e.ts \
  tests/integration/feedback-route.test.ts \
  tests/integration/recap-page.test.tsx
git commit -m "feat: add beta feedback capture"
```

## Task 5: `TASK-033` Accessibility Pass

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/(app)/chronicles/page.tsx`
- Modify: `src/components/ui/AuthForm.tsx`
- Modify: `src/components/ritual/SetupStepper.tsx`
- Modify: `src/components/ritual/PlaySurface.tsx`
- Modify: `src/components/ritual/ChronicleCard.tsx`
- Modify: `src/components/ritual/ConsequencePanel.tsx`
- Modify: `src/components/archive/EventTimeline.tsx`
- Modify: `src/components/archive/LedgerSection.tsx`
- Modify: `src/components/archive/MemoryCard.tsx`
- Modify: `src/components/ui/FeedbackForm.tsx`
- Test: `tests/e2e/accessibility.spec.ts`

- [ ] **Step 1: Write the keyboard-only Playwright accessibility pass**

Create `tests/e2e/accessibility.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("keyboard navigation and visible focus work across the core beta routes", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Begin the Chronicle" })).toBeFocused();

  await page.goto("/sign-in");
  await expect(page.getByLabel("Email address")).toBeVisible();

  await page.getByLabel("Testing email address").fill("e2e@example.com");
  await page.getByLabel("Testing password").fill("nightfall");
  await page.getByRole("button", { name: "Enter Through Test Sign-In" }).click();
  await expect(page).toHaveURL("/chronicles");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: /title/i })).toBeFocused();
});
```

- [ ] **Step 2: Run the accessibility spec to verify RED**

Run:

```bash
npx playwright test tests/e2e/accessibility.spec.ts --project=chromium
```

Expected: FAIL on at least one focus, label, or keyboard assertion.

- [ ] **Step 3: Strengthen the global focus and reduced-motion contract**

Update `src/app/globals.css`:

```css
:root {
  --focus-ring-light: var(--color-nocturne);
  --focus-ring-dark: var(--color-gold);
}

:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus-ring-light);
}

.theme-nocturne :focus-visible,
[data-tone="nocturne"] :focus-visible {
  box-shadow: 0 0 0 3px var(--focus-ring-dark);
}

@media (prefers-reduced-motion: reduce) {
  html:focus-within {
    scroll-behavior: auto;
  }
}
```

- [ ] **Step 4: Fix labels, keyboard order, and touch targets in the high-traffic components**

Apply focused accessibility changes instead of cosmetic rewrites:

```tsx
// src/components/ritual/SetupStepper.tsx
<button
  type="button"
  aria-current={index === stepIndex ? "step" : undefined}
  aria-label={`Open step ${index + 1}: ${step.label}`}
  className={`min-h-11 rounded-soft border px-3 py-2 text-left text-sm transition-colors duration-160 ease-ritual ${
    index === stepIndex
      ? "border-gold/60 bg-gold/10 text-ink"
      : "border-ink/10 bg-surface text-ink-muted hover:border-gold/30 hover:text-ink"
  }`}
>
  {step.label}
</button>
```

```tsx
// src/components/archive/MemoryCard.tsx
<summary className="cursor-pointer list-none focus-visible:outline-none">
  <span className="sr-only">Toggle memory details for {title}</span>
  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
    {describeMemoryLocation(location, slotIndex)}
  </p>
  <h3 className="mt-3 font-heading text-2xl leading-tight text-ink sm:text-3xl">
    {title}
  </h3>
</summary>
```

```tsx
// src/components/ui/FeedbackForm.tsx
<textarea
  aria-describedby="feedback-hint"
  className="mt-3 min-h-32 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70"
/>
<p id="feedback-hint" className="text-sm text-ink-muted">
  Keep the note about the product experience rather than the prose you wrote.
</p>
```

Ensure every interactive control is at least `min-h-11` and every form field keeps an explicit text label.

For the chronicle-list create form, replace the placeholder-only contract with an actual label:

```tsx
// src/app/(app)/chronicles/page.tsx
<label
  htmlFor="chronicle-title"
  className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted"
>
  Chronicle title
</label>
<input
  id="chronicle-title"
  type="text"
  name="title"
  placeholder="The Long Night"
  className="min-h-11 flex-1 rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
/>
```

- [ ] **Step 5: Re-run the accessibility spec to verify GREEN**

Run:

```bash
npx playwright test tests/e2e/accessibility.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 6: Mark the roadmap task complete and commit**

Update `docs/product-roadmap.md` so `TASK-033` is `- [x]`, then commit:

```bash
git add \
  docs/product-roadmap.md \
  src/app/globals.css \
  'src/app/(app)/chronicles/page.tsx' \
  src/components/ui/AuthForm.tsx \
  src/components/ritual/SetupStepper.tsx \
  src/components/ritual/PlaySurface.tsx \
  src/components/ritual/ChronicleCard.tsx \
  src/components/ritual/ConsequencePanel.tsx \
  src/components/archive/EventTimeline.tsx \
  src/components/archive/LedgerSection.tsx \
  src/components/archive/MemoryCard.tsx \
  src/components/ui/FeedbackForm.tsx \
  tests/e2e/accessibility.spec.ts
git commit -m "fix: improve accessibility across core routes"
```

## Task 6: `TASK-034` Performance Pass

**Files:**
- Modify: `src/app/(app)/chronicles/[chronicleId]/play/page.tsx`
- Modify: `src/lib/prompts/catalog.ts`
- Modify: `next.config.ts`
- Test: `tests/integration/prompt-catalog.test.ts`

- [ ] **Step 1: Extend the prompt catalog test with a failing cache expectation**

Append to `tests/integration/prompt-catalog.test.ts`:

```ts
it("reuses a cached prompt lookup for identical prompt coordinates", async () => {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: {
      encounter_index: 1,
      prompt_markdown: "Prompt text",
      prompt_number: 1,
      prompt_version: "base",
    },
    error: null,
  });

  const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle,
            }),
          }),
        }),
      }),
    }),
  };

  const { getPromptByPosition } = await import("@/lib/prompts/catalog");
  await getPromptByPosition(supabase as never, 1, 1, "base");
  await getPromptByPosition(supabase as never, 1, 1, "base");

  expect(maybeSingle).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the prompt-catalog test to verify RED**

Run:

```bash
npx vitest run tests/integration/prompt-catalog.test.ts
```

Expected: FAIL because repeated calls still hit Supabase twice.

- [ ] **Step 3: Cache the prompt lookup and keep the play page server-led**

Update `src/lib/prompts/catalog.ts` with a request-local memoizer:

```ts
const promptCache = new Map<string, PromptCatalogRow | null>();

export async function getPromptByPosition(
  supabase: PromptCatalogClient,
  promptNumber: number,
  encounterIndex: number,
  promptVersion = "base",
) {
  const cacheKey = `${promptVersion}:${promptNumber}:${encounterIndex}`;

  if (promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey) ?? null;
  }

  const { data, error } = await supabase
    .from("prompt_catalog")
    .select("prompt_number, encounter_index, prompt_markdown, prompt_version")
    .eq("prompt_number", promptNumber)
    .eq("encounter_index", encounterIndex)
    .eq("prompt_version", promptVersion)
    .maybeSingle();

  if (error) {
    throw error;
  }

  promptCache.set(cacheKey, data ?? null);
  return data;
}
```

Update `src/app/(app)/chronicles/[chronicleId]/play/page.tsx` so the route does all of its I/O in one server pass and passes only the minimal data to the client form:

```tsx
const [mindMemoriesResult, diaryResult, prompt] = await Promise.all([
  memoryClient
    .from("memories")
    .select("id, title, slot_index")
    .eq("chronicle_id", chronicleId),
  diaryCountClient
    .from("diaries")
    .select("id", { count: "exact", head: true })
    .eq("chronicle_id", chronicleId)
    .eq("status", "active"),
  getPromptByPosition(
    supabase as never,
    chronicle.current_prompt_number,
    chronicle.current_prompt_encounter,
    chronicle.prompt_version,
  ),
]);
```

- [ ] **Step 4: Tighten Next.js build settings for the Phase 3 surface**

Update `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
```

- [ ] **Step 5: Re-run the performance-facing tests and production build**

Run:

```bash
npx vitest run tests/integration/prompt-catalog.test.ts
npm run build
```

Expected: PASS and successful build.

- [ ] **Step 6: Mark the roadmap task complete and commit**

Update `docs/product-roadmap.md` so `TASK-034` is `- [x]`, then commit:

```bash
git add \
  docs/product-roadmap.md \
  src/lib/prompts/catalog.ts \
  'src/app/(app)/chronicles/[chronicleId]/play/page.tsx' \
  next.config.ts \
  tests/integration/prompt-catalog.test.ts
git commit -m "perf: cache prompt lookups and tighten build settings"
```

## Task 7: `TASK-035` SEO Metadata, Open Graph, and Beta-Legal Copy

**Files:**
- Modify: `src/app/(marketing)/layout.tsx`
- Create: `src/app/robots.ts`
- Create: `src/app/sitemap.ts`
- Modify: `src/app/(marketing)/page.tsx`
- Create: `public/og/tyov-beta-card.png`
- Test: `tests/integration/marketing-metadata.test.ts`

- [ ] **Step 1: Write failing metadata tests for the public marketing surface**

Create `tests/integration/marketing-metadata.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("marketing metadata", () => {
  it("returns a sitemap with only the public marketing route", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const entries = await sitemap();

    expect(entries).toHaveLength(1);
    expect(entries[0]?.url).toMatch(/\/$/);
  });

  it("disallows indexing authenticated routes", async () => {
    const robots = (await import("@/app/robots")).default;
    const rules = await robots();

    expect(rules.rules).toEqual(
      expect.objectContaining({
        disallow: expect.arrayContaining(["/auth", "/chronicles", "/sign-in"]),
      }),
    );
  });
});
```

- [ ] **Step 2: Run the metadata tests to verify RED**

Run:

```bash
npx vitest run tests/integration/marketing-metadata.test.ts
```

Expected: FAIL because `robots.ts`, `sitemap.ts`, and marketing metadata do not exist yet.

- [ ] **Step 3: Add the marketing layout metadata and public indexing rules**

Update `src/app/(marketing)/layout.tsx`:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Thousand Year Old Vampire: Digital Edition",
  description: "A guided digital ritual for a solitary gothic life. Private beta.",
  openGraph: {
    title: "Thousand Year Old Vampire: Digital Edition",
    description: "A guided digital ritual for a solitary gothic life. Private beta.",
    images: ["/og/tyov-beta-card.png"],
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
```

Create `src/app/robots.ts` and `src/app/sitemap.ts`:

```ts
// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth", "/chronicles", "/sign-in"],
    },
    sitemap: "/sitemap.xml",
  };
}
```

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/auth/redirects";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", resolveSiteUrl()).toString(),
    },
  ];
}
```

- [ ] **Step 4: Add honest beta/legal posture copy and the OG asset**

Add a final note block to `src/app/(marketing)/page.tsx`:

```tsx
<SurfacePanel className="px-6 py-6 sm:px-8">
  <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
    Launch posture
  </p>
  <h2 className="mt-3 font-heading text-3xl text-ink">
    Private beta while the launch surface and licensing posture stay explicit.
  </h2>
  <p className="mt-3 max-w-reading text-base leading-relaxed text-ink-muted">
    This beta is a careful adaptation in progress. The product is public enough to explain itself, but not presented as a broad official release while launch conditions are still being clarified.
  </p>
</SurfacePanel>
```

Create `public/og/tyov-beta-card.png` as a 1200x630 marketing card using the approved headline, a nocturne hero band, and one archive/play surface crop.

- [ ] **Step 5: Re-run the metadata tests to verify GREEN**

Run:

```bash
npx vitest run tests/integration/marketing-metadata.test.ts
```

Expected: PASS.

- [ ] **Step 6: Mark the roadmap task complete and commit**

Update `docs/product-roadmap.md` so `TASK-035` is `- [x]`, then commit:

```bash
git add \
  docs/product-roadmap.md \
  'src/app/(marketing)/layout.tsx' \
  'src/app/(marketing)/page.tsx' \
  src/app/robots.ts \
  src/app/sitemap.ts \
  public/og/tyov-beta-card.png \
  tests/integration/marketing-metadata.test.ts
git commit -m "feat: add beta launch metadata and legal posture copy"
```

## Task 8: `TASK-036` Final Beta-Readiness QA

**Files:**
- Create: `docs/beta-launch-checklist.md`
- Create: `tests/e2e/beta-smoke.spec.ts`
- Modify: `src/lib/supabase/e2e.ts`
- Modify: `docs/product-roadmap.md`

- [ ] **Step 1: Write the final beta smoke spec**

Create `tests/e2e/beta-smoke.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("beta readiness flow covers sign-in, setup, first prompt, archive, recap, and feedback", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page.getByLabel("Testing email address").fill("e2e@example.com");
  await page.getByLabel("Testing password").fill("nightfall");
  await page.getByRole("button", { name: "Enter Through Test Sign-In" }).click();
  await expect(page).toHaveURL("/chronicles");

  await page.getByPlaceholder("The Long Night").fill("The Long Night");
  await page.getByRole("button", { name: "Begin a New Chronicle" }).click();
  await expect(page).toHaveURL(/\/chronicles\/.+\/setup/);

  await page.getByLabel("Mortal summary").fill(
    "I had a life of service, habit, and private longing before the night opened.",
  );
  await page.getByRole("button", { name: "Continue to the next threshold" }).click();

  await page.getByLabel("First skill").fill("Quiet Devotion");
  await page.getByLabel("Why this skill mattered").fill(
    "I knew how to listen before I knew how to survive.",
  );
  await page.getByLabel("First resource").fill("The Marsh House");
  await page.getByLabel("Why it matters").fill(
    "It was the first shelter I claimed as the hunger sharpened.",
  );
  await page.getByRole("button", { name: "Continue to the next threshold" }).click();

  await page.getByLabel("A mortal character").fill("Marta");
  await page.getByLabel("Why they still matter").fill(
    "She believed there was still a gentler version of me worth saving.",
  );
  await page.getByLabel("The immortal who made you").fill("Aurelia");
  await page.getByLabel("How they changed you").fill(
    "She remade my hunger and called it a gift.",
  );
  await page.getByRole("button", { name: "Continue to the next threshold" }).click();

  await page.getByLabel("The mark").fill("Unsteady Reflection");
  await page.getByLabel("How it shows itself").fill(
    "My reflection trembles before it vanishes.",
  );
  await page.getByRole("button", { name: "Continue to the next threshold" }).click();

  await page.getByLabel("First memory title").fill("My vigil by the sickbed");
  await page.getByLabel("First memory entry").fill(
    "I kept watch outside the sickroom and learned patience.",
  );
  await page.getByRole("button", { name: "Enter the first prompt" }).click();
  await expect(page).toHaveURL(/\/chronicles\/.+\/play/);

  await page.getByLabel("Player entry").fill(
    "I answered the bells by dragging the sexton into the thawing graveyard.",
  );
  await page.getByLabel("Experience text").fill(
    "I left the chapel with blood under my nails and a prayer I could not finish.",
  );
  await page.getByRole("button", { name: "Set the entry into memory" }).click();
  await expect(page.getByText("The entry has been set into memory.")).toBeVisible();

  const chronicleId = page.url().match(/\/chronicles\/([^/]+)\//)?.[1] ?? "";
  await page.goto(`/chronicles/${chronicleId}/archive`);
  await expect(page.getByRole("heading", { name: "Chronicle archive" })).toBeVisible();

  await page.goto(`/chronicles/${chronicleId}/recap`);
  await expect(page.getByRole("button", { name: "Share beta feedback" })).toBeVisible();
  await page.getByRole("button", { name: "Share beta feedback" }).click();
  await page.getByLabel("Your note").fill(
    "The return flow felt strong, but I still wanted slightly more context before resuming the prompt.",
  );
  await page.getByRole("button", { name: "Set the note down" }).click();
  await expect(page.getByText("Your note has been set down.")).toBeVisible();
});
```

- [ ] **Step 2: Create the manual beta checklist**

Create `docs/beta-launch-checklist.md`:

```md
# Beta Launch Checklist

- [ ] Landing page communicates the product and direct sign-in path clearly
- [ ] Sign-in succeeds without breaking return-path routing
- [ ] Chronicle creation routes into setup
- [ ] Setup completion routes into play
- [ ] First prompt resolution shows the consequence panel
- [ ] Archive route loads memories, prompt history, and event timeline
- [ ] Recap route loads prose and resume action
- [ ] Feedback form submits successfully from recap
- [ ] Keyboard-only pass succeeds on landing, sign-in, setup, play, archive, ledger, and recap
- [ ] Production build succeeds with current metadata and OG assets
```

- [ ] **Step 3: Run the final smoke and full verification set**

Run:

```bash
npx playwright test tests/e2e/accessibility.spec.ts tests/e2e/beta-smoke.spec.ts --project=chromium
npx vitest run
npm run build
```

Expected: all commands pass.

- [ ] **Step 4: Mark the roadmap task complete and commit**

Update `docs/product-roadmap.md` so `TASK-036` is `- [x]`, then commit:

```bash
git add \
  docs/product-roadmap.md \
  docs/beta-launch-checklist.md \
  tests/e2e/beta-smoke.spec.ts
git commit -m "test: add beta launch checklist and smoke coverage"
```

## Final Wrap-Up

- [ ] **Step 1: Verify the whole Phase 3 slice one more time**

Run:

```bash
npx vitest run
npx playwright test --project=chromium
npm run build
git diff --stat main...
```

Expected: green tests, successful build, and a Phase 3-only diff.

- [ ] **Step 2: Confirm all Phase 3 roadmap boxes are checked**

Inspect `docs/product-roadmap.md` and confirm `TASK-029` through `TASK-036` are all `- [x]`.

- [ ] **Step 3: Push the phase branch and open the ready PR**

Use:

```bash
git push -u origin phase-3/polish-and-launch-prep
```

Open a ready-for-review PR titled:

```text
Phase 3: Polish & Launch Prep
```

PR body should include:

```md
## Goal
Phase 3 makes the MVP feel beta-ready: consistent route states, launch-ready messaging, product analytics, feedback capture, accessibility/performance hardening, and final launch QA.

## Completed Tasks
- TASK-029 shared route-state foundation
- TASK-030 landing page launch polish
- TASK-031 launch funnel analytics
- TASK-032 beta feedback capture
- TASK-033 accessibility pass
- TASK-034 performance pass
- TASK-035 SEO metadata and beta-accurate legal posture
- TASK-036 beta checklist and final smoke suite

## Verification
- `npx vitest run`
- `npx playwright test --project=chromium`
- `npm run build`
```
