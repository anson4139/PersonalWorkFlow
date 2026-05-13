import { json, requireAdmin } from "./_auth";
const STYLES = {
  1: "科普解說",
  2: "批判分析",
  3: "職場視角",
  4: "懶人包",
  5: "趨勢觀察",
  6: "技術深潛",
  7: "故事敘述",
  8: "問答體",
  9: "晨報風格",
  10: "辯論觀點",
};
const STYLE_SYSTEM_PROMPTS = {
  1: "你是一位科普作家，善用類比和故事讓新手秒懂，避免技術術語。",
  2: "你是一位批判性分析師，深度剖析利弊，提出犀利的懷疑視角。",
  3: "你是一位資深 PM/SA，聚焦業務影響與實務應用，避免純技術論述。",
  4: "你擅長寫懶人包，用條列式重點讓讀者 3 分鐘讀完，每點不超過 2 行。",
  5: "你是市場趨勢分析師，用宏觀產業視角分析，數據佐證。",
  6: "你是資深工程師，保留所有技術細節，適合工程師讀者。",
  7: "你善用故事敘述方式帶入，情境化呈現，引發共鳴。",
  8: "你用 Q&A 格式寫文章，預設讀者問題，逐一解答。",
  9: "你寫每日簡訊感，精煉重點，語氣簡潔清爽，適合早晨閱讀。",
  10: "你呈現正反兩方論點並陳，讓讀者自行判斷，辯論觀點式。",
};
// POST /api/admin/ai-generate
// body: { url: string, style: string ("1"~"10") }
export async function onRequest(ctx) {
  const { request, env } = ctx;
  const deny = requireAdmin(request, env);
  if (deny) return deny;
  if (request.method !== "POST")
    return json({ error: "Method Not Allowed" }, 405);
  const body = await request.json();
  const sourceUrl = body.url?.trim();
  const styleKey = body.style ?? "1";
  if (!sourceUrl) return json({ error: "url required" }, 400);
  if (!env.OPENAI_API_KEY)
    return json({ error: "OPENAI_API_KEY not configured" }, 503);
  // 1. 抓取原始內容（使用 Jina.ai reader 做清洗）
  let rawContent = "";
  try {
    const jinaUrl = `https://r.jina.ai/${sourceUrl}`;
    const res = await fetch(jinaUrl, {
      headers: { Accept: "text/plain", "X-Timeout": "15" },
    });
    rawContent = await res.text();
    rawContent = rawContent.slice(0, 12000); // 限制長度避免超出 context
  } catch {
    return json({ error: "Failed to fetch source URL" }, 400);
  }
  if (!rawContent || rawContent.length < 100) {
    return json({ error: "Could not extract content from URL" }, 422);
  }
  const styleName = STYLES[styleKey] ?? "科普解說";
  const systemPrompt =
    STYLE_SYSTEM_PROMPTS[styleKey] ?? STYLE_SYSTEM_PROMPTS["1"];
  // 2. gpt-5.5 改寫文章
  let aiResult;
  try {
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        temperature: 0.7,
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\n以繁體中文輸出。回傳嚴格的 JSON，格式如下（不含 markdown code block）：\n{"title":"文章標題","excerpt":"100字內摘要","content_html":"HTML格式完整文章內容","suggested_category":"分類名稱","suggested_tags":["標籤1","標籤2"],"company_name":"提到的主要公司（沒有則空字串）","tech_keywords":["關鍵字1","關鍵字2"]}`,
          },
          {
            role: "user",
            content: `請依照「${styleName}」風格，根據以下原始內容改寫成部落格文章：\n\n---\n${rawContent}\n---\n\n來源 URL：${sourceUrl}`,
          },
        ],
      }),
    });
    if (!chatRes.ok) {
      const err = await chatRes.text();
      return json({ error: `OpenAI error: ${err}` }, 502);
    }
    const chatData = await chatRes.json();
    const raw = chatData.choices[0].message.content.trim();
    // 去除可能包裹的 markdown code fence
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    aiResult = JSON.parse(cleaned);
  } catch (e) {
    return json({ error: `AI parse error: ${String(e)}` }, 502);
  }
  // 3. gpt-image-2 生成封面圖（如果 R2 已設定）
  let coverUrl = null;
  if (env.BLOG_IMAGES && env.OPENAI_API_KEY) {
    try {
      const imgRes = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-2",
            prompt: `A professional blog cover image about "${aiResult.title}", dark background #080808, green accent #76B900, minimalist, 16:9 aspect ratio, no text`,
            n: 1,
            size: "1536x1024",
            output_format: "webp",
          }),
        },
      );
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        const imageItem = imgData.data[0];
        if (imageItem.b64_json) {
          // b64 模式 → 直接上傳 R2
          const binaryStr = atob(imageItem.b64_json);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++)
            bytes[i] = binaryStr.charCodeAt(i);
          const imgKey = `covers/${Date.now()}.webp`;
          await env.BLOG_IMAGES.put(imgKey, bytes.buffer, {
            httpMetadata: { contentType: "image/webp" },
          });
          coverUrl = `https://blog.buclaw.org/images/${imgKey}`;
        } else if (imageItem.url) {
          coverUrl = imageItem.url; // 暫存 URL（有效期限短）
        }
      }
    } catch {
      // 圖片生成失敗不影響主流程
    }
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
  const postRes = await env.BLOG_DB.prepare(
    `INSERT INTO posts (title, slug, content, excerpt, cover_url, status)
     VALUES (?, ?, ?, ?, ?, 'draft') RETURNING id`,
  )
    .bind(
      aiResult.title,
      slug,
      aiResult.content_html,
      aiResult.excerpt,
      coverUrl,
    )
    .first();
  const postId = postRes.id;
  // 5. 記錄 AI log
  await env.BLOG_DB.prepare(
    `INSERT INTO ai_generate_log (source_url, style, post_id, status)
     VALUES (?, ?, ?, 'done')`,
  )
    .bind(sourceUrl, styleName, postId)
    .run();
  // 6. 非同步備份至 MSSQL（不阻塞回應）
  if (
    env.MSSQL_BRIDGE_URL &&
    env.MSSQL_BRIDGE_URL !== "http://localhost:8888"
  ) {
    ctx.waitUntil(
      fetch(`${env.MSSQL_BRIDGE_URL}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.MSSQL_BRIDGE_SECRET ?? ""}`,
        },
        body: JSON.stringify({
          source_url: sourceUrl,
          title: aiResult.title,
          raw_content: rawContent.slice(0, 8000),
          category: aiResult.suggested_category,
          company_name: aiResult.company_name,
          tech_keywords: aiResult.tech_keywords.join(", "),
          blog_post_slug: slug,
        }),
      }).catch(() => {}),
    );
  }
  return json(
    {
      post_id: postId,
      slug,
      title: aiResult.title,
      excerpt: aiResult.excerpt,
      content_html: aiResult.content_html,
      cover_url: coverUrl,
      suggested_category: aiResult.suggested_category,
      suggested_tags: aiResult.suggested_tags,
      company_name: aiResult.company_name,
      tech_keywords: aiResult.tech_keywords,
    },
    201,
  );
}
