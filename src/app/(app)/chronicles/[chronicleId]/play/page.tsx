import { redirect } from "next/navigation";
import { MemoryMeter } from "@/components/ritual/MemoryMeter";
import { PlaySurface } from "@/components/ritual/PlaySurface";
import { PromptCard } from "@/components/ritual/PromptCard";
import { PageShell } from "@/components/ui/PageShell";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { getPromptByPosition } from "@/lib/prompts/catalog";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PlayPageProps = {
  params: Promise<{
    chronicleId: string;
  }>;
};

export default async function ChroniclePlayPage({ params }: PlayPageProps) {
  const { chronicleId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/chronicles/${chronicleId}/play`)}`);
  }

  const { data: chronicle, error } = await supabase
    .from("chronicles")
    .select(
      "id, title, status, current_prompt_number, current_prompt_encounter, current_session_id, prompt_version",
    )
    .eq("id", chronicleId)
    .single();

  if (error || !chronicle) {
    redirect("/chronicles?error=That%20chronicle%20could%20not%20be%20opened.");
  }

  if (chronicle.status === "draft") {
    redirect(`/chronicles/${chronicleId}/setup`);
  }

  const [{ count: memoriesInMind = 0 }, { count: diaryCount = 0 }, prompt] =
    await Promise.all([
      supabase
        .from("memories")
        .select("id", { count: "exact", head: true })
        .eq("chronicle_id", chronicleId)
        .eq("location", "mind"),
      supabase
        .from("diaries")
        .select("id", { count: "exact", head: true })
        .eq("chronicle_id", chronicleId)
        .eq("status", "active"),
      getPromptByPosition(
        supabase as never,
        chronicle.current_prompt_number,
        chronicle.current_prompt_encounter,
        chronicle.prompt_version,
      ),
    ]);

  return (
    <PageShell className="gap-6 py-8">
      <SurfacePanel tone="nocturne" className="px-6 py-7 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Active chronicle
        </p>
        <h1 className="mt-4 font-heading text-5xl leading-[1.08] text-surface sm:text-6xl">
          {chronicle.title}
        </h1>
        <p className="mt-4 max-w-reading text-lg leading-relaxed text-surface/76">
          Stay with the prompt, write what the night asks of you, and let the
          system keep the burden of continuity.
        </p>
      </SurfacePanel>

      {prompt ? (
        <PromptCard
          promptMarkdown={prompt.prompt_markdown}
          promptNumber={prompt.prompt_number}
        />
      ) : (
        <SurfacePanel className="border-error/20 bg-error/10 px-6 py-5">
          <p className="text-sm text-ink">
            The prompt could not be found just now. Return when the chronicle is
            ready.
          </p>
        </SurfacePanel>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <PlaySurface
          chronicleId={chronicleId}
          initialSessionId={chronicle.current_session_id}
        />

        <MemoryMeter
          hasActiveDiary={diaryCount > 0}
          memoriesInMind={memoriesInMind}
        />
      </div>
    </PageShell>
  );
}
