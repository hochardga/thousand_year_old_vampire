import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const resourcePatchSchema = z
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

type ResourceRouteContext = {
  params: Promise<{
    chronicleId: string;
    resourceId: string;
  }>;
};

export async function PATCH(request: Request, context: ResourceRouteContext) {
  const { chronicleId, resourceId } = await context.params;
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
  const parsed = resourcePatchSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const { data, error } = await (supabase as any)
    .from("resources")
    .update(parsed.data)
    .eq("id", resourceId)
    .eq("chronicle_id", chronicleId)
    .select("id, label, description, is_stationary, status")
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        error: "Resource not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    resource: data,
  });
}
