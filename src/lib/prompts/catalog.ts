import { cache } from "react";

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

const promptLookupCache = new WeakMap<
  PromptCatalogClient,
  Map<string, PromptCatalogRow | null>
>();

const loadPromptByPosition = cache(
  async (
    supabase: PromptCatalogClient,
    promptNumber: number,
    encounterIndex: number,
    promptVersion: string,
  ) => {
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

    return data ?? null;
  },
);

export async function getPromptByPosition(
  supabase: PromptCatalogClient,
  promptNumber: number,
  encounterIndex: number,
  promptVersion = "base",
) {
  const cacheKey = `${promptVersion}:${promptNumber}:${encounterIndex}`;
  const requestCache = promptLookupCache.get(supabase);

  if (requestCache?.has(cacheKey)) {
    return requestCache.get(cacheKey) ?? null;
  }

  const prompt = await loadPromptByPosition(
    supabase,
    promptNumber,
    encounterIndex,
    promptVersion,
  );
  const cacheForRequest = requestCache ?? new Map<string, PromptCatalogRow | null>();

  if (!requestCache) {
    promptLookupCache.set(supabase, cacheForRequest);
  }

  cacheForRequest.set(cacheKey, prompt);

  return prompt;
}
