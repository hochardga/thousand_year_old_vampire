import { describe, expect, it, vi } from "vitest";
import { getPromptByPosition } from "@/lib/prompts/catalog";

describe("prompt catalog loader", () => {
  it("loads a prompt row by prompt number and encounter index", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        encounter_index: 1,
        prompt_markdown: "Prompt 1",
        prompt_number: 1,
        prompt_version: "base",
      },
      error: null,
    });
    const versionEq = vi.fn(() => ({ maybeSingle }));
    const encounterEq = vi.fn(() => ({ eq: versionEq }));
    const promptEq = vi.fn(() => ({ eq: encounterEq }));
    const select = vi.fn(() => ({ eq: promptEq }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from };

    const prompt = await getPromptByPosition(supabase as never, 1, 1);

    expect(from).toHaveBeenCalledWith("prompt_catalog");
    expect(select).toHaveBeenCalledWith(
      "prompt_number, encounter_index, prompt_markdown, prompt_version",
    );
    expect(promptEq).toHaveBeenCalledWith("prompt_number", 1);
    expect(encounterEq).toHaveBeenCalledWith("encounter_index", 1);
    expect(versionEq).toHaveBeenCalledWith("prompt_version", "base");
    expect(prompt).toEqual({
      encounter_index: 1,
      prompt_markdown: "Prompt 1",
      prompt_number: 1,
      prompt_version: "base",
    });
  });
});
