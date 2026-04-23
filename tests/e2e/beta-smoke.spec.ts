import { expect, test, type Page } from "@playwright/test";

async function resetE2EState(page: Page) {
  const resetResponse = await page.request.post("/api/internal/e2e/reset");
  expect(resetResponse.status()).toBe(204);
}

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

  await page
    .getByLabel("Mortal summary")
    .fill(
      "I had a life of service, habit, and private longing before the night opened.",
    );
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
  await page
    .getByRole("button", { name: "Continue to the next threshold" })
    .click();

  await page.getByLabel("The mark").fill("Unsteady Reflection");
  await page
    .getByLabel("How it shows itself")
    .fill("My reflection trembles before it vanishes.");
  await page
    .getByRole("button", { name: "Continue to the next threshold" })
    .click();

  await page.getByLabel("First memory title").fill("My vigil by the sickbed");
  await page
    .getByLabel("First memory entry")
    .fill("I kept watch outside the sickroom and learned patience.");

  const setupCompletionResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/setup/complete") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Enter the first prompt" }).click();
  const setupCompletionResponse = await setupCompletionResponsePromise;

  expect(setupCompletionResponse.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/chronicles\/.+\/play/, { timeout: 15_000 });
}

test("beta smoke flow covers sign-in, setup, play, archive, recap, and feedback", async ({
  page,
}) => {
  await resetE2EState(page);
  await signInThroughTestAuth(page);
  await createChronicleThroughSetup(page);

  await expect(page.getByRole("heading", { name: "Prompt 1" })).toBeVisible();

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

  const resolveResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/play/resolve") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Set the entry into memory" }).click();
  const resolveResponse = await resolveResponsePromise;

  expect(resolveResponse.ok()).toBeTruthy();
  await expect(page.getByText("The entry has been set into memory.")).toBeVisible();

  const chronicleId = page.url().match(/\/chronicles\/([^/]+)\//)?.[1];
  expect(chronicleId).toBeTruthy();

  await page.goto(`/chronicles/${chronicleId}/archive`);
  await expect(page.getByText("Chronicle archive")).toBeVisible();
  await expect(page.getByRole("heading", { name: "My vigil by the sickbed" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prompt history" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Event timeline" })).toBeVisible();

  await page.goto(`/chronicles/${chronicleId}/recap`);
  await expect(page.getByText("Session recap")).toBeVisible();
  await expect(page.getByRole("link", { name: "Resume the current prompt" })).toBeVisible();
  await page.getByRole("button", { name: "Share beta feedback" }).click();
  await page
    .getByLabel("Your note")
    .fill("The recap carried me forward, and the archive felt easy to trust.");
  await page.getByRole("button", { name: "Send feedback" }).click();
  await expect(page.getByText("Your note has been set down.")).toBeVisible();
});
