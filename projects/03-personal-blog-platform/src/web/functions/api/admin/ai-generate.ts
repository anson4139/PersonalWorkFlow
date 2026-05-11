import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import { json, requireAdmin } from "./_auth";

const STYLES: Record<string, string> = {
  "1": "科普解說",
  "2": "批判分析",
  "3": "職場視角",
  "4": "懶人包",
  "5": "趨勢觀察",
  "6": "技術深潛",
  "7": "故事敘述",
  "8": "問答體",
  "9": "晨報風格",
  "10": "辯論觀點",
};

const STYLE_SYSTEM_PROMPTS: Record<string, string> = {
  "1": "你是一位科普作家，善用類比和故事讓新手秒懂，避免技術術語。",
  "2": "你是一位批判性分析師，深度剖析利弊，提出犀利的懷疑視角。",
  "3": "你是一位資深 PM/SA，聚焦業務影響與實務應用，避免純技術論述。",
  "4": "你擅長寫懶人包，用條列式重點讓讀者 3 分鐘讀完，每點不超過 2 行。",
  "5": "你是市場趨勢分析師，用宏觀產業視角分析，數據佐證。",
  "6": "你是資深工程師，保留所有技術細節，適合工程師讀者。",
  "7": "你善用故事敘述方式帶入，情境化呈現，引發共鳴。",
  "8": "你用 Q&A 格式寫文章，預設讀者問題，逐一解答。",
  "9": "你寫每日簡訊感，精煉重點，語氣簡潔清爽，適合早晨閱讀。",
  "10": "你呈現正反兩方論點並陳，讓讀者自行判斷，辯論觀點式。",
};

interface OpenAIChoice {
  message: { content: string };
}

interface AiArticleResult {
  title: string;
  excerpt: string;
  content_html: string;
  suggested_category: string;
  suggested_tags: string[];
  company_name: string;
  tech_keywords: string[];
}

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

// Meta-spec per cover style — fed to GPT to generate a context-aware image prompt
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
): Promise<string | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
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

// POST /api/admin/ai-generate
// body: { url: string, style: string ("1"~"10"), coverStyle?: string ("1"~"6") }
export async function onRequest(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;
  if (request.method !== "POST")
    return json({ error: "Method Not Allowed" }, 405);

  const body = (await request.json()) as {
    url?: string;
    style?: string;
    manualContent?: string;
    coverStyle?: string;
  };
  const sourceUrl = body.url?.trim();
  const styleKey = body.style ?? "1";
  const manualContent = body.manualContent?.trim();
  const coverStyleKey = body.coverStyle ?? "2";

  console.log(
    `[ai-generate] START url=${sourceUrl} style=${styleKey} coverStyle=${coverStyleKey}`,
  );

  if (!sourceUrl) return json({ error: "url required" }, 400);
  if (!env.OPENAI_API_KEY) {
    console.error("[ai-generate] OPENAI_API_KEY not set");
    return json({ error: "OPENAI_API_KEY not configured" }, 503);
  }

  // 1. 取得原始內容（優先使用手動貼上的內容）
  let rawContent = "";
  if (manualContent && manualContent.length >= 50) {
    rawContent = manualContent.slice(0, 12000);
    console.log(
      `[ai-generate] STEP1 using manual content len=${rawContent.length}`,
    );
  } else {
    try {
      const jinaUrl = `https://r.jina.ai/${sourceUrl}`;
      console.log(`[ai-generate] STEP1 fetching jina: ${jinaUrl}`);
      const res = await fetch(jinaUrl, {
        headers: { Accept: "text/plain", "X-Timeout": "15" },
      });
      rawContent = (await res.text()).slice(0, 12000);
      console.log(
        `[ai-generate] STEP1 jina status=${res.status} content_len=${rawContent.length}`,
      );
    } catch (e) {
      console.error(`[ai-generate] STEP1 jina fetch error: ${String(e)}`);
    }
    if (!rawContent || rawContent.length < 50) {
      rawContent = `請根據以下新聞網址推測文章主題，並撰寫一篇完整的科技新聞文章：\n${sourceUrl}`;
      console.log("[ai-generate] STEP1 using fallback prompt (no content)");
    }
  }

  const styleName = STYLES[styleKey] ?? "科普解說";
  const systemPrompt =
    STYLE_SYSTEM_PROMPTS[styleKey] ?? STYLE_SYSTEM_PROMPTS["1"];

  // 2. gpt-5.5 改寫文章
  let aiResult: AiArticleResult;
  try {
    console.log(`[ai-generate] STEP2 calling gpt-5.5 style="${styleName}"`);
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        max_completion_tokens: 4096,
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\n【重要限制】\n- 文章正文長度：600~900 字（繁體中文），不超過此範圍\n- content_html 使用語義化 HTML（<h2>/<h3>/<p>/<ul>/<li>），禁止 inline style\n- 不要加來源說明、作者備註等與正文無關的段落\n\n以繁體中文輸出。回傳嚴格的 JSON，格式如下（不含 markdown code block）：\n{"title":"文章標題（15字內）","excerpt":"60~80字摘要","content_html":"HTML格式正文","suggested_category":"分類名稱","suggested_tags":["標籤1","標籤2","標籤3"],"company_name":"主要公司（沒有則空字串）","tech_keywords":["關鍵字1","關鍵字2","關鍵字3"]}`,
          },
          {
            role: "user",
            content: `請依照「${styleName}」風格，根據以下原始內容改寫成部落格文章：\n\n---\n${rawContent}\n---\n\n來源 URL：${sourceUrl}`,
          },
        ],
      }),
    });

    console.log(`[ai-generate] STEP2 gpt-5.5 status=${chatRes.status}`);
    if (!chatRes.ok) {
      const err = await chatRes.text();
      console.error(`[ai-generate] STEP2 gpt-5.5 error: ${err}`);
      return json({ error: `OpenAI error: ${err}` }, 502);
    }

    const chatData = (await chatRes.json()) as { choices: OpenAIChoice[] };
    const raw = chatData.choices[0].message.content.trim();
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    aiResult = JSON.parse(cleaned) as AiArticleResult;
    console.log(`[ai-generate] STEP2 parsed OK title="${aiResult.title}"`);
  } catch (e) {
    console.error(`[ai-generate] STEP2 parse error: ${String(e)}`);
    return json({ error: `AI parse error: ${String(e)}` }, 502);
  }

  // 3. gpt-image-2 生成封面圖（org verified，支援多種封面風格）
  let coverUrl: string | null = null;
  let imgError: string | null = null;
  try {
    const styleSpec =
      COVER_STYLE_SPECS[coverStyleKey] ?? COVER_STYLE_SPECS["2"];
    const staticPromptFn =
      COVER_STYLE_PROMPTS[coverStyleKey] ?? COVER_STYLE_PROMPTS["2"];
    const gptPrompt = await buildImagePromptViaGpt(
      env.OPENAI_API_KEY,
      aiResult.title,
      aiResult.excerpt,
      styleSpec,
    );
    const imgPrompt = gptPrompt ?? staticPromptFn(aiResult.title);

    console.log(
      `[ai-generate] STEP3 cover prompt src=${gptPrompt ? "gpt" : "static"} len=${imgPrompt.length} coverStyle=${coverStyleKey} r2=${!!env.BLOG_IMAGES}`,
    );
    const imgRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt: imgPrompt,
        n: 1,
        size: "1536x1024",
        output_format: "png",
      }),
    });

    console.log(`[ai-generate] STEP3 gpt-image-2 status=${imgRes.status}`);
    if (imgRes.status === 403) {
      // org 未驗證 → 自動降級 dall-e-3
      const errText = await imgRes.text();
      console.log(
        `[ai-generate] STEP3 gpt-image-2 403, falling back to dall-e-3. reason=${errText.slice(0, 120)}`,
      );
      const fallbackRes = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: imgPrompt.slice(0, 1000),
            n: 1,
            size: "1792x1024",
            response_format: "url",
          }),
        },
      );
      console.log(
        `[ai-generate] STEP3 dall-e-3 fallback status=${fallbackRes.status}`,
      );
      if (fallbackRes.ok) {
        const fallbackData = (await fallbackRes.json()) as {
          data: Array<{ url?: string }>;
        };
        coverUrl = fallbackData.data[0]?.url ?? null;
        console.log(
          `[ai-generate] STEP3 dall-e-3 fallback url=${coverUrl ? "OK" : "null"}`,
        );
      } else {
        const fbErr = await fallbackRes.text();
        imgError = `gpt-image-2 403, dall-e-3 fallback: ${fbErr}`;
        console.error(`[ai-generate] STEP3 dall-e-3 fallback failed: ${fbErr}`);
      }
    } else if (imgRes.ok) {
      const imgData = (await imgRes.json()) as {
        data: Array<{ b64_json?: string; url?: string }>;
      };
      const imageItem = imgData.data[0];
      console.log(
        `[ai-generate] STEP3 image item keys=${Object.keys(imageItem).join(",")}`,
      );

      if (imageItem.b64_json && env.BLOG_IMAGES) {
        const binaryStr = atob(imageItem.b64_json);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++)
          bytes[i] = binaryStr.charCodeAt(i);
        const imgKey = `covers/${Date.now()}.png`;
        await env.BLOG_IMAGES.put(imgKey, bytes.buffer, {
          httpMetadata: { contentType: "image/png" },
        });
        coverUrl = `/images/${imgKey}`;
        console.log(
          `[ai-generate] STEP3 R2 upload OK key=${imgKey} size=${bytes.length}`,
        );
      } else if (imageItem.url) {
        coverUrl = imageItem.url;
        console.log(`[ai-generate] STEP3 using direct URL (no R2)`);
      } else {
        console.error(
          `[ai-generate] STEP3 image item has neither b64_json nor url`,
        );
      }
    } else {
      const errText = await imgRes.text();
      imgError = `HTTP ${imgRes.status}: ${errText}`;
      console.error(`[ai-generate] STEP3 image failed: ${imgError}`);
    }
  } catch (e) {
    imgError = String(e);
    console.error(`[ai-generate] STEP3 image exception: ${imgError}`);
  }

  // 4. 寫入 D1（草稿）
  const slug =
    aiResult.title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) +
    "-" +
    Date.now().toString(36);

  // Prepend source URL attribution block before the first section heading
  const sourceBlock = `<p class="source-ref" style="margin:0 0 1.5em;padding:.5em .9em;border-left:3px solid #4ade80;font-size:.82em;color:#9ca3af;background:rgba(74,222,128,.06)">&#128204; <strong style="color:#d1d5db">來源：</strong><a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="color:#4ade80;word-break:break-all">${sourceUrl}</a></p>`;
  const contentWithSource = sourceBlock + aiResult.content_html;

  const postRes = await env.BLOG_DB.prepare(
    `INSERT INTO posts (title, slug, content, excerpt, cover_url, status, is_ai_generated)
     VALUES (?, ?, ?, ?, ?, 'draft', 1) RETURNING id`,
  )
    .bind(aiResult.title, slug, contentWithSource, aiResult.excerpt, coverUrl)
    .first<{ id: number }>();

  const postId = postRes!.id;
  console.log(
    `[ai-generate] STEP4 D1 insert OK post_id=${postId} slug=${slug}`,
  );

  // 5. 記錄 AI log
  await env.BLOG_DB.prepare(
    `INSERT INTO ai_generate_log (source_url, style, post_id, status)
     VALUES (?, ?, ?, 'done')`,
  )
    .bind(sourceUrl, styleName, postId)
    .run();

  console.log(
    `[ai-generate] DONE cover=${coverUrl ?? "null"} img_error=${imgError ?? "none"}`,
  );
  return json(
    {
      post_id: postId,
      slug,
      title: aiResult.title,
      excerpt: aiResult.excerpt,
      content_html: aiResult.content_html,
      cover_url: coverUrl,
      img_error: imgError,
      r2_available: !!env.BLOG_IMAGES,
      suggested_category: aiResult.suggested_category,
      suggested_tags: aiResult.suggested_tags,
      company_name: aiResult.company_name,
      tech_keywords: aiResult.tech_keywords,
    },
    201,
  );
}
