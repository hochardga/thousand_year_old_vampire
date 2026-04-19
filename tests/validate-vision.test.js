const test = require("node:test");
const assert = require("node:assert/strict");

const { validate, CURRENT_VERSION } = require("../scripts/validate-vision.js");

function buildValidVision() {
  return {
    meta: {
      createdAt: "2026-04-19T20:04:34Z",
      updatedAt: "2026-04-19T20:04:34Z",
      version: CURRENT_VERSION,
      plaidVersion: "1.0",
    },
    creator: {
      name: "Gerg",
      expertise: "Software engineer with 20+ years building enterprise tools",
      background:
        "I know how to ship software that solves practical problems, but I haven't yet made something creative that feels like mine. This adaptation is a deliberate shift: using everything I've learned as an engineer to build an experience that is atmospheric, literary, and emotionally durable.",
    },
    purpose: {
      whoYouHelp:
        "People intrigued by reflective narrative games who bounce off physical journaling, handwriting, and manual bookkeeping",
      problemYouSolve:
        "They are curious about solo journaling games, but handwriting, setup, and bookkeeping feel like homework before the magic arrives.",
      desiredTransformation:
        "Players move from rules friction and bookkeeping to a guided gothic ritual where the system handles scaffolding and they stay focused on story and feeling.",
      whyYou:
        "I know how to reduce friction in complex systems without stripping away their depth.",
    },
    product: {
      name: "Thousand Year Old Vampire: Digital Edition",
      oneLiner:
        "Thousand Year Old Vampire: Digital Edition helps curious solo players experience gothic journaling play through guided digital ritual.",
      howItWorks:
        "A player is guided through becoming undead, then moves prompt by prompt through a focused writing ritual while the app quietly handles rolls, memory changes, and state tracking.",
      keyCapabilities: [
        "Guided vampire creation and onboarding",
        "Cinematic prompt-by-prompt play",
        "Automatic memory and trait management",
        "Archival journal presentation",
        "Session recaps that make long gaps easy to return from",
      ],
      platform: "cross-platform",
      marketDifferentiation:
        "Unlike broader narrative game apps that streamline everything into clean choice flows, this adaptation keeps the literary, solitary, and unsettling character of the game intact while quietly supporting the player underneath.",
      magicMoment:
        "During setup, the player moves from learning a complicated solo game to already inhabiting a vampire's life within minutes.",
    },
    audience: {
      primaryUser:
        "Jules, 35, is a creatively curious player who wants solitary, emotionally rich experiences they can return to at their own pace.",
      secondaryUsers: [
        "Existing fans of the tabletop game who want a faithful digital adaptation for convenience and rereading",
      ],
      currentAlternatives:
        "The physical book and handwritten journaling, plain text docs or Notes apps, Notion or Obsidian setups, and sometimes just not starting because the analog overhead feels too high.",
      frustrations:
        "The original analog form is powerful, but for this audience the setup and manual tracking create enough friction that they never fully enter the experience.",
    },
    business: {
      revenueModel: "free",
      initialGoal:
        "Release a public version that feels authored rather than prototype-like, with a handful of returning players and clear signal on whether it should stay a free art project or grow into something commercial.",
      sixMonthVision:
        "A respected niche adaptation with a small but devoted player base and a quality level that feels worthy as a first released creative work.",
      constraints:
        "The main constraint is avoiding over-engineering and keeping the scope focused on tone, pacing, and literary feeling.",
      goToMarket:
        "Build in public with regular progress notes, design thoughts, and archival screenshots before releasing to narrative-game communities.",
    },
    feeling: {
      brandPersonality:
        "A graceful guide through darkness: gentle, intimate, emotionally serious, and never theatrical for its own sake.",
      visualMood:
        "A quiet nocturne: deep charcoal, ash, faded gold, restrained ornament, and spacious layouts that feel intimate and literary.",
      toneOfVoice:
        "Gentle ritual guide — calm, intimate, and supportive, helping the player stay inside the experience without sounding like software.",
      antiPatterns:
        "Never like a dense rules tool: no spreadsheet energy, no forms-heavy setup, and no obvious state-management UI that makes the player feel like they are operating a system instead of inhabiting a life.",
    },
    techStack: {
      appType: "cross-platform",
      frontend: {
        choice: "Next.js",
        rationale:
          "Best ecosystem for a solo build with strong support for polished web experiences across desktop and mobile browsers.",
      },
      backend: {
        choice: "Supabase",
        rationale:
          "A conventional backend platform with auth, storage, and relational data that keeps the stack explicit and durable.",
      },
      database: {
        choice: "Supabase Database (PostgreSQL)",
        rationale:
          "A natural fit for Supabase and a clear relational model for chronicles, memories, prompts, and session history.",
      },
      auth: {
        choice: "Supabase Auth",
        rationale:
          "Keeps authentication aligned with the chosen backend and supports private cross-device chronicles.",
      },
      payments: {
        choice: "",
        rationale: "",
      },
    },
    tooling: {
      codingAgent: "other",
      codingAgentName: "Codex",
    },
  };
}

test("validate accepts a complete free-product vision", () => {
  const result = validate(buildValidVision());

  assert.deepEqual(result.errors, []);
  assert.ok(Array.isArray(result.warnings));
});

test("validate requires a codingAgentName when codingAgent is other", () => {
  const vision = buildValidVision();
  delete vision.tooling.codingAgentName;

  const result = validate(vision);

  assert.ok(
    result.errors.some((error) =>
      error.includes("tooling.codingAgentName is required"),
    ),
  );
});
