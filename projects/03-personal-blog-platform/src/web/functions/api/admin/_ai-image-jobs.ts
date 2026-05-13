import type { Env } from "../../_types";

const OPENAI_IMG_URL = "https://api.openai.com/v1/images/generations";
const COVER_IMAGE_MODEL = "gpt-image-2";
const COVER_IMAGE_SIZE = "1024x1024";
const COVER_OUTPUT_FORMAT = "webp";
const COVER_PROMPT_MAX_LEN = 650;
const COVER_RENDER_TIMEOUT_MS = 90000;
const ILLUSTRATE_IMAGE_SIZE = "1024x1024";
const ILLUSTRATE_RENDER_TIMEOUT_MS = 90000;
const FAST_IMAGE_PROMPT_MAX_LEN = 650;

export type AiImageJobKind = "cover" | "illustration";
export type AiImageJobStatus = "queued" | "processing" | "ready" | "failed";

export interface CoverJobPayload {
  title: string;
  img_prompt: string;
  cover_style: string;
  r2_available: boolean;
}

export interface IllustrationJobPayload {
  title: string;
  img_prompt: string;
  prompt_src: string;
}

export type AiImageJobPayload = CoverJobPayload | IllustrationJobPayload;

export interface AiImageJobRow {
  id: string;
  kind: AiImageJobKind;
  post_id: number;
  status: AiImageJobStatus;
  payload: string;
  result_url: string | null;
  error_message: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export function publicJob(row: AiImageJobRow) {
  return {
    job_id: row.id,
    kind: row.kind,
    post_id: row.post_id,
    status: row.status,
    image_url: row.result_url,
    error: row.error_message,
    attempts: row.attempts,
    created_at: row.created_at,
    updated_at: row.updated_at,
    started_at: row.started_at,
    finished_at: row.finished_at,
  };
}

export async function createImageJob(args: {
  env: Env;
  kind: AiImageJobKind;
  postId: number;
  payload: AiImageJobPayload;
}) {
  const jobId = crypto.randomUUID();
  await args.env.BLOG_DB.prepare(
    `INSERT INTO ai_image_jobs (id, kind, post_id, status, payload)
     VALUES (?, ?, ?, 'queued', ?)`,
  )
    .bind(jobId, args.kind, args.postId, JSON.stringify(args.payload))
    .run();
  return jobId;
}

export async function enqueueImageJob(env: Env, jobId: string) {
  if (!env.AI_IMAGE_QUEUE) return false;
  await env.AI_IMAGE_QUEUE.send({ job_id: jobId });
  return true;
}

export async function getImageJob(env: Env, jobId: string) {
  return env.BLOG_DB.prepare("SELECT * FROM ai_image_jobs WHERE id = ?")
    .bind(jobId)
    .first<AiImageJobRow>();
}

export async function getLatestImageJob(
  env: Env,
  postId: number,
  kind: AiImageJobKind,
) {
  return env.BLOG_DB.prepare(
    `SELECT * FROM ai_image_jobs
     WHERE post_id = ? AND kind = ?
     ORDER BY created_at DESC
     LIMIT 1`,
  )
    .bind(postId, kind)
    .first<AiImageJobRow>();
}

export function extractIllustrationUrl(content: string): string | null {
  const match = content.match(
    /<figure class="post-illustration">[\s\S]*?<img src="([^"]+)"/i,
  );
  return match?.[1] ?? null;
}

export async function processImageJobById(env: Env, jobId: string) {
  const row = await getImageJob(env, jobId);
  if (!row) throw new Error(`AI image job not found: ${jobId}`);
  if (row.status === "ready") return row.result_url;
  if (row.status === "processing" && row.started_at) return row.result_url;

  await markProcessing(env, jobId);
  try {
    const payload = JSON.parse(row.payload) as AiImageJobPayload;
    const imageUrl =
      row.kind === "cover"
        ? await renderCover(env, row.post_id, payload as CoverJobPayload)
        : await renderIllustration(
            env,
            row.post_id,
            payload as IllustrationJobPayload,
          );
    await markReady(env, jobId, imageUrl);
    return imageUrl;
  } catch (error) {
    const message = String(error);
    await markFailed(env, jobId, message);
    throw error;
  }
}

async function markProcessing(env: Env, jobId: string) {
  await env.BLOG_DB.prepare(
    `UPDATE ai_image_jobs
     SET status = 'processing', attempts = attempts + 1,
         started_at = COALESCE(started_at, datetime('now')),
         updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(jobId)
    .run();
}

async function markReady(env: Env, jobId: string, imageUrl: string) {
  await env.BLOG_DB.prepare(
    `UPDATE ai_image_jobs
     SET status = 'ready', result_url = ?, error_message = NULL,
         updated_at = datetime('now'), finished_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(imageUrl, jobId)
    .run();
}

async function markFailed(env: Env, jobId: string, message: string) {
  await env.BLOG_DB.prepare(
    `UPDATE ai_image_jobs
     SET status = 'failed', error_message = ?,
         updated_at = datetime('now'), finished_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(message.slice(0, 2000), jobId)
    .run();
}

async function renderCover(env: Env, postId: number, payload: CoverJobPayload) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

  const imgRes = await fetch(OPENAI_IMG_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: COVER_IMAGE_MODEL,
      prompt: payload.img_prompt.slice(0, COVER_PROMPT_MAX_LEN),
      n: 1,
      size: COVER_IMAGE_SIZE,
      quality: "low",
      output_format: COVER_OUTPUT_FORMAT,
    }),
    signal: AbortSignal.timeout(COVER_RENDER_TIMEOUT_MS),
  });

  if (!imgRes.ok) {
    const errText = await imgRes.text();
    throw new Error(`Image API: HTTP ${imgRes.status}: ${errText}`);
  }

  const imageUrl = await persistImage(env, await imgRes.json(), "covers");
  await env.BLOG_DB.prepare("UPDATE posts SET cover_url = ? WHERE id = ?")
    .bind(imageUrl, postId)
    .run();
  return imageUrl;
}

async function renderIllustration(
  env: Env,
  postId: number,
  payload: IllustrationJobPayload,
) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

  const postRow = await env.BLOG_DB.prepare(
    "SELECT content FROM posts WHERE id = ?",
  )
    .bind(postId)
    .first<{ content: string }>();

  if (!postRow) throw new Error("post not found");
  const existingUrl = extractIllustrationUrl(postRow.content);
  if (existingUrl) return existingUrl;

  const imgRes = await fetch(OPENAI_IMG_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(ILLUSTRATE_RENDER_TIMEOUT_MS),
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt: payload.img_prompt.slice(0, FAST_IMAGE_PROMPT_MAX_LEN),
      n: 1,
      size: ILLUSTRATE_IMAGE_SIZE,
      quality: "low",
      output_format: "webp",
    }),
  });

  if (!imgRes.ok) {
    const errText = await imgRes.text();
    throw new Error(`Image API: HTTP ${imgRes.status}: ${errText}`);
  }

  const imageUrl = await persistImage(
    env,
    await imgRes.json(),
    "illustrations",
  );
  const figureHtml = `\n<figure class="post-illustration"><img src="${imageUrl}" alt="${payload.title} 解析圖" loading="lazy" /><figcaption>${payload.title} — AI 生成解析圖</figcaption></figure>`;
  await env.BLOG_DB.prepare(
    "UPDATE posts SET content = ?, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(postRow.content + figureHtml, postId)
    .run();
  return imageUrl;
}

async function persistImage(env: Env, responseData: unknown, folder: string) {
  const imgData = responseData as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const imageItem = imgData.data?.[0];
  if (!imageItem) throw new Error("No image returned from API");

  if (imageItem.b64_json && env.BLOG_IMAGES) {
    const binaryStr = atob(imageItem.b64_json);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i += 1) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const imgKey = `${folder}/${Date.now()}.webp`;
    await env.BLOG_IMAGES.put(imgKey, bytes.buffer, {
      httpMetadata: { contentType: "image/webp" },
    });
    return `/images/${imgKey}`;
  }

  if (imageItem.url) return imageItem.url;
  throw new Error("image item has neither b64_json nor url");
}
