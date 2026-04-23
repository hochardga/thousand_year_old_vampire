import { expect, test } from "@playwright/test";

test("keyboard navigation and visible focus work across the core beta routes", async ({
  page,
}) => {
  const resetResponse = await page.request.post("/api/internal/e2e/reset");
  expect(resetResponse.status()).toBe(204);

  await page.request.post("/__nextjs_devtools_config", {
    data: { disableDevIndicator: true },
  });

  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Begin the Chronicle" }),
  ).toBeFocused();

  await page.goto("/sign-in");
  await expect(page.getByLabel("Email address")).toBeVisible();

  await page.getByLabel("Testing email address").fill("e2e@example.com");
  await page.getByLabel("Testing password").fill("nightfall");
  await page
    .getByRole("button", { name: "Enter Through Test Sign-In" })
    .click();
  await expect(page).toHaveURL("/chronicles");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: /title/i })).toBeFocused();
});
