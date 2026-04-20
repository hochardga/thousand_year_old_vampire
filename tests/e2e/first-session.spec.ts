import { expect, test, type BrowserContext, type Page } from "@playwright/test";

async function continueWithMockSession(page: Page, context: BrowserContext) {
  const currentUrl = new URL(page.url());
  const nextPath = currentUrl.searchParams.get("next");

  if (!currentUrl.pathname.startsWith("/sign-in") || !nextPath) {
    return;
  }

  await context.addCookies([
    {
      name: "tyov-e2e-auth",
      url: page.url(),
      value: "1",
    },
  ]);
  await page.goto(nextPath);
}

test("sign-in to first resolved prompt stays inside the ritual flow", async ({
  context,
  page,
}) => {
  await page.goto("/sign-in");

  await expect(
    page.getByRole("heading", {
      name: "We will send a private link to the address you choose.",
    }),
  ).toBeVisible();

  await context.addCookies([
    {
      name: "tyov-e2e-auth",
      url: page.url(),
      value: "1",
    },
  ]);

  await page.goto("/chronicles");
  await page.getByPlaceholder("The Long Night").fill("The Long Night");
  await page.getByRole("button", { name: "Begin a New Chronicle" }).click();
  await continueWithMockSession(page, context);

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
  await page.getByRole("button", { name: "Enter the first prompt" }).click();
  await continueWithMockSession(page, context);

  await expect(page).toHaveURL(/\/chronicles\/.+\/play/);
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
  await page
    .getByRole("button", { name: "Set the entry into memory" })
    .click();

  await expect(
    page.getByText("The entry has been set into memory."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue to prompt 4" }),
  ).toBeVisible();
});
