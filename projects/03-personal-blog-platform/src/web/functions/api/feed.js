const SITE_URL = "https://blog.buclaw.org";
const SITE_TITLE = "BU AN LA AI — Anson Chiang";
const SITE_DESC =
  "PM \u00d7 SA \u00d7 AI \u2014 Anson Chiang \u7684\u500b\u4eba\u6280\u8853\u90e8\u843d\u683c";
function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
export const onRequestGet = async ({ env }) => {
  const result = await env.BLOG_DB.prepare(
    `SELECT title, slug, excerpt, published_at
     FROM posts
     WHERE status = 'published'
     ORDER BY published_at DESC
     LIMIT 20`,
  ).all();
  const items = result.results
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/posts/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
    </item>`,
    )
    .join("");
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>zh-TW</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/api/feed" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
