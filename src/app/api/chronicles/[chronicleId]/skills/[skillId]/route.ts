import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const skillPatchSchema = z
  .object({
    status: z.enum(["active", "checked", "lost"]),
  })
  .strict();

function validationErrorResponse(issues: { message: string; path: PropertyKey[] }[]) {
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

type SkillRouteContext = {
  params: Promise<{
    chronicleId: string;
    skillId: string;
  }>;
};

type SkillPatchInput = z.infer<typeof skillPatchSchema>;

type SkillRecord = {
  description: string | null;
  id: string;
  label: string;
  status: "active" | "checked" | "lost";
};

type QueryError = {
  message: string;
};

type SkillRouteClient = {
  from: (table: "skills") => {
    update: (values: SkillPatchInput) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => {
            single: () => Promise<{
              data: SkillRecord | null;
              error: QueryError | null;
            }>;
          };
        };
      };
    };
  };
};

export async function PATCH(request: Request, context: SkillRouteContext) {
  const { chronicleId, skillId } = await context.params;
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
  const parsed = skillPatchSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const { data, error } = await (supabase as unknown as SkillRouteClient)
    .from("skills")
    .update(parsed.data)
    .eq("id", skillId)
    .eq("chronicle_id", chronicleId)
    .select("id, label, description, status")
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        error: "Skill not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    skill: data,
  });
}
