import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env/public";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/cadet/", "/auth/"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}

