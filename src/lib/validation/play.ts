import { z } from "zod";
import type {
  PromptCreatedCharacterInput,
  PromptCreatedMarkInput,
  PromptCreatedResourceInput,
  PromptCreatedSkillInput,
  PromptResolutionPayload,
  TraitMutationsPayload,
} from "@/types/chronicle";

const uuidSchema = z.string().uuid();

const memoryDecisionSchema = z
  .object({
    memoryId: uuidSchema.optional(),
    mode: z.enum([
      "append-existing",
      "create-new",
      "forget-existing",
      "move-to-diary",
    ]),
    targetMemoryId: uuidSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.mode === "append-existing" && !value.targetMemoryId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "targetMemoryId is required when appending to a memory.",
        path: ["targetMemoryId"],
      });
    }

    if (
      (value.mode === "forget-existing" || value.mode === "move-to-diary") &&
      !value.memoryId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "memoryId is required for this memory decision.",
        path: ["memoryId"],
      });
    }
  });

const skillMutationSchema = z.object({
  action: z.enum(["check", "lose"]),
  id: uuidSchema,
});

const resourceMutationSchema = z.object({
  action: z.literal("lose"),
  id: uuidSchema,
});

const characterMutationSchema = z.object({
  action: z.enum(["age-out", "lose"]),
  id: uuidSchema,
});

const markMutationSchema = z.object({
  action: z.literal("update"),
  description: z.string().trim().min(1).max(280),
  id: uuidSchema,
  isActive: z.boolean().optional(),
  isConcealed: z.boolean().optional(),
});

const newSkillSchema: z.ZodType<PromptCreatedSkillInput> = z.object({
  description: z.string().trim().min(1).max(280),
  label: z.string().trim().min(1).max(120),
});

const newResourceSchema: z.ZodType<PromptCreatedResourceInput> = z.object({
  description: z.string().trim().min(1).max(280),
  isStationary: z.boolean(),
  label: z.string().trim().min(1).max(120),
});

const newCharacterSchema: z.ZodType<PromptCreatedCharacterInput> = z.object({
  description: z.string().trim().min(1).max(280),
  kind: z.enum(["mortal", "immortal"]),
  name: z.string().trim().min(1).max(120),
});

const newMarkSchema: z.ZodType<PromptCreatedMarkInput> = z.object({
  description: z.string().trim().min(1).max(280),
  isConcealed: z.boolean(),
  label: z.string().trim().min(1).max(120),
});

const traitMutationsSchema: z.ZodType<TraitMutationsPayload> = z.object({
  characters: z.array(characterMutationSchema).default([]),
  marks: z.array(markMutationSchema).default([]),
  resources: z.array(resourceMutationSchema).default([]),
  skills: z.array(skillMutationSchema).default([]),
});

export const promptResolutionSchema: z.ZodType<PromptResolutionPayload> =
  z.object({
    experienceText: z.string().trim().min(1).max(1600),
    memoryDecision: memoryDecisionSchema.default({ mode: "create-new" }),
    newCharacter: newCharacterSchema.optional(),
    newMark: newMarkSchema.optional(),
    newResource: newResourceSchema.optional(),
    newSkill: newSkillSchema.optional(),
    playerEntry: z.string().trim().min(1).max(4000),
    sessionId: uuidSchema,
    traitMutations: traitMutationsSchema.default({
      characters: [],
      marks: [],
      resources: [],
      skills: [],
    }),
  });
