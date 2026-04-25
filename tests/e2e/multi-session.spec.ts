import { expect, test, type Page } from "@playwright/test";

test.use({
  viewport: {
    height: 844,
    width: 390,
  },
});

async function signInThroughTestAuth(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Testing email address").fill("e2e@example.com");
  await page.getByLabel("Testing password").fill("nightfall");
  await page.getByRole("button", { name: "Enter Through Test Sign-In" }).click();

  await expect(page).toHaveURL("/chronicles");
}

async function createChronicleThroughSetup(page: Page) {
  await page.getByPlaceholder("The Long Night").fill("The Long Night");
  await page.getByRole("button", { name: "Begin a New Chronicle" }).click();

  await expect(page).toHaveURL(/\/chronicles\/.+\/setup/);
  const chronicleId = page.url().match(/\/chronicles\/([^/]+)\//)?.[1];

  await page
    .getByLabel("Mortal summary")
    .fill(
      "I had a life of service, habit, and private longing before the night opened.",
    );
  if (chronicleId) {
    await expect
      .poll(async () =>
        page.evaluate(
          (id) => window.localStorage.getItem(`tyov.setup.${id}`),
          chronicleId,
        ),
      )
      .toContain("I had a life of service, habit, and private longing before the night opened.");
  }
  await page
    .getByRole("button", { name: "Continue to the next threshold" })
    .click();

  await page.getByLabel("First skill").fill("Quiet Devotion");
  await page
    .getByLabel("Why this skill mattered")
    .fill("I knew how to listen before I knew how to survive.");
  await page.getByLabel("First resource").fill("The Marsh House");
  await page
    .getByLabel("Why it matters")
    .fill("It was the first shelter I claimed as the hunger sharpened.");
  if (chronicleId) {
    await expect
      .poll(async () =>
        page.evaluate(
          (id) => window.localStorage.getItem(`tyov.setup.${id}`),
          chronicleId,
        ),
      )
      .toContain("Quiet Devotion");
    await expect
      .poll(async () =>
        page.evaluate(
          (id) => window.localStorage.getItem(`tyov.setup.${id}`),
          chronicleId,
        ),
      )
      .toContain("The Marsh House");
  }
  await page
    .getByRole("button", { name: "Continue to the next threshold" })
    .click();

  await page.getByLabel("A mortal character").fill("Marta");
  await page
    .getByLabel("Why they still matter")
    .fill("She believed there was still a gentler version of me worth saving.");
  await page.getByLabel("The immortal who made you").fill("Aurelia");
  await page
    .getByLabel("How they changed you")
    .fill("She remade my hunger and called it a gift.");
  if (chronicleId) {
    await expect
      .poll(async () =>
        page.evaluate(
          (id) => window.localStorage.getItem(`tyov.setup.${id}`),
          chronicleId,
        ),
      )
      .toContain("Marta");
    await expect
      .poll(async () =>
        page.evaluate(
          (id) => window.localStorage.getItem(`tyov.setup.${id}`),
          chronicleId,
        ),
      )
      .toContain("Aurelia");
  }
  await page
    .getByRole("button", { name: "Continue to the next threshold" })
    .click();

  await page.getByLabel("The mark").fill("Unsteady Reflection");
  await page
    .getByLabel("How it shows itself")
    .fill("My reflection trembles before it vanishes.");
  if (chronicleId) {
    await expect
      .poll(async () =>
        page.evaluate(
          (id) => window.localStorage.getItem(`tyov.setup.${id}`),
          chronicleId,
        ),
      )
      .toContain("Unsteady Reflection");
  }
  await page
    .getByRole("button", { name: "Continue to the next threshold" })
    .click();

  await page.getByLabel("First memory title").fill("My vigil by the sickbed");
  await page
    .getByLabel("First memory entry")
    .fill("I kept watch outside the sickroom and learned patience.");

  if (chronicleId) {
    await expect
      .poll(async () =>
        page.evaluate(
          (id) => window.localStorage.getItem(`tyov.setup.${id}`),
          chronicleId,
        ),
      )
      .toContain("My vigil by the sickbed");
  }

  await page
    .getByRole("button", { name: "Continue to the next threshold" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Pause at the threshold before the first prompt.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "This chronicle asks for mature, solitary, and sometimes painful material. You can continue now, step away, or return another night without penalty.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Reduce the level of detail when a prompt feels too close.",
    ),
  ).toBeVisible();

  const setupCompletionResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/setup/complete") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Continue to the first prompt" })
    .click();
  const setupCompletionResponse = await setupCompletionResponsePromise;

  expect(setupCompletionResponse.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/chronicles\/.+\/play/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Prompt 1" })).toBeVisible();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolvePrompt(
  page: Page,
  options: {
    experienceText: string;
    overflowChoiceTitle?: string;
    overflowMode?: "forget-existing" | "move-to-diary";
    playerEntry: string;
  },
) {
  await page.waitForLoadState("networkidle");

  const playerEntryField = page.getByLabel("Player entry");
  const experienceField = page.getByLabel("Experience text");

  await expect(playerEntryField).toBeEditable();
  await playerEntryField.fill(options.playerEntry);
  await expect(playerEntryField).toHaveValue(options.playerEntry);

  await expect(experienceField).toBeEditable();
  await experienceField.fill(options.experienceText);
  await expect(experienceField).toHaveValue(options.experienceText);

  if (await page.getByLabel("Why this skill now").isVisible().catch(() => false)) {
    await expect(page.getByLabel("Skill name")).toHaveValue("Bloodthirsty");
    await page
      .getByLabel("Why this skill now")
      .fill("I learned to feed first and mourn later.");
  }

  if (await page.getByLabel("Resource name").isVisible().catch(() => false)) {
    await page.getByLabel("Resource name").fill("A trusted resting place");
    await page
      .getByLabel("Why it matters")
      .fill("It sheltered me while I learned to survive outside mortal company.");
    await expect(page.getByLabel("Stationary")).toBeChecked();
  }

  const chronicleId = page.url().match(/\/chronicles\/([^/]+)\//)?.[1];

  if (chronicleId) {
    await expect
      .poll(
        async () =>
          page.evaluate(
            (id) => window.localStorage.getItem(`tyov.prompt.${id}`),
            chronicleId,
          ),
        {
          timeout: 10_000,
        },
      )
      .toContain(options.playerEntry);
  }

  if (options.overflowMode) {
    await expect(page.getByRole("heading", { name: "The mind is full." })).toBeVisible();

    if (options.overflowMode === "move-to-diary") {
      await page
        .getByRole("radio", { name: /Move one memory into/i })
        .check();
    } else {
      await page
        .getByRole("radio", { name: /Forget one in-mind memory/i })
        .check();
    }

    await page
      .getByRole("radio", {
        name: new RegExp(escapeRegExp(options.overflowChoiceTitle ?? ""), "i"),
      })
      .check();
  }

  const resolveResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/play/resolve") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Set the entry into memory" }).click();
  const resolveResponse = await resolveResponsePromise;

  expect(resolveResponse.ok()).toBeTruthy();
  await expect(page.getByText("The entry has been set into memory.")).toBeVisible();
  await page.getByRole("link", { name: /Continue to prompt/i }).click();
  await expect(page).toHaveURL(/\/chronicles\/.+\/play/);
}

test("mobile return flow supports diary overflow, forgotten memories, and recap resume", async ({
  page,
}) => {
  await signInThroughTestAuth(page);
  await createChronicleThroughSetup(page);

  const firstOverflowTarget = "My vigil by the sickbed";
  const forgottenOverflowTarget = "First consequence kept in mind.";

  await resolvePrompt(page, {
    experienceText: forgottenOverflowTarget,
    playerEntry: "I answered the bells by dragging the sexton into the thawing graveyard.",
  });
  await resolvePrompt(page, {
    experienceText: "Second consequence kept in mind.",
    playerEntry: "I learned how to keep my hunger hidden behind a church door.",
  });
  await resolvePrompt(page, {
    experienceText: "Third consequence kept in mind.",
    playerEntry: "I took the road beyond the village and let my old life fall away.",
  });
  await resolvePrompt(page, {
    experienceText: "Fourth consequence kept in mind.",
    playerEntry: "I counted the names I could still say before dawn took them.",
  });

  await expect(page.getByText("5 memories held in mind")).toBeVisible();
  await resolvePrompt(page, {
    experienceText: "Fifth consequence kept in mind.",
    overflowChoiceTitle: firstOverflowTarget,
    overflowMode: "move-to-diary",
    playerEntry: "I needed the diary before the oldest vigil could vanish entirely.",
  });

  await expect(page.getByText("Diary 1 of 4 memories")).toBeVisible();

  const diaryArchiveUrl = page.url().replace("/play", "/archive");
  await page.goto(diaryArchiveUrl);
  await expect(page.getByRole("heading", { name: "The Diary" })).toBeVisible();
  await expect(page.getByText("1 of 4 memories sheltered here.")).toBeVisible();
  await expect(page.getByText("A diary has been opened against forgetting.")).toBeVisible();
  await expect(page.getByText("A memory has been placed into the diary.")).toBeVisible();

  await page.goto(diaryArchiveUrl.replace("/archive", "/play"));
  await resolvePrompt(page, {
    experienceText: "Sixth consequence kept in mind.",
    overflowChoiceTitle: forgottenOverflowTarget,
    overflowMode: "forget-existing",
    playerEntry: "I surrendered one consequence so the next one could stay with me.",
  });

  await page.goto(diaryArchiveUrl);
  await expect(page.getByText("An old memory has been surrendered to the dark.")).toBeVisible();
  await expect(
    page.getByText("Given over to forgetting", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: forgottenOverflowTarget }),
  ).toBeVisible();

  await page.goto("/chronicles");
  await page.getByRole("link", { name: "Resume the last active chronicle" }).click();

  await expect(page).toHaveURL(/\/chronicles\/.+\/recap/);
  await expect(page.getByText("Session recap")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Long Night" })).toBeVisible();
  await page.getByRole("link", { name: "Resume the current prompt" }).click();

  await expect(page).toHaveURL(/\/chronicles\/.+\/play/);
  await expect(page.getByRole("heading", { name: "Prompt 19" })).toBeVisible();
});
