import Link from "next/link";
import { redirect } from "next/navigation";
import { CharacterEditor } from "@/components/archive/CharacterEditor";
import { LedgerSection } from "@/components/archive/LedgerSection";
import { MarkEditor } from "@/components/archive/MarkEditor";
import { TraitItem } from "@/components/archive/TraitItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { QuietAlert } from "@/components/ui/QuietAlert";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LedgerPageProps = {
  params: Promise<{
    chronicleId: string;
  }>;
};

type ChronicleRecord = {
  id: string;
  status: "draft" | "active" | "completed" | "archived";
  title: string;
};

type SkillRecord = {
  description: string | null;
  id: string;
  label: string;
  status: "active" | "checked" | "lost";
};

type ResourceRecord = {
  description: string | null;
  id: string;
  is_stationary: boolean;
  label: string;
  status: "active" | "checked" | "lost";
};

type CharacterRecord = {
  description: string;
  id: string;
  kind: "mortal" | "immortal";
  name: string;
  status: "active" | "dead" | "lost";
};

type MarkRecord = {
  description: string;
  id: string;
  is_active: boolean;
  is_concealed: boolean;
  label: string;
};

function renderSectionError(message: string) {
  return <QuietAlert title={message} body="Return when the chronicle is ready." />;
}

export default async function ChronicleLedgerPage({ params }: LedgerPageProps) {
  const { chronicleId } = await params;
  const supabase = await createServerSupabaseClient();
  const ledgerClient = supabase as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/sign-in?next=${encodeURIComponent(`/chronicles/${chronicleId}/ledger`)}`,
    );
  }

  const { data: chronicle, error: chronicleError } = await ledgerClient
    .from("chronicles")
    .select("id, title, status")
    .eq("id", chronicleId)
    .single();

  if (chronicleError || !chronicle) {
    redirect("/chronicles?error=That%20chronicle%20could%20not%20be%20opened.");
  }

  if ((chronicle as ChronicleRecord).status === "draft") {
    redirect(`/chronicles/${chronicleId}/setup`);
  }

  const [skillsResult, resourcesResult, charactersResult, marksResult] =
    await Promise.all([
      ledgerClient
        .from("skills")
        .select("id, label, description, status")
        .eq("chronicle_id", chronicleId)
        .order("sort_order", { ascending: true }),
      ledgerClient
        .from("resources")
        .select("id, label, description, is_stationary, status")
        .eq("chronicle_id", chronicleId)
        .order("sort_order", { ascending: true }),
      ledgerClient
        .from("characters")
        .select("id, name, description, kind, status")
        .eq("chronicle_id", chronicleId)
        .order("introduced_at", { ascending: true }),
      ledgerClient
        .from("marks")
        .select("id, label, description, is_concealed, is_active")
        .eq("chronicle_id", chronicleId)
        .order("created_at", { ascending: true }),
    ]);

  const skills = (skillsResult.data ?? []) as SkillRecord[];
  const resources = (resourcesResult.data ?? []) as ResourceRecord[];
  const characters = (charactersResult.data ?? []) as CharacterRecord[];
  const marks = (marksResult.data ?? []) as MarkRecord[];

  return (
    <PageShell className="gap-6 py-8">
      <SurfacePanel tone="nocturne" className="px-5 py-6 sm:px-8 sm:py-7">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Chronicle ledger
        </p>
        <h1 className="mt-4 font-heading text-4xl leading-[1.08] text-surface sm:text-5xl lg:text-6xl">
          {(chronicle as ChronicleRecord).title}
        </h1>
        <p className="mt-4 max-w-reading text-base leading-relaxed text-surface/76 sm:text-lg">
          Everything the chronicle can still claim, what has already been worn
          down, and the marks that refuse to leave it untouched.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/chronicles/${chronicleId}/play`}
            className="inline-flex min-h-11 items-center justify-center rounded-soft bg-surface px-5 py-3 text-sm font-medium text-nocturne transition-colors duration-160 ease-ritual hover:bg-surface-muted"
          >
            Return to the current prompt
          </Link>
          <Link
            href={`/chronicles/${chronicleId}/archive`}
            className="inline-flex min-h-11 items-center justify-center rounded-soft border border-surface/14 px-5 py-3 text-sm font-medium text-surface transition-colors duration-160 ease-ritual hover:border-surface/28 hover:text-surface"
          >
            Open the archive
          </Link>
        </div>
      </SurfacePanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <LedgerSection
          title="Skills"
          description="The capacities the vampire can still call upon, including the ones already checked or lost."
        >
          {skillsResult.error ? (
            renderSectionError("The skill ledger could not be read just now.")
          ) : skills.length === 0 ? (
            <EmptyState
              eyebrow="Ledger state"
              title="No skills have been entered into the ledger yet."
              body="The capacities the chronicle gathers will appear here."
            />
          ) : (
            <div className="space-y-4">
              {skills.map((skill) => (
                <TraitItem
                  key={skill.id}
                  description={skill.description || "No note has been added yet."}
                  label={skill.label}
                  state={skill.status}
                />
              ))}
            </div>
          )}
        </LedgerSection>

        <LedgerSection
          title="Resources"
          description="Shelters, reputations, tools, and keepsakes that still matter to the chronicle."
        >
          {resourcesResult.error ? (
            renderSectionError("The resource ledger could not be read just now.")
          ) : resources.length === 0 ? (
            <EmptyState
              eyebrow="Ledger state"
              title="No resources have been entered into the ledger yet."
              body="Shelters, tools, and keepsakes will appear here when the chronicle claims them."
            />
          ) : (
            <div className="space-y-4">
              {resources.map((resource) => (
                <TraitItem
                  key={resource.id}
                  description={resource.description || "No note has been added yet."}
                  label={resource.label}
                  metaLabels={[resource.is_stationary ? "Stationary" : "Portable"]}
                  state={resource.status}
                />
              ))}
            </div>
          )}
        </LedgerSection>

        <LedgerSection
          title="Characters"
          description="Mortals and immortals whose presence still presses against the story, whether they remain or not."
        >
          {charactersResult.error ? (
            renderSectionError("The character ledger could not be read just now.")
          ) : characters.length === 0 ? (
            <EmptyState
              eyebrow="Ledger state"
              title="No characters have been entered into the ledger yet."
              body="Mortals and immortals will gather here as the chronicle names them."
            />
          ) : (
            <div className="space-y-4">
              {characters.map((character) => (
                <div key={character.id} className="space-y-3">
                  <TraitItem
                    description={character.description}
                    label={character.name}
                    metaLabels={[
                      character.kind === "immortal" ? "Immortal" : "Mortal",
                    ]}
                    state={character.status === "active" ? "active" : character.status}
                  />
                  <CharacterEditor
                    characterId={character.id}
                    chronicleId={chronicleId}
                    initialDescription={character.description}
                    initialStatus={character.status}
                  />
                </div>
              ))}
            </div>
          )}
        </LedgerSection>

        <LedgerSection
          title="Marks"
          description="Conditions, curses, and visible or hidden changes the chronicle still carries."
        >
          {marksResult.error ? (
            renderSectionError("The marks could not be read just now.")
          ) : marks.length === 0 ? (
            <EmptyState
              eyebrow="Ledger state"
              title="No marks have been entered into the ledger yet."
              body="Conditions, curses, and transformations will gather here."
            />
          ) : (
            <div className="space-y-4">
              {marks.map((mark) => (
                <div key={mark.id} className="space-y-3">
                  <TraitItem
                    description={mark.description}
                    label={mark.label}
                    metaLabels={[mark.is_concealed ? "Concealed" : "Revealed"]}
                    state={mark.is_active ? "active" : "dormant"}
                  />
                  <MarkEditor
                    chronicleId={chronicleId}
                    initialDescription={mark.description}
                    initialIsActive={mark.is_active}
                    initialIsConcealed={mark.is_concealed}
                    markId={mark.id}
                  />
                </div>
              ))}
            </div>
          )}
        </LedgerSection>
      </div>
    </PageShell>
  );
}
