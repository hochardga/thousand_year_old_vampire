import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const markPatchSchema = z
  .object({
    description: z.string().trim().min(1).max(1600).optional(),
    isActive: z.boolean().optional(),
    isConcealed: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.description !== undefined ||
      value.isActive !== undefined ||
      value.isConcealed !== undefined,
    {
      message: "At least one mark field must be provided.",
    },
  );

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

type MarkRouteContext = {
  params: Promise<{
    chronicleId: string;
    markId: string;
  }>;
};

type MarkRecord = {
  description: string;
  id: string;
  is_active: boolean;
  is_concealed: boolean;
  label: string;
};

type MarkUpdateInput = {
  description?: string;
  is_active?: boolean;
  is_concealed?: boolean;
};

type QueryError = {
  message: string;
};

type MarkRouteClient = {
  from: (table: "marks") => {
    update: (values: MarkUpdateInput) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => {
            single: () => Promise<{
              data: MarkRecord | null;
              error: QueryError | null;
            }>;
          };
        };
      };
    };
  };
};

export async function PATCH(request: Request, context: MarkRouteContext) {
  const { chronicleId, markId } = await context.params;
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
  const parsed = markPatchSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const updates = {
    description: parsed.data.description,
    is_active: parsed.data.isActive,
    is_concealed: parsed.data.isConcealed,
  };

  const { data, error } = await (supabase as unknown as MarkRouteClient)
    .from("marks")
    .update(updates)
    .eq("id", markId)
    .eq("chronicle_id", chronicleId)
    .select("id, label, description, is_active, is_concealed")
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        error: "Mark not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    mark: data,
  });
}
