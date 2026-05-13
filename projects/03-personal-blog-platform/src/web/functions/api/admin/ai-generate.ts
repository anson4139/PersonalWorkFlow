import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import { json, requireAdmin, slugify } from "./_auth";

// CF AI Gateway proxies requests through US nodes → bypasses OpenAI HK block
const OPENAI_CHAT_URL =
  "https://gateway.ai.cloudflare.com/v1/febfc538b58e0a5c56a0edbaa3a221bd/blog-openai-gw/openai/chat/completions";

const ARTICLE_STYLE_NAME = "FB PO文";

const ARTICLE_SYSTEM_PROMPT = `你是一位台灣科技媒體社群編輯，專門把新聞原文整理成可直接發布的 Facebook 貼文。你必須先做內容過濾，再做改寫，絕對不能把網頁雜訊、推薦文章或舊聞混進正文。`;

const ARTICLE_OUTPUT_SPEC = `【任務】
- 請從下方原始文字中，只擷取與主文核心主題最相關、且發布日期最新的那篇主要新聞內容。

【過濾與排除條件】
- 去除所有網頁導覽選單、版權宣告、登入提示、追蹤我們、熱門分類、分享按鈕與其他 UI 雜訊。
- 嚴格排除所有與主文無關的推薦文章、贊助內容、延伸閱讀、廣告文案與舊日期新聞。
- 特別忽略含有「永豐」或「國泰金控」的無關資訊，除非它們本身就是本篇主文主角。

【時間與格式要求】
- 從原文找出目標文章真正的發布日期，轉成 yyyyMMdd。不可使用今天日期，也不可誤抓推薦文章日期。
- 自行判斷內容分類，例如：AI模型與技術、企業策略、半導體、消費科技、法規政策。
- 以繁體中文改寫成 Facebook 貼文，語氣俐落、資訊密度高、可讀性強。
- 內文可使用 2 到 4 個貼切 emoji，但不要浮濫。
- 結尾一定要有 5 到 8 個 Hashtag。

【content_html 輸出格式】
- 使用語義化 HTML，僅用 <p>、<ul>、<li>、<strong>；不要用 <h2>、<h3>、table 或 inline style。
- 第一段固定輸出：<p>【yyyyMMdd 分類】【公司或機構名稱】【主題：吸引人的標題】</p>
- 接著輸出 4 到 6 段 FB 貼文正文，每段都要有具體資訊，不可空泛。
- 最後兩段固定為：
  1. <p>#hashtag1 #hashtag2 ...</p>
  2. <p>出處：來源名稱</p>

【準確性規則】
- 只能使用原文已出現的事實、數字、日期、公司、人名、產品名與技術名詞。
- 若資訊不足，寧可保守描述，不可腦補。
- 不可把多篇不同文章混成一篇。

以繁體中文輸出。回傳嚴格 JSON，不含 markdown code block，格式如下：
{"title":"主題欄中的吸睛標題","excerpt":"60~90 字摘要","content_html":"FB 貼文 HTML","suggested_category":"分類名稱","suggested_tags":["標籤1","標籤2","標籤3"],"company_name":"主要公司或機構","tech_keywords":["關鍵字1","關鍵字2","關鍵字3"]}`;

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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToReadableText(html: string): string {
  const withoutBlocks = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, " ")
    .replace(
      /<(br|\/p|\/div|\/li|\/section|\/article|\/h1|\/h2|\/h3|\/h4|\/tr)>/gi,
      "\n",
    )
    .replace(/<[^>]+>/g, " ");

  const noisePattern =
    /(登入|註冊|追蹤我們|熱門分類|熱門文章|延伸閱讀|推薦閱讀|相關文章|版權所有|copyright|訂閱|分享本文|立即下載|Sponsored|廣告|永豐|國泰金控)/i;

  return decodeHtmlEntities(withoutBlocks)
    .split(/\r?\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 8)
    .filter((line) => !noisePattern.test(line))
    .join("\n")
    .slice(0, 12000);
}

// COVER_STYLE_PROMPTS / COVER_STYLE_SPECS / buildImagePromptViaGpt 已移至 ai-cover.ts

// POST /api/admin/ai-generate
// body: { url: string, style?: string, manualContent?: string }
// 封面圖生成已移至 /api/admin/ai-cover（Stage 2 獨立呼叫）
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
  };
  const sourceUrl = body.url?.trim();
  const manualContent = body.manualContent?.trim();

  console.log(
    `[ai-generate] START url=${sourceUrl} style=${ARTICLE_STYLE_NAME} colo=${(request as Request & { cf?: { colo?: string } }).cf?.colo ?? "unknown"}`,
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
      try {
        console.log(`[ai-generate] STEP1 fetching source HTML: ${sourceUrl}`);
        const res = await fetch(sourceUrl, {
          headers: {
            Accept: "text/html,application/xhtml+xml",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
          },
        });
        const html = await res.text();
        rawContent = htmlToReadableText(html);
        console.log(
          `[ai-generate] STEP1 source status=${res.status} content_len=${rawContent.length}`,
        );
      } catch (e) {
        console.error(`[ai-generate] STEP1 source fetch error: ${String(e)}`);
      }
    }
    if (!rawContent || rawContent.length < 50) {
      console.error("[ai-generate] STEP1 source content unavailable");
      return json(
        {
          error:
            "無法擷取原文內容。系統已嘗試文字代理與原站 HTML 擷取，但內容仍不足。請改用「手動貼上內文」後再試。",
        },
        422,
      );
    }
  }

  const styleName = ARTICLE_STYLE_NAME;

  const articleSystemContent = `${ARTICLE_SYSTEM_PROMPT}\n\n${ARTICLE_OUTPUT_SPEC}`;
  const articleUserContent = `請根據以下原始文字，整理成單一篇 FB PO 文草稿。\n\n來源 URL：${sourceUrl}\n\n來源文字如下：\n---\n${rawContent}\n---`;

  // 2. 依序嘗試模型（gpt-5.5 部分節點有地區限制，自動 fallback 到 gpt-4.1）
  const MODEL_PRIORITY = ["gpt-5.5", "gpt-4.1", "gpt-4o"];
  let aiResult: AiArticleResult | null = null;
  try {
    let chatData: { choices: OpenAIChoice[] } | null = null;
    let usedModel = "";
    let allRegionBlocked = true;
    let lastModelError = "";

    for (const model of MODEL_PRIORITY) {
      console.log(
        `[ai-generate] STEP2 trying model=${model} style="${styleName}"`,
      );
      const chatRes = await fetch(OPENAI_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_completion_tokens: 2600,
          messages: [
            { role: "system", content: articleSystemContent },
            { role: "user", content: articleUserContent },
          ],
        }),
      });

      console.log(
        `[ai-generate] STEP2 model=${model} status=${chatRes.status}`,
      );

      if (chatRes.status === 403) {
        const errText = await chatRes.text();
        if (errText.includes("unsupported_country_region_territory")) {
          console.warn(
            `[ai-generate] STEP2 model=${model} region-blocked, trying next`,
          );
          continue;
        }
        console.error(
          `[ai-generate] STEP2 model=${model} 403 error: ${errText}`,
        );
        return json({ error: `OpenAI 拒絕（403）：${errText}` }, 422);
      }

      allRegionBlocked = false;

      if (!chatRes.ok) {
        const err = await chatRes.text();
        console.error(`[ai-generate] STEP2 model=${model} error: ${err}`);
        // 5xx → 伺服器問題，試下一個模型；其他錯誤直接結束
        if (chatRes.status >= 500) {
          lastModelError = `模型 ${model} 暫時失敗：${err}`;
          continue;
        }
        return json({ error: `OpenAI error: ${err}` }, 422);
      }

      chatData = (await chatRes.json()) as { choices: OpenAIChoice[] };

      const raw = chatData.choices[0]?.message?.content?.trim() ?? "";
      const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();

      if (!cleaned) {
        lastModelError = `模型 ${model} 回傳空內容`;
        console.error(`[ai-generate] STEP2 model=${model} empty content`);
        chatData = null;
        continue;
      }

      try {
        aiResult = JSON.parse(cleaned) as AiArticleResult;
        usedModel = model;
        break;
      } catch (parseError) {
        lastModelError = `模型 ${model} JSON 無法解析：${String(parseError)}`;
        console.error(
          `[ai-generate] STEP2 model=${model} parse error: ${String(parseError)} raw_len=${cleaned.length}`,
        );
        chatData = null;
        continue;
      }
    }

    if (!chatData) {
      if (allRegionBlocked) {
        console.error("[ai-generate] STEP2 all models region-blocked");
        return json({ error: "所有可用模型均受地區限制，請稍後再試" }, 422);
      }
      console.error(`[ai-generate] STEP2 all models failed: ${lastModelError}`);
      return json(
        { error: lastModelError || "所有模型暫時失敗，請稍後再試" },
        422,
      );
    }

    console.log(`[ai-generate] STEP2 model=${usedModel} OK`);
    if (!aiResult) {
      return json({ error: "AI 回傳格式異常，請稍後再試" }, 422);
    }
    console.log(`[ai-generate] STEP2 parsed OK title="${aiResult.title}"`);
  } catch (e) {
    console.error(`[ai-generate] STEP2 parse error: ${String(e)}`);
    return json({ error: `AI parse error: ${String(e)}` }, 422);
  }

  // 3. 寫入 D1（草稿，cover_url 留 NULL — 由 ai-cover Stage 2 填入）
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
     VALUES (?, ?, ?, ?, NULL, 'draft', 1) RETURNING id`,
  )
    .bind(aiResult.title, slug, contentWithSource, aiResult.excerpt)
    .first<{ id: number }>();

  const postId = postRes!.id;
  console.log(
    `[ai-generate] STEP3 D1 insert OK post_id=${postId} slug=${slug}`,
  );

  // 4. 自動綁定分類（比對現有 or 新建）
  if (aiResult.suggested_category?.trim()) {
    const catName = aiResult.suggested_category.trim();
    let cat = await env.BLOG_DB.prepare(
      `SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    )
      .bind(catName)
      .first<{ id: number }>();
    if (!cat) {
      const catSlug =
        slugify(catName) + "-" + Date.now().toString(36).slice(-5);
      await env.BLOG_DB.prepare(
        `INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`,
      )
        .bind(catName, catSlug)
        .run();
      cat = await env.BLOG_DB.prepare(
        `SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      )
        .bind(catName)
        .first<{ id: number }>();
      console.log(
        `[ai-generate] STEP4 created category "${catName}" id=${cat?.id}`,
      );
    }
    if (cat) {
      await env.BLOG_DB.prepare(
        `INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)`,
      )
        .bind(postId, cat.id)
        .run();
    }
  }

  // 5. 自動綁定標籤（比對現有 or 新建）
  const allTags: string[] = [
    ...(aiResult.suggested_tags ?? []),
    ...(aiResult.tech_keywords ?? []),
  ];
  const seenTags = new Set<string>();
  for (const rawTag of allTags) {
    const tagName = rawTag?.trim();
    if (!tagName || seenTags.has(tagName.toLowerCase())) continue;
    seenTags.add(tagName.toLowerCase());
    let tag = await env.BLOG_DB.prepare(
      `SELECT id FROM tags WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    )
      .bind(tagName)
      .first<{ id: number }>();
    if (!tag) {
      const tagSlug =
        slugify(tagName) + "-" + Date.now().toString(36).slice(-5);
      await env.BLOG_DB.prepare(
        `INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)`,
      )
        .bind(tagName, tagSlug)
        .run();
      tag = await env.BLOG_DB.prepare(
        `SELECT id FROM tags WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      )
        .bind(tagName)
        .first<{ id: number }>();
      console.log(`[ai-generate] STEP5 created tag "${tagName}" id=${tag?.id}`);
    }
    if (tag) {
      await env.BLOG_DB.prepare(
        `INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`,
      )
        .bind(postId, tag.id)
        .run();
    }
  }

  // 6. 記錄 AI log
  await env.BLOG_DB.prepare(
    `INSERT INTO ai_generate_log (source_url, style, post_id, status)
     VALUES (?, ?, ?, 'done')`,
  )
    .bind(sourceUrl, styleName, postId)
    .run();

  console.log(`[ai-generate] DONE post_id=${postId}`);
  return json(
    {
      post_id: postId,
      slug,
      title: aiResult.title,
      excerpt: aiResult.excerpt,
      content_html: aiResult.content_html,
      suggested_category: aiResult.suggested_category,
      suggested_tags: aiResult.suggested_tags,
      company_name: aiResult.company_name,
      tech_keywords: aiResult.tech_keywords,
      article_prompt: `[System]\n${articleSystemContent}\n\n[User]\n${articleUserContent.slice(0, 500)}…（原文已截斷）`,
    },
    201,
  );
}
