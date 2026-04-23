import { describe, expect, it } from "vitest";
import { metadata } from "@/app/(marketing)/layout";
import { resolveSiteUrl } from "@/lib/auth/redirects";

describe("marketing metadata", () => {
  it("exports the core marketing SEO payload", () => {
    expect(metadata).toMatchObject({
      title: "Thousand Year Old Vampire: Digital Edition",
      description: "A guided digital ritual for a solitary gothic life. Private beta.",
      openGraph: {
        title: "Thousand Year Old Vampire: Digital Edition",
        description: "A guided digital ritual for a solitary gothic life. Private beta.",
        images: ["/og/tyov-beta-card.png"],
      },
    });
  });

  it("returns a sitemap with only the public marketing route", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const entries = await sitemap();

    expect(entries).toHaveLength(1);
    expect(entries[0]?.url).toBe(resolveSiteUrl());
  });

  it("disallows indexing authenticated routes", async () => {
    const robots = (await import("@/app/robots")).default;
    const rules = await robots();

    expect(rules.sitemap).toBe(new URL("/sitemap.xml", resolveSiteUrl()).toString());
    expect(rules.rules).toEqual(
      expect.objectContaining({
        disallow: expect.arrayContaining(["/auth", "/chronicles", "/sign-in"]),
      }),
    );
  });
});
