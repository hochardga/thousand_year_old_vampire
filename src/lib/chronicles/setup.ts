import type { ChronicleSetupPayload } from "@/types/chronicle";

type SetupCompletionResult = {
  chronicleId: string;
  createdEntities: {
    characters: number;
    memories: number;
    resources: number;
    skills: number;
  };
  currentPromptNumber: number;
  nextRoute: string;
  sessionId: string;
};

type SetupRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{
    data: SetupCompletionResult | null;
    error: { message: string } | null;
  }>;
};

export async function completeChronicleSetup(
  supabase: SetupRpcClient,
  chronicleId: string,
  payload: ChronicleSetupPayload,
) {
  const { data, error } = await supabase.rpc("complete_chronicle_setup", {
    immortal_character: payload.immortalCharacter,
    initial_characters: payload.initialCharacters,
    initial_resources: payload.initialResources,
    initial_skills: payload.initialSkills,
    mark: payload.mark,
    mortal_summary: payload.mortalSummary,
    setup_memories: payload.setupMemories,
    target_chronicle_id: chronicleId,
  });

  if (error || !data) {
    throw new Error(error?.message || "The chronicle could not be completed.");
  }

  return data;
}
