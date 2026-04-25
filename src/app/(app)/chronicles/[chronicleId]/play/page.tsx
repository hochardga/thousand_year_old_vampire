import { redirect } from "next/navigation";
import { MemoryMeter } from "@/components/ritual/MemoryMeter";
import { PlayGuidancePanel } from "@/components/ritual/PlayGuidancePanel";
import { PlaySurface } from "@/components/ritual/PlaySurface";
import { PromptCard } from "@/components/ritual/PromptCard";
import { PageShell } from "@/components/ui/PageShell";
import { QuietAlert } from "@/components/ui/QuietAlert";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { getPromptByPosition } from "@/lib/prompts/catalog";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActiveDiarySummary } from "@/types/chronicle";

type PlayPageProps = {
  params: Promise<{
    chronicleId: string;
  }>;
};

type MindMemoryRecord = {
  diary_id: string | null;
  id: string;
  location: "mind" | "diary";
  slot_index: number | null;
  title: string;
};

type ActiveDiaryRecord = {
  id: string;
  memory_capacity: number;
  title: string;
};

type ChroniclePlayRecord = {
  current_prompt_encounter: number;
  current_prompt_number: number;
  current_session_id: string | null;
  id: string;
  prompt_version: string;
  status: "draft" | "active" | "completed" | "archived";
  title: string;
};

type ChronicleLookupClient = {
  from: (table: "chronicles") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{
          data: ChroniclePlayRecord | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

type MemoryLookupClient = {
  from: (table: "memories") => {
    select: (
      columns: string,
    ) => {
      eq: (column: string, value: string) => Promise<{
        data: MindMemoryRecord[] | null;
        error: { message: string } | null;
      }>;
    };
  };
};

type ActiveDiaryLookupResult = {
  data: ActiveDiaryRecord | null;
  error: { message: string } | null;
};

type ActiveDiaryMaybeSingleClient = {
  from: (table: "diaries") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<ActiveDiaryLookupResult>;
        };
      };
    };
  };
};

type SkillLabelRecord = {
  label: string;
};

type SkillLookupClient = {
  from: (table: "skills") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => Promise<{
          data: SkillLabelRecord[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
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

  const { data: chronicle, error } = await (
    supabase as unknown as ChronicleLookupClient
  )
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

  const memoryClient = supabase as unknown as MemoryLookupClient;
  const diaryClient = supabase as unknown as ActiveDiaryMaybeSingleClient;
  const skillClient = supabase as unknown as SkillLookupClient;
  const promptPromise = getPromptByPosition(
    supabase as never,
    chronicle.current_prompt_number,
    chronicle.current_prompt_encounter,
    chronicle.prompt_version,
  );

  const [mindMemoriesResult, diaryResult, skillsResult, prompt] = await Promise.all([
    memoryClient
      .from("memories")
      .select("id, title, slot_index, location, diary_id")
      .eq("chronicle_id", chronicleId),
    diaryClient
      .from("diaries")
      .select("id, title, memory_capacity")
      .eq("chronicle_id", chronicleId)
      .eq("status", "active")
      .maybeSingle(),
    skillClient
      .from("skills")
      .select("label")
      .eq("chronicle_id", chronicleId)
      .order("sort_order", { ascending: true }),
    promptPromise,
  ] as const) as [
    {
      data: MindMemoryRecord[] | null;
      error: { message: string } | null;
    },
    ActiveDiaryLookupResult,
    {
      data: SkillLabelRecord[] | null;
      error: { message: string } | null;
    },
    Awaited<ReturnType<typeof getPromptByPosition>>,
  ];

  const allMemories = mindMemoriesResult.data ?? [];
  const mindMemories = allMemories.filter(
    (memory) => memory.location === "mind",
  );
  const memoriesInMind = mindMemories.length;
  const activeDiary: ActiveDiarySummary | null = diaryResult.data
    ? {
        id: diaryResult.data.id,
        memoryCapacity: diaryResult.data.memory_capacity,
        memoryCount: allMemories.filter(
          (memory) =>
            memory.location === "diary" &&
            memory.diary_id === diaryResult.data?.id,
        ).length,
        title: diaryResult.data.title,
      }
    : null;

  return (
    <PageShell className="gap-6 py-8">
      <SurfacePanel tone="nocturne" className="px-5 py-6 sm:px-8 sm:py-7">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Active chronicle
        </p>
        <h1 className="mt-4 font-heading text-4xl leading-[1.08] text-surface sm:text-5xl lg:text-6xl">
          {chronicle.title}
        </h1>
        <p className="mt-4 max-w-reading text-base leading-relaxed text-surface/76 sm:text-lg">
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
        <QuietAlert
          title="The prompt could not be found just now."
          body="Return when the chronicle is ready."
          tone="error"
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <PlaySurface
          activeDiary={activeDiary}
          chronicleId={chronicleId}
          currentPromptNumber={chronicle.current_prompt_number}
          existingSkillLabels={(skillsResult.data ?? []).map((skill) => skill.label)}
          initialSessionId={chronicle.current_session_id}
          mindMemories={mindMemories.map((memory) => ({
            id: memory.id,
            slotIndex: memory.slot_index,
            title: memory.title,
          }))}
        />

        <div className="space-y-4">
          <PlayGuidancePanel />
          <MemoryMeter
            activeDiary={activeDiary}
            memoriesInMind={memoriesInMind}
          />
        </div>
      </div>
    </PageShell>
  );
}
