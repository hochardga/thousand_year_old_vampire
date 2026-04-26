"use client";

import { SurfacePanel } from "@/components/ui/SurfacePanel";

type PlacementMode = "append-existing" | "create-new";

type MemoryPlacementPanelProps = {
  memories: Array<{
    entryCount?: number;
    id: string;
    slotIndex: number | null;
    title: string;
  }>;
  onModeChange: (value: PlacementMode) => void;
  onSelectedMemoryChange: (value: string) => void;
  selectedMemoryId: string | null;
  selectedMode: PlacementMode;
};

function describeEntryCount(entryCount: number | undefined) {
  if (typeof entryCount !== "number") {
    return "Held in mind; the chronicle will confirm whether there is room.";
  }

  return `${entryCount} of 3 Experiences held here.`;
}

export function MemoryPlacementPanel({
  memories,
  onModeChange,
  onSelectedMemoryChange,
  selectedMemoryId,
  selectedMode,
}: MemoryPlacementPanelProps) {
  const canAppend = memories.length > 0;

  return (
    <SurfacePanel className="space-y-5 border-ink/10 bg-surface/88 px-5 py-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
          Memory placement
        </p>
        <h3 className="mt-2 font-heading text-2xl text-ink">
          Decide where this Experience settles.
        </h3>
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">Memory placement</legend>

        <label className="flex cursor-pointer items-start gap-3 rounded-soft border border-ink/10 bg-surface px-4 py-3">
          <input
            checked={selectedMode === "create-new"}
            className="mt-1"
            name="memoryPlacementMode"
            onChange={() => onModeChange("create-new")}
            type="radio"
            value="create-new"
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-ink">
              Begin a new Memory
            </span>
            <span className="block text-sm leading-relaxed text-ink-muted">
              Let this Experience open a new thread in the vampire&apos;s mind.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-soft border border-ink/10 bg-surface px-4 py-3">
          <input
            checked={selectedMode === "append-existing"}
            className="mt-1"
            disabled={!canAppend}
            name="memoryPlacementMode"
            onChange={() => onModeChange("append-existing")}
            type="radio"
            value="append-existing"
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-ink">
              Add this Experience to an existing Memory
            </span>
            <span className="block text-sm leading-relaxed text-ink-muted">
              Keep related Experiences clustered until a Memory holds three.
            </span>
          </span>
        </label>
      </fieldset>

      {selectedMode === "append-existing" && canAppend ? (
        <fieldset className="space-y-3">
          <legend className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Choose the Memory
          </legend>
          <div className="space-y-2">
            {memories.map((memory) => {
              const isFull =
                typeof memory.entryCount === "number" && memory.entryCount >= 3;

              return (
                <label
                  key={memory.id}
                  className="flex cursor-pointer items-start gap-3 rounded-soft border border-ink/10 bg-surface px-4 py-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
                >
                  <input
                    checked={selectedMemoryId === memory.id}
                    className="mt-1"
                    disabled={isFull}
                    name="appendMemory"
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
                      {isFull
                        ? "This Memory already holds 3 Experiences."
                        : describeEntryCount(memory.entryCount)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
    </SurfacePanel>
  );
}
