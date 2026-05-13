import { json, requireAdmin } from "./_auth";
// POST /api/admin/upload
// Content-Type: multipart/form-data, field "file"
// 回傳 { url: "https://..." }
export async function onRequest(ctx) {
  const { request, env } = ctx;
  const deny = requireAdmin(request, env);
  if (deny) return deny;
  if (request.method !== "POST")
    return json({ error: "Method Not Allowed" }, 405);
  if (!env.BLOG_IMAGES) {
    return json(
      { error: "R2 not configured. Enable R2 bucket in CF Dashboard first." },
      503,
    );
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) return json({ error: "No file provided" }, 400);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const allowed = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  if (!allowed.includes(ext))
    return json({ error: "File type not allowed" }, 400);
  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = await file.arrayBuffer();
  await env.BLOG_IMAGES.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });
  // R2 public URL 需先在 CF Dashboard 啟用「Public Access」
  const siteUrl = "https://blog.buclaw.org";
  const url = `${siteUrl}/images/${key}`;
  return json({ url }, 201);
}
