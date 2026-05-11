export const onRequestGet = async ({ env }) => {
    const result = await env.BLOG_DB.prepare(`
    SELECT id, name, slug FROM tags ORDER BY name ASC
  `).all();
    return Response.json(result.results);
};
