import { expect, test } from "@playwright/test";

test("sign-in to first resolved prompt stays inside the ritual flow", async ({
  page,
}) => {
  await page.goto("/sign-in");

  await expect(
    page.getByRole("heading", {
      name: "We will send a private link to the address you choose.",
    }),
  ).toBeVisible();

  await page.getByLabel("Testing email address").fill("e2e@example.com");
  await page.getByLabel("Testing password").fill("nightfall");
  await page
    .getByRole("button", { name: "Enter Through Test Sign-In" })
    .click();

  await expect(page).toHaveURL("/chronicles");
  await page.waitForLoadState("networkidle");
  await expect
    .poll(async () => {
      const cookies = await page.context().cookies();

      return cookies.find(({ name }) => name === "tyov-e2e-auth")?.value;
    })
    .toBe("1");
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
  await expect(
    page.getByRole("heading", {
      name: "Name what you can still carry into the night.",
    }),
  ).toBeVisible();

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
  await expect(
    page.getByRole("heading", {
      name: "Record who stood beside you, and who changed you.",
    }),
  ).toBeVisible();

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
  await expect(
    page.getByRole("heading", {
      name: "Write the mark the night left upon you.",
    }),
  ).toBeVisible();

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
  await expect(
    page.getByRole("heading", {
      name: "Gather the first memory fragments you refuse to lose.",
    }),
  ).toBeVisible();

  await page.getByLabel("First memory title").fill("My vigil by the sickbed");
  const firstMemoryEntry = page.getByLabel("First memory entry");
  await firstMemoryEntry.fill(
    "I kept watch outside the sickroom and learned patience.",
  );
  await expect(firstMemoryEntry).toHaveValue(
    "I kept watch outside the sickroom and learned patience.",
  );
  await firstMemoryEntry.press("Tab");
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

  await page.waitForURL(/\/chronicles\/.+\/play/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", {
      name: "Prompt 1",
    }),
  ).toBeVisible();

  await page
    .getByLabel("Player entry")
    .fill(
      "I answered the bells by dragging the sexton into the thawing graveyard.",
    );
  await page
    .getByLabel("Experience text")
    .fill(
      "I left the chapel with blood under my nails and a prayer I could not finish.",
    );
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
      .toContain("I answered the bells by dragging the sexton into the thawing graveyard.");
  }
  const resolveResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/play/resolve") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Set the entry into memory" })
    .click();
  const resolveResponse = await resolveResponsePromise;

  expect(resolveResponse.ok()).toBeTruthy();

  await expect(
    page.getByText("The entry has been set into memory."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue to prompt 4" }),
  ).toBeVisible();
});
