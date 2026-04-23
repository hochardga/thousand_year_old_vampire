import { FeatureBand } from "@/components/marketing/FeatureBand";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { HeroPanel } from "@/components/marketing/HeroPanel";

export default function MarketingPage() {
  return (
    <main className="pb-12">
      <HeroPanel />
      <FeatureBand />
      <div className="mx-auto max-w-shell px-4 sm:px-6 lg:px-10">
        <SurfacePanel className="px-6 py-6 sm:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Launch posture
          </p>
          <h2 className="mt-3 font-heading text-3xl text-ink">
            Private beta while the launch surface and licensing posture stay explicit.
          </h2>
          <p className="mt-3 max-w-reading text-base leading-relaxed text-ink-muted">
            This beta is a careful adaptation in progress. The product is public
            enough to explain itself, but not presented as a broad official
            release while launch conditions are still being clarified.
          </p>
        </SurfacePanel>
      </div>
    </main>
  );
}
