import type { PromptResolutionPayload } from "@/types/chronicle";
import { toMemoryRuleMessage } from "@/lib/chronicles/memoryRules";

type PromptResolutionResult = {
  archiveEvents: Array<{
    eventType: string;
    summary: string;
  }>;
  nextPrompt: {
    encounterIndex: number;
    promptNumber: number;
  };
  promptRunId: string;
  rolled: {
    d10: number;
    d6: number;
    movement: number;
  };
};

type ResolvePromptClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{
    data: PromptResolutionResult | null;
    error: { message: string } | null;
  }>;
};

export async function resolvePrompt(
  supabase: ResolvePromptClient,
  chronicleId: string,
  payload: PromptResolutionPayload,
) {
  const { data, error } = await supabase.rpc("resolve_prompt_run", {
    experience_text: payload.experienceText,
    memory_decision: payload.memoryDecision,
    new_character: payload.newCharacter ?? null,
    new_mark: payload.newMark ?? null,
    new_resource: payload.newResource ?? null,
    new_skill: payload.newSkill ?? null,
    player_entry: payload.playerEntry,
    target_chronicle_id: chronicleId,
    target_session_id: payload.sessionId,
    trait_mutations: payload.traitMutations,
  });

  if (error || !data) {
    throw new Error(
      error?.message
        ? toMemoryRuleMessage(error.message)
        : "The prompt could not be resolved.",
    );
  }

  return data;
}
