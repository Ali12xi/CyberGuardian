import type { MetadataRoute } from "next";

const BASE_URL = "https://www.cybergurdianai.com";

const LOCALES = ["en", "ar"] as const;

const ROUTES: {
  path: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly";
}[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/about", priority: 0.8, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: `${BASE_URL}/${locale}${route.path}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
  );
}
