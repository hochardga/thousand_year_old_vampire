"use client";

import { useState, type FormEvent } from "react";
import { QuietAlert } from "@/components/ui/QuietAlert";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type FeedbackCategory = "delight" | "friction" | "bug" | "question";

type FeedbackFormProps = {
  chronicleId?: string;
};

const categoryOptions: Array<{ label: string; value: FeedbackCategory }> = [
  { label: "Delight", value: "delight" },
  { label: "Friction", value: "friction" },
  { label: "Bug", value: "bug" },
  { label: "Question", value: "question" },
];

export function FeedbackForm({ chronicleId }: FeedbackFormProps) {
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("friction");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);

    try {
      const response = await fetch("/api/feedback", {
        body: JSON.stringify({
          body,
          category,
          ...(chronicleId ? { chronicleId } : {}),
          source: "recap",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error || "The feedback could not be saved.");
        return;
      }

      setBody("");
      setStatus("saved");
    } catch {
      setStatus("error");
      setMessage("The feedback could not be saved.");
    }
  }

  return (
    <div className="space-y-4">
      {status === "saved" ? (
        <QuietAlert
          title="Your note has been set down."
          body="Thank you for helping shape the beta."
          tone="info"
        />
      ) : null}

      {status === "error" && message ? (
        <QuietAlert
          title="The feedback could not be saved just now."
          body={message}
          tone="warning"
        />
      ) : null}

      <SurfacePanel className="space-y-4 px-5 py-5 sm:px-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <label
              htmlFor="feedback-category"
              className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted"
            >
              Kind of note
            </label>
            <select
              id="feedback-category"
              name="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as FeedbackCategory)
              }
              className="min-h-11 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual focus:border-gold/70"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="feedback-body"
              className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted"
            >
              Your note
            </label>
            <textarea
              id="feedback-body"
              name="body"
              rows={5}
              aria-describedby="feedback-hint"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Tell us what helped, what felt unclear, or what broke your rhythm."
              className="min-h-32 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base leading-relaxed text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
            />
            <p
              id="feedback-hint"
              className="text-sm leading-relaxed text-ink-muted"
            >
              Share enough detail for us to retrace the moment that helped or
              broke your rhythm.
            </p>
          </div>

          <button
            type="submit"
            disabled={status === "saving" || body.trim().length < 20}
            className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Sending note..." : "Send feedback"}
          </button>
        </form>
      </SurfacePanel>
    </div>
  );
}
