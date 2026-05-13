import type { Env } from "../_types";

export const onRequest: PagesFunction<Env> = async ({
  request,
  env,
  params,
}) => {
  if (!env.BLOG_IMAGES) {
    return new Response("R2 not configured", { status: 503 });
  }

  const path = (params.path as string[]).join("/");
  if (!path) {
    return new Response("Not found", { status: 404 });
  }

  const object = await env.BLOG_IMAGES.get(path);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
};
