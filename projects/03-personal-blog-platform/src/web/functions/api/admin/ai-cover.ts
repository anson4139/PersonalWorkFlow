import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import {
  createImageJob,
  enqueueImageJob,
  processImageJobById,
} from "./_ai-image-jobs";
import { json, requireAdmin } from "./_auth";

// CF AI Gateway proxies requests through US nodes → bypasses OpenAI HK block
const OPENAI_BASE =
  "https://gateway.ai.cloudflare.com/v1/febfc538b58e0a5c56a0edbaa3a221bd/blog-openai-gw/openai";
const OPENAI_CHAT_URL = `${OPENAI_BASE}/chat/completions`;
const GPT_PROMPT_BUDGET_MS = 2500;

// ── 封面風格靜態 Prompt（fallback） ───────────────────────────────────
const COVER_STYLE_PROMPTS: Record<string, (title: string) => string> = {
  "1": (t) =>
    `Corporate business presentation cover art about "${t}". Minimalist white and dark navy layout, elegant sans-serif typography zones, subtle geometric grid lines, professional consulting aesthetic, no readable text, photorealistic render`,
  "2": (t) =>
    `Bold editorial news magazine cover about "${t}". Dramatic high-contrast photography style, strong visual focal point, dynamic composition, news media aesthetic, dark vignette edges, no readable text`,
  "3": (t) =>
    `Bloomberg terminal trading dashboard visualization about "${t}". Dark background with glowing green data streams, financial candlestick charts, matrix digital display, cyberpunk finance atmosphere, no readable text`,
  "4": (t) =>
    `Clean minimalist knowledge card illustration about "${t}". Soft gradient pastel background, flat geometric icons, modern educational infographic style, gentle rounded shapes, mobile-friendly layout, no readable text`,
  "5": (t) =>
    `Comic-style explainer illustration about "${t}". Colorful cartoon characters debating and pointing, speech bubble shapes (empty), flat design, vibrant bold colors, playful storytelling composition, no readable text`,
  "6": (t) =>
    `Dramatic newspaper broadsheet front page editorial photograph about "${t}". Black and white high-contrast photojournalism style, strong architectural composition, vintage broadsheet layout zones, no readable text`,
};

// ── Meta-spec per cover style（給 GPT 生 context-aware prompt 用）──
const COVER_STYLE_SPECS: Record<string, string> = {
  "1": "Corporate consulting presentation aesthetic. Minimalist composition, white and dark navy palette, geometric grid lines, data visualization elements, professional authoritative mood. No readable text.",
  "2": "Bold editorial news magazine cover. High-contrast dramatic photography style, strong single focal point, dynamic asymmetric composition, dark vignette edges. Urgent, impactful mood. No readable text.",
  "3": "Bloomberg terminal / trading floor visualization. Dark background with glowing cyan or green data streams, candlestick charts, digital matrix displays. Cyberpunk finance atmosphere. No readable text.",
  "4": "Clean knowledge card illustration. Soft pastel gradient background, flat geometric icons, modern educational infographic layout. Calm, friendly, approachable mood. No readable text.",
  "5": "Comic-style explainer scene. Colorful cartoon characters interacting, empty speech bubbles, flat bold vector design, vibrant primary colors. Playful energetic storytelling composition. No readable text.",
  "6": "Vintage newspaper broadsheet editorial photograph. Black and white or sepia tone, high-contrast photojournalism, strong architectural or human-interest composition. Gravitas, historical weight. No readable text.",
};

async function buildImagePromptViaGpt(
  apiKey: string,
  title: string,
  excerpt: string,
  styleSpec: string,
  timeoutMs: number,
): Promise<string | null> {
  try {
    const res = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        max_completion_tokens: 350,
        messages: [
          {
            role: "system",
            content:
              "You are an expert image prompt engineer for gpt-image-2. Generate a detailed English image prompt (120-180 words) that visually represents the article in the specified style. Describe composition, lighting, color palette, key visual metaphors extracted from the topic, and mood. Do NOT include readable text or typography. Return ONLY the prompt text, no explanation.",
          },
          {
            role: "user",
            content: `Title: ${title}\nSummary: ${excerpt.slice(0, 150)}\nStyle: ${styleSpec}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

// POST /api/admin/ai-cover
// body: { post_id, title, excerpt, cover_style }
// Stage 2：生成封面圖並更新 D1 posts.cover_url
export async function onRequestPost(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;

  if (!env.OPENAI_API_KEY) {
    return json({ error: "OPENAI_API_KEY not configured" }, 503);
  }

  const body = (await request.json()) as {
    post_id?: number;
    title?: string;
    excerpt?: string;
    cover_style?: string;
  };

  const postId = body.post_id;
  const title = body.title?.trim() ?? "";
  const excerpt = body.excerpt?.trim() ?? "";
  const coverStyleKey = body.cover_style ?? "2";

  if (!postId || !title) {
    return json({ error: "post_id and title required" }, 400);
  }

  console.log(`[ai-cover] START post_id=${postId} coverStyle=${coverStyleKey}`);

  const styleSpec = COVER_STYLE_SPECS[coverStyleKey] ?? COVER_STYLE_SPECS["2"];
  const staticPromptFn =
    COVER_STYLE_PROMPTS[coverStyleKey] ?? COVER_STYLE_PROMPTS["2"];
  const gptPrompt = await buildImagePromptViaGpt(
    env.OPENAI_API_KEY,
    title,
    excerpt,
    styleSpec,
    GPT_PROMPT_BUDGET_MS,
  );
  const imgPrompt = gptPrompt ?? staticPromptFn(title);

  console.log(
    `[ai-cover] prompt src=${gptPrompt ? "gpt" : "static"} len=${imgPrompt.length}`,
  );

  const jobId = await createImageJob({
    env,
    kind: "cover",
    postId,
    payload: {
      title,
      img_prompt: imgPrompt,
      cover_style: coverStyleKey,
      r2_available: !!env.BLOG_IMAGES,
    },
  });
  const enqueued = await enqueueImageJob(env, jobId);
  if (!enqueued) {
    ctx.waitUntil(
      processImageJobById(env, jobId).catch((error) => {
        console.error(
          `[ai-cover] background fallback failed: ${String(error)}`,
        );
      }),
    );
  }

  console.log(`[ai-cover] QUEUED job_id=${jobId} queue=${enqueued}`);

  return json({
    post_id: postId,
    job_id: jobId,
    status: "queued",
    queued: true,
    queue_available: enqueued,
    cover_url: null,
    img_error: null,
    r2_available: !!env.BLOG_IMAGES,
    img_prompt: imgPrompt,
  });
}
