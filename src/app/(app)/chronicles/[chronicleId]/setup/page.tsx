import { redirect } from "next/navigation";
import { TrackEventOnMount } from "@/components/analytics/TrackEventOnMount";
import { SetupStepper } from "@/components/ritual/SetupStepper";
import { PageShell } from "@/components/ui/PageShell";
import { QuietAlert } from "@/components/ui/QuietAlert";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SetupPageProps = {
  params: Promise<{
    chronicleId: string;
  }>;
  searchParams: Promise<{
    created?: string;
  }>;
};

type SetupChronicleRecord = {
  id: string;
  status: "draft" | "active" | "completed" | "archived";
  title: string;
};

type SetupChronicleClient = {
  from: (table: "chronicles") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{
          data: SetupChronicleRecord | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

export default async function ChronicleSetupPage({
  params,
  searchParams,
}: SetupPageProps) {
  const { chronicleId } = await params;
  const setupParams = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/chronicles/${chronicleId}/setup`)}`);
  }

  const { data: chronicle, error } = await (
    supabase as unknown as SetupChronicleClient
  )
    .from("chronicles")
    .select("id, title, status")
    .eq("id", chronicleId)
    .single();

  if (error || !chronicle) {
    redirect("/chronicles?error=That%20chronicle%20could%20not%20be%20opened.");
  }

  if (chronicle.status !== "draft") {
    redirect(`/chronicles/${chronicleId}/play`);
  }

  return (
    <PageShell className="gap-6 py-8">
      <SurfacePanel className="max-w-reading px-6 py-7 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
          Guided setup
        </p>
        <h1 className="mt-3 font-heading text-5xl leading-[1.08] text-ink sm:text-6xl">
          We will begin with the life you had before.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          Move one threshold at a time. What you set down here should feel like
          the beginning of a life, not the filling of a form.
        </p>
      </SurfacePanel>

      {setupParams.created === "1" ? (
        <>
          <TrackEventOnMount
            event="chronicle_created"
            onceKey={`chronicle-created:${chronicleId}`}
            properties={{
              chronicleId,
              source: "setup",
            }}
          />
          <QuietAlert
            title="The draft chronicle has been opened."
            body="The becoming-undead sequence is ready when you are."
            tone="info"
          />
        </>
      ) : null}

      <SetupStepper chronicleId={chronicle.id} chronicleTitle={chronicle.title} />
    </PageShell>
  );
}
