import type { MetadataRoute } from "next";

import { resolveSiteUrl } from "@/lib/auth/redirects";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: ["/auth", "/chronicles", "/sign-in"],
    },
    sitemap: `${resolveSiteUrl()}sitemap.xml`,
  };
}
