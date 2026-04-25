type RecapPromptRun = {
  created_at: string;
  encounter_index: number;
  experience_text: string;
  movement: number;
  prompt_number: number;
};

type RecapArchiveEvent = {
  created_at: string;
  event_type: string;
  summary: string;
};

type BuildRecapInput = {
  archiveEvents: RecapArchiveEvent[];
  chronicleTitle: string;
  currentPromptEncounter: number;
  currentPromptNumber: number;
  promptRuns: RecapPromptRun[];
};

function formatPromptLine(promptRun: RecapPromptRun) {
  return `Prompt ${promptRun.prompt_number} left this memory: ${promptRun.experience_text}`;
}

function uniqueUsefulEvents(
  archiveEvents: RecapArchiveEvent[],
  hasPromptRuns: boolean,
) {
  const seen = new Set<string>();

  return archiveEvents.filter((event) => {
    if (
      hasPromptRuns &&
      event.event_type === "prompt_resolved" &&
      event.summary === "The entry has been set into memory."
    ) {
      return false;
    }

    if (seen.has(event.summary)) {
      return false;
    }

    seen.add(event.summary);
    return true;
  });
}

export function buildRecap(input: BuildRecapInput) {
  const { archiveEvents, chronicleTitle, currentPromptNumber, promptRuns } = input;
  const promptSummary =
    promptRuns.length > 0
      ? promptRuns.map(formatPromptLine).join(" ")
      : "No recent prompt run could be recovered, so the chronicle must be resumed from its current place alone.";
  const usefulEvents = uniqueUsefulEvents(archiveEvents, promptRuns.length > 0);
  const eventSummary =
    usefulEvents.length > 0
      ? `Recent archive changes: ${usefulEvents.map((event) => event.summary).join(" ")}`
      : "No unusual archive changes were recorded beyond the prompt memories.";

  return `${chronicleTitle} now waits at Prompt ${currentPromptNumber}.\n\n${promptSummary}\n\n${eventSummary}`;
}
