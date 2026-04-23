import { expect, test } from "@playwright/test";

async function expectVisibleFocus(
  locator: Parameters<typeof expect>[0],
  expectation: "default" | "forced-colors" | "nocturne" = "default",
) {
  const styles = await locator.evaluate((element) => {
    const computedStyles = window.getComputedStyle(element);

    return {
      boxShadow: computedStyles.boxShadow,
      outlineColor: computedStyles.outlineColor,
      outlineStyle: computedStyles.outlineStyle,
      outlineWidth: computedStyles.outlineWidth,
    };
  });

  if (expectation === "forced-colors") {
    expect(styles.outlineStyle).not.toBe("none");
    expect(styles.outlineWidth).not.toBe("0px");
    expect(styles.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    return;
  }

  if (expectation === "default") {
    expect(
      styles.boxShadow !== "none" ||
        (styles.outlineStyle !== "none" && styles.outlineWidth !== "0px"),
    ).toBeTruthy();
    return;
  }

  expect(styles.boxShadow).toContain("228, 221, 211");
  expect(styles.outlineColor).toBe("rgb(251, 248, 244)");
}

test("keyboard navigation and visible focus work across the core beta routes", async ({
  page,
}) => {
  const resetResponse = await page.request.post("/api/internal/e2e/reset");
  expect(resetResponse.status()).toBe(204);

  await page.goto("/");
  await page.keyboard.press("Tab");
  const beginChronicleLink = page.getByRole("link", {
    name: "Begin the Chronicle",
  });
  await expect(beginChronicleLink).toBeFocused();
  await expectVisibleFocus(beginChronicleLink, "nocturne");

  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(beginChronicleLink).toBeFocused();
  await expectVisibleFocus(beginChronicleLink, "forced-colors");

  await page.emulateMedia({ forcedColors: "none" });

  await page.goto("/sign-in");
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  expect(await page.getByLabel("Testing email address").isVisible()).toBeTruthy();

  await page.getByLabel("Testing email address").fill("e2e@example.com");
  await page.getByLabel("Testing password").fill("nightfall");
  await page
    .getByRole("button", { name: "Enter Through Test Sign-In" })
    .click();
  await expect(page).toHaveURL("/chronicles");

  await page.keyboard.press("Tab");
  const chronicleTitle = page.getByRole("textbox", { name: /title/i });
  await expect(chronicleTitle).toBeFocused();
  await expectVisibleFocus(chronicleTitle);
});
