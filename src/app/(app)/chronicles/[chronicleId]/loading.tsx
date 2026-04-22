import { PageShell } from "@/components/ui/PageShell";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

export default function ChronicleSegmentLoading() {
  return (
    <PageShell className="gap-6 py-8">
      <SurfacePanel tone="nocturne" className="px-6 py-8 sm:px-8">
        <SkeletonBlock className="h-3 w-28 bg-gold/20" />
        <SkeletonBlock className="mt-4 h-16 w-full max-w-[32rem] bg-surface/20" />
        <SkeletonBlock className="mt-4 h-6 w-full max-w-[28rem] bg-surface/20" />
      </SurfacePanel>
      <SkeletonBlock className="h-64 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonBlock className="h-48 w-full" />
        <SkeletonBlock className="h-48 w-full" />
      </div>
    </PageShell>
  );
}
