import type { MetadataRoute } from "next";
import { movies } from "@/data/movies";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  return [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/movies`, changeFrequency: "daily", priority: 0.9 },
    ...movies.map((movie) => ({
      url: `${baseUrl}/movies/${movie.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
