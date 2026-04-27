import { describe, expect, it, vi } from "vitest";
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
  it("passes prompt-created skills into the resolve_prompt_run RPC payload", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        archiveEvents: [],
        nextPrompt: {
          encounterIndex: 1,
          promptNumber: 4,
        },
        promptRunId: "run-1",
        rolled: {
          d10: 7,
          d6: 4,
          movement: 3,
        },
      },
      error: null,
    });

    await resolvePrompt(
      { rpc },
      "chronicle-1",
      {
        ...payload,
        newSkill: {
          description: "I learned to feed first and mourn later.",
          label: "Bloodthirsty",
        },
      },
    );

    expect(rpc).toHaveBeenCalledWith(
      "resolve_prompt_run",
      expect.objectContaining({
        new_skill: {
          description: "I learned to feed first and mourn later.",
          label: "Bloodthirsty",
        },
      }),
    );
  });

  it("passes prompt-created resources into the resolve_prompt_run RPC payload", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        archiveEvents: [],
        nextPrompt: {
          encounterIndex: 1,
          promptNumber: 4,
        },
        promptRunId: "run-1",
        rolled: {
          d10: 7,
          d6: 4,
          movement: 3,
        },
      },
      error: null,
    });

    await resolvePrompt(
      { rpc },
      "chronicle-1",
      {
        ...payload,
        newResource: {
          description: "A roofed crypt where I can feed and vanish.",
          isStationary: true,
          label: "The Marsh House",
        },
      },
    );

    expect(rpc).toHaveBeenCalledWith(
      "resolve_prompt_run",
      expect.objectContaining({
        new_resource: {
          description: "A roofed crypt where I can feed and vanish.",
          isStationary: true,
          label: "The Marsh House",
        },
      }),
    );
  });

  it("passes prompt-created marks into the resolve_prompt_run RPC payload", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        archiveEvents: [],
        nextPrompt: {
          encounterIndex: 1,
          promptNumber: 4,
        },
        promptRunId: "run-1",
        rolled: {
          d10: 7,
          d6: 4,
          movement: 3,
        },
      },
      error: null,
    });

    await resolvePrompt(
      { rpc },
      "chronicle-1",
      {
        ...payload,
        newMark: {
          description: "A crescent scar that opens when I hunger.",
          isConcealed: true,
          label: "Moon-Scarred Throat",
        },
      },
    );

    expect(rpc).toHaveBeenCalledWith(
      "resolve_prompt_run",
      expect.objectContaining({
        new_mark: {
          description: "A crescent scar that opens when I hunger.",
          isConcealed: true,
          label: "Moon-Scarred Throat",
        },
      }),
    );
  });

  it("passes prompt-created characters into the resolve_prompt_run RPC payload", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        archiveEvents: [],
        nextPrompt: {
          encounterIndex: 1,
          promptNumber: 4,
        },
        promptRunId: "run-1",
        rolled: {
          d10: 7,
          d6: 4,
          movement: 3,
        },
      },
      error: null,
    });

    await resolvePrompt(
      { rpc },
      "chronicle-1",
      {
        ...payload,
        newCharacter: {
          description: "A parish clerk who saw my hunger and chose silence.",
          kind: "mortal",
          name: "Elias Voss",
        },
      },
    );

    expect(rpc).toHaveBeenCalledWith(
      "resolve_prompt_run",
      expect.objectContaining({
        new_character: {
          description: "A parish clerk who saw my hunger and chose silence.",
          kind: "mortal",
          name: "Elias Voss",
        },
      }),
    );
  });

  it("passes Skill/Resource trait mutations into the resolve_prompt_run RPC payload", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        archiveEvents: [],
        nextPrompt: {
          encounterIndex: 1,
          promptNumber: 4,
        },
        promptRunId: "run-1",
        rolled: {
          d10: 7,
          d6: 4,
          movement: 3,
        },
      },
      error: null,
    });

    await resolvePrompt(
      { rpc },
      "chronicle-1",
      {
        ...payload,
        traitMutations: {
          characters: [],
          marks: [],
          resources: [{ action: "lose", id: "resource-1" }],
          skills: [],
        },
      },
    );

    expect(rpc).toHaveBeenCalledWith(
      "resolve_prompt_run",
      expect.objectContaining({
        trait_mutations: {
          characters: [],
          marks: [],
          resources: [{ action: "lose", id: "resource-1" }],
          skills: [],
        },
      }),
    );
  });

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

  it("normalizes duplicate prompt-created skill failures into calm copy", async () => {
    const supabase = {
      rpc: async () => ({
        data: null,
        error: {
          message: "A skill with this name already exists.",
        },
      }),
    };

    await expect(
      resolvePrompt(supabase, "chronicle-1", {
        ...payload,
        newSkill: {
          description: "I learned to feed first and mourn later.",
          label: "Bloodthirsty",
        },
      }),
    ).rejects.toThrow(
      "That skill name is already in the chronicle. Choose different wording.",
    );
  });

  it("normalizes duplicate prompt-created resource failures into calm copy", async () => {
    const supabase = {
      rpc: async () => ({
        data: null,
        error: {
          message: "A resource with this name already exists.",
        },
      }),
    };

    await expect(
      resolvePrompt(supabase, "chronicle-1", {
        ...payload,
        newResource: {
          description: "A roofed crypt where I can feed and vanish.",
          isStationary: true,
          label: "The Marsh House",
        },
      }),
    ).rejects.toThrow(
      "That resource name is already in the chronicle. Choose different wording.",
    );
  });

  it("normalizes duplicate prompt-created mark failures into calm copy", async () => {
    const supabase = {
      rpc: async () => ({
        data: null,
        error: {
          message: "A mark with this name already exists.",
        },
      }),
    };

    await expect(
      resolvePrompt(supabase, "chronicle-1", {
        ...payload,
        newMark: {
          description: "A crescent scar that opens when I hunger.",
          isConcealed: true,
          label: "Moon-Scarred Throat",
        },
      }),
    ).rejects.toThrow(
      "That mark name is already in the chronicle. Choose different wording.",
    );
  });

  it("normalizes duplicate prompt-created character failures into calm copy", async () => {
    const supabase = {
      rpc: async () => ({
        data: null,
        error: {
          message: "A character with this name already exists.",
        },
      }),
    };

    await expect(
      resolvePrompt(supabase, "chronicle-1", {
        ...payload,
        newCharacter: {
          description: "A parish clerk who saw my hunger and chose silence.",
          kind: "mortal",
          name: "Elias Voss",
        },
      }),
    ).rejects.toThrow(
      "That character name is already in the chronicle. Choose different wording.",
    );
  });
});
