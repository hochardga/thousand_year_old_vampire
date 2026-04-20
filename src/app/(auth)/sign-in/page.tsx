import { redirect } from "next/navigation";
import { z } from "zod";
import { PageShell } from "@/components/ui/PageShell";
import { AuthForm } from "@/components/ui/AuthForm";
import { normalizeReturnPath, resolveSiteUrl } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const magicLinkSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().optional(),
});

type SignInPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
    next?: string;
    sent?: string;
  }>;
};

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  const params = await searchParams;
  const next = normalizeReturnPath(params.next);
  const siteUrl = resolveSiteUrl();

  async function requestMagicLink(formData: FormData) {
    "use server";

    const parsed = magicLinkSchema.safeParse({
      email: formData.get("email"),
      next: formData.get("next"),
    });

    if (!parsed.success) {
      redirect(
        `/sign-in?error=${encodeURIComponent(
          "Choose a valid email address.",
        )}&next=${encodeURIComponent(next)}`,
      );
    }

    const destination = normalizeReturnPath(parsed.data.next);
    const callbackUrl = new URL("/auth/callback", siteUrl);
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
        `/sign-in?error=${encodeURIComponent(
          "That sign-in link could not be sent just now.",
        )}&next=${encodeURIComponent(destination)}&email=${encodeURIComponent(
          parsed.data.email,
        )}`,
      );
    }

    redirect(
      `/sign-in?sent=1&next=${encodeURIComponent(
        destination,
      )}&email=${encodeURIComponent(parsed.data.email)}`,
    );
  }

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
      />
    </PageShell>
  );
}
