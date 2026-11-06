import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
