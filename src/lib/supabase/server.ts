import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/config";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export async function createServerSupabaseClient(
  cookieStore?: CookieStore,
) {
  const resolvedCookieStore = cookieStore ?? (await cookies());
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return resolvedCookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            resolvedCookieStore.set(name, value, options);
          });
        } catch {
          // Server components may not be allowed to write cookies directly.
          // Middleware handles the refresh path in those cases.
        }
      },
    },
  });
}
