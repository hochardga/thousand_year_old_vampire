import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { ChronicleCard } from "@/components/ritual/ChronicleCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ChroniclesPageProps = {
  searchParams: Promise<{
    created?: string;
    error?: string;
  }>;
};

type ChronicleRecord = {
  created_at: string;
  id: string;
  last_played_at: string | null;
  status: "draft" | "active" | "completed" | "archived";
  title: string;
  vampire_name: string | null;
};

export default async function ChroniclesPage({
  searchParams,
}: ChroniclesPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=%2Fchronicles");
  }

  const { data, error } = await supabase
    .from("chronicles")
    .select("id, title, status, vampire_name, created_at, last_played_at")
    .order("updated_at", { ascending: false });

  const chronicles = (data ?? []) as ChronicleRecord[];

  return (
    <PageShell className="gap-6 py-8">
      <SurfacePanel
        tone="nocturne"
        className="overflow-hidden px-6 py-8 sm:px-8 sm:py-10"
      >
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold/80">
          Protected chronicle shell
        </p>
        <h1 className="mt-4 max-w-reading font-heading text-5xl leading-[1.08] text-surface sm:text-6xl">
          The lives you have begun wait here.
        </h1>
        <p className="mt-4 max-w-reading text-lg leading-relaxed text-surface/78">
          Start a new draft quietly, or return to a life already lengthening
          through the centuries.
        </p>
      </SurfacePanel>

      <SurfacePanel className="px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-reading">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
              Begin another life
            </p>
            <h2 className="mt-3 font-heading text-3xl text-ink">
              Open a draft chronicle
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              Give the new chronicle a title now, or let the night name it for
              you.
            </p>
          </div>

          <form
            action="/api/chronicles"
            method="post"
            className="flex w-full max-w-reading flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              name="title"
              placeholder="The Long Night"
              className="min-h-11 flex-1 rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-soft bg-nocturne px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:bg-nocturne/92"
            >
              Begin a New Chronicle
            </button>
          </form>
        </div>
      </SurfacePanel>

      {params.error ? (
        <SurfacePanel className="border-error/20 bg-error/10 px-5 py-4">
          <p className="text-sm text-ink">{params.error}</p>
        </SurfacePanel>
      ) : null}

      {error ? (
        <SurfacePanel className="border-error/20 bg-error/10 px-5 py-4">
          <p className="text-sm text-ink">
            The chronicle ledger could not be read just now.
          </p>
        </SurfacePanel>
      ) : null}

      {chronicles.length === 0 ? (
        <SurfacePanel className="max-w-reading px-6 py-8 sm:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
            Empty state
          </p>
          <h2 className="mt-3 font-heading text-3xl text-ink">
            No chronicle has been opened yet.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Begin the first one when you are ready. The ledger will keep the
            life for you once it starts.
          </p>
        </SurfacePanel>
      ) : (
        <div className="grid gap-4">
          {chronicles.map((chronicle) => (
            <ChronicleCard
              key={chronicle.id}
              createdAt={chronicle.created_at}
              highlight={params.created === chronicle.id}
              lastPlayedAt={chronicle.last_played_at}
              status={chronicle.status}
              title={chronicle.title}
              vampireName={chronicle.vampire_name}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
