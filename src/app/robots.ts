import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/auth/redirects";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth", "/chronicles", "/sign-in"],
    },
    sitemap: new URL("/sitemap.xml", resolveSiteUrl()).toString(),
  };
}
