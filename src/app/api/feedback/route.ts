import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type FeedbackSubmissionInsert = {
  body: string;
  category: "delight" | "friction" | "bug" | "question";
  chronicle_id: string | null;
  source: "recap";
  user_id: string;
};

type FeedbackInsertResult = {
  error: { message: string } | null;
};

type FeedbackSupabaseClient = {
  auth: {
    getUser: () => Promise<{
      data: {
        user: { id: string } | null;
      };
    }>;
  };
  from: (table: "feedback_submissions") => {
    insert: (
      payload: FeedbackSubmissionInsert,
    ) => PromiseLike<FeedbackInsertResult>;
  };
};

const feedbackSchema = z
  .object({
    body: z.string().trim().min(20).max(4000),
    category: z.enum(["delight", "friction", "bug", "question"]),
    chronicleId: z.string().uuid().optional(),
    source: z.literal("recap"),
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

export async function POST(request: Request) {
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
  const parsed = feedbackSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const { body, category, chronicleId, source } = parsed.data;
  const feedbackClient = supabase as FeedbackSupabaseClient;
  const { error } = await feedbackClient
    .from("feedback_submissions")
    .insert({
      body,
      category,
      chronicle_id: chronicleId ?? null,
      source,
      user_id: user.id,
    });

  if (error) {
    return NextResponse.json(
      {
        error: "The feedback could not be saved.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
