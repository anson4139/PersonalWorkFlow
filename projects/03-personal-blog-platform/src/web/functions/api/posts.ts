import type { Env } from "../_types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

interface PostRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_url: string | null;
  status: string;
  published_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const perPage = Math.min(
    parseInt(url.searchParams.get("per_page") ?? "6"),
    20,
  );
  const category = url.searchParams.get("category");
  const tag = url.searchParams.get("tag");
  const q = url.searchParams.get("q");

  const offset = (page - 1) * perPage;

  let sql = `
    SELECT p.id, p.title, p.slug, p.excerpt, p.cover_url, p.status, p.published_at
    FROM posts p
    WHERE p.status = 'published'
  `;
  const bindings: (string | number)[] = [];

  if (category) {
    if (category === "uncategorized") {
      sql += ` AND NOT EXISTS (
        SELECT 1 FROM post_categories pc WHERE pc.post_id = p.id
      )`;
    } else {
      sql += ` AND EXISTS (
        SELECT 1 FROM post_categories pc
        JOIN categories c ON c.id = pc.category_id
        WHERE pc.post_id = p.id AND c.slug = ?
      )`;
      bindings.push(category);
    }
  }

  if (tag) {
    sql += ` AND EXISTS (
      SELECT 1 FROM post_tags pt
      JOIN tags t ON t.id = pt.tag_id
      WHERE pt.post_id = p.id AND t.slug = ?
    )`;
    bindings.push(tag);
  }

  if (q) {
    sql += ` AND (p.title LIKE ? OR p.excerpt LIKE ?)`;
    bindings.push(`%${q}%`, `%${q}%`);
  }

  sql += ` ORDER BY p.published_at DESC`;

  // Count
  const countSql = sql.replace(
    "SELECT p.id, p.title, p.slug, p.excerpt, p.cover_url, p.status, p.published_at",
    "SELECT COUNT(*) as total",
  );

  // Paginated
  const pageSql = sql + ` LIMIT ? OFFSET ?`;
  const pageBindings = [...bindings, perPage, offset];

  const [countResult, postsResult] = await Promise.all([
    env.BLOG_DB.prepare(countSql)
      .bind(...bindings)
      .first<{ total: number }>(),
    env.BLOG_DB.prepare(pageSql)
      .bind(...pageBindings)
      .all<PostRow>(),
  ]);

  const total = countResult?.total ?? 0;
  const posts = postsResult.results;

  // Fetch categories and tags for each post
  const postIds = posts.map((p) => p.id);
  if (postIds.length === 0) {
    return Response.json(
      { posts: [], total, page, per_page: perPage },
      { headers: CORS_HEADERS },
    );
  }

  const placeholders = postIds.map(() => "?").join(",");

  const [categoriesResult, tagsResult] = await Promise.all([
    env.BLOG_DB.prepare(
      `
      SELECT pc.post_id, c.id, c.name, c.slug
      FROM post_categories pc JOIN categories c ON c.id = pc.category_id
      WHERE pc.post_id IN (${placeholders})
    `,
    )
      .bind(...postIds)
      .all<{ post_id: number; id: number; name: string; slug: string }>(),
    env.BLOG_DB.prepare(
      `
      SELECT pt.post_id, t.id, t.name, t.slug
      FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
      WHERE pt.post_id IN (${placeholders})
    `,
    )
      .bind(...postIds)
      .all<{ post_id: number; id: number; name: string; slug: string }>(),
  ]);

  const catMap = new Map<
    number,
    { id: number; name: string; slug: string }[]
  >();
  const tagMap = new Map<
    number,
    { id: number; name: string; slug: string }[]
  >();

  for (const row of categoriesResult.results) {
    if (!catMap.has(row.post_id)) catMap.set(row.post_id, []);
    catMap
      .get(row.post_id)!
      .push({ id: row.id, name: row.name, slug: row.slug });
  }
  for (const row of tagsResult.results) {
    if (!tagMap.has(row.post_id)) tagMap.set(row.post_id, []);
    tagMap
      .get(row.post_id)!
      .push({ id: row.id, name: row.name, slug: row.slug });
  }

  const enriched = posts.map((p) => ({
    ...p,
    categories: catMap.get(p.id) ?? [],
    tags: tagMap.get(p.id) ?? [],
  }));

  return Response.json(
    { posts: enriched, total, page, per_page: perPage },
    { headers: CORS_HEADERS },
  );
};
