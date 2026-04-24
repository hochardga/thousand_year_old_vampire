import { describe, expect, it } from "vitest";
import { promptResolutionSchema } from "@/lib/validation/play";
import { chronicleSetupSchema } from "@/lib/validation/setup";

describe("chronicle validation", () => {
  it("accepts a valid setup payload", () => {
    const result = chronicleSetupSchema.safeParse({
      immortalCharacter: {
        description: "The one who made me endure forever.",
        kind: "immortal",
        name: "Aurelia",
      },
      initialCharacters: [
        {
          description: "A sister who would have followed me anywhere.",
          kind: "mortal",
          name: "Marta",
        },
      ],
      initialResources: [
        {
          description: "A shuttered estate above the marsh.",
          isStationary: true,
          label: "The Marsh House",
        },
      ],
      initialSkills: [
        {
          description: "I knew how to listen before I knew how to survive.",
          label: "Quiet Devotion",
        },
      ],
      mark: {
        description: "My reflection trembles before it vanishes.",
        isConcealed: true,
        label: "Unsteady Reflection",
      },
      mortalSummary:
        "I had a life of service, habit, and private longing before the night opened.",
      setupMemories: [
        {
          entryText: "I kept watch outside the sickroom and learned patience.",
          title: "My vigil by the sickbed",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid setup payload", () => {
    const result = chronicleSetupSchema.safeParse({
      immortalCharacter: {
        description: "The one who remade me.",
        kind: "mortal",
        name: "Aurelia",
      },
      initialCharacters: [],
      initialResources: [
        {
          description: "A shuttered estate above the marsh.",
          isStationary: "yes",
          label: "",
        },
      ],
      initialSkills: [],
      mark: {
        description: "",
        isConcealed: true,
        label: "",
      },
      mortalSummary: "",
      setupMemories: [],
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid prompt resolution payload", () => {
    const result = promptResolutionSchema.safeParse({
      experienceText:
        "I left the chapel with blood under my nails and a prayer I could not finish.",
      memoryDecision: {
        mode: "append-existing",
        targetMemoryId: "9b3a25d0-89de-4c6f-b0fd-f719f99c4f6b",
      },
      playerEntry:
        "I answered the bells by dragging the sexton into the thawing graveyard.",
      sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
      traitMutations: {
        characters: [
          {
            action: "age-out",
            id: "06a408b6-f408-477a-a0d4-4d167bb365c5",
          },
        ],
        marks: [
          {
            action: "update",
            description: "The chapel smoke still lives in my lungs.",
            id: "2637e021-fd12-4cb1-b1fc-3c1af30817c6",
          },
        ],
        resources: [
          {
            action: "lose",
            id: "3d6ca4e5-4627-4298-b4ae-1ca4a1c4d341",
          },
        ],
        skills: [
          {
            action: "check",
            id: "06a408b6-f408-477a-a0d4-4d167bb365c1",
          },
        ],
      },
    });

    expect(result.success).toBe(true);
  });

  it("keeps prompt-created skills in the parsed prompt resolution payload", () => {
    const result = promptResolutionSchema.safeParse({
      experienceText:
        "I left the chapel with blood under my nails and a prayer I could not finish.",
      memoryDecision: {
        mode: "append-existing",
        targetMemoryId: "9b3a25d0-89de-4c6f-b0fd-f719f99c4f6b",
      },
      newSkill: {
        description: "I learned to feed first and mourn later.",
        label: "Bloodthirsty",
      },
      playerEntry:
        "I answered the bells by dragging the sexton into the thawing graveyard.",
      sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
      traitMutations: {
        characters: [],
        marks: [],
        resources: [],
        skills: [],
      },
    });

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error("Expected prompt resolution payload to parse.");
    }

    expect(result.data.newSkill).toEqual({
      description: "I learned to feed first and mourn later.",
      label: "Bloodthirsty",
    });
  });

  it("rejects prompt-created skills with missing description text", () => {
    const result = promptResolutionSchema.safeParse({
      experienceText:
        "I left the chapel with blood under my nails and a prayer I could not finish.",
      memoryDecision: {
        mode: "create-new",
      },
      newSkill: {
        description: "",
        label: "Bloodthirsty",
      },
      playerEntry:
        "I answered the bells by dragging the sexton into the thawing graveyard.",
      sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
      traitMutations: {
        characters: [],
        marks: [],
        resources: [],
        skills: [],
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid prompt resolution payload", () => {
    const result = promptResolutionSchema.safeParse({
      experienceText: "",
      memoryDecision: {
        memoryId: "not-a-uuid",
        mode: "keep-everything",
      },
      playerEntry: "",
      sessionId: "not-a-uuid",
      traitMutations: {
        characters: [
          {
            action: "celebrate",
            id: "still-not-a-uuid",
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });
});
