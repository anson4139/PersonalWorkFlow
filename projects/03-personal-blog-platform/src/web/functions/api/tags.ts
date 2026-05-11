import type { Env } from "../_types";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const result = await env.BLOG_DB.prepare(
    `
    SELECT id, name, slug FROM tags ORDER BY name ASC
  `,
  ).all<{ id: number; name: string; slug: string }>();

  return Response.json(result.results);
};
