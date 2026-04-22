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

function formatMovement(movement: number) {
  if (movement > 0) {
    return `forward by ${movement}`;
  }

  if (movement < 0) {
    return `back by ${Math.abs(movement)}`;
  }

  return "without changing position";
}

function formatPromptLine(promptRun: RecapPromptRun) {
  return `Prompt ${promptRun.prompt_number}.${promptRun.encounter_index} moved the chronicle ${formatMovement(promptRun.movement)} and left ${promptRun.experience_text}`;
}

export function buildRecap({
  archiveEvents,
  chronicleTitle,
  currentPromptEncounter,
  currentPromptNumber,
  promptRuns,
}: BuildRecapInput) {
  const promptSummary =
    promptRuns.length > 0
      ? promptRuns.map(formatPromptLine).join(" ")
      : "No recent prompt run could be recovered, so the chronicle must be resumed from its current place alone.";
  const eventSummary =
    archiveEvents.length > 0
      ? archiveEvents.map((event) => event.summary).join(" ")
      : "No recent archive event was recorded beyond the ordinary movement of play.";

  return `${chronicleTitle} now waits at prompt ${currentPromptNumber}.${currentPromptEncounter}.\n\n${promptSummary}\n\nThe latest changes around the archive: ${eventSummary}`;
}
