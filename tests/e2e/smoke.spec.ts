import { expect, test } from "@playwright/test";

test("landing page renders and protected routes redirect to sign-in", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Enter the vampire's life before the rules get in the way.",
    }),
  ).toBeVisible();

  await page.goto("/chronicles");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fchronicles$/);
  await expect(
    page.getByRole("heading", {
      name: "We will send a private link to the address you choose.",
    }),
  ).toBeVisible();
});
