import { describe, expect, it } from "vitest";
import { resolvePrompt } from "@/lib/chronicles/resolvePrompt";
import type { PromptResolutionPayload } from "@/types/chronicle";

const payload: PromptResolutionPayload = {
  experienceText:
    "I set the moment into language before it can slip away from me again.",
  memoryDecision: {
    mode: "create-new",
  },
  playerEntry:
    "I answer in the quiet voice I use when I am afraid to hear myself clearly.",
  sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
  traitMutations: {
    characters: [],
    marks: [],
    resources: [],
    skills: [],
  },
};

describe("resolvePrompt", () => {
  it("normalizes known memory-rule failures into calm product copy", async () => {
    const supabase = {
      rpc: async () => ({
        data: null,
        error: {
          message: "A memory decision is required when the mind is full.",
        },
      }),
    };

    await expect(
      resolvePrompt(supabase, "chronicle-1", payload),
    ).rejects.toThrow(
      "Choose a memory to forget or move into the diary before adding a new one.",
    );
  });
});
