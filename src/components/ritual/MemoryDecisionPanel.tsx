"use client";

import type { ActiveDiarySummary } from "@/types/chronicle";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type MemoryDecisionPanelProps = {
  activeDiary: ActiveDiarySummary | null;
  memories: Array<{
    id: string;
    slotIndex: number | null;
    title: string;
  }>;
  onModeChange: (value: "forget-existing" | "move-to-diary") => void;
  onSelectedMemoryChange: (value: string) => void;
  selectedMemoryId: string | null;
  selectedMode: "forget-existing" | "move-to-diary" | null;
};

export function MemoryDecisionPanel({
  activeDiary,
  memories,
  onModeChange,
  onSelectedMemoryChange,
  selectedMemoryId,
  selectedMode,
}: MemoryDecisionPanelProps) {
  const isDiaryFull =
    activeDiary !== null &&
    activeDiary.memoryCount >= activeDiary.memoryCapacity;

  return (
    <SurfacePanel className="space-y-5 border-gold/18 bg-gold/6 px-6 py-6 sm:px-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
          Memory overflow
        </p>
        <h2 className="mt-3 font-heading text-3xl text-ink">
          The mind is full.
        </h2>
        <p className="mt-3 max-w-reading text-base leading-relaxed text-ink">
          The mind is full. Choose which memory to forget or press into the
          diary before this new one can settle.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
          Legal choices
        </legend>

        <label className="flex cursor-pointer items-start gap-3 rounded-soft border border-ink/10 bg-surface/88 px-4 py-3">
          <input
            checked={selectedMode === "forget-existing"}
            className="mt-1"
            name="overflowMode"
            onChange={() => onModeChange("forget-existing")}
            type="radio"
            value="forget-existing"
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-ink">
              Forget one in-mind memory
            </span>
            <span className="block text-sm leading-relaxed text-ink-muted">
              The chosen memory leaves the active stack and becomes part of the
              forgotten archive.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-soft border border-ink/10 bg-surface/88 px-4 py-3">
          <input
            checked={selectedMode === "move-to-diary"}
            className="mt-1"
            disabled={isDiaryFull}
            name="overflowMode"
            onChange={() => onModeChange("move-to-diary")}
            type="radio"
            value="move-to-diary"
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-ink">
              {activeDiary
                ? "Move one memory into the diary"
                : "Move one memory into a new diary"}
            </span>
            <span className="block text-sm leading-relaxed text-ink-muted">
              {isDiaryFull
                ? `The diary is full at ${activeDiary.memoryCapacity} memories. Forget one in-mind memory, or wait for a prompt effect that changes the diary.`
                : activeDiary
                  ? "The chosen memory leaves the active stack but remains legible in the diary."
                : "The chosen memory will be pressed into a diary the chronicle opens for you."}
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
          Choose the memory
        </legend>

        <div className="space-y-2">
          {memories.map((memory) => (
            <label
              key={memory.id}
              className="flex cursor-pointer items-start gap-3 rounded-soft border border-ink/10 bg-surface/88 px-4 py-3"
            >
              <input
                checked={selectedMemoryId === memory.id}
                className="mt-1"
                name="overflowMemory"
                onChange={() => onSelectedMemoryChange(memory.id)}
                type="radio"
                value={memory.id}
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-ink">
                  {memory.slotIndex
                    ? `Slot ${memory.slotIndex}: ${memory.title}`
                    : memory.title}
                </span>
                <span className="block text-sm leading-relaxed text-ink-muted">
                  Choose this memory as the legal place to make room.
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </SurfacePanel>
  );
}
