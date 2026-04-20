import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getE2EAuthCookieName,
  isE2EMockMode,
} from "@/lib/supabase/e2e";
import { buildSignInRedirectUrl } from "@/lib/supabase/middleware";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const chronicleSchema = z.object({
  title: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value?.trim() || ""),
});

function fallbackChronicleTitle() {
  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(new Date());

  return `Chronicle begun ${date}`;
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      buildSignInRedirectUrl(new URL("/chronicles", requestUrl.origin)),
      303,
    );
  }

  const formData = await request.formData();
  const parsed = chronicleSchema.safeParse({
    title: formData.get("title"),
  });
  const title = parsed.success ? parsed.data.title : "";

  const { data, error } = await supabase
    .from("chronicles")
    .insert({
      status: "draft",
      title: title || fallbackChronicleTitle(),
      user_id: user.id,
    })
    .select("id")
    .single();

  const redirectUrl = new URL("/chronicles", requestUrl.origin);

  if (error || !data) {
    redirectUrl.searchParams.set(
      "error",
      "The chronicle could not be opened just now.",
    );

    return NextResponse.redirect(redirectUrl, 303);
  }

  const setupRedirectUrl = new URL(
    `/chronicles/${data.id}/setup`,
    requestUrl.origin,
  );
  setupRedirectUrl.searchParams.set("created", "1");

  const response = NextResponse.redirect(setupRedirectUrl, 303);

  if (isE2EMockMode()) {
    response.cookies.set(getE2EAuthCookieName(), "1", {
      path: "/",
    });
  }

  return response;
}
