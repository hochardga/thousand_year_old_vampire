import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

export function HeroPanel() {
  return (
    <PageShell className="justify-center gap-6 py-10 sm:py-14">
      <SurfacePanel
        tone="nocturne"
        className="overflow-hidden px-6 py-10 sm:px-10 sm:py-12"
      >
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-surface/60">
          Private beta. Cross-device. Quietly guided.
        </p>
        <h1 className="mt-4 max-w-reading text-balance font-heading text-5xl leading-[1.05] text-surface sm:text-6xl">
          Enter the vampire&apos;s life before the rules get in the way.
        </h1>
        <p className="mt-4 max-w-reading text-base leading-relaxed text-surface/76">
          Built for players who want the literary depth of the original without
          the analog burden, while the launch remains deliberately small.
        </p>
        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link
            href="/sign-in"
            className="inline-flex min-h-11 items-center justify-center rounded-soft bg-surface px-5 py-3 font-medium text-nocturne transition-colors duration-160 ease-ritual hover:bg-surface-muted"
          >
            Begin the Chronicle
          </Link>
        </div>
      </SurfacePanel>
    </PageShell>
  );
}
