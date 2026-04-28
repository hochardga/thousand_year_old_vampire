import { NextResponse } from "next/server";
import { resolvePrompt } from "@/lib/chronicles/resolvePrompt";
import {
  buildSkillResourceTraitMutations,
  type SkillResourceResource,
  type SkillResourceSkill,
} from "@/lib/chronicles/skillResourceRules";
import { refreshSessionSnapshot } from "@/lib/chronicles/sessionSnapshots";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { promptResolutionSchema } from "@/lib/validation/play";
import type { TraitMutationsPayload } from "@/types/chronicle";

type ResolveRouteContext = {
  params: Promise<{
    chronicleId: string;
  }>;
};

function validationErrorResponse(issues: {
  message: string;
  path: PropertyKey[];
}[]) {
  return NextResponse.json(
    {
      details: issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map(String).join("."),
      })),
      error: "Validation failed",
    },
    { status: 400 },
  );
}

type SkillResourceLedgerRecord = Record<string, unknown>;

type SkillResourceLedgerClient = {
  from: (table: "skills" | "resources") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => Promise<{
          data: SkillResourceLedgerRecord[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

function mergeTraitMutations(
  base: TraitMutationsPayload,
  addition: TraitMutationsPayload,
): TraitMutationsPayload {
  return {
    characters: [...base.characters, ...addition.characters],
    marks: [...base.marks, ...addition.marks],
    resources: [...base.resources, ...addition.resources],
    skills: [...base.skills, ...addition.skills],
  };
}

function toSkillRecords(records: SkillResourceLedgerRecord[]) {
  return records.map((skill) => ({
    description:
      typeof skill.description === "string" ? skill.description : null,
    id: String(skill.id),
    label: String(skill.label),
    status: skill.status as SkillResourceSkill["status"],
  }));
}

function toResourceRecords(records: SkillResourceLedgerRecord[]) {
  return records.map((resource) => ({
    description:
      typeof resource.description === "string" ? resource.description : null,
    id: String(resource.id),
    isStationary: Boolean(resource.is_stationary),
    label: String(resource.label),
    status: resource.status as SkillResourceResource["status"],
  }));
}

export async function POST(request: Request, context: ResolveRouteContext) {
  const { chronicleId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Authentication required",
      },
      { status: 401 },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = promptResolutionSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    let traitMutations = parsed.data.traitMutations;

    if (parsed.data.skillResourceChange) {
      const skillResourceClient = supabase as unknown as SkillResourceLedgerClient;
      const [skillsResult, resourcesResult] = await Promise.all([
        skillResourceClient
          .from("skills")
          .select("id, label, description, status")
          .eq("chronicle_id", chronicleId)
          .order("sort_order", { ascending: true }),
        skillResourceClient
          .from("resources")
          .select("id, label, description, is_stationary, status")
          .eq("chronicle_id", chronicleId)
          .order("sort_order", { ascending: true }),
      ]);

      if (skillsResult.error || resourcesResult.error) {
        throw new Error("The Skill and Resource ledger could not be read.");
      }

      const generated = buildSkillResourceTraitMutations(
        parsed.data.skillResourceChange,
        {
          resources: toResourceRecords(resourcesResult.data ?? []),
          skills: toSkillRecords(skillsResult.data ?? []),
        },
      );

      if ("error" in generated) {
        return validationErrorResponse([
          {
            message: generated.error,
            path: ["skillResourceChange"],
          },
        ]);
      }

      traitMutations = mergeTraitMutations(
        parsed.data.traitMutations,
        generated.traitMutations,
      );
    }

    const result = await resolvePrompt(
      supabase as never,
      chronicleId,
      {
        ...parsed.data,
        traitMutations,
      },
    );
    try {
      await refreshSessionSnapshot(supabase as never, {
        chronicleId,
        sessionId: parsed.data.sessionId,
      });
    } catch {
      // Keep prompt resolution resilient even if recap refresh lags behind.
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The prompt could not be resolved.",
      },
      { status: 500 },
    );
  }
}
