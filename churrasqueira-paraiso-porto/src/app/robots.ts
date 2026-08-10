import type { MetadataRoute } from "next";

const baseUrl = "https://churrasqueira-paraiso-porto.example.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
