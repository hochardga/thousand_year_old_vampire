import fs from "node:fs";
import path from "node:path";
import { createE2EServerSupabaseClient } from "@/lib/supabase/e2e";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/0002_core_gameplay_schema.sql",
);

function readMigration() {
  return fs.readFileSync(migrationPath, "utf8");
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
      /select coalesce\(max\(encounter_index\), 0\) \+ 1[\s\S]*from public\.prompt_runs[\s\S]*and prompt_number = next_prompt_number/i,
    );
    expect(sql).toMatch(
      /if exists \([\s\S]*prompt_number = next_prompt_number[\s\S]*encounter_index = next_prompt_encounter[\s\S]*\) then[\s\S]*exit;[\s\S]*end if;[\s\S]*next_prompt_number := next_prompt_number \+ 1;[\s\S]*next_prompt_encounter := 1;/i,
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
