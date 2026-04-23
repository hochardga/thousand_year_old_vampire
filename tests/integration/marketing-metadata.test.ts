import { describe, expect, it } from "vitest";

describe("marketing metadata", () => {
  it("returns a sitemap with only the public marketing route", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const entries = await sitemap();

    expect(entries).toHaveLength(1);
    expect(entries[0]?.url).toMatch(/\/$/);
  });

  it("disallows indexing authenticated routes", async () => {
    const robots = (await import("@/app/robots")).default;
    const rules = await robots();

    expect(rules.rules).toEqual(
      expect.objectContaining({
        disallow: expect.arrayContaining(["/auth", "/chronicles", "/sign-in"]),
      }),
    );
  });
});
