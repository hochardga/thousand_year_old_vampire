import { NextResponse } from "next/server";
import { closeSessionWithRecap } from "@/lib/chronicles/sessionSnapshots";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { skillResourceEndSchema } from "@/lib/validation/play";

type EndRouteContext = {
  params: Promise<{
    chronicleId: string;
  }>;
};

type ChronicleEndRecord = {
  current_session_id: string | null;
  id: string;
  status: "draft" | "active" | "completed" | "archived";
};

type EndRouteClient = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<{
      error: { message: string } | null;
    }>;
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{
            data: ChronicleEndRecord | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{
        error: { message: string } | null;
      }>;
    };
  };
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

export async function POST(request: Request, context: EndRouteContext) {
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
  const parsed = skillResourceEndSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    const endClient = supabase as unknown as EndRouteClient;
    const { data: chronicle, error: chronicleError } = await endClient
      .from("chronicles")
      .select("id, status, current_session_id")
      .eq("id", chronicleId)
      .eq("user_id", user.id)
      .single();

    if (chronicleError || !chronicle) {
      return NextResponse.json(
        {
          error: "Chronicle not found.",
        },
        { status: 404 },
      );
    }

    if (chronicle.status !== "active") {
      return NextResponse.json(
        {
          error: "Only active chronicles can be ended from play.",
        },
        { status: 400 },
      );
    }

    const archiveEventResult = await endClient
      .from("archive_events")
      .insert({
        chronicle_id: chronicleId,
        event_type: "chronicle_completed",
        metadata: {
          narration: parsed.data.narration,
          requiredAction: parsed.data.requiredAction,
        },
        session_id: chronicle.current_session_id,
        summary:
          "The chronicle ends because no Skill or Resource can answer the prompt.",
      });

    if (archiveEventResult.error) {
      throw new Error(archiveEventResult.error.message);
    }

    if (chronicle.current_session_id) {
      await closeSessionWithRecap(supabase as never, {
        chronicleId,
        sessionId: chronicle.current_session_id,
      });
    }

    const completedResult = await endClient
      .from("chronicles")
      .update({
        last_played_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", chronicleId);

    if (completedResult.error) {
      throw new Error(completedResult.error.message);
    }

    return NextResponse.json({
      nextRoute: `/chronicles/${chronicleId}/recap`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The chronicle could not be ended.",
      },
      { status: 500 },
    );
  }
}
