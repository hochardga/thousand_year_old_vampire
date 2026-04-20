import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PageShell } from "@/components/ui/PageShell";
import { AuthForm } from "@/components/ui/AuthForm";
import {
  normalizeReturnPath,
  resolveSiteUrl,
} from "@/lib/auth/redirects";
import {
  assertTestAuthEnabled,
  isTestAuthEnabled,
} from "@/lib/auth/testAuth";
import {
  getE2EAuthCookieName,
  isE2EMockMode,
} from "@/lib/supabase/e2e";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const magicLinkSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().optional(),
});

const testPasswordSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().optional(),
  password: z.string().min(1),
});

function buildSignInRedirectUrl({
  email,
  error,
  next,
  sent,
  testAuthError,
}: {
  email?: string;
  error?: string;
  next: string;
  sent?: boolean;
  testAuthError?: string;
}) {
  const params = new URLSearchParams();

  if (error) {
    params.set("error", error);
  }

  if (testAuthError) {
    params.set("testAuthError", testAuthError);
  }

  params.set("next", next);

  if (email) {
    params.set("email", email);
  }

  if (sent) {
    params.set("sent", "1");
  }

  return `/sign-in?${params.toString()}`;
}

export async function requestMagicLink(formData: FormData) {
  "use server";

  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
  });
  const destination = normalizeReturnPath(formData.get("next")?.toString());

  if (!parsed.success) {
    redirect(
      buildSignInRedirectUrl({
        error: "Choose a valid email address.",
        next: destination,
      }),
    );
  }

  const callbackUrl = new URL("/auth/callback", resolveSiteUrl());
  callbackUrl.searchParams.set("next", destination);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    redirect(
      buildSignInRedirectUrl({
        email: parsed.data.email,
        error: "That sign-in link could not be sent just now.",
        next: destination,
      }),
    );
  }

  redirect(
    buildSignInRedirectUrl({
      email: parsed.data.email,
      next: destination,
      sent: true,
    }),
  );
}

export async function requestTestPasswordSignIn(formData: FormData) {
  "use server";

  const parsed = testPasswordSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
    password: formData.get("password"),
  });
  const destination = normalizeReturnPath(formData.get("next")?.toString());
  const email =
    typeof formData.get("email") === "string"
      ? formData.get("email")?.toString()
      : undefined;

  try {
    assertTestAuthEnabled();
  } catch (error) {
    redirect(
      buildSignInRedirectUrl({
        email,
        next: destination,
        testAuthError:
          error instanceof Error
            ? error.message
            : "Testing-only sign-in is unavailable here.",
      }),
    );
  }

  if (!parsed.success) {
    redirect(
      buildSignInRedirectUrl({
        email,
        next: destination,
        testAuthError: "Choose a valid testing email and password.",
      }),
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(
      buildSignInRedirectUrl({
        email: parsed.data.email,
        next: destination,
        testAuthError:
          "The testing password could not open the door just now.",
      }),
    );
  }

  if (isE2EMockMode()) {
    const cookieStore = await cookies();
    cookieStore.set(getE2EAuthCookieName(), "1", {
      path: "/",
    });
  }

  redirect(destination);
}

type SignInPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
    next?: string;
    sent?: string;
    testAuthError?: string;
  }>;
};

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  const params = await searchParams;
  const next = normalizeReturnPath(params.next);
  const testAuthEnabled = isTestAuthEnabled();

  return (
    <PageShell className="justify-center gap-6">
      <div className="max-w-reading">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-ink-muted">
          Gentle ritual guide
        </p>
        <h1 className="mt-4 font-heading text-5xl leading-[1.08] text-ink sm:text-6xl">
          We will send a private link to the address you choose.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          Sign in quietly, then continue toward your chronicle without carrying
          a password into the room.
        </p>
      </div>

      <AuthForm
        action={requestMagicLink}
        defaultEmail={params.email}
        error={params.error}
        next={next}
        sent={params.sent === "1"}
        testAuthAction={testAuthEnabled ? requestTestPasswordSignIn : undefined}
        testAuthEnabled={testAuthEnabled}
        testAuthError={params.testAuthError}
      />
    </PageShell>
  );
}
