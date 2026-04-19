import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/config";

const PROTECTED_PREFIXES = ["/chronicles"];

export function isProtectedAppPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function buildSignInRedirectUrl(url: URL) {
  const redirectUrl = new URL("/sign-in", url.origin);
  const destination = `${url.pathname}${url.search}`;

  if (destination && destination !== "/") {
    redirectUrl.searchParams.set("next", destination);
  }

  return redirectUrl;
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

function nextResponseFor(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export async function updateSession(request: NextRequest) {
  if (
    isProtectedAppPath(request.nextUrl.pathname) &&
    !hasSupabaseAuthCookie(request)
  ) {
    return NextResponse.redirect(buildSignInRedirectUrl(request.nextUrl));
  }

  const { url, anonKey } = getSupabaseEnv();
  let response = nextResponseFor(request);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = nextResponseFor(request);

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedAppPath(request.nextUrl.pathname)) {
    const redirectResponse = NextResponse.redirect(
      buildSignInRedirectUrl(request.nextUrl),
    );

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  return response;
}
