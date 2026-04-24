import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SetupStepper } from "@/components/ritual/SetupStepper";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());
const completeChronicleSetup = vi.hoisted(() => vi.fn());
const getPromptByPosition = vi.hoisted(() => vi.fn());
const refreshSessionSnapshot = vi.hoisted(() => vi.fn());
const resolvePrompt = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

vi.mock("@/lib/chronicles/setup", () => ({
  completeChronicleSetup,
}));

vi.mock("@/lib/chronicles/resolvePrompt", () => ({
  resolvePrompt,
}));

vi.mock("@/lib/chronicles/sessionSnapshots", () => ({
  refreshSessionSnapshot,
}));

vi.mock("@/lib/prompts/catalog", () => ({
  getPromptByPosition,
}));

describe("guided setup flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    createServerSupabaseClient.mockReset();
    completeChronicleSetup.mockReset();
    getPromptByPosition.mockReset();
    refreshSessionSnapshot.mockReset();
    resolvePrompt.mockReset();
    vi.resetModules();
  });

  it("renders editorial setup steps and hydrates saved draft state", () => {
    window.localStorage.setItem(
      "tyov.setup.chronicle-1",
      JSON.stringify({
        immortalCharacter: {
          description: "",
          kind: "immortal",
          name: "",
        },
        initialCharacters: [],
        initialResources: [],
        initialSkills: [],
        mark: {
          description: "",
          isConcealed: true,
          label: "",
        },
        mortalSummary:
          "I kept the ledgers for a household that believed order could save it.",
        setupMemories: [],
      }),
    );

    render(
      <SetupStepper
        chronicleId="chronicle-1"
        chronicleTitle="The Long Night"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Begin with the life you had before.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("The life you had before")).toBeInTheDocument();
    expect(screen.getByLabelText("Mortal summary")).toHaveValue(
      "I kept the ledgers for a household that believed order could save it.",
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );

    expect(screen.getByText("What you can still carry")).toBeInTheDocument();
  });

  it("renders rules guidance inside the setup thresholds", () => {
    render(
      <SetupStepper
        chronicleId="chronicle-1"
        chronicleTitle="The Long Night"
      />,
    );

    expect(screen.getByText("How this works")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This summary anchors the mortal life the chronicle will spend and distort.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Keep this grounded in the life, habits, and loyalties that mattered before undeath.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );

    expect(
      screen.getByText(
        "Skills and resources become part of the living record, so choose what feels defining rather than exhaustive.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Choose one thing the vampire could do before the hunger learned its name.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );

    expect(
      screen.getByText(
        "These first memories seed the mind the chronicle will later struggle to keep intact.",
      ),
    ).toBeInTheDocument();
  });

  it("adds a deliberate safety checkpoint before the first prompt", () => {
    render(
      <SetupStepper
        chronicleId="chronicle-1"
        chronicleTitle="The Long Night"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Pause at the threshold before the first prompt.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This chronicle asks for mature, solitary, and sometimes painful material. You can continue now, step away, or return another night without penalty.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Continue to the first prompt",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Return to the memory fragments",
      }),
    ).toBeInTheDocument();
  });

  it("keeps the player on the checkpoint when setup submission fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "The chronicle could not be completed just now.",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 500,
        },
      ),
    );

    render(
      <SetupStepper
        chronicleId="chronicle-1"
        chronicleTitle="The Long Night"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the next threshold",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to the first prompt",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("The chronicle could not be completed just now."),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", {
        name: "Pause at the threshold before the first prompt.",
      }),
    ).toBeInTheDocument();

    fetchMock.mockRestore();
  });

  it("submits a valid setup payload through the completion route", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    });
    completeChronicleSetup.mockResolvedValue({
      chronicleId: "chronicle-1",
      createdEntities: {
        characters: 2,
        memories: 1,
        resources: 1,
        skills: 1,
      },
      currentPromptNumber: 1,
      nextRoute: "/chronicles/chronicle-1/play",
    });

    const { POST } = await import(
      "@/app/api/chronicles/[chronicleId]/setup/complete/route"
    );
    const response = await POST(
      new Request("http://localhost/api/chronicles/chronicle-1/setup/complete", {
        body: JSON.stringify({
          immortalCharacter: {
            description: "The one who remade me.",
            kind: "immortal",
            name: "Aurelia",
          },
          initialCharacters: [
            {
              description: "My sister kept watch at the window.",
              kind: "mortal",
              name: "Marta",
            },
          ],
          initialResources: [
            {
              description: "A shuttered estate above the marsh.",
              isStationary: true,
              label: "The Marsh House",
            },
          ],
          initialSkills: [
            {
              description: "I knew how to listen before I knew how to survive.",
              label: "Quiet Devotion",
            },
          ],
          mark: {
            description: "My reflection trembles before it vanishes.",
            isConcealed: true,
            label: "Unsteady Reflection",
          },
          mortalSummary:
            "I had a life of service, habit, and private longing before the night opened.",
          setupMemories: [
            {
              entryText: "I kept watch outside the sickroom and learned patience.",
              title: "My vigil by the sickbed",
            },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      {
        params: Promise.resolve({ chronicleId: "chronicle-1" }),
      } as never,
    );

    expect(response.status).toBe(200);
    expect(completeChronicleSetup).toHaveBeenCalledWith(
      expect.anything(),
      "chronicle-1",
      expect.objectContaining({
        mortalSummary:
          "I had a life of service, habit, and private longing before the night opened.",
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      chronicleId: "chronicle-1",
      currentPromptNumber: 1,
      nextRoute: "/chronicles/chronicle-1/play",
    });
  });

  it("rejects an invalid setup payload with the standard error shape", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    });

    const { POST } = await import(
      "@/app/api/chronicles/[chronicleId]/setup/complete/route"
    );
    const response = await POST(
      new Request("http://localhost/api/chronicles/chronicle-1/setup/complete", {
        body: JSON.stringify({
          immortalCharacter: {
            description: "The one who remade me.",
            kind: "mortal",
            name: "Aurelia",
          },
          initialCharacters: [],
          initialResources: [],
          initialSkills: [],
          mark: {
            description: "",
            isConcealed: true,
            label: "",
          },
          mortalSummary: "",
          setupMemories: [],
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      {
        params: Promise.resolve({ chronicleId: "chronicle-1" }),
      } as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      details: expect.any(Array),
      error: "Validation failed",
    });
    expect(completeChronicleSetup).not.toHaveBeenCalled();
  });

  it("renders the first prompt and compact memory summary on the play route", async () => {
    const chronicleSingle = vi.fn().mockResolvedValue({
        data: {
          current_prompt_encounter: 1,
          current_prompt_number: 1,
          current_session_id: "session-1",
          id: "chronicle-1",
          prompt_version: "base",
          status: "active",
          title: "The Long Night",
        },
        error: null,
      });
    const chronicleEq = vi.fn(() => ({ single: chronicleSingle }));
    const chronicleSelect = vi.fn(() => ({ eq: chronicleEq }));
    const memoriesEqChronicle = vi.fn().mockResolvedValue({
      data: [
        {
          diary_id: null,
          id: "memory-1",
          location: "mind",
          slot_index: 1,
          title: "Winter bells",
        },
        {
          diary_id: "diary-1",
          id: "memory-2",
          location: "diary",
          slot_index: null,
          title: "The vow written down",
        },
        {
          diary_id: "diary-2",
          id: "memory-3",
          location: "diary",
          slot_index: null,
          title: "A discarded ledger",
        },
      ],
      error: null,
    });
    const memoriesSelect = vi.fn(() => ({ eq: memoriesEqChronicle }));
    const diariesMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "diary-1",
        memory_capacity: 4,
        status: "active",
        title: "The Diary",
      },
      error: null,
    });
    const diariesEqStatus = vi.fn(() => ({ maybeSingle: diariesMaybeSingle }));
    const diariesEqChronicle = vi.fn(() => ({ eq: diariesEqStatus }));
    const diariesSelect = vi.fn(() => ({ eq: diariesEqChronicle }));
    const skillsOrder = vi.fn().mockResolvedValue({
      data: [
        {
          chronicle_id: "chronicle-1",
          label: "Quiet Devotion",
        },
      ],
      error: null,
    });
    const skillsEqChronicle = vi.fn(() => ({ order: skillsOrder }));
    const skillsSelect = vi.fn(() => ({ eq: skillsEqChronicle }));
    const from = vi.fn((table: string) => {
      if (table === "chronicles") {
        return { select: chronicleSelect };
      }

      if (table === "memories") {
        return { select: memoriesSelect };
      }

      if (table === "diaries") {
        return { select: diariesSelect };
      }

      if (table === "skills") {
        return { select: skillsSelect };
      }

      throw new Error(`Unsupported table in play page test: ${table}`);
    });

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from,
    });
    getPromptByPosition.mockResolvedValue({
      encounter_index: 1,
      prompt_markdown:
        "In your blood-hunger you destroy someone close to you. Kill a mortal Character.",
      prompt_number: 1,
      prompt_version: "base",
    });

    const { default: PlayPage } = await import(
      "@/app/(app)/chronicles/[chronicleId]/play/page"
    );
    const view = await PlayPage({
      params: Promise.resolve({ chronicleId: "chronicle-1" }),
    } as never);

    render(view);

    expect(
      screen.getByRole("heading", {
        name: "Prompt 1",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "In your blood-hunger you destroy someone close to you. Kill a mortal Character.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Keep your footing")).toBeInTheDocument();
    expect(
      screen.getByText("What belongs in the entry?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Write the immediate answer to the prompt: what the vampire did, chose, or suffered.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("When the mind is full")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Choose which older memory to forget or move into a diary before the new experience can settle.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("1 memory held in mind")).toBeInTheDocument();
    expect(screen.getByText("Diary 1 of 4 memories")).toBeInTheDocument();
    expect(diariesMaybeSingle).toHaveBeenCalledTimes(1);
  });

  it("submits a valid prompt resolution payload through the resolve route", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    });
    resolvePrompt.mockResolvedValue({
      archiveEvents: [
        {
          eventType: "prompt_resolved",
          summary: "The entry has been set into memory.",
        },
      ],
      nextPrompt: {
        encounterIndex: 1,
        promptNumber: 4,
      },
      promptRunId: "run-1",
      rolled: {
        d10: 7,
        d6: 4,
        movement: 3,
      },
    });

    const { POST } = await import(
      "@/app/api/chronicles/[chronicleId]/play/resolve/route"
    );
    const response = await POST(
      new Request("http://localhost/api/chronicles/chronicle-1/play/resolve", {
        body: JSON.stringify({
          experienceText:
            "I left the chapel with blood under my nails and a prayer I could not finish.",
          memoryDecision: {
            mode: "append-existing",
            targetMemoryId: "9b3a25d0-89de-4c6f-b0fd-f719f99c4f6b",
          },
          playerEntry:
            "I answered the bells by dragging the sexton into the thawing graveyard.",
          sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
          traitMutations: {
            characters: [],
            marks: [],
            resources: [],
            skills: [],
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      {
        params: Promise.resolve({ chronicleId: "chronicle-1" }),
      } as never,
    );

    expect(response.status).toBe(200);
    expect(resolvePrompt).toHaveBeenCalledWith(
      expect.anything(),
      "chronicle-1",
      expect.objectContaining({
        sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
      }),
    );
    expect(refreshSessionSnapshot).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        chronicleId: "chronicle-1",
        sessionId: "ae7810a8-c50f-4790-9d09-8e8968f6a7a1",
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      nextPrompt: {
        encounterIndex: 1,
        promptNumber: 4,
      },
      promptRunId: "run-1",
      rolled: {
        d10: 7,
        d6: 4,
        movement: 3,
      },
    });
  });

  it("rejects an invalid prompt resolution payload with the standard error shape", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    });

    const { POST } = await import(
      "@/app/api/chronicles/[chronicleId]/play/resolve/route"
    );
    const response = await POST(
      new Request("http://localhost/api/chronicles/chronicle-1/play/resolve", {
        body: JSON.stringify({
          experienceText: "",
          memoryDecision: {
            memoryId: "not-a-uuid",
            mode: "keep-everything",
          },
          playerEntry: "",
          sessionId: "not-a-uuid",
          traitMutations: {
            characters: [],
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      {
        params: Promise.resolve({ chronicleId: "chronicle-1" }),
      } as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      details: expect.any(Array),
      error: "Validation failed",
    });
    expect(resolvePrompt).not.toHaveBeenCalled();
  });

  it("shows quiet consequence feedback after a successful prompt resolution", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            archiveEvents: [
              {
                eventType: "prompt_resolved",
                summary: "The entry has been set into memory.",
              },
            ],
            nextPrompt: {
              encounterIndex: 1,
              promptNumber: 4,
            },
            promptRunId: "run-1",
            rolled: {
              d10: 7,
              d6: 4,
              movement: 3,
            },
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 200,
          },
        ),
      );

    const { PlaySurface } = await import("@/components/ritual/PlaySurface");

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        initialSessionId="session-1"
      />,
    );

    fireEvent.change(screen.getByLabelText("Player entry"), {
      target: {
        value: "I answered the bells by dragging the sexton into the thawing graveyard.",
      },
    });
    fireEvent.change(screen.getByLabelText("Experience text"), {
      target: {
        value:
          "I left the chapel with blood under my nails and a prayer I could not finish.",
      },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Set the entry into memory",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("The entry has been set into memory."),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("link", {
        name: "Continue to prompt 4",
      }),
    ).toHaveAttribute("href", "/chronicles/chronicle-1/play");

    fetchMock.mockRestore();
  });

  it("reveals prompt-created skill fields on demand and sends newSkill in the request body", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            archiveEvents: [
              {
                eventType: "prompt_resolved",
                summary: "The entry has been set into memory.",
              },
            ],
            nextPrompt: {
              encounterIndex: 1,
              promptNumber: 4,
            },
            promptRunId: "run-1",
            rolled: {
              d10: 7,
              d6: 4,
              movement: 3,
            },
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 200,
          },
        ),
      );

    const { PlaySurface } = await import("@/components/ritual/PlaySurface");

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        existingSkillLabels={["Quiet Devotion"]}
        initialSessionId="session-1"
      />,
    );

    expect(screen.queryByLabelText("Skill name")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a skill from this prompt",
      }),
    );

    fireEvent.change(screen.getByLabelText("Skill name"), {
      target: { value: "Bloodthirsty" },
    });
    fireEvent.change(screen.getByLabelText("Why this skill now"), {
      target: { value: "I learned to feed first and mourn later." },
    });
    fireEvent.change(screen.getByLabelText("Player entry"), {
      target: {
        value: "I answered the bells by dragging the sexton into the thawing graveyard.",
      },
    });
    fireEvent.change(screen.getByLabelText("Experience text"), {
      target: {
        value:
          "I left the chapel with blood under my nails and a prayer I could not finish.",
      },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Set the entry into memory",
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body)) as {
      newSkill?: {
        description: string;
        label: string;
      };
    };

    expect(payload.newSkill).toEqual({
      description: "I learned to feed first and mourn later.",
      label: "Bloodthirsty",
    });

    fetchMock.mockRestore();
  });

  it("blocks duplicate prompt-created skill labels before submitting", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const { PlaySurface } = await import("@/components/ritual/PlaySurface");

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        existingSkillLabels={["Quiet Devotion", "Bloodthirsty"]}
        initialSessionId="session-1"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a skill from this prompt",
      }),
    );
    fireEvent.change(screen.getByLabelText("Skill name"), {
      target: { value: "Bloodthirsty" },
    });
    fireEvent.change(screen.getByLabelText("Why this skill now"), {
      target: { value: "I learned to feed first and mourn later." },
    });
    fireEvent.change(screen.getByLabelText("Player entry"), {
      target: { value: "I answered the prompt." },
    });
    fireEvent.change(screen.getByLabelText("Experience text"), {
      target: { value: "I carried the consequence forward." },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Set the entry into memory",
      }),
    );

    expect(
      screen.getByText(
        "That skill name is already in the chronicle. Choose different wording.",
      ),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockRestore();
  });

  it("preserves prompt-created skill draft fields after a failed submission", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "That skill name is already in the chronicle. Choose different wording.",
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 500,
          },
        ),
      );

    const { PlaySurface } = await import("@/components/ritual/PlaySurface");
    const view = render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        existingSkillLabels={["Quiet Devotion"]}
        initialSessionId="session-1"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a skill from this prompt",
      }),
    );
    fireEvent.change(screen.getByLabelText("Skill name"), {
      target: { value: "Bloodthirsty" },
    });
    fireEvent.change(screen.getByLabelText("Why this skill now"), {
      target: { value: "I learned to feed first and mourn later." },
    });
    fireEvent.change(screen.getByLabelText("Player entry"), {
      target: { value: "I answered the prompt." },
    });
    fireEvent.change(screen.getByLabelText("Experience text"), {
      target: { value: "I carried the consequence forward." },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Set the entry into memory",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "That skill name is already in the chronicle. Choose different wording.",
        ),
      ).toBeInTheDocument();
    });

    view.unmount();

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        existingSkillLabels={["Quiet Devotion"]}
        initialSessionId="session-1"
      />,
    );

    expect(screen.getByLabelText("Skill name")).toHaveValue("Bloodthirsty");
    expect(screen.getByLabelText("Why this skill now")).toHaveValue(
      "I learned to feed first and mourn later.",
    );

    fetchMock.mockRestore();
  });

  it("clears prompt-created skill draft fields when the skill is removed", async () => {
    const { PlaySurface } = await import("@/components/ritual/PlaySurface");
    const view = render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        existingSkillLabels={["Quiet Devotion"]}
        initialSessionId="session-1"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a skill from this prompt",
      }),
    );
    fireEvent.change(screen.getByLabelText("Skill name"), {
      target: { value: "Bloodthirsty" },
    });
    fireEvent.change(screen.getByLabelText("Why this skill now"), {
      target: { value: "I learned to feed first and mourn later." },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove the new skill",
      }),
    );

    expect(screen.queryByLabelText("Skill name")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a skill from this prompt",
      }),
    );

    expect(screen.getByLabelText("Skill name")).toHaveValue("");
    expect(screen.getByLabelText("Why this skill now")).toHaveValue("");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove the new skill",
      }),
    );

    view.unmount();

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        currentPromptNumber={1}
        existingSkillLabels={["Quiet Devotion"]}
        initialSessionId="session-1"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add a skill from this prompt",
      }),
    );

    expect(screen.getByLabelText("Skill name")).toHaveValue("");
    expect(screen.getByLabelText("Why this skill now")).toHaveValue("");
  });

  it("shows the memory overflow panel in play and submits a legal overflow decision", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            archiveEvents: [
              {
                eventType: "memory_moved_to_diary",
                summary: "A memory has been placed into the diary.",
              },
            ],
            nextPrompt: {
              encounterIndex: 1,
              promptNumber: 4,
            },
            promptRunId: "run-1",
            rolled: {
              d10: 7,
              d6: 4,
              movement: 3,
            },
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 200,
          },
        ),
      );

    const { PlaySurface } = await import("@/components/ritual/PlaySurface");

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        initialSessionId="session-1"
        mindMemories={[
          { id: "memory-1", slotIndex: 1, title: "Winter bells" },
          { id: "memory-2", slotIndex: 2, title: "The nameless face" },
          { id: "memory-3", slotIndex: 3, title: "A flooded chapel" },
          { id: "memory-4", slotIndex: 4, title: "The black carriage" },
          { id: "memory-5", slotIndex: 5, title: "A ruined oath" },
        ]}
      />,
    );

    expect(
      screen.getByText(
        "The mind is full. Choose which memory to forget or press into the diary before this new one can settle.",
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Player entry"), {
      target: {
        value: "I answered the bells by dragging the sexton into the thawing graveyard.",
      },
    });
    fireEvent.change(screen.getByLabelText("Experience text"), {
      target: {
        value:
          "I left the chapel with blood under my nails and a prayer I could not finish.",
      },
    });
    fireEvent.click(
      screen.getByRole("radio", {
        name: /Move one memory into a new diary/i,
      }),
    );
    fireEvent.click(
      screen.getByRole("radio", {
        name: /Slot 1: Winter bells/i,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Set the entry into memory",
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body)) as {
      memoryDecision: {
        memoryId: string;
        mode: string;
      };
    };

    expect(payload.memoryDecision).toEqual({
      memoryId: "memory-1",
      mode: "move-to-diary",
    });

    fetchMock.mockRestore();
  });

  it("loads chronicle skill labels on the play page for duplicate checking", async () => {
    const chronicleSingle = vi.fn().mockResolvedValue({
      data: {
        current_prompt_encounter: 1,
        current_prompt_number: 1,
        current_session_id: "session-1",
        id: "chronicle-1",
        prompt_version: "base",
        status: "active",
        title: "The Long Night",
      },
      error: null,
    });
    const chronicleEq = vi.fn(() => ({ single: chronicleSingle }));
    const chronicleSelect = vi.fn(() => ({ eq: chronicleEq }));
    const memoriesEqChronicle = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const memoriesSelect = vi.fn(() => ({ eq: memoriesEqChronicle }));
    const diariesMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const diariesEqStatus = vi.fn(() => ({ maybeSingle: diariesMaybeSingle }));
    const diariesEqChronicle = vi.fn(() => ({ eq: diariesEqStatus }));
    const diariesSelect = vi.fn(() => ({ eq: diariesEqChronicle }));
    const skillsOrder = vi.fn().mockResolvedValue({
      data: [
        {
          chronicle_id: "chronicle-1",
          label: "Quiet Devotion",
        },
      ],
      error: null,
    });
    const skillsEqChronicle = vi.fn(() => ({ order: skillsOrder }));
    const skillsSelect = vi.fn(() => ({ eq: skillsEqChronicle }));

    const from = vi.fn((table: string) => {
      if (table === "chronicles") {
        return { select: chronicleSelect };
      }

      if (table === "memories") {
        return { select: memoriesSelect };
      }

      if (table === "diaries") {
        return { select: diariesSelect };
      }

      if (table === "skills") {
        return { select: skillsSelect };
      }

      throw new Error(`Unsupported table in play page test: ${table}`);
    });

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from,
    });
    getPromptByPosition.mockResolvedValue({
      encounter_index: 1,
      prompt_markdown:
        "In your blood-hunger you destroy someone close to you. Kill a mortal Character.",
      prompt_number: 1,
      prompt_version: "base",
    });

    const { default: PlayPage } = await import(
      "@/app/(app)/chronicles/[chronicleId]/play/page"
    );

    render(
      await PlayPage({
        params: Promise.resolve({ chronicleId: "chronicle-1" }),
      } as never),
    );

    expect(skillsOrder).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", {
        name: "Add a skill from this prompt",
      }),
    ).toBeInTheDocument();
  });

  it("disables diary overflow when the active diary is already full", async () => {
    const { PlaySurface } = await import("@/components/ritual/PlaySurface");

    render(
      <PlaySurface
        {...({
          activeDiary: {
            id: "diary-1",
            memoryCapacity: 4,
            memoryCount: 4,
            title: "The Diary",
          },
        } as never)}
        chronicleId="chronicle-1"
        initialSessionId="session-1"
        mindMemories={[
          { id: "memory-1", slotIndex: 1, title: "Winter bells" },
          { id: "memory-2", slotIndex: 2, title: "The nameless face" },
          { id: "memory-3", slotIndex: 3, title: "A flooded chapel" },
          { id: "memory-4", slotIndex: 4, title: "The black carriage" },
          { id: "memory-5", slotIndex: 5, title: "A ruined oath" },
        ]}
      />,
    );

    expect(
      screen.getByRole("radio", {
        name: /Move one memory into the diary/i,
      }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "The diary is full at 4 memories. Forget one in-mind memory, or wait for a prompt effect that changes the diary.",
      ),
    ).toBeInTheDocument();
  });

  it("preserves the unsent prompt draft after a failed submission", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "The prompt could not be resolved.",
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 500,
          },
        ),
      );

    const { PlaySurface } = await import("@/components/ritual/PlaySurface");

    const view = render(
      <PlaySurface
        chronicleId="chronicle-1"
        initialSessionId="session-1"
      />,
    );

    fireEvent.change(screen.getByLabelText("Player entry"), {
      target: {
        value: "I answered the bells by dragging the sexton into the thawing graveyard.",
      },
    });
    fireEvent.change(screen.getByLabelText("Experience text"), {
      target: {
        value:
          "I left the chapel with blood under my nails and a prayer I could not finish.",
      },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Set the entry into memory",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("The prompt could not be resolved."),
      ).toBeInTheDocument();
    });

    view.unmount();

    render(
      <PlaySurface
        chronicleId="chronicle-1"
        initialSessionId="session-1"
      />,
    );

    expect(screen.getByLabelText("Player entry")).toHaveValue(
      "I answered the bells by dragging the sexton into the thawing graveyard.",
    );
    expect(screen.getByLabelText("Experience text")).toHaveValue(
      "I left the chapel with blood under my nails and a prayer I could not finish.",
    );

    fetchMock.mockRestore();
  });
});
