import { z } from "zod";
import type { ChronicleSetupPayload } from "@/types/chronicle";

const setupSkillSchema = z.object({
  description: z.string().trim().min(1).max(280),
  label: z.string().trim().min(1).max(120),
});

const setupResourceSchema = z.object({
  description: z.string().trim().min(1).max(280),
  isStationary: z.boolean(),
  label: z.string().trim().min(1).max(120),
});

const setupCharacterSchema = z.object({
  description: z.string().trim().min(1).max(280),
  kind: z.literal("mortal"),
  name: z.string().trim().min(1).max(120),
});

const immortalCharacterSchema = z.object({
  description: z.string().trim().min(1).max(280),
  kind: z.literal("immortal"),
  name: z.string().trim().min(1).max(120),
});

const markSchema = z.object({
  description: z.string().trim().min(1).max(280),
  isConcealed: z.boolean(),
  label: z.string().trim().min(1).max(120),
});

const setupMemorySchema = z.object({
  entryText: z.string().trim().min(1).max(600),
  title: z.string().trim().min(1).max(120),
});

export const chronicleSetupSchema: z.ZodType<ChronicleSetupPayload> = z.object({
  immortalCharacter: immortalCharacterSchema,
  initialCharacters: z.array(setupCharacterSchema).min(1).max(8),
  initialResources: z.array(setupResourceSchema).min(1).max(8),
  initialSkills: z.array(setupSkillSchema).min(1).max(8),
  mark: markSchema,
  mortalSummary: z.string().trim().min(1).max(1200),
  setupMemories: z.array(setupMemorySchema).min(1).max(5),
});
