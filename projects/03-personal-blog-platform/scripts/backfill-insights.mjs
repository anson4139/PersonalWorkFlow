/**
 * backfill-insights.mjs
 *
 * One-time backfill: fetch FinMind TaiwanStockNews historical data,
 * group by company x ISO week, call GPT-5.5 to generate trend summaries,
 * then write into D1 insights table via wrangler.
 *
 * WHY FinMind (not D1 posts): D1 posts table is nearly empty when first deploying.
 * This script seeds the insights table with historical data so /trends has content
 * from day one. Going forward, the weekly Cron uses D1 posts instead.
 *
 * Usage:
 *   node scripts/backfill-insights.mjs [--dry-run] [--weeks=8]
 *
 * Reads credentials from: src/web/.dev.vars  (or process.env)
 * Writes SQL to: scripts/backfill-insights.sql  (then auto-runs wrangler)
 *
 * Run from project root:
 *   cd projects/03-personal-blog-platform
 *   node scripts/backfill-insights.mjs --dry-run    # preview
 *   node scripts/backfill-insights.mjs --weeks=8    # last 8 weeks
 *   node scripts/backfill-insights.mjs              # default: last 4 weeks
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEV_VARS_PATH = path.join(ROOT, "src", "web", ".dev.vars");
const OUT_SQL = path.join(__dirname, "backfill-insights.sql");

// --- Config ------------------------------------------------------------------

/** How many past weeks to backfill (override with --weeks=N) */
const DEFAULT_WEEKS = 4;

/** Max titles to send to GPT per company-week group */
const MAX_TITLES_PER_PROMPT = 20;

/** Rate-limit: ms to wait between OpenAI calls */
const OPENAI_DELAY_MS = 800;

const MODEL_VER = "gpt-5.5";
const PROMPT_VER = "1.0";

/**
 * 14 target companies.
 *   name     - canonical display name stored in D1
 *   group    - entity_group
 *   keywords - strings to match against FinMind title (case-insensitive)
 */
const COMPANIES = [
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

// --- Helpers -----------------------------------------------------------------

function loadDevVars(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) vars[m[1]] = m[2].trim();
  }
  return vars;
}

/** Returns the ISO week Monday (YYYY-MM-DD) for a given date string */
function isoWeekStart(dateStr) {
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00Z");
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Returns each date in a date range; TaiwanStockNews only supports one day per request. */
function dateRangeDays(startDate, endDate) {
  const days = [];
  let cur = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sqlEscape(str) {
  return (str ?? "").replace(/'/g, "''");
}

// --- FinMind fetch -----------------------------------------------------------

async function fetchFinMind(token, date) {
  const url =
    `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockNews` +
    `&start_date=${encodeURIComponent(date)}` +
    `&token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "blog-backfill/1.0" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`FinMind HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 200)
    throw new Error(`FinMind API status ${json.status}: ${json.msg}`);
  return json.data ?? [];
}

// --- OpenAI summarise --------------------------------------------------------

async function generateInsight(openaiKey, company, weekStart, titles) {
  const titlesText = titles
    .slice(0, MAX_TITLES_PER_PROMPT)
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n");
  const prompt =
    `以下是關於「${company}」在 ${weekStart} 這週的新聞標題（共 ${titles.length} 筆）：\n` +
    `${titlesText}\n\n` +
    `請用繁體中文，一句話（≤80字）總結這週該企業的主要動向或趨勢。只輸出摘要，不要其他說明。`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: MODEL_VER,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 120,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const json = await res.json();
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

// --- Main --------------------------------------------------------------------

const DRY_RUN = process.argv.includes("--dry-run");
const weeksArg = process.argv.find((a) => a.startsWith("--weeks="));
const BACKFILL_WEEKS = weeksArg
  ? parseInt(weeksArg.split("=")[1], 10)
  : DEFAULT_WEEKS;

async function main() {
  // 1. Load credentials
  const vars = loadDevVars(DEV_VARS_PATH);
  const FINMIND_TOKEN = process.env.FINMIND_TOKEN ?? vars.FINMIND_TOKEN;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? vars.OPENAI_API_KEY;

  if (!FINMIND_TOKEN) {
    console.error("ERROR: FINMIND_TOKEN not found in .dev.vars or environment");
    process.exit(1);
  }
  if (!OPENAI_API_KEY) {
    console.error(
      "ERROR: OPENAI_API_KEY not found in .dev.vars or environment",
    );
    process.exit(1);
  }

  if (DRY_RUN)
    console.log("[backfill] DRY RUN — no OpenAI calls, no D1 writes");

  // 2. Apply D1 migration (idempotent)
  if (!DRY_RUN) {
    console.log("[backfill] Applying D1 migration 0008_insights.sql ...");
    try {
      execSync(
        `npx wrangler d1 execute BLOG_DB --remote --file=src/web/migrations/0008_insights.sql`,
        { cwd: ROOT, stdio: "inherit" },
      );
    } catch {
      console.warn("[backfill] Migration may already be applied — continuing");
    }
    console.log(
      "[backfill] Applying D1 migration 0009_insights_unique.sql ...",
    );
    try {
      execSync(
        `npx wrangler d1 execute BLOG_DB --remote --file=src/web/migrations/0009_insights_unique.sql`,
        { cwd: ROOT, stdio: "inherit" },
      );
    } catch {
      console.warn(
        "[backfill] Unique index may already be applied — continuing",
      );
    }
  }

  // 3. Compute date range
  const today = new Date();
  const endStr = today.toISOString().slice(0, 10);
  const startDt = new Date(today);
  startDt.setDate(startDt.getDate() - BACKFILL_WEEKS * 7);
  const startStr = startDt.toISOString().slice(0, 10);
  const days = dateRangeDays(startStr, endStr);

  console.log(
    `[backfill] Fetching FinMind data: ${startStr} → ${endStr} (${BACKFILL_WEEKS} weeks, ${days.length} day(s))`,
  );

  // 4. Fetch FinMind data
  let allNews = [];
  for (const date of days) {
    process.stdout.write(`[backfill] FinMind ${date} ... `);
    try {
      const rows = await fetchFinMind(FINMIND_TOKEN, date);
      console.log(`${rows.length} rows`);
      allNews = allNews.concat(rows);
      await sleep(600); // be polite to FinMind
    } catch (err) {
      console.error(`FAILED: ${err.message}`);
      process.exit(1);
    }
  }
  console.log(`[backfill] Total raw rows: ${allNews.length}`);

  // 5. Group by company x week
  // Structure: companyName -> weekStart -> { company, titles: string[] }
  const grouped = new Map();
  for (const row of allNews) {
    const titleLower = (row.title ?? "").toLowerCase();
    const weekStart = isoWeekStart(row.date?.slice(0, 10) ?? "");
    if (!weekStart) continue;

    for (const company of COMPANIES) {
      if (
        company.keywords.some((kw) => titleLower.includes(kw.toLowerCase()))
      ) {
        if (!grouped.has(company.name)) grouped.set(company.name, new Map());
        const weeks = grouped.get(company.name);
        if (!weeks.has(weekStart))
          weeks.set(weekStart, { company, titles: [] });
        weeks.get(weekStart).titles.push(row.title);
        break; // count each article once
      }
    }
  }

  let totalGroups = 0;
  for (const [companyName, weeks] of grouped) {
    const count = [...weeks.values()].reduce((s, v) => s + v.titles.length, 0);
    console.log(`  ${companyName}: ${weeks.size} weeks, ${count} total hits`);
    totalGroups += weeks.size;
  }
  console.log(
    `[backfill] Groups to process: ${totalGroups} (= GPT calls in non-dry-run)`,
  );

  // 6. Generate AI summaries
  const inserts = [];
  let aiCalls = 0;

  for (const [companyName, weeks] of grouped) {
    for (const [weekStart, { company, titles }] of [
      ...weeks.entries(),
    ].sort()) {
      if (titles.length === 0) continue;

      let direction = "";
      let modelVer = "none";

      if (DRY_RUN) {
        direction = `[DRY RUN] ${companyName} 本週 ${titles.length} 筆`;
        modelVer = "dry-run";
      } else {
        try {
          await sleep(OPENAI_DELAY_MS);
          direction = await generateInsight(
            OPENAI_API_KEY,
            companyName,
            weekStart,
            titles,
          );
          modelVer = MODEL_VER;
          aiCalls++;
          console.log(
            `  [AI] ${companyName} ${weekStart} (${titles.length} hits) → "${direction.slice(0, 60)}..."`,
          );
        } catch (err) {
          console.warn(
            `  [WARN] AI failed for ${companyName} ${weekStart}: ${err.message}`,
          );
          direction = `${companyName} 本週出現 ${titles.length} 筆相關新聞，動向待分析。`;
          modelVer = "fallback";
        }
      }

      const impact =
        titles.length >= 10 ? "high" : titles.length >= 4 ? "medium" : "low";
      const keyEvents = JSON.stringify(
        titles.slice(0, 5).map((t) => ({ title: t })),
      );

      inserts.push(
        `INSERT OR IGNORE INTO insights ` +
          `(week_start, entity, entity_group, hit_count, direction, key_events, impact, ` +
          `data_source, model_ver, prompt_ver) ` +
          `VALUES ('${weekStart}', '${sqlEscape(companyName)}', '${sqlEscape(company.group)}', ` +
          `${titles.length}, '${sqlEscape(direction)}', '${sqlEscape(keyEvents)}', ` +
          `'${impact}', 'FINMIND', '${modelVer}', '${PROMPT_VER}');`,
      );
    }
  }

  console.log(
    `\n[backfill] ${inserts.length} INSERT statements (${aiCalls} AI calls)`,
  );

  if (inserts.length === 0) {
    console.log("[backfill] Nothing to write. Done.");
    return;
  }

  // 7. Write SQL file
  const sqlContent = [
    "-- backfill-insights.sql  (auto-generated, do not edit manually)",
    `-- Generated: ${new Date().toISOString()}`,
    `-- Source: FinMind TaiwanStockNews`,
    `-- Range: ${startStr} to ${endStr}`,
    "",
    ...inserts,
  ].join("\n");
  fs.writeFileSync(OUT_SQL, sqlContent, "utf8");
  console.log(`[backfill] SQL written to: ${OUT_SQL}`);

  if (DRY_RUN) {
    console.log("[backfill] DRY RUN complete — skipping wrangler apply");
    return;
  }

  // 8. Apply to remote D1
  console.log("\n[backfill] Applying to remote D1 ...");
  execSync(
    `npx wrangler d1 execute BLOG_DB --remote --file=scripts/backfill-insights.sql`,
    { cwd: ROOT, stdio: "inherit" },
  );

  console.log(
    "\n[backfill] Done! insights table populated with FinMind history.",
  );
}

main().catch((err) => {
  console.error("[backfill] FATAL:", err.message);
  process.exit(1);
});
