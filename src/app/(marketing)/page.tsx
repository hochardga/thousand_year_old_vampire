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
            Beta posture
          </p>
          <h2 className="mt-3 font-heading text-3xl text-ink">
            A careful launch for a careful adaptation.
          </h2>
          <p className="mt-3 max-w-reading text-base leading-relaxed text-ink-muted">
            This release is a private beta focused on onboarding, prompt flow,
            archive return, and product tone while licensing posture remains
            explicit.
          </p>
        </SurfacePanel>
      </div>
    </main>
  );
}
