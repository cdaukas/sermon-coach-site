import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog/posts";

const BASE = "https://sermoncoach.com";

/**
 * Posts are read off the filesystem, which is only available at build time.
 * The sitemap is static by default; this makes that explicit so a stray
 * request-time API can never turn it into a runtime read.
 */
export const dynamic = "force-static";

/**
 * Marketing pages keep the .html extension because next.config.ts 301s the
 * extensionless form to it — the .html URL is the canonical one.
 *
 * lastModified is deliberately omitted here. These pages are hand-edited and
 * git checkouts do not preserve edit times, so anything we could compute would
 * just be the build timestamp. Claiming every page changed on every deploy
 * teaches crawlers to ignore lastmod, including on the posts where it is real.
 */
const STATIC_PAGES = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/sketch", priority: 0.9, changeFrequency: "monthly" },
  { path: "/pricing.html", priority: 0.9, changeFrequency: "monthly" },
  { path: "/how-its-scored.html", priority: 0.8, changeFrequency: "monthly" },
  { path: "/sample-evaluation", priority: 0.8, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/sample-sketch", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq.html", priority: 0.7, changeFrequency: "monthly" },
  { path: "/story.html", priority: 0.7, changeFrequency: "yearly" },
  { path: "/privacy.html", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms.html", priority: 0.3, changeFrequency: "yearly" },
] as const satisfies ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
}>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  return [
    ...STATIC_PAGES.map((page) => ({
      url: `${BASE}${page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...posts.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      ...(post.date ? { lastModified: post.date } : {}),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
