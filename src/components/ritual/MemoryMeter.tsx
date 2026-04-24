import type { ActiveDiarySummary } from "@/types/chronicle";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type MemoryMeterProps = {
  activeDiary: ActiveDiarySummary | null;
  memoriesInMind: number;
};

function memoryLabel(memoriesInMind: number) {
  return memoriesInMind === 1
    ? "1 memory held in mind"
    : `${memoriesInMind} memories held in mind`;
}

export function MemoryMeter({
  activeDiary,
  memoriesInMind,
}: MemoryMeterProps) {
  return (
    <SurfacePanel className="space-y-4 px-5 py-5">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
        Current state
      </p>
      <div className="space-y-2">
        <p className="text-base text-ink">{memoryLabel(memoriesInMind)}</p>
        <p className="text-sm text-ink-muted">
          {activeDiary
            ? `Diary ${activeDiary.memoryCount} of ${activeDiary.memoryCapacity} memories`
            : "No diary yet"}
        </p>
      </div>
    </SurfacePanel>
  );
}
