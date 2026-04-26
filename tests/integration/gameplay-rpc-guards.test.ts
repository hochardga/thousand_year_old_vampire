import fs from "node:fs";
import path from "node:path";
import { createE2EServerSupabaseClient } from "@/lib/supabase/e2e";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/0002_core_gameplay_schema.sql",
);
const memoryRuleMigrationPath = path.join(
  process.cwd(),
  "supabase/migrations/0007_memory_rule_helpers.sql",
);
const diaryCapacityMigrationPath = path.join(
  process.cwd(),
  "supabase/migrations/0009_diary_capacity.sql",
);
const promptCreatedSkillsMigrationPath = path.join(
  process.cwd(),
  "supabase/migrations/0010_prompt_created_skills.sql",
);
const promptCreatedResourcesMigrationPath = path.join(
  process.cwd(),
  "supabase/migrations/0011_prompt_created_resources.sql",
);
const promptCreatedMarksMigrationPath = path.join(
  process.cwd(),
  "supabase/migrations/0012_prompt_created_marks.sql",
);
const promptCreatedCharactersMigrationPath = path.join(
  process.cwd(),
  "supabase/migrations/0013_prompt_created_characters.sql",
);
const samePromptEncounterHotfixPath = path.join(
  process.cwd(),
  "supabase/migrations/0006_fix_same_prompt_encounter_progression.sql",
);

function readMigration() {
  return fs.readFileSync(migrationPath, "utf8");
}

function readMemoryRuleMigration() {
  return fs.readFileSync(memoryRuleMigrationPath, "utf8");
}

function readDiaryCapacityMigration() {
  return fs.readFileSync(diaryCapacityMigrationPath, "utf8");
}

function readPromptCreatedSkillsMigration() {
  return fs.readFileSync(promptCreatedSkillsMigrationPath, "utf8");
}

function readPromptCreatedResourcesMigration() {
  return fs.readFileSync(promptCreatedResourcesMigrationPath, "utf8");
}

function readPromptCreatedMarksMigration() {
  return fs.readFileSync(promptCreatedMarksMigrationPath, "utf8");
}

function readPromptCreatedCharactersMigration() {
  return fs.readFileSync(promptCreatedCharactersMigrationPath, "utf8");
}

function readSamePromptEncounterHotfix() {
  return fs.readFileSync(samePromptEncounterHotfixPath, "utf8");
}

function resetE2EState() {
  (
    globalThis as typeof globalThis & {
      __tyovE2EState?: unknown;
    }
  ).__tyovE2EState = undefined;
}

beforeEach(() => {
  resetE2EState();
});

describe("gameplay RPC safety guards", () => {
  it("uses an unambiguous setup summary parameter when the setup RPC activates a chronicle", () => {
    const sql = readMigration();

    expect(sql).toContain("mortal_summary = nullif($2, '')");
  });

  it("rejects setup completion once a chronicle is no longer a draft", () => {
    const sql = readMigration();

    expect(sql).toMatch(
      /if chronicle_record\.status <> 'draft' then[\s\S]*raise exception/i,
    );
  });

  it("requires prompt resolution to target the current in-progress session", () => {
    const sql = readMigration();

    expect(sql).toMatch(
      /if chronicle_record\.current_session_id is distinct from target_session_id then[\s\S]*raise exception/i,
    );
    expect(sql).toMatch(
      /if session_record\.status <> 'in_progress' then[\s\S]*raise exception/i,
    );
  });

  it("moves on when the next encounter for a prompt does not exist", () => {
    const sql = readMigration();

    expect(sql).toMatch(
      /candidate_prompt_number = chronicle_record\.current_prompt_number[\s\S]*chronicle_record\.current_prompt_encounter/i,
    );
    expect(sql).toMatch(
      /if exists \([\s\S]*prompt_number = candidate_prompt_number[\s\S]*encounter_index = next_prompt_encounter[\s\S]*\) then[\s\S]*exit;[\s\S]*end if;[\s\S]*candidate_prompt_number := candidate_prompt_number \+ 1;[\s\S]*next_prompt_encounter := 1;/i,
    );
  });

  it("keeps the current-encounter safeguard in the linked-environment hotfix migration", () => {
    const sql = readSamePromptEncounterHotfix();

    expect(sql).toMatch(
      /candidate_prompt_number = chronicle_record\.current_prompt_number[\s\S]*chronicle_record\.current_prompt_encounter/i,
    );
  });

  it("defines dedicated helper functions for memory legality and overflow handling", () => {
    const sql = readMemoryRuleMigration();

    expect(sql).toMatch(
      /create or replace function public\.require_in_mind_memory/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.memory_entry_count/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.ensure_active_diary/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.apply_memory_overflow/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.next_open_memory_slot/i,
    );
  });

  it("guards append and overflow branches with the new memory helper error messages", () => {
    const sql = readMemoryRuleMigration();

    expect(sql).toMatch(
      /raise exception 'Only memories still held in mind can accept new entries\.'/i,
    );
    expect(sql).toMatch(
      /raise exception 'That memory is already full\.'/i,
    );
    expect(sql).toMatch(
      /raise exception 'A memory decision is required when the mind is full\.'/i,
    );
  });

  it("routes resolve_prompt_run through the helper layer instead of keeping all memory logic inline", () => {
    const sql = readMemoryRuleMigration();

    expect(sql).toMatch(/public\.require_in_mind_memory/i);
    expect(sql).toMatch(/public\.memory_entry_count/i);
    expect(sql).toMatch(/public\.apply_memory_overflow/i);
    expect(sql).toMatch(/public\.next_open_memory_slot/i);
    expect(sql).toMatch(/public\.ensure_active_diary/i);
  });

  it("adds diary capacity columns and helpers in the diary-capacity migration", () => {
    const sql = readDiaryCapacityMigration();

    expect(sql).toMatch(
      /alter table public\.diaries[\s\S]*add column if not exists memory_capacity integer not null default 4 check \(memory_capacity >= 1\);/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.active_diary_usage/i,
    );
  });

  it("checks active diary usage against diary-held memories in the diary-capacity migration", () => {
    const sql = readDiaryCapacityMigration();

    expect(sql).toContain("memories.location = 'diary'");
    expect(sql).toMatch(
      /insert into public\.diaries \(chronicle_id, title, memory_capacity\)\s*values \(target_chronicle_id, 'The Diary', 4\)/i,
    );
  });

  it("raises a dedicated full-diary error in the diary-capacity migration", () => {
    const sql = readDiaryCapacityMigration();

    expect(sql).toContain("The diary is already full.");
    expect(sql).toMatch(/where memory_capacity is null/i);
    expect(sql).toMatch(
      /if coalesce\(active_diary_memory_count, 0\) >= active_diary_capacity then/i,
    );
  });

  it("persists every archive event generated during prompt resolution", () => {
    const sql = readMemoryRuleMigration();

    expect(sql).toMatch(
      /insert into public\.archive_events[\s\S]*select[\s\S]*from jsonb_array_elements\(event_payload\) as event_row\(value\)/i,
    );
    expect(sql).toMatch(/event_row\.value->>'eventType'/i);
    expect(sql).toMatch(/event_row\.value->>'summary'/i);
  });

  it("adds a prompt-created skill helper and wires a new_skill argument into resolve_prompt_run", () => {
    const sql = readPromptCreatedSkillsMigration();

    expect(sql).toMatch(
      /create or replace function public\.create_prompt_skill\(\s*target_chronicle_id uuid,\s*new_skill jsonb\s*\)[\s\S]*?if new_skill is null then[\s\S]*?return null;[\s\S]*?select \*\s*into locked_chronicle\s*from public\.chronicles[\s\S]*?where id = target_chronicle_id[\s\S]*?for update;/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.resolve_prompt_run\(\s*target_chronicle_id uuid,\s*target_session_id uuid,\s*player_entry text,\s*experience_text text,\s*memory_decision jsonb default null,\s*trait_mutations jsonb default '\{\}'::jsonb,\s*new_skill jsonb default null\s*\)/i,
    );
    expect(sql).toMatch(
      /for mutation_row in[\s\S]*?coalesce\(trait_mutations->'marks', '\[\]'::jsonb\)[\s\S]*?end loop;\s*perform public\.create_prompt_skill\(target_chronicle_id, new_skill\);\s*insert into public\.archive_events/i,
    );
  });

  it("drops the old resolve_prompt_run signature and rejects duplicate skill labels", () => {
    const sql = readPromptCreatedSkillsMigration();

    expect(sql).toMatch(
      /drop function if exists public\.resolve_prompt_run\(uuid, uuid, text, text, jsonb, jsonb\);/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.create_prompt_skill[\s\S]*?if exists \([\s\S]*?from public\.skills[\s\S]*?where chronicle_id = target_chronicle_id[\s\S]*?and btrim\(label\) = new_skill_label[\s\S]*?\) then[\s\S]*?raise exception 'A skill with this name already exists\.'[\s\S]*?end if;/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.create_prompt_skill[\s\S]*?select \*\s*into locked_chronicle\s*from public\.chronicles[\s\S]*?for update;[\s\S]*?if exists \([\s\S]*?btrim\(label\) = new_skill_label[\s\S]*?end if;[\s\S]*?select coalesce\(max\(sort_order\), -1\) \+ 1[\s\S]*?into new_sort_order[\s\S]*?from public\.skills[\s\S]*?where chronicle_id = target_chronicle_id;/i,
    );
  });

  it("adds a prompt-created resource helper and wires a new_resource argument into resolve_prompt_run", () => {
    const sql = readPromptCreatedResourcesMigration();

    expect(sql).toMatch(
      /create or replace function public\.create_prompt_resource\(\s*target_chronicle_id uuid,\s*new_resource jsonb\s*\)[\s\S]*?if new_resource is null then[\s\S]*?return null;[\s\S]*?select \*\s*into locked_chronicle\s*from public\.chronicles[\s\S]*?where id = target_chronicle_id[\s\S]*?for update;/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.resolve_prompt_run\(\s*target_chronicle_id uuid,\s*target_session_id uuid,\s*player_entry text,\s*experience_text text,\s*memory_decision jsonb default null,\s*trait_mutations jsonb default '\{\}'::jsonb,\s*new_skill jsonb default null,\s*new_resource jsonb default null\s*\)/i,
    );
    expect(sql).toMatch(
      /perform public\.create_prompt_skill\(target_chronicle_id, new_skill\);\s*perform public\.create_prompt_resource\(target_chronicle_id, new_resource\);\s*insert into public\.archive_events/i,
    );
  });

  it("rejects duplicate resource labels and assigns the next resource sort order", () => {
    const sql = readPromptCreatedResourcesMigration();

    expect(sql).toMatch(
      /create or replace function public\.create_prompt_resource[\s\S]*?if exists \([\s\S]*?from public\.resources[\s\S]*?where chronicle_id = target_chronicle_id[\s\S]*?and btrim\(label\) = new_resource_label[\s\S]*?\) then[\s\S]*?raise exception 'A resource with this name already exists\.'[\s\S]*?end if;/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.create_prompt_resource[\s\S]*?select coalesce\(max\(sort_order\), -1\) \+ 1[\s\S]*?into new_sort_order[\s\S]*?from public\.resources[\s\S]*?where chronicle_id = target_chronicle_id;/i,
    );
  });

  it("adds a prompt-created mark helper and wires a new_mark argument into resolve_prompt_run", () => {
    const sql = readPromptCreatedMarksMigration();

    expect(sql).toMatch(
      /create or replace function public\.create_prompt_mark\(\s*target_chronicle_id uuid,\s*new_mark jsonb\s*\)[\s\S]*?if new_mark is null then[\s\S]*?return null;[\s\S]*?select \*\s*into locked_chronicle\s*from public\.chronicles[\s\S]*?where id = target_chronicle_id[\s\S]*?for update;/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.resolve_prompt_run\(\s*target_chronicle_id uuid,\s*target_session_id uuid,\s*player_entry text,\s*experience_text text,\s*memory_decision jsonb default null,\s*trait_mutations jsonb default '\{\}'::jsonb,\s*new_skill jsonb default null,\s*new_resource jsonb default null,\s*new_mark jsonb default null\s*\)/i,
    );
    expect(sql).toMatch(
      /perform public\.create_prompt_skill\(target_chronicle_id, new_skill\);\s*perform public\.create_prompt_resource\(target_chronicle_id, new_resource\);\s*perform public\.create_prompt_mark\(target_chronicle_id, new_mark\);\s*insert into public\.archive_events/i,
    );
  });

  it("rejects duplicate mark labels and assigns the next mark sort order", () => {
    const sql = readPromptCreatedMarksMigration();

    expect(sql).toMatch(
      /create or replace function public\.create_prompt_mark[\s\S]*?if exists \([\s\S]*?from public\.marks[\s\S]*?where chronicle_id = target_chronicle_id[\s\S]*?and btrim\(label\) = new_mark_label[\s\S]*?\) then[\s\S]*?raise exception 'A mark with this name already exists\.'[\s\S]*?end if;/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.create_prompt_mark[\s\S]*?select coalesce\(max\(sort_order\), -1\) \+ 1[\s\S]*?into new_sort_order[\s\S]*?from public\.marks[\s\S]*?where chronicle_id = target_chronicle_id;/i,
    );
  });

  it("adds mark sort order schema support before prompt-created marks read it", () => {
    const sql = readPromptCreatedMarksMigration();
    const schemaSupportIndex = sql.search(
      /alter table public\.marks[\s\S]*?add column if not exists sort_order integer/i,
    );
    const helperIndex = sql.indexOf(
      "create or replace function public.create_prompt_mark",
    );

    expect(schemaSupportIndex).toBeGreaterThanOrEqual(0);
    expect(helperIndex).toBeGreaterThanOrEqual(0);
    expect(schemaSupportIndex).toBeLessThan(helperIndex);
    expect(sql).toMatch(
      /row_number\(\) over \(\s*partition by chronicle_id\s*order by created_at, id\s*\) - 1/i,
    );
    expect(sql).toMatch(
      /alter table public\.marks[\s\S]*?alter column sort_order set default 0[\s\S]*?alter column sort_order set not null/i,
    );
  });

  it("adds a prompt-created character helper and wires a new_character argument into resolve_prompt_run", () => {
    const sql = readPromptCreatedCharactersMigration();

    expect(sql).toMatch(
      /create or replace function public\.create_prompt_character\(\s*target_chronicle_id uuid,\s*new_character jsonb\s*\)[\s\S]*?if new_character is null then[\s\S]*?return null;[\s\S]*?select \*\s*into locked_chronicle\s*from public\.chronicles[\s\S]*?where id = target_chronicle_id[\s\S]*?for update;/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.resolve_prompt_run\(\s*target_chronicle_id uuid,\s*target_session_id uuid,\s*player_entry text,\s*experience_text text,\s*memory_decision jsonb default null,\s*trait_mutations jsonb default '\{\}'::jsonb,\s*new_skill jsonb default null,\s*new_resource jsonb default null,\s*new_mark jsonb default null,\s*new_character jsonb default null\s*\)/i,
    );
    expect(sql).toMatch(
      /perform public\.create_prompt_skill\(target_chronicle_id, new_skill\);\s*perform public\.create_prompt_resource\(target_chronicle_id, new_resource\);\s*perform public\.create_prompt_mark\(target_chronicle_id, new_mark\);\s*perform public\.create_prompt_character\(target_chronicle_id, new_character\);/i,
    );
  });

  it("rejects duplicate character names and assigns the next character sort order", () => {
    const sql = readPromptCreatedCharactersMigration();

    expect(sql).toMatch(/raise exception 'A character with this name already exists\.'/i);
    expect(sql).toMatch(
      /select coalesce\(max\(sort_order\), -1\) \+ 1[\s\S]*from public\.characters/i,
    );
  });

  it("fills omitted character sort order before setup-created characters are inserted", () => {
    const sql = readPromptCreatedCharactersMigration();

    expect(sql).toMatch(
      /alter table public\.characters[\s\S]*?alter column sort_order drop default[\s\S]*?alter column sort_order set not null/i,
    );
    expect(sql).toMatch(
      /create or replace function public\.assign_character_sort_order\(\)[\s\S]*?if new\.sort_order is null then[\s\S]*?select coalesce\(max\(sort_order\), -1\) \+ 1[\s\S]*?into new\.sort_order[\s\S]*?where chronicle_id = new\.chronicle_id/i,
    );
    expect(sql).toMatch(
      /create trigger assign_character_sort_order\s*before insert on public\.characters\s*for each row\s*execute function public\.assign_character_sort_order\(\);/i,
    );
  });

  it("keeps the e2e gameplay mock aligned with the setup and active-session guards", async () => {
    const client = createE2EServerSupabaseClient({
      get(name) {
        if (name === "tyov-e2e-auth") {
          return { value: "1" };
        }

        return undefined;
      },
      set() {},
    });
    const inserted = await client
      .from("chronicles")
      .insert({ title: "The Long Night" })
      .select("id")
      .single();
    const chronicleId = inserted.data?.id as string;

    const firstSetup = await client.rpc("complete_chronicle_setup", {
      target_chronicle_id: chronicleId,
    });

    expect(firstSetup.error).toBeNull();

    const repeatedSetup = await client.rpc("complete_chronicle_setup", {
      target_chronicle_id: chronicleId,
    });

    expect(repeatedSetup.error).toMatchObject({
      message: "Chronicle setup has already been completed.",
    });

    const state = globalThis as typeof globalThis & {
      __tyovE2EState?: {
        chronicles: Array<{
          current_session_id: string | null;
          id: string;
        }>;
        sessions: Array<{
          chronicle_id: string;
          id: string;
          snapshot_json: Record<string, unknown>;
          started_at: string;
          status: "in_progress" | "paused" | "closed";
        }>;
      };
    };

    const staleSessionId = firstSetup.data?.sessionId as string;
    state.__tyovE2EState?.sessions.push({
      chronicle_id: chronicleId,
      id: "session-2",
      snapshot_json: {},
      started_at: new Date().toISOString(),
      status: "in_progress",
    });
    const chronicle = state.__tyovE2EState?.chronicles.find(
      (row) => row.id === chronicleId,
    );

    if (chronicle) {
      chronicle.current_session_id = "session-2";
    }

    const staleResolution = await client.rpc("resolve_prompt_run", {
      target_chronicle_id: chronicleId,
      target_session_id: staleSessionId,
    });

    expect(staleResolution.error).toMatchObject({
      message: "The active session no longer matches this request.",
    });

    if (chronicle) {
      chronicle.current_session_id = "session-2";
    }

    const activeSession = state.__tyovE2EState?.sessions.find(
      (row) => row.id === "session-2",
    );

    if (activeSession) {
      activeSession.status = "paused";
    }

    const inactiveSessionResolution = await client.rpc("resolve_prompt_run", {
      target_chronicle_id: chronicleId,
      target_session_id: "session-2",
    });

    expect(inactiveSessionResolution.error).toMatchObject({
      message: "Session is not active.",
    });
  });
});
