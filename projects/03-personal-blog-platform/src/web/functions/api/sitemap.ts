import type { Env } from "../_types";

const SITE_URL = "https://blog.buclaw.org";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const result = await env.BLOG_DB.prepare(
    `SELECT slug, updated_at, published_at
     FROM posts
     WHERE status = 'published'
     ORDER BY published_at DESC`,
  ).all<{ slug: string; updated_at: string | null; published_at: string }>();

  // 靜態頁面
  const staticUrls = [{ loc: SITE_URL, changefreq: "daily", priority: "1.0" }];

  const staticItems = staticUrls
    .map(
      (p) => `
  <url>
    <loc>${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
    )
    .join("");

  const postItems = result.results
    .map((post) => {
      const lastmod = (post.updated_at ?? post.published_at).split("T")[0];
      return `
  <url>
    <loc>${SITE_URL}/posts/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticItems}
${postItems}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
