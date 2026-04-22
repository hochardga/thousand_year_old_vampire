"use client";

import { useFormStatus } from "react-dom";
import { trackAnalyticsEvent } from "@/lib/analytics/posthog";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type AuthFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultEmail?: string;
  error?: string;
  next?: string;
  sent?: boolean;
  testAuthAction?: (formData: FormData) => void | Promise<void>;
  testAuthEnabled?: boolean;
  testAuthError?: string;
};

type SubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
};

function SubmitButton({ idleLabel, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92 disabled:cursor-wait disabled:opacity-80"
      disabled={pending}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function AuthForm({
  action,
  defaultEmail,
  error,
  next = "/chronicles",
  sent = false,
  testAuthAction,
  testAuthEnabled = false,
  testAuthError,
}: AuthFormProps) {
  function handleSignInSubmit() {
    trackAnalyticsEvent("sign_in_requested", {
      source: "sign-in",
    });
  }

  return (
    <SurfacePanel className="w-full max-w-reading px-6 py-6 sm:px-8 sm:py-8">
      <form action={action} onSubmit={handleSignInSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="magic-link-email"
            className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted"
          >
            Email address
          </label>
          <input
            id="magic-link-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={defaultEmail}
            required
            className="mt-3 min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
            placeholder="name@example.com"
          />
        </div>

        <input type="hidden" name="next" value={next} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SubmitButton
            idleLabel="Send the Link"
            pendingLabel="Sending…"
          />
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Private magic link
          </p>
        </div>
      </form>

      {sent ? (
        <p className="mt-5 rounded-soft border border-success/20 bg-success/10 px-4 py-3 text-sm text-ink">
          A sign-in link is on its way. Return when the night is ready.
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-soft border border-error/20 bg-error/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}

      {testAuthEnabled && testAuthAction ? (
        <div className="mt-8 border-t border-ink/10 pt-6">
          <div className="max-w-reading">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
              Testing only
            </p>
            <h2 className="mt-3 font-heading text-2xl text-ink">
              Use a password only for preview or local verification.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              This quieter side door is for testing. The public ritual still
              begins with a magic link.
            </p>
          </div>

          <form
            action={testAuthAction}
            onSubmit={handleSignInSubmit}
            className="mt-5 space-y-5"
          >
            <div>
              <label
                htmlFor="test-auth-email"
                className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted"
              >
                Testing email address
              </label>
              <input
                id="test-auth-email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={defaultEmail}
                required
                className="mt-3 min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
                placeholder="tester@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="test-auth-password"
                className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted"
              >
                Testing password
              </label>
              <input
                id="test-auth-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-3 min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
                placeholder="Preview password"
              />
            </div>

            <input type="hidden" name="next" value={next} />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SubmitButton
                idleLabel="Enter Through Test Sign-In"
                pendingLabel="Entering…"
              />
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
                Preview and dev only
              </p>
            </div>
          </form>

          {testAuthError ? (
            <p className="mt-5 rounded-soft border border-error/20 bg-error/10 px-4 py-3 text-sm text-ink">
              {testAuthError}
            </p>
          ) : null}
        </div>
      ) : null}
    </SurfacePanel>
  );
}
