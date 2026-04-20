import { NextResponse, type NextRequest } from "next/server";
import { normalizeReturnPath } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function deriveDisplayName(email?: string | null) {
  if (!email) {
    return "Unnamed Vampire";
  }

  const [localPart] = email.split("@");
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();

  return cleaned ? cleaned.replace(/\b\w/g, (char) => char.toUpperCase()) : email;
}

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

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: deriveDisplayName(user.email),
    },
    {
      onConflict: "id",
    },
  );

  if (profileError) {
    signInUrl.searchParams.set(
      "error",
      "Your entry was opened, but your profile could not be prepared yet.",
    );

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
