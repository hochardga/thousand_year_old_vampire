import { NextResponse, type NextRequest } from "next/server";
import { normalizeReturnPath } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeReturnPath(requestUrl.searchParams.get("next"));
  const signInUrl = new URL("/sign-in", requestUrl.origin);
  signInUrl.searchParams.set("next", next);

  if (!code) {
    signInUrl.searchParams.set(
      "error",
      "That sign-in link could not be used.",
    );

    return NextResponse.redirect(signInUrl);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    signInUrl.searchParams.set(
      "error",
      "That sign-in link has expired or already been used.",
    );

    return NextResponse.redirect(signInUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    signInUrl.searchParams.set("error", "We could not finish signing you in.");

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
