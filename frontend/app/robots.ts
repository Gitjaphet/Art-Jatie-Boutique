import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/panier", "/api/", "/admin/"],
    },
    sitemap: "https://www.artjatie.com/sitemap.xml",
  };
}