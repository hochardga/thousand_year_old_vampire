import { NextResponse } from "next/server";
import { completeChronicleSetup } from "@/lib/chronicles/setup";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { chronicleSetupSchema } from "@/lib/validation/setup";

type SetupCompletionRouteContext = {
  params: Promise<{
    chronicleId: string;
  }>;
};

function validationErrorResponse(issues: {
  message: string;
  path: (string | number)[];
}[]) {
  return NextResponse.json(
    {
      details: issues.map((issue) => ({
        message: issue.message,
        path: issue.path.join("."),
      })),
      error: "Validation failed",
    },
    { status: 400 },
  );
}

export async function POST(
  request: Request,
  context: SetupCompletionRouteContext,
) {
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
  const parsed = chronicleSetupSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    const result = await completeChronicleSetup(
      supabase as never,
      chronicleId,
      parsed.data,
    );

    return NextResponse.json({
      chronicleId: result.chronicleId ?? chronicleId,
      createdEntities: result.createdEntities,
      currentPromptNumber: result.currentPromptNumber ?? 1,
      nextRoute: result.nextRoute ?? `/chronicles/${chronicleId}/play`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The chronicle could not be completed.",
      },
      { status: 500 },
    );
  }
}
