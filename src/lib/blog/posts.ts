import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Blog posts are authored as static HTML in public/blog and listed by hand
 * in public/blog/index.html. There is no CMS. Slugs come from the post
 * files so a new .html appears in the sitemap the day it ships. Dates live
 * only in the index markup (`<time datetime>`), so lastmod is taken from
 * there and omitted when a file has not been listed yet. Guessing today
 * would train crawlers to ignore the field.
 */

const BLOG_DIR = path.join(process.cwd(), "public", "blog");

/** The index page and the authoring template are not posts. */
const NON_POST_FILES = new Set(["index.html", "_template.html"]);

export type BlogPost = {
  slug: string;
  /** YYYY-MM-DD from the blog index, absent when the post is not listed. */
  date?: string;
};

async function datesFromIndex(): Promise<Map<string, string>> {
  const html = await readFile(path.join(BLOG_DIR, "index.html"), "utf8");
  const dates = new Map<string, string>();

  const featured = html.match(
    /<a class="featured-card" href="\/blog\/([^"]+)">[\s\S]*?<time[^>]*datetime="(\d{4}-\d{2}-\d{2})"/,
  );
  if (featured) dates.set(featured[1], featured[2]);

  const archiveRow =
    /<article class="archive-row">[\s\S]*?<time[^>]*datetime="(\d{4}-\d{2}-\d{2})"[\s\S]*?href="\/blog\/([^"]+)"/g;
  for (const match of html.matchAll(archiveRow)) {
    dates.set(match[2], match[1]);
  }

  return dates;
}

/** Every published post file, newest-dated first. Undated files sort last. */
export async function getAllPosts(): Promise<BlogPost[]> {
  const [fileNames, dates] = await Promise.all([
    readdir(BLOG_DIR),
    datesFromIndex(),
  ]);

  return fileNames
    .filter((name) => name.endsWith(".html") && !NON_POST_FILES.has(name))
    .map((name) => {
      const slug = name.replace(/\.html$/, "");
      return { slug, date: dates.get(slug) };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
