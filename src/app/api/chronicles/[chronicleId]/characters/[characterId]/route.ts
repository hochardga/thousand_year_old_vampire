import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const characterPatchSchema = z
  .object({
    description: z.string().trim().min(1).max(1600).optional(),
    status: z.enum(["active", "dead", "lost"]).optional(),
  })
  .strict()
  .refine((value) => value.description !== undefined || value.status !== undefined, {
    message: "At least one character field must be provided.",
  });

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

type CharacterRouteContext = {
  params: Promise<{
    characterId: string;
    chronicleId: string;
  }>;
};

export async function PATCH(request: Request, context: CharacterRouteContext) {
  const { characterId, chronicleId } = await context.params;
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
  const parsed = characterPatchSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const { data, error } = await (supabase as any)
    .from("characters")
    .update(parsed.data)
    .eq("id", characterId)
    .eq("chronicle_id", chronicleId)
    .select("id, name, description, kind, status")
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        error: "Character not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    character: data,
  });
}
