import { SurfacePanel } from "@/components/ui/SurfacePanel";

type MemoryMeterProps = {
  hasActiveDiary: boolean;
  memoriesInMind: number;
};

function memoryLabel(memoriesInMind: number) {
  return memoriesInMind === 1
    ? "1 memory held in mind"
    : `${memoriesInMind} memories held in mind`;
}

export function MemoryMeter({
  hasActiveDiary,
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
          {hasActiveDiary ? "Diary present" : "No diary yet"}
        </p>
      </div>
    </SurfacePanel>
  );
}
