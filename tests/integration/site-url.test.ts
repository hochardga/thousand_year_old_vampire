import * as authRedirects from "@/lib/auth/redirects";

describe("resolveSiteUrl", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }

    if (originalVercelUrl === undefined) {
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
    } else {
      process.env.NEXT_PUBLIC_VERCEL_URL = originalVercelUrl;
    }
  });

  it("prefers the configured production site URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "vampire.vercel.app";
    process.env.NEXT_PUBLIC_VERCEL_URL = "preview.vercel.app";

    expect(authRedirects.resolveSiteUrl).toBeTypeOf("function");

    if (typeof authRedirects.resolveSiteUrl !== "function") {
      return;
    }

    expect(authRedirects.resolveSiteUrl()).toBe("https://vampire.vercel.app/");
  });

  it("falls back to the active Vercel preview URL", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_VERCEL_URL = "preview.vercel.app";

    expect(authRedirects.resolveSiteUrl).toBeTypeOf("function");

    if (typeof authRedirects.resolveSiteUrl !== "function") {
      return;
    }

    expect(authRedirects.resolveSiteUrl()).toBe("https://preview.vercel.app/");
  });

  it("falls back to localhost for local development", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;

    expect(authRedirects.resolveSiteUrl).toBeTypeOf("function");

    if (typeof authRedirects.resolveSiteUrl !== "function") {
      return;
    }

    expect(authRedirects.resolveSiteUrl()).toBe("http://localhost:3000/");
  });
});
