import { NextResponse } from "next/server";
import { resolvePrompt } from "@/lib/chronicles/resolvePrompt";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { promptResolutionSchema } from "@/lib/validation/play";

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
    const result = await resolvePrompt(
      supabase as never,
      chronicleId,
      parsed.data,
    );

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
