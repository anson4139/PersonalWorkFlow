interface Env {
  BLOG_DB: D1Database;
  PIPELINE_DEDUP: KVNamespace;
  PIPELINE_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN?: string;
  LINE_USER_ID?: string;
  BLOG_BASE_URL?: string;
  FINMIND_TOKEN?: string;
  OPENAI_API_KEY?: string;
}

interface RssSource {
  name: string;
  url: string;
  depth: 0 | 1 | 2;
}

interface RssItem {
  source: RssSource;
  title: string;
  link: string;
  description: string;
  pubDate: Date | null;
}

interface CategorySpec {
  name: string;
  coverStyle: string;
  keywords: string[];
}

interface Candidate extends RssItem {
  category: CategorySpec;
  score: number;
}

interface AiGenerateResponse {
  post_id: number;
  slug: string;
  title: string;
  excerpt: string;
  content_html: string;
}

interface ImageJobResponse {
  job_id?: string;
  status?: string;
  image_url?: string | null;
  error?: string | null;
  img_prompt?: string;
  prompt_src?: string;
}

interface PublishedArticle {
  category: string;
  title: string;
  postId: number;
  slug: string;
}

interface SkippedCategory {
  category: string;
  reason: string;
}

const RSS_SOURCES: RssSource[] = [
  { name: "VentureBeat", url: "https://venturebeat.com/feed/", depth: 2 },
  {
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    depth: 1,
  },
];

const CATEGORIES: CategorySpec[] = [
  {
    name: "AI",
    coverStyle: "4",
    keywords: [
      "AI",
      "GPT",
      "LLM",
      "Claude",
      "Gemini",
      "OpenAI",
      "Anthropic",
      "人工智慧",
      "大模型",
      "生成式",
      "agent",
      "機器學習",
      "artificial intelligence",
    ],
  },
  {
    name: "產業",
    coverStyle: "2",
    keywords: [
      "台積電",
      "TSMC",
      "鴻海",
      "Foxconn",
      "輝達",
      "NVIDIA",
      "英特爾",
      "Intel",
      "三星",
      "Samsung",
      "SpaceX",
      "AMD",
      "蘋果",
      "Apple",
      "Meta",
      "Tesla",
      "特斯拉",
      "Microsoft",
      "微軟",
      "Google",
      "Amazon",
      "亞馬遜",
      "Broadcom",
      "博通",
      "semiconductor",
      "晶片",
      "半導體",
    ],
  },
  {
    name: "資安",
    coverStyle: "5",
    keywords: [
      "vulnerability",
      "CVE",
      "exploit",
      "ransomware",
      "malware",
      "phishing",
      "patch",
      "zero-day",
      "zero day",
      "breach",
      "cyberattack",
      "資安",
      "漏洞",
      "勒索",
      "駭客",
      "入侵",
    ],
  },
];

const BRAND_BOOST_KEYWORDS = [
  "nvidia",
  "\u8f1d\u9054",
  "amd",
  "intel",
  "microsoft",
  "\u5fae\u8edf",
  "anthropic",
  "openai",
  "spacex",
  "google",
  "tsmc",
  "\u53f0\u7a4d\u96fb",
  "amazon",
  "openclaw",
  "broadcom",
];

// FinMind 産業追蹤關鍵字（14 家目標企業）
const FINMIND_INDUSTRY_KEYWORDS = [
  "台積電",
  "TSMC",
  "鴻海",
  "Foxconn",
  "輝達",
  "NVIDIA",
  "英特爾",
  "Intel",
  "三星",
  "Samsung",
  "SpaceX",
  "AMD",
  "Apple",
  "蘋果",
  "Meta",
  "Tesla",
  "特斯拉",
  "Microsoft",
  "微軟",
  "Google",
  "Amazon",
  "亞馬遜",
  "Broadcom",
  "博通",
];

const FINMIND_SOURCE: RssSource = {
  name: "FinMind産業",
  url: "https://api.finmindtrade.com",
  depth: 1,
};

/** 14 家目標企業：用於 insights 週報生成 */
const INSIGHTS_COMPANIES: Array<{
  name: string;
  group: string;
  keywords: string[];
}> = [
  { name: "TSMC", group: "半導體", keywords: ["台積電", "tsmc"] },
  { name: "鴻海", group: "半導體", keywords: ["鴻海", "foxconn"] },
  { name: "Samsung", group: "半導體", keywords: ["三星", "samsung"] },
  { name: "NVIDIA", group: "AI 研究", keywords: ["輝達", "nvidia"] },
  { name: "Intel", group: "AI 研究", keywords: ["英特爾", "intel"] },
  { name: "AMD", group: "AI 研究", keywords: ["amd"] },
  { name: "Broadcom", group: "AI 研究", keywords: ["broadcom", "博通"] },
  { name: "Apple", group: "科技巨頭", keywords: ["蘋果", "apple"] },
  { name: "Microsoft", group: "科技巨頭", keywords: ["microsoft", "微軟"] },
  { name: "Google", group: "科技巨頭", keywords: ["google"] },
  { name: "Amazon", group: "科技巨頭", keywords: ["amazon", "亞馬遜"] },
  { name: "Meta", group: "科技巨頭", keywords: ["meta"] },
  { name: "Tesla", group: "科技巨頭", keywords: ["tesla", "特斯拉"] },
  { name: "SpaceX", group: "科技巨頭", keywords: ["spacex"] },
];

const RSS_TIMEOUT_MS = 10000;
const API_TIMEOUT_MS = 45000;
const IMAGE_JOB_TIMEOUT_MS = 110000;
const IMAGE_JOB_POLL_MS = 5000;
const MAX_ATTEMPTS_PER_CATEGORY = 5;
const DEDUP_TTL_SECONDS = 60 * 60 * 24 * 30;
const LOCK_TTL_SECONDS = 60 * 60 * 26;

export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // 每週一 00:00 UTC (08:00 UTC+8) → 產業趨勢 insights 生成
    // 每天 23:00 UTC (07:00 UTC+8) → 日報 pipeline
    if (event.cron === "0 0 * * 1") {
      await generateWeeklyInsights(env);
    } else {
      await runPipeline(env);
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname !== "/run") {
      return Response.json({ ok: true, service: "blog-auto-pipeline" });
    }

    const authHeader = request.headers.get("Authorization") ?? "";
    if (
      !env.PIPELINE_SECRET ||
      authHeader !== `Bearer ${env.PIPELINE_SECRET}`
    ) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ignoreLock = url.searchParams.get("force") === "1";
    ctx.waitUntil(
      runPipeline(env, { ignoreLock }).catch((error) => {
        console.error("[pipeline] uncaught error:", errorMessage(error));
      }),
    );
    return Response.json({ status: "triggered", ignoreLock });
  },
};

async function runPipeline(env: Env, options: { ignoreLock?: boolean } = {}) {
  const startedAt = new Date();
  const runDate = taipeiDate(startedAt);
  const lockKey = `lock:${runDate}`;

  if (!options.ignoreLock) {
    const existingLock = await env.PIPELINE_DEDUP.get(lockKey);
    if (existingLock) {
      console.log(`[pipeline] already ran for ${runDate}, skipping`);
      return { status: "skipped", reason: "daily lock exists", runDate };
    }
    await env.PIPELINE_DEDUP.put(lockKey, startedAt.toISOString(), {
      expirationTtl: LOCK_TTL_SECONDS,
    });
  }

  const published: PublishedArticle[] = [];
  const skipped: SkippedCategory[] = [];

  // 啟動通知：讓你知道 Cron 確實有觸發
  await sendLine(
    env,
    `[Blog Pipeline] ${runDate} 開始執行，共 ${CATEGORIES.length} 個分類，請稍候...`,
  );

  try {
    const rssItems = await fetchAllRss();
    const finmindItems = await fetchFinMindNews(env, runDate);
    const candidatesByCategory = await buildCandidateQueues(env, [
      ...rssItems,
      ...finmindItems,
    ]);
    const selectedTokenSets: Set<string>[] = [];

    for (const category of CATEGORIES) {
      const candidates = candidatesByCategory.get(category.name) ?? [];
      const result = await publishCategory(
        env,
        category,
        candidates,
        selectedTokenSets,
      );
      if (result.ok) {
        published.push(result.article);
        selectedTokenSets.push(titleTokens(result.article.title));
        // 每篇發佈後即時通知
        await sendLine(
          env,
          `✅ [${category.name}] 已發佈（${published.length}/${CATEGORIES.length}）\n「${result.article.title}」`,
        );
      } else {
        skipped.push({ category: category.name, reason: result.reason });
        // 每篇跳過也即時通知
        await sendLine(
          env,
          `⚠️ [${category.name}] 跳過\n原因：${result.reason}`,
        );
      }
    }

    const status = published.length === CATEGORIES.length ? "done" : "partial";
    await sendLine(env, buildLineSummary(runDate, published, skipped));
    return {
      status,
      runDate,
      published: published.length,
      skipped: skipped.length,
      elapsedMs: Date.now() - startedAt.getTime(),
    };
  } catch (error) {
    await sendLine(
      env,
      `[Blog Pipeline] ${runDate} 執行失敗\n${errorMessage(error)}`,
    );
    throw error;
  }
}

async function fetchAllRss() {
  const batches = await Promise.all(
    RSS_SOURCES.map(async (source) => {
      try {
        const response = await fetch(source.url, {
          headers: { "User-Agent": "blog-auto-pipeline/1.0" },
          signal: AbortSignal.timeout(RSS_TIMEOUT_MS),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return parseRss(await response.text(), source);
      } catch (error) {
        console.warn(
          `[pipeline] RSS skipped ${source.name}: ${errorMessage(error)}`,
        );
        return [];
      }
    }),
  );
  return batches.flat();
}

async function fetchFinMindNews(env: Env, date: string): Promise<RssItem[]> {
  if (!env.FINMIND_TOKEN) return [];
  try {
    const url =
      `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockNews` +
      `&start_date=${encodeURIComponent(date)}` +
      `&token=${encodeURIComponent(env.FINMIND_TOKEN)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "blog-auto-pipeline/1.0" },
      signal: AbortSignal.timeout(RSS_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as {
      data?: Array<{ date: string; link: string; title: string }>;
    };
    return (data.data ?? [])
      .filter((row) =>
        FINMIND_INDUSTRY_KEYWORDS.some((kw) =>
          row.title.toLowerCase().includes(kw.toLowerCase()),
        ),
      )
      .map((row) => ({
        source: FINMIND_SOURCE,
        title: row.title,
        link: row.link,
        description: "",
        pubDate: row.date ? new Date(row.date.replace(" ", "T")) : null,
      }));
  } catch (error) {
    console.warn(`[pipeline] FinMind skipped: ${errorMessage(error)}`);
    return [];
  }
}

async function buildCandidateQueues(env: Env, items: RssItem[]) {
  const queues = new Map<string, Candidate[]>();
  for (const item of items) {
    const category = classify(item.title);
    if (!category) continue;

    if (await env.PIPELINE_DEDUP.get(await urlDedupKey(item.link))) continue;

    const queue = queues.get(category.name) ?? [];
    queue.push({ ...item, category, score: scoreItem(item, category) });
    queues.set(category.name, queue);
  }

  for (const [name, queue] of queues.entries()) {
    queue.sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (right.pubDate?.getTime() ?? 0) - (left.pubDate?.getTime() ?? 0);
    });
    queues.set(name, queue.slice(0, MAX_ATTEMPTS_PER_CATEGORY));
  }
  return queues;
}

async function publishCategory(
  env: Env,
  category: CategorySpec,
  candidates: Candidate[],
  selectedTokenSets: Set<string>[],
): Promise<
  { ok: true; article: PublishedArticle } | { ok: false; reason: string }
> {
  if (!candidates.length) return { ok: false, reason: "無匹配文章" };

  let lastError = "候選文章全部失敗";
  for (const candidate of candidates) {
    if (isSoftDuplicate(candidate.title, selectedTokenSets)) {
      lastError = "批次內主題重複";
      continue;
    }

    try {
      const article = await publishCandidate(env, category, candidate);
      await env.PIPELINE_DEDUP.put(await urlDedupKey(candidate.link), "1", {
        expirationTtl: DEDUP_TTL_SECONDS,
      });
      return { ok: true, article };
    } catch (error) {
      lastError = errorMessage(error);
      console.warn(
        `[pipeline] ${category.name} candidate failed: ${lastError}`,
      );
    }
  }
  return { ok: false, reason: lastError };
}

async function publishCandidate(
  env: Env,
  category: CategorySpec,
  candidate: Candidate,
) {
  const generated = await apiJson<AiGenerateResponse>(
    env,
    "/api/admin/ai-generate",
    {
      method: "POST",
      body: JSON.stringify({ url: candidate.link }),
    },
  );

  if (!generated.post_id || !generated.title?.trim()) {
    throw new Error("ai-generate missing post_id or title");
  }
  if (stripHtml(generated.content_html ?? "").length < 500) {
    throw new Error("ai-generate content too short");
  }

  const cover = await apiJson<ImageJobResponse>(env, "/api/admin/ai-cover", {
    method: "POST",
    body: JSON.stringify({
      post_id: generated.post_id,
      title: generated.title,
      excerpt: generated.excerpt,
      cover_style: category.coverStyle,
    }),
  });

  if (cover.job_id)
    await waitForImageJob(env, cover.job_id, IMAGE_JOB_TIMEOUT_MS);

  try {
    const prepared = await apiJson<ImageJobResponse>(
      env,
      "/api/admin/ai-illustrate",
      {
        method: "POST",
        body: JSON.stringify({
          post_id: generated.post_id,
          title: generated.title,
          excerpt: generated.excerpt,
          cover_style: category.coverStyle,
          article_style: "4",
        }),
      },
    );

    if (prepared.img_prompt) {
      const queued = await apiJson<ImageJobResponse>(
        env,
        "/api/admin/ai-illustrate",
        {
          method: "PUT",
          body: JSON.stringify({
            post_id: generated.post_id,
            title: generated.title,
            img_prompt: prepared.img_prompt,
            prompt_src: prepared.prompt_src,
          }),
        },
      );
      if (queued.job_id)
        await waitForImageJob(env, queued.job_id, IMAGE_JOB_TIMEOUT_MS);
    }
  } catch (error) {
    console.warn(
      `[pipeline] illustration degraded post_id=${generated.post_id}: ${errorMessage(error)}`,
    );
  }

  await env.BLOG_DB.prepare(
    `UPDATE posts
       SET status = 'published',
           published_at = COALESCE(published_at, datetime('now')),
           updated_at = datetime('now')
       WHERE id = ?`,
  )
    .bind(generated.post_id)
    .run();

  return {
    category: category.name,
    title: generated.title,
    postId: generated.post_id,
    slug: generated.slug,
  };
}

async function waitForImageJob(env: Env, jobId: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const job = await apiJson<ImageJobResponse>(
      env,
      `/api/admin/ai-image-jobs?job_id=${encodeURIComponent(jobId)}`,
      { method: "GET" },
      15000,
    );
    if (job.status === "ready") return job;
    if (job.status === "failed")
      throw new Error(job.error || `image job failed: ${jobId}`);
    await delay(IMAGE_JOB_POLL_MS);
  }
  throw new Error(`image job timeout: ${jobId}`);
}

async function apiJson<T>(
  env: Env,
  path: string,
  init: RequestInit,
  timeoutMs = API_TIMEOUT_MS,
) {
  const baseUrl = (env.BLOG_BASE_URL || "https://blog.buclaw.org").replace(
    /\/$/,
    "",
  );
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.PIPELINE_SECRET}`,
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      `API ${path} HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`,
    );
  }
  return (await response.json()) as T;
}

function parseRss(xml: string, source: RssSource) {
  const blocks =
    xml.match(/<item\b[\s\S]*?<\/item>/gi) ??
    xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ??
    [];
  const items: RssItem[] = [];

  for (const block of blocks.slice(0, 30)) {
    const title = tagText(block, "title");
    const link = tagText(block, "link") || atomLink(block);
    const description =
      tagText(block, "description") ||
      tagText(block, "summary") ||
      tagText(block, "content:encoded");
    const rawDate =
      tagText(block, "pubDate") ||
      tagText(block, "published") ||
      tagText(block, "updated");
    const pubDate = rawDate ? new Date(rawDate) : null;

    if (!title || !link) continue;
    items.push({
      source,
      title: decodeXml(stripCdata(title)).trim(),
      link: decodeXml(stripCdata(link)).trim(),
      description: stripHtml(decodeXml(stripCdata(description))).trim(),
      pubDate: pubDate && !Number.isNaN(pubDate.getTime()) ? pubDate : null,
    });
  }
  return items;
}

function tagText(block: string, tag: string) {
  const match = block.match(
    new RegExp(
      `<${escapeRegExp(tag)}\\b[^>]*>([\\s\\S]*?)<\\/${escapeRegExp(tag)}>`,
      "i",
    ),
  );
  return match?.[1] ?? "";
}

function atomLink(block: string) {
  const match = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  return match?.[1] ?? "";
}

function classify(title: string) {
  const normalized = title.toLowerCase();
  return CATEGORIES.find((category) =>
    category.keywords.some((keyword) =>
      normalized.includes(keyword.toLowerCase()),
    ),
  );
}

function scoreItem(item: RssItem, category: CategorySpec) {
  let score = 0;
  const ageHours = item.pubDate
    ? (Date.now() - item.pubDate.getTime()) / 3600000
    : Number.POSITIVE_INFINITY;
  if (ageHours <= 6) score += 3;
  else if (ageHours <= 24) score += 1;
  score += item.source.depth;
  if (item.description.length >= 100) score += 1;
  const title = item.title.toLowerCase();
  if (
    category.keywords.some((keyword) => title.includes(keyword.toLowerCase()))
  )
    score += 1;
  // 品牌旗艦標的文章額外加分，提高被選機率
  if (BRAND_BOOST_KEYWORDS.some((b) => title.includes(b))) score += 2;
  return score;
}

function isSoftDuplicate(title: string, selectedTokenSets: Set<string>[]) {
  const tokens = titleTokens(title);
  if (!tokens.size) return false;
  for (const selected of selectedTokenSets) {
    let overlap = 0;
    for (const token of tokens) if (selected.has(token)) overlap += 1;
    if (overlap / tokens.size > 0.6) return true;
  }
  return false;
}

function titleTokens(title: string) {
  const tokens = new Set<string>();
  for (const word of title.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [])
    tokens.add(word);
  for (const chunk of title.match(/[\u4e00-\u9fff]{2,}/g) ?? []) {
    for (let index = 0; index < chunk.length - 1; index += 1)
      tokens.add(chunk.slice(index, index + 2));
  }
  return tokens;
}

async function urlDedupKey(url: string) {
  const bytes = new TextEncoder().encode(url.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `url:${hex}`;
}

async function sendLine(env: Env, text: string) {
  if (!env.LINE_CHANNEL_ACCESS_TOKEN || !env.LINE_USER_ID) {
    console.warn("[pipeline] LINE credentials not configured");
    return;
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: env.LINE_USER_ID,
      messages: [{ type: "text", text: text.slice(0, 5000) }],
    }),
  });

  if (!response.ok) {
    console.warn(
      `[pipeline] LINE push failed HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`,
    );
  }
}

function buildLineSummary(
  runDate: string,
  published: PublishedArticle[],
  skipped: SkippedCategory[],
) {
  const state = skipped.length ? "完成（部分失敗）" : "完成";
  const lines = [
    `[Blog Pipeline] ${runDate} ${state}`,
    `發布 ${published.length} 篇，跳過 ${skipped.length} 篇`,
  ];
  for (const article of published)
    lines.push(`- ${article.category}: ${truncate(article.title, 28)}`);
  for (const item of skipped)
    lines.push(`- ${item.category}: 跳過（${truncate(item.reason, 36)}）`);
  if (published.length === 0)
    lines.push("0 篇發布，請手動檢查 RSS 來源與 AI endpoint。");
  return lines.join("\n");
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripCdata(value: string) {
  return value.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "");
}

function decodeXml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function taipeiDate(date: Date) {
  return new Date(date.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1)}...`
    : value;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2: Weekly Insights Generation
// Cron: every Monday 00:00 UTC (08:00 UTC+8)
// ─────────────────────────────────────────────────────────────────────────────

async function generateWeeklyInsights(env: Env) {
  const now = new Date();
  const weekStart = isoWeekMonday(now);
  // week_end = weekStart + 6 days
  const weekEnd = (() => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + 6);
    return d.toISOString().slice(0, 10);
  })();

  console.log(
    `[insights] Starting weekly insights generation for week ${weekStart}`,
  );

  if (!env.OPENAI_API_KEY) {
    console.warn("[insights] OPENAI_API_KEY not set — skipping insights");
    await sendLine(env, `[Blog 產業趨勢] OPENAI_API_KEY 未設定，週報跳過。`);
    return;
  }

  // Query D1 posts published or drafted this week
  let posts: Array<{
    id: number;
    title: string;
    excerpt: string;
    slug: string;
  }>;
  try {
    const result = await env.BLOG_DB.prepare(
      `SELECT id, title, COALESCE(excerpt, '') AS excerpt, slug
       FROM posts
       WHERE status IN ('published', 'draft')
         AND DATE(COALESCE(published_at, created_at)) BETWEEN ? AND ?
       ORDER BY id DESC`,
    )
      .bind(weekStart, weekEnd)
      .all<{ id: number; title: string; excerpt: string; slug: string }>();
    posts = result.results ?? [];
    console.log(
      `[insights] ${posts.length} posts found for ${weekStart}~${weekEnd}`,
    );
  } catch (err) {
    console.error(`[insights] D1 query failed: ${errorMessage(err)}`);
    await sendLine(env, `[Blog 產業趨勢] D1 查詢失敗：${errorMessage(err)}`);
    return;
  }

  if (posts.length === 0) {
    console.warn("[insights] No posts this week — skipping");
    await sendLine(
      env,
      `[Blog 產業趨勢] ${weekStart} 本週無新文章，insights 生成跳過。`,
    );
    return;
  }

  // Match posts to companies
  const groups = new Map<
    string,
    { company: (typeof INSIGHTS_COMPANIES)[0]; items: typeof posts }
  >();
  for (const post of posts) {
    const needle = `${post.title} ${post.excerpt}`.toLowerCase();
    for (const company of INSIGHTS_COMPANIES) {
      if (company.keywords.some((kw) => needle.includes(kw.toLowerCase()))) {
        if (!groups.has(company.name))
          groups.set(company.name, { company, items: [] });
        groups.get(company.name)!.items.push(post);
        break;
      }
    }
  }

  let saved = 0;
  let failed = 0;

  for (const [companyName, { company, items }] of groups.entries()) {
    if (items.length === 0) continue;

    const titles = items.map((p) => p.title);
    const sourceIds = JSON.stringify(items.map((p) => p.id));
    const keyEvents = JSON.stringify(
      items.slice(0, 5).map((p) => ({ title: p.title, slug: p.slug })),
    );

    let direction: string;
    let modelVer: string;
    try {
      direction = await callOpenAiInsight(
        env.OPENAI_API_KEY,
        companyName,
        weekStart,
        titles,
      );
      modelVer = "gpt-5.5";
    } catch (err) {
      console.warn(
        `[insights] AI failed for ${companyName}: ${errorMessage(err)}`,
      );
      direction = `${companyName} 本週出現 ${items.length} 篇相關文章。`;
      modelVer = "fallback";
    }

    const impact =
      items.length >= 5 ? "high" : items.length >= 2 ? "medium" : "low";

    try {
      await env.BLOG_DB.prepare(
        `INSERT INTO insights
           (week_start, entity, entity_group, hit_count, direction, key_events, impact,
            source_ids, data_source, model_ver, prompt_ver)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'D1_POSTS', ?, '1.0')`,
      )
        .bind(
          weekStart,
          companyName,
          company.group,
          items.length,
          direction,
          keyEvents,
          impact,
          sourceIds,
          modelVer,
        )
        .run();
      saved++;
    } catch (err) {
      console.error(
        `[insights] D1 write failed for ${companyName}: ${errorMessage(err)}`,
      );
      failed++;
    }

    // Rate-limit: 500ms between OpenAI calls
    await delay(500);
  }

  const summary = `[Blog 産業趨勢] ${weekStart} 週報完成\n已更新 ${saved} 家企業動向，失敗 ${failed} 筆。`;
  console.log(summary);
  await sendLine(env, summary);
}

/** Call OpenAI GPT-5.5 to generate a one-sentence industry insight (≤80 chars) */
async function callOpenAiInsight(
  apiKey: string,
  company: string,
  weekStart: string,
  titles: string[],
): Promise<string> {
  const titlesText = titles
    .slice(0, 20)
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n");
  const prompt = `以下是關於「${company}」在 ${weekStart} 這週的文章標題（共 ${titles.length} 筆）：\n${titlesText}\n\n請用繁體中文，一句話（≤80字）總結這週該企業的主要動向或趨勢。只輸出摘要，不要其他說明。`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5.5",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 512,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

/** Returns the ISO week Monday (YYYY-MM-DD) for a given Date */
function isoWeekMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
