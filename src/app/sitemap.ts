import type { MetadataRoute } from "next";

import { resolveSiteUrl } from "@/lib/auth/redirects";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: resolveSiteUrl(),
    },
  ];
}
