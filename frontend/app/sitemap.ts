import type { MetadataRoute } from "next";
import { getBlogPosts, getProjects } from "../lib/api";
import { SERVICES } from "../lib/constants";

const SITE_URL = "https://banglasketch.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getProjects(), getBlogPosts()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/portfolio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    ...SERVICES.map((service) => ({
      url: `${SITE_URL}/services/${service.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  const projectPages: MetadataRoute.Sitemap = projects
    .filter((project) => project.slug && project.published !== false)
    .map((project) => ({
      url: `${SITE_URL}/portfolio/${project.slug}`,
      lastModified: project.date_completed ? new Date(project.date_completed) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  const postPages: MetadataRoute.Sitemap = posts
    .filter((post) => post.slug && post.published !== false)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.published_date ? new Date(post.published_date) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...projectPages, ...postPages];
}
