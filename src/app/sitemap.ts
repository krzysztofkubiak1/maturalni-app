import type { MetadataRoute } from "next";
import { courses } from "@/data/courses";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/kursy`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/program`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site.url}/o-nas`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/kontakt`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const coursePages: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${site.url}/kursy/${course.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...coursePages];
}
