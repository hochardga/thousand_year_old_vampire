export type PromptCatalogRow = {
  encounter_index: number;
  prompt_markdown: string;
  prompt_number: number;
  prompt_version: string;
};

type PromptCatalogClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: number | string) => {
        eq: (column: string, value: number | string) => {
          eq: (column: string, value: number | string) => {
            maybeSingle: () => Promise<{
              data: PromptCatalogRow | null;
              error: Error | null;
            }>;
          };
        };
      };
    };
  };
};

export async function getPromptByPosition(
  supabase: PromptCatalogClient,
  promptNumber: number,
  encounterIndex: number,
  promptVersion = "base",
) {
  const { data, error } = await supabase
    .from("prompt_catalog")
    .select(
      "prompt_number, encounter_index, prompt_markdown, prompt_version",
    )
    .eq("prompt_number", promptNumber)
    .eq("encounter_index", encounterIndex)
    .eq("prompt_version", promptVersion)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
