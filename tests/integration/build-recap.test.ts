import { describe, expect, it } from "vitest";
import { buildRecap } from "@/lib/recap/buildRecap";

describe("buildRecap", () => {
  it("turns recent prompt runs and archive events into useful recap prose", () => {
    const recap = buildRecap({
      archiveEvents: [
        {
          created_at: "2026-04-21T12:00:00.000Z",
          event_type: "memory_forgotten",
          summary: "An old memory has been surrendered to the dark.",
        },
      ],
      chronicleTitle: "The Long Night",
      currentPromptEncounter: 1,
      currentPromptNumber: 7,
      promptRuns: [
        {
          created_at: "2026-04-21T11:00:00.000Z",
          encounter_index: 1,
          experience_text: "I kept the chapel smoke in my lungs.",
          movement: 3,
          prompt_number: 6,
        },
      ],
    });

    expect(recap).toContain("The Long Night");
    expect(recap).toContain("Prompt 7");
    expect(recap).not.toContain("prompt 7.1");
    expect(recap).toContain("Prompt 6");
    expect(recap).not.toContain("moved the chronicle forward");
    expect(recap).toContain("An old memory has been surrendered to the dark.");
    expect(recap.length).toBeGreaterThan(80);
  });

  it("prefers concrete prompt experiences over repeated generic archive events", () => {
    const recap = buildRecap({
      archiveEvents: [
        {
          created_at: "2026-04-21T12:00:00.000Z",
          event_type: "prompt_resolved",
          summary: "The entry has been set into memory.",
        },
        {
          created_at: "2026-04-21T12:01:00.000Z",
          event_type: "prompt_resolved",
          summary: "The entry has been set into memory.",
        },
      ],
      chronicleTitle: "The Long Night",
      currentPromptEncounter: 1,
      currentPromptNumber: 4,
      promptRuns: [
        {
          created_at: "2026-04-21T11:00:00.000Z",
          encounter_index: 1,
          experience_text:
            "The cistern became a chapel for hunger and secrecy.",
          movement: 3,
          prompt_number: 1,
        },
      ],
    });

    expect(recap).toContain(
      "The cistern became a chapel for hunger and secrecy.",
    );
    expect(recap).not.toContain("The latest changes around the archive");
    expect(recap).not.toContain("The entry has been set into memory. The entry has been set into memory.");
  });
});
