"use client";

import { useFormStatus } from "react-dom";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type AuthFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultEmail?: string;
  error?: string;
  next?: string;
  sent?: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92 disabled:cursor-wait disabled:opacity-80"
      disabled={pending}
    >
      {pending ? "Sending…" : "Send the Link"}
    </button>
  );
}

export function AuthForm({
  action,
  defaultEmail,
  error,
  next = "/chronicles",
  sent = false,
}: AuthFormProps) {
  return (
    <SurfacePanel className="w-full max-w-reading px-6 py-6 sm:px-8 sm:py-8">
      <form action={action} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted"
          >
            Email address
          </label>
          <input
            id="email"
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
          <SubmitButton />
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
    </SurfacePanel>
  );
}
