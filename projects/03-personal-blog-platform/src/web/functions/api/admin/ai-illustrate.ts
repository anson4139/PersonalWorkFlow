import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import {
  createImageJob,
  enqueueImageJob,
  extractIllustrationUrl,
  getLatestImageJob,
  processImageJobById,
  publicJob,
} from "./_ai-image-jobs";
import { json, requireAdmin } from "./_auth";

// CF AI Gateway proxies requests through US nodes → bypasses OpenAI HK block
const OPENAI_BASE =
  "https://gateway.ai.cloudflare.com/v1/febfc538b58e0a5c56a0edbaa3a221bd/blog-openai-gw/openai";
const OPENAI_CHAT_URL = `${OPENAI_BASE}/chat/completions`;
const EXTRACT_BUDGET_MS = 4000;
const FAST_IMAGE_PROMPT_MAX_LEN = 650;

// ── 6 種模板類型（由寫作風格決定 extraction schema）────────────────
type TemplateType =
  | "data_event" // 事件+數據型：有具體數字的新聞事件（晨報風格）
  | "industry_analysis" // 產業分析型：觀察/趨勢/政策（批判、職場、趨勢）
  | "technical" // 技術深潛型：架構/原理/工程實作
  | "narrative" // 故事敘述型：人物/企業起伏/事件始末
  | "explainer" // 科普解說型：概念解釋/懶人包/問答
  | "debate"; // 辯論觀點型：正方 vs 反方對立結構

// ── 5 種版面類型（由封面風格決定佈局骨架）────────────────────────
type LayoutType =
  | "explainer-card" // 教學型：定義→概念→類比→結論
  | "analysis-6" // 分析型：張力→雙欄→行動步驟→結論
  | "metrics-dashboard" // 數據儀表板型：指標→趨勢→預測
  | "timeline-story" // 故事型：時間軸→演員→因果→結論
  | "debate-split"; // 辯論型：左右對立→關鍵證據→裁決

// ── 封面情境風格 → 版面類型（核心解耦：封面決定佈局，非內容）──────
// 不同封面情境各有最適合的資訊佈局語言
const COVER_TO_LAYOUT: Record<string, LayoutType> = {
  "1": "analysis-6", // 商業簡報風 → 雙欄分析 + 行動步驟
  "2": "analysis-6", // 新聞封面風 → 核心張力 + 雙欄對比
  "3": "metrics-dashboard", // 交易員面板風 → 數據+指標佈局
  "4": "explainer-card", // 知識卡片風 → 定義+概念+類比
  "5": "debate-split", // 漫畫解說風 → 正反對立+辯論
  "6": "timeline-story", // 報紙頭版風 → 故事時間軸+演員
};

// ── 寫作風格 → extraction schema 類型（決定抽取哪些欄位）──────────
// 注意：這裡只決定「萃取什麼內容」，不再決定「畫面怎麼排」
const STYLE_TO_SCHEMA: Record<string, TemplateType> = {
  "1": "explainer", // 科普解說
  "2": "industry_analysis", // 批判分析
  "3": "industry_analysis", // 職場視角
  "4": "explainer", // 懶人包
  "5": "industry_analysis", // 趨勢觀察
  "6": "technical", // 技術深潛
  "7": "narrative", // 故事敘述
  "8": "explainer", // 問答體
  "9": "data_event", // 晨報風格
  "10": "debate", // 辯論觀點
};

// 保留舊名作為別名（向後相容）
const STYLE_TO_TEMPLATE = STYLE_TO_SCHEMA;

// ── 6 種情境的視覺語言規格（顏色 + 佈局語言，對應各自的 LayoutType）─
const VISUAL_SPECS: Record<string, string> = {
  "1": "White and dark navy (#003087) palette. Thin geometric grid lines. Gold accent for key numbers. Minimalist consulting deck. Professional authoritative. Layout language: structured panel grid, dense data hierarchy, authority typography, no decorative elements.",
  "2": "Dark navy / near-black background. Cyan (#00E5FF) and electric blue glowing panel borders. Red-orange-yellow warning accent panels. High contrast white typography. Premium AI cybersecurity dashboard. Layout language: tight editorial grid, bold tension callouts, high-contrast accent panels.",
  "3": "Pure black background. Neon green (#00FF41) glowing data streams. Amber numeric callouts. Matrix digital display. Bloomberg terminal style. Layout language: dashboard grid with metric callout panels, data stream connectors, amber highlight for key figures.",
  "4": "Soft gradient (light sky blue to lavender). Flat geometric icons in rounded panels. Coral (#FF6B6B) and mint green (#4ECDC4) accents. Calm educational infographic. Layout language: rounded card panels, friendly icon blocks, generous whitespace, step-by-step flow.",
  "5": "Deep rich purple (#1A0030) background. Bold comic-panel borders in vivid primary colors. Cartoon character silhouettes in hero area. Energetic vibrant storytelling. Layout language: comic-style panel borders, left-right split debate structure, bold versus panels, speech-bubble callouts.",
  "6": "Near-black with warm sepia (#3D2B1F) undertones. High contrast white text. Broadsheet editorial grid. Aged paper yellow and deep crimson accents. Gravitas editorial. Layout language: broadsheet column grid, large-caption timeline bars, actor name-plates with sub-labels, dramatic S6 thesis banner.",
};

// ── 反幻覺強制規則（注入每個 extraction prompt）──────────────────────
const ANTI_HALLUCINATION = `
STRICT ANTI-HALLUCINATION RULES (non-negotiable):
- ONLY use numbers, percentages, statistics EXPLICITLY stated in the article content below
- If no specific numeric metric exists, write a SHORT qualitative phrase (e.g. "快速成長" NOT "30%")
- NEVER invent percentages, counts, timelines, or technical specs not found in the source
- NEVER fabricate workflow steps not discussed in the article
- If a field cannot be filled from actual content, write a brief honest qualitative description`;

// ── 新聞品質引導（提升萃取的敘事精準度）────────────────────────────
const JOURNALISTIC_QUALITY = `
JOURNALISTIC QUALITY GUIDELINES:
- headline: If the article has a NAMED PROTAGONIST (specific company, product, or person) making a concrete move, the headline MUST include them (e.g. "Anthropic 搦進金融代理" NOT "金融代理崛起"). Only use generic industry trend labels when the article truly has no clear protagonist.
- hero_concept: Use the article's most CONCRETE SCENE — a specific physical action, workflow moment, or product interaction described in the text. If no single dramatic scene exists, describe the article's most representative WORKFLOW MOMENT in concrete terms (e.g. "financial analyst and AI agent jointly reviewing earnings reports on split screen, with status badge showing '\u521d\u7a3f\u5b8c\u6210 / \u5f85\u4eba\u5de5\u8986\u6838'"). NOT a generic concept illustration.
- opportunities vs threshold barriers: opportunities = concrete capabilities this AI/tech ENABLES per the article (e.g. "縮短分析週期", "提升投覇效率"). EXCEPTION: if the article frames these as trust-building PREREQUISITES rather than pure gains (e.g. 可追溯流程設計, 人機共審機制), write them in neutral factual terms and set opp_label to a neutral label (e.g. "可信流程設計" instead of "AI賦能"). challenges = competitive THRESHOLD CONDITIONS and governance MOATS the article frames as barriers to winning (e.g. "資料治理" belongs in challenges as a moat, NOT in opportunities). ALSO include EPISTEMIC RISKS: if the article discusses how AI's professional/confident tone causes readers to over-trust flawed outputs, that IS a challenge (e.g. "穩定語氣掩蓋判斷錯誤", "格式權威性放大錯誤信任"). NEVER place systemic threshold barriers in opportunities.
- timeline / wave framing: If the article frames the shift as "first wave → second wave" competitive transition (e.g. cloud era → edge device era), use THAT framing with the article's own labels. Do NOT default to generic "before / turning point / after" if the article has a stronger wave narrative.
- key_actors / key_players: For EACH actor, extract their STRATEGIC ROUTE or ecosystem bet from the article. If article discusses ecosystem competition (not just single model), route should capture the strategic ecosystem framing (e.g. "整套解決方案生態系" vs "單一模型路線"). If the article treats the ability to PAUSE or STOP high-risk actions (可停止, 可中止, human override) as a key differentiator, include it in route (e.g. "強調安全代理→可追溯+可停止高風險動作"). Never list names alone.
- lesson / takeaway / verdict: Must capture the article's FINAL PUNCH LINE — frame it as a paradigm entry point, a decade-defining competition threshold, or a fundamental shift. NOT "X improves Y capability". If the article ends with "whoever can do X will hold the next decade's entry point", that IS the lesson. If the article uses a BRAKE metaphor in its conclusion (煞車, 可停止, 留下軌跡), preserve that EXACT framing (e.g. "金融業需要AI，但更需要可追溯可停止的煞車機制"). If the article ends with a COMPETITIVE DEPTH comparison (不只比誰用得多，而是比誰能在XX下用得深), preserve that EXACT comparative framing (e.g. "AI競爭不只比誰用得多，而是比誰能在可控風險下用得深").`;

// ── 5 種模板各自的 JSON schema ───────────────────────────────────────
const TEMPLATE_SCHEMAS: Record<TemplateType, string> = {
  data_event: `{"headline":"大標題 max 20 chars","subheadline":"副標 max 30 chars","hero_concept":"one vivid English scene representing the event","metrics":[{"label":"指標名 max 8 chars","value":"REAL number from article OR qualitative phrase"},{"label":"...","value":"..."},{"label":"...","value":"..."}],"key_findings":["發現1 max 20 chars","發現2","發現3"],"process":["事件步驟1 max 15 chars","步驟2","步驟3","步驟4"],"risks":["風險1 max 20 chars","風險2","風險3"],"takeaway":"一句總結 max 35 chars"}`,

  industry_analysis: `{"headline":"大標題 max 20 chars — if article has a named protagonist (company/product) making a move, NAME THEM here","subheadline":"副標說明市場創舉或角色行動 max 30 chars","hero_concept":"Describe the article's most CONCRETE WORKFLOW MOMENT or scene in one English sentence. If analyst+AI co-review is described, describe that specific moment. NOT a generic concept.","core_tension":"核心矛盾 max 25 chars (e.g. 效率機會 vs 風控責任)","opp_label":"機會面標籤 max 8 chars (e.g. AI賦能 / 可信流程設計 — if article frames capabilities as governance prerequisites not pure gains, choose neutral label like 可信流程設計)","opportunities":["具體能力或治理前提 max 20 chars — what AI ENABLES per article OR governance prerequisites the article frames as foundational (e.g. 縮短分析週期, 可追溯流程設計). If article treats as prerequisites not gains, write in neutral factual terms.","能力2","能力3"],"chal_label":"門櫛面標籤 max 8 chars (e.g. 競爭門櫛 / 認識論風險)","challenges":["競爭門櫛或認識論障礙 max 20 chars — governance moats, regulatory thresholds, ecosystem barriers. ALSO include epistemic risks: if article discusses AI confident tone masking judgment errors, that IS a challenge (e.g. 穩定語氣掩蓋判斷錯誤). These are BATTLEGROUNDS.","門櫛2","門櫛3"],"key_players":[{"name":"角色/公司 max 12 chars","route":"策略路線或生態系局 max 25 chars — from article. Include 可停止/可中止 if article treats human override as key differentiator (e.g. Anthropic→可追溯+可停止+安全代理). If ecosystem bet, name it."},{"name":"...","route":"..."}],"action_steps":["步驟1 max 20 chars — concrete enterprise implementation step from article (e.g. 盤點使用情境, 建立紅線清單, 把稽核接進流程). ONLY fill if article has explicit numbered/sequenced steps. Leave [] if article has no concrete step sequence.","步驟2","步驟3"],"takeaway":"文章最終力道句 max 35 chars — if article uses BRAKE metaphor (煞車/可停止/留下軌跡), preserve that EXACT framing (e.g. 金融業需要AI，但更需要可追溯可停止的煞車機制). Otherwise: ecosystem competition threshold, paradigm entry point. NOT status-quo description."}`,

  technical: `{"headline":"大標題 max 20 chars","subheadline":"副標 max 30 chars","hero_concept":"one vivid English technical visualization scene","components":["技術組件1 max 15 chars","組件2","組件3","組件4"],"how_it_works":["運作步驟1 max 15 chars","步驟2","步驟3","步驟4"],"specs":[{"label":"規格名","value":"REAL spec from article OR qualitative if not stated"}],"limitations":["限制1 max 20 chars","限制2","限制3"],"takeaway":"一句總結 max 35 chars"}`,

  narrative: `{"headline":"大標題 max 20 chars","subheadline":"副標 max 30 chars","hero_concept":"The article's CONCRETE OPENING SCENE — use the most specific physical action or object from the text (e.g. 'factory robot arm pausing to recalibrate a half-cm offset screw'). NOT abstract.","timeline":{"stage1":"第一波格局 OR 事件前狀態 max 20 chars — use article's OWN framing","stage2":"轉場節點 OR 競賽轉移關鍵 max 20 chars","stage3":"第二波新戰場 OR 現在結果 max 20 chars","label1":"波段標籤 max 8 chars (e.g. 第一波 / 雲端時代)","label2":"轉折標籤 max 8 chars (e.g. 轉折點 / 第二波啟動)","label3":"新局標籤 max 8 chars (e.g. 第二波 / 實體世界)"},"key_actors":[{"name":"人物/組織 max 12 chars","route":"策略路線或視角 max 20 chars — from article (e.g. Intel→企業/PC/本地模型)"},{"name":"...","route":"..."}],"cause_effect":["因果鏈1 max 20 chars","因果鏈2","因果鏈3"],"lesson":"文章最終力道句 max 35 chars — MUST frame as paradigm entry point or decade-defining competition threshold, NOT 'X improves Y feature'"}`,

  explainer: `{"headline":"大標題 max 20 chars","subheadline":"副標 max 30 chars","hero_concept":"one vivid English conceptual illustration scene","what_is_it":"一句定義 max 25 chars","why_matters":"為何重要 max 25 chars","key_concepts":["核心概念1 max 20 chars","核心概念2","核心概念3"],"comparison":"類比或對比說明 max 30 chars","takeaway":"底線結論 max 35 chars"}`,

  debate: `{"headline":"辯題大標 max 20 chars","subheadline":"副標說明爭議核心 max 30 chars","hero_concept":"one vivid English scene showing two opposing forces or a courtroom debate","motion":"辯題一句話 max 25 chars (e.g. AI 應全面取代金融顧問)","pro_side":{"label":"正方立場 max 10 chars","arguments":["論點1 max 20 chars","論點2","論點3"]},"con_side":{"label":"反方立場 max 10 chars","arguments":["論點1 max 20 chars","論點2","論點3"]},"key_evidence":"雙方都認可的關鍵事實 max 30 chars (use only real facts from article)","verdict":"作者傾向或結論 max 35 chars"}`,
};

// ── Helper：去除 HTML tag 取純文字 ─────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);
}

export async function onRequestGet(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;

  const url = new URL(request.url);
  const postId = Number(url.searchParams.get("post_id") || 0);
  if (!postId) return json({ error: "post_id required" }, 400);

  const postRow = await env.BLOG_DB.prepare(
    "SELECT content FROM posts WHERE id = ?",
  )
    .bind(postId)
    .first<{ content: string }>();

  if (!postRow) return json({ error: "post not found" }, 404);

  const imageUrl = extractIllustrationUrl(postRow.content);
  if (imageUrl) {
    return json({ status: "ready", image_url: imageUrl });
  }

  const latestJob = await getLatestImageJob(env, postId, "illustration");
  if (latestJob) return json(publicJob(latestJob));

  return json({ status: "processing", image_url: null });
}

export async function onRequestPut(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;

  if (!env.OPENAI_API_KEY) {
    console.error("[ai-illustrate] OPENAI_API_KEY not set");
    return json({ error: "OPENAI_API_KEY not configured" }, 503);
  }

  const body = (await request.json()) as {
    post_id?: number;
    title?: string;
    img_prompt?: string;
    prompt_src?: string;
  };

  const postId = Number(body.post_id || 0);
  const title = body.title?.trim() ?? "";
  const imgPrompt = body.img_prompt?.trim() ?? "";
  const promptSrc = body.prompt_src?.trim() ?? "prepared";

  if (!postId || !title || !imgPrompt) {
    return json({ error: "post_id, title and img_prompt required" }, 400);
  }

  const postRow = await env.BLOG_DB.prepare(
    "SELECT content FROM posts WHERE id = ?",
  )
    .bind(postId)
    .first<{ content: string }>();

  if (!postRow) return json({ error: "post not found" }, 404);

  const existingUrl = extractIllustrationUrl(postRow.content);
  if (existingUrl) {
    return json({
      status: "ready",
      image_url: existingUrl,
      img_prompt: imgPrompt,
    });
  }

  const jobId = await createImageJob({
    env,
    kind: "illustration",
    postId,
    payload: {
      title,
      img_prompt: imgPrompt,
      prompt_src: promptSrc,
    },
  });
  const enqueued = await enqueueImageJob(env, jobId);
  if (!enqueued) {
    ctx.waitUntil(
      processImageJobById(env, jobId).catch((error) => {
        console.error(
          `[ai-illustrate] background fallback failed: ${String(error)}`,
        );
      }),
    );
  }

  return json({
    status: "queued",
    queued: true,
    queue_available: enqueued,
    job_id: jobId,
    image_url: null,
    img_prompt: imgPrompt,
    prompt_src: promptSrc,
  });
}

// ── STEP B：GPT 萃取結構化 JSON（全文 + 反幻覺）─────────────────────
async function extractInfographicJson(
  apiKey: string,
  title: string,
  fullText: string,
  articleStyle: string,
  timeoutMs: number,
): Promise<Record<string, unknown> | null> {
  const templateType = STYLE_TO_TEMPLATE[articleStyle] ?? "explainer";
  const schema = TEMPLATE_SCHEMAS[templateType];
  try {
    const res = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        max_completion_tokens: 900,
        messages: [
          {
            role: "system",
            content: `You extract structured infographic data from articles. Template type: ${templateType}.${ANTI_HALLUCINATION}${JOURNALISTIC_QUALITY}
Return ONLY valid JSON (no markdown fences) matching this exact schema:
${schema}`,
          },
          {
            role: "user",
            content: `Title: ${title}\n\nArticle content:\n${fullText}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const raw = data.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ── STEP C：模板渲染 helpers ─────────────────────────────────────────
const s = (v: unknown): string =>
  typeof v === "string" ? v : JSON.stringify(v ?? "");
const a = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function promptDataEvent(d: Record<string, unknown>, visual: string): string {
  const metrics = a(d.metrics)
    .slice(0, 5)
    .map((m) => {
      const x = m as { label?: string; value?: string };
      return `"${x.label ?? ""}: ${x.value ?? ""}"`;
    })
    .join(", ");
  const findings = a(d.key_findings)
    .slice(0, 3)
    .map((p, i) => `Panel${i + 1}:"${s(p)}"`)
    .join(", ");
  const process = a(d.process)
    .slice(0, 4)
    .map((x, i) => `Step${i + 1}:"${s(x)}"`)
    .join(" → ");
  const risks = a(d.risks)
    .slice(0, 3)
    .map((r) => `"${s(r)}"`)
    .join("; ");
  return `Create a vertical mobile-first infographic card in portrait orientation.
Visual style: ${visual}
7-section modular layout, thin glowing divider lines between sections:
S1 HEADLINE: Bold "${s(d.headline)}" + sub "${s(d.subheadline)}"
S2 HERO VISUAL: Illustration of "${s(d.hero_concept)}", ~25% height
S3 KEY METRICS: Bold numeric callout panels — ${metrics}
S4 KEY FINDINGS: Rounded panels — ${findings}
S5 PROCESS FLOW: Arrow-connected — ${process}
S6 RISK ALERTS: Warning panels with caution icons — ${risks}
S7 TAKEAWAY: Full-width accent bar — "${s(d.takeaway)}"
Rules: Dense editorial infographic card, NOT freeform illustration. Rounded panels, visible borders, high-contrast typography. Premium tech-media explainer card. Vertical social sharing format.`;
}

function promptIndustryAnalysis(
  d: Record<string, unknown>,
  visual: string,
): string {
  const oppLabel = s(d.opp_label) || "AI 賦能";
  const chalLabel = s(d.chal_label) || "競爭門櫛";
  const opps = a(d.opportunities)
    .slice(0, 3)
    .map((o, i) => `${i + 1}:"${s(o)}"`)
    .join(" | ");
  const chal = a(d.challenges)
    .slice(0, 3)
    .map((c, i) => `${i + 1}:"${s(c)}"`)
    .join(" | ");
  // Support both new ({name, route}) and old (string) key_players formats
  const players = a(d.key_players)
    .slice(0, 4)
    .map((p) => {
      if (typeof p === "object" && p !== null) {
        const actor = p as { name?: string; route?: string };
        return actor.route
          ? `[${s(actor.name)}] → ${s(actor.route)}`
          : `[${s(actor.name)}]`;
      }
      return `[${s(p)}]`;
    })
    .join(" vs ");
  // action_steps: governance/workflow articles with explicit numbered steps
  const rawSteps = a(d.action_steps).filter((x) => s(x).length > 1);
  const stepStr = rawSteps
    .slice(0, 3)
    .map((st, i) => `Step${i + 1}:"${s(st)}"`)
    .join(" → ");
  const s5Section = stepStr
    ? `S5 THREE-STEP ACTION FLOW (key visual): Render as numbered arrow-connected step panels — ${stepStr} — each step as a bold action card with direction arrow; this IS the article's concrete implementation roadmap`
    : `S5 COMPETITIVE ROUTES (key visual): ${players} — render each as a distinct strategic route card with [Name] as header and arrow route text below; if 可停止 or 可中止 appears in route text, bold/highlight that phrase; if only 2 players, show as side-by-side comparison panels`;
  const s5Rules = stepStr
    ? "S5 action flow is the most distinctive visual element — numbered steps with directional arrows."
    : "S5 route comparison is the most distinctive visual element.";
  // Governance tone override: if article is about enterprise risk/compliance/governance
  const isGovernance =
    oppLabel.includes("治理") ||
    oppLabel.includes("可信") ||
    oppLabel.includes("管理") ||
    chalLabel.includes("治理") ||
    chalLabel.includes("稽核") ||
    chalLabel.includes("合規");
  const toneOverride = isGovernance
    ? `\nVisual tone override: This is a GOVERNANCE/COMPLIANCE article. Suppress any comic-panel or cartoon-silhouette elements. Shift to corporate editorial aesthetic: structured geometric grid panels, authority typography, navy-charcoal-white dominant palette. Think enterprise consulting deck, NOT media entertainment infographic.`
    : "";
  return `Create a vertical mobile-first infographic card in portrait orientation.
Visual style: ${visual}${toneOverride}
6-section modular layout, thin dividers:
S1 HEADLINE: Bold "${s(d.headline)}" + sub "${s(d.subheadline)}" — if a company/product name appears in headline, render it in accent color
S2 HERO VISUAL (~25% height): Render this SPECIFIC WORKFLOW SCENE: "${s(d.hero_concept)}" — must look like a realistic moment, not a metaphor
S3 CORE TENSION: Large centered VS panel — "${s(d.core_tension)}" with balance scale icon
S4 DUAL PANEL: Left panel labeled "${oppLabel}" (use authoritative neutral blue-grey tint if ${oppLabel} reflects governance prerequisites like 可信流程設計; use warm tint if it reflects pure gains like AI賦能): ${opps} / Right panel labeled "${chalLabel}" (threshold/moat tint — informational, NOT danger-red): ${chal} — right panel = competitive threshold conditions AND epistemic risks; NOT failure alarms
${s5Section}
S6 TAKEAWAY: Full-width accent bar — "${s(d.takeaway)}" — typography as thesis statement; if takeaway contains 煞車 or 可停止 or 用得深, visually bold/accent that word as the article's punchline
Rules: Dense qualitative analysis. No fake statistics. ${s5Rules} S4 right panel = competitive moat (informational), not warning/danger. Premium industry insight format. Vertical social card.`;
}

function promptTechnical(d: Record<string, unknown>, visual: string): string {
  const comps = a(d.components)
    .slice(0, 4)
    .map((c, i) => `Comp${i + 1}:"${s(c)}"`)
    .join(", ");
  const steps = a(d.how_it_works)
    .slice(0, 4)
    .map((x, i) => `Step${i + 1}:"${s(x)}"`)
    .join(" → ");
  const specs = a(d.specs)
    .slice(0, 3)
    .map((x) => {
      const m = x as { label?: string; value?: string };
      return `"${m.label ?? ""}:${m.value ?? ""}"`;
    })
    .join(", ");
  const limits = a(d.limitations)
    .slice(0, 3)
    .map((l) => `"${s(l)}"`)
    .join("; ");
  return `Create a vertical mobile-first infographic card in portrait orientation.
Visual style: ${visual}
7-section modular layout:
S1 HEADLINE: Bold "${s(d.headline)}" + sub "${s(d.subheadline)}"
S2 HERO VISUAL: Technical visualization of "${s(d.hero_concept)}", ~20% height
S3 COMPONENTS: Architecture block diagram panels — ${comps}
S4 HOW IT WORKS: Step-by-step arrow flow — ${steps}
S5 SPECS/BENCHMARKS: Data panels — ${specs}
S6 LIMITATIONS: Warning-style panels — ${limits}
S7 TAKEAWAY: Full-width accent bar — "${s(d.takeaway)}"
Rules: Technical editorial infographic. Architectural diagram aesthetic. Only real specs. Dense but readable. Vertical format.`;
}

function promptNarrative(d: Record<string, unknown>, visual: string): string {
  const tl = (d.timeline as Record<string, string>) ?? {};
  // Support both new (stage1/stage2/stage3 + labels) and old (before/turning_point/after) formats
  const s1 = tl.stage1 || tl.before || "";
  const s2 = tl.stage2 || tl.turning_point || "";
  const s3 = tl.stage3 || tl.after || "";
  const l1 = tl.label1 || "Before";
  const l2 = tl.label2 || "Shift";
  const l3 = tl.label3 || "After";
  // Support both new ({name, route}) and old (string) key_actors formats
  const actors = a(d.key_actors)
    .slice(0, 3)
    .map((x) => {
      if (typeof x === "object" && x !== null) {
        const actor = x as { name?: string; route?: string };
        return actor.route
          ? `"${s(actor.name)}: ${s(actor.route)}"`
          : `"${s(actor.name)}"`;
      }
      return `"${s(x)}"`;
    })
    .join(", ");
  const chain = a(d.cause_effect)
    .slice(0, 3)
    .map((c, i) => `${i + 1}."${s(c)}"`)
    .join(" → ");
  return `Create a vertical mobile-first infographic card in portrait orientation.
Visual style: ${visual}
6-section modular layout:
S1 HEADLINE: Bold "${s(d.headline)}" + sub "${s(d.subheadline)}"
S2 HERO VISUAL: Story scene of "${s(d.hero_concept)}", ~25% height — render the SPECIFIC scene described, not a symbolic illustration
S3 SHIFT MAP: Three-stage horizontal flow with visible stage labels — [${l1}]:"${s1}" → [${l2}]:"${s2}" → [${l3}]:"${s3}". If this is a competitive wave narrative, the three stages represent wave transitions not just time periods.
S4 KEY ACTORS with strategic routes: ${actors} — show each actor's name as primary text with their route/approach as smaller sub-label below
S5 CAUSE & EFFECT: Arrow chain — ${chain}
S6 LESSON: Full-width conclusion bar — "${s(d.lesson)}" — typography should feel like a thesis statement, not a caption
Rules: Narrative editorial card. Story-driven. S3 Shift Map must visually convey competitive wave transition. Actor routes displayed as sub-labels. S6 Lesson bar is the dominant closing element. No invented events. Vertical social format.`;
}

function promptDebate(d: Record<string, unknown>, visual: string): string {
  const pro = (d.pro_side as { label?: string; arguments?: unknown[] }) ?? {};
  const con = (d.con_side as { label?: string; arguments?: unknown[] }) ?? {};
  const proArgs = a(pro.arguments)
    .slice(0, 3)
    .map((x, i) => `P${i + 1}:"${s(x)}"`)
    .join(", ");
  const conArgs = a(con.arguments)
    .slice(0, 3)
    .map((x, i) => `C${i + 1}:"${s(x)}"`)
    .join(", ");
  return `Create a vertical mobile-first infographic card in portrait orientation.
Visual style: ${visual}
7-section modular layout with a strong left-vs-right visual split:
S1 HEADLINE: Bold "${s(d.headline)}" + sub "${s(d.subheadline)}"
S2 HERO VISUAL: Illustration of "${s(d.hero_concept)}", ~20% height
S3 MOTION BANNER: Full-width high-contrast panel — "${s(d.motion)}" with gavel or scales icon
S4 PRO SIDE (left half, green/positive tint): Label "${s(pro.label)}" — ${proArgs}
S5 CON SIDE (right half, red/warning tint): Label "${s(con.label)}" — ${conArgs}
S6 KEY EVIDENCE: Neutral center panel bridging both sides — "${s(d.key_evidence)}"
S7 VERDICT: Full-width conclusion bar — "${s(d.verdict)}"
Rules: Debate card must show clear visual left-right split between pro and con. Symmetrical opposing panels. No invented facts. Qualitative language only unless article states specific data. Vertical social format.`;
}

function promptExplainer(d: Record<string, unknown>, visual: string): string {
  const concepts = a(d.key_concepts)
    .slice(0, 3)
    .map((c, i) => `Concept${i + 1}:"${s(c)}"`)
    .join(", ");
  return `Create a vertical mobile-first infographic card in portrait orientation.
Visual style: ${visual}
6-section modular layout:
S1 HEADLINE: Bold "${s(d.headline)}" + sub "${s(d.subheadline)}"
S2 HERO VISUAL: Conceptual illustration of "${s(d.hero_concept)}", ~25% height
S3 DEFINITION: Two side-by-side panels — "What: ${s(d.what_is_it)}" and "Why matters: ${s(d.why_matters)}"
S4 KEY CONCEPTS: Three rounded concept panels — ${concepts}
S5 ANALOGY: Visual comparison panel — "${s(d.comparison)}"
S6 TAKEAWAY: Full-width bottom bar — "${s(d.takeaway)}"
Rules: Educational explainer card. Accessible visual language. No jargon. Friendly informative tone. Vertical social format.`;
}

// ── Phase 2: Layout-based prompt 函式（coverStyle 決定佈局骨架）────

interface CommonFields {
  headline: string;
  subheadline: string;
  heroConcept: string;
  conclusion: string;
}

// Layout 1: explainer-card — 封面風格 4（知識卡片）
// 教學型：定義→概念→類比→結論
function promptExplainerCard(
  d: Record<string, unknown>,
  visual: string,
  c: CommonFields,
): string {
  // key_concepts from explainer schema; fallback to opportunities/components for other schemas
  const rawConcepts =
    a(d.key_concepts).length > 0
      ? a(d.key_concepts)
      : a(d.opportunities).length > 0
        ? a(d.opportunities)
        : a(d.components);
  const concepts = rawConcepts
    .slice(0, 3)
    .map((x, i) => `Concept${i + 1}:"${s(x)}"`)
    .join(", ");
  // what/why from explainer; fallback to what_is_it/why_matters or core_tension
  const whatPanel = s(d.what_is_it || d.opp_label || "核心概念");
  const whyPanel = s(d.why_matters || d.chal_label || "為何重要");
  const analogy = s(d.comparison || d.core_tension || "");

  return `Create a vertical mobile-first infographic card in portrait orientation.
Visual style: ${visual}
6-section modular layout:
S1 HEADLINE: Bold "${c.headline}" + sub "${c.subheadline}"
S2 HERO VISUAL: Conceptual illustration of "${c.heroConcept}", ~25% height
S3 DEFINITION: Two side-by-side panels — "What: ${whatPanel}" and "Why matters: ${whyPanel}"
S4 KEY CONCEPTS: Three rounded concept panels — ${concepts}
S5 ANALOGY: Visual comparison panel — "${analogy}"
S6 TAKEAWAY: Full-width bottom bar — "${c.conclusion}"
Rules: Educational explainer card. Accessible visual language. No jargon. Friendly informative tone. Vertical social format.`;
}

// Layout 2: analysis-6 — 封面風格 1/2（商業簡報風 / 新聞封面風）
// 分析型：核心張力→雙欄→行動步驟→結論
function promptAnalysis6(
  d: Record<string, unknown>,
  visual: string,
  c: CommonFields,
): string {
  const oppLabel = s(d.opp_label) || "機會";
  const chalLabel = s(d.chal_label) || "門檻";
  // opportunities from industry_analysis; fallback to key_concepts / components
  const rawOpps =
    a(d.opportunities).length > 0
      ? a(d.opportunities)
      : a(d.key_concepts).length > 0
        ? a(d.key_concepts)
        : a(d.components);
  const opps = rawOpps
    .slice(0, 3)
    .map((o, i) => `${i + 1}:"${s(o)}"`)
    .join(" | ");
  // challenges from industry_analysis; fallback to limitations / risks
  const rawChal =
    a(d.challenges).length > 0
      ? a(d.challenges)
      : a(d.limitations).length > 0
        ? a(d.limitations)
        : a(d.risks);
  const chal = rawChal
    .slice(0, 3)
    .map((x, i) => `${i + 1}:"${s(x)}"`)
    .join(" | ");
  const coreTension = s(d.core_tension || d.motion || "");
  // action_steps from industry_analysis; fallback to how_it_works / process
  const rawSteps =
    a(d.action_steps).filter((x) => s(x).length > 1).length > 0
      ? a(d.action_steps).filter((x) => s(x).length > 1)
      : a(d.how_it_works).length > 0
        ? a(d.how_it_works)
        : a(d.process);
  const steps = rawSteps
    .slice(0, 3)
    .map((st, i) => `Step${i + 1}:"${s(st)}"`)
    .join(" → ");
  const s5Section = steps
    ? `S5 THREE-STEP ACTION FLOW (key visual): Render as numbered arrow-connected step panels — ${steps} — each step as a bold action card with direction arrow; this IS the article's concrete implementation roadmap`
    : `S5 KEY INSIGHT: Full-width emphasis panel — "${s(d.key_evidence || d.comparison || "")}"`;
  const isGovernance =
    oppLabel.includes("治理") ||
    oppLabel.includes("可信") ||
    oppLabel.includes("管理") ||
    chalLabel.includes("稽核") ||
    chalLabel.includes("合規");
  const toneOverride = isGovernance
    ? `\nVisual tone override: This is a GOVERNANCE/COMPLIANCE article. Suppress decorative elements. Shift to corporate editorial: structured geometric grid, authority typography, navy-charcoal-white dominant.`
    : "";

  return `Create a vertical mobile-first infographic card in portrait orientation.
Visual style: ${visual}${toneOverride}
6-section modular layout, thin dividers:
S1 HEADLINE: Bold "${c.headline}" + sub "${c.subheadline}" — if a company/product name appears in headline, render it in accent color
S2 HERO VISUAL (~25% height): Render this SPECIFIC WORKFLOW SCENE: "${c.heroConcept}" — must look like a realistic moment, not a metaphor
S3 CORE TENSION: Large centered VS panel — "${coreTension}" with balance scale icon
S4 DUAL PANEL: Left panel labeled "${oppLabel}" (use authoritative neutral blue-grey tint if it reflects governance prerequisites; use warm tint if it reflects pure gains): ${opps} / Right panel labeled "${chalLabel}" (threshold/moat tint — informational, NOT danger-red): ${chal} — right panel = competitive threshold conditions AND epistemic risks; NOT failure alarms
${s5Section}
S6 TAKEAWAY: Full-width accent bar — "${c.conclusion}" — typography as thesis statement; if takeaway contains 煞車 or 可停止 or 用得深, visually bold/accent that word as the article's punchline
Rules: Dense qualitative analysis. No fake statistics. ${steps ? "S5 action flow is the most distinctive visual element — numbered steps with directional arrows." : "S5 key insight panel bridges S3 and S6."} S4 right panel = competitive moat (informational), not warning/danger. Premium industry insight format. Vertical social card.`;
}

// Layout 3: metrics-dashboard — 封面風格 3（交易員面板風）
// 數據儀表板型：指標→預測→結論
function promptMetricsDashboard(
  d: Record<string, unknown>,
  visual: string,
  c: CommonFields,
): string {
  // metrics from data_event; fallback to key_concepts / opportunities as qualitative panels
  const rawMetrics = a(d.metrics);
  let metricsStr: string;
  if (rawMetrics.length > 0) {
    metricsStr = rawMetrics
      .slice(0, 4)
      .map((m) => {
        const x = m as { label?: string; value?: string };
        return `"${x.label ?? ""}: ${x.value ?? ""}"`;
      })
      .join(", ");
  } else {
    const fallbackPanels =
      a(d.opportunities).length > 0 ? a(d.opportunities) : a(d.key_concepts);
    metricsStr = fallbackPanels
      .slice(0, 3)
      .map((x, i) => `Panel${i + 1}:"${s(x)}"`)
      .join(", ");
  }
  // forecast from data_event; fallback to action_steps / how_it_works
  const rawForecast =
    a(d.key_findings).length > 0
      ? a(d.key_findings)
      : a(d.action_steps).length > 0
        ? a(d.action_steps)
        : a(d.challenges);
  const forecast = rawForecast
    .slice(0, 3)
    .map((f, i) => `F${i + 1}:"${s(f)}"`)
    .join(" | ");
  // process / timeline steps
  const rawProcess = a(d.process).length > 0 ? a(d.process) : a(d.how_it_works);
  const processStr = rawProcess
    .slice(0, 4)
    .map((x, i) => `Step${i + 1}:"${s(x)}"`)
    .join(" → ");

  return `Create a vertical mobile-first infographic card in portrait orientation.
Visual style: ${visual}
7-section modular layout, thin glowing divider lines between sections:
S1 HEADLINE: Bold "${c.headline}" + sub "${c.subheadline}"
S2 HERO VISUAL: Illustration of "${c.heroConcept}", ~20% height
S3 KEY METRICS / DATA PANELS: Bold callout panels — ${metricsStr}
S4 TREND / FORECAST PANELS: Three forward-looking indicator panels — ${forecast}
S5 PROCESS / TIMELINE FLOW: Arrow-connected — ${processStr}
S6 RISKS / BARRIERS: Warning-style panels — ${a(
    d.risks || d.limitations || d.challenges,
  )
    .slice(0, 2)
    .map((r) => `"${s(r)}"`)
    .join("; ")}
S7 TAKEAWAY: Full-width accent bar — "${c.conclusion}"
Rules: Dense data-driven infographic. Dashboard aesthetic. Amber/neon callout numbers. No fake statistics — use qualitative phrases if no numeric data. Vertical social card.`;
}

// Layout 4: timeline-story — 封面風格 6（報紙頭版風）
// 故事型：時間軸→演員→因果鏈→結論
function promptTimelineStory(
  d: Record<string, unknown>,
  visual: string,
  c: CommonFields,
): string {
  const tl = (d.timeline as Record<string, string>) ?? {};
  const s1 = tl.stage1 || tl.before || "";
  const s2 = tl.stage2 || tl.turning_point || "";
  const s3 = tl.stage3 || tl.after || "";
  const l1 = tl.label1 || "第一波";
  const l2 = tl.label2 || "轉折點";
  const l3 = tl.label3 || "新局";
  // actors from narrative; fallback to key_players from industry_analysis
  const rawActors =
    a(d.key_actors).length > 0 ? a(d.key_actors) : a(d.key_players);
  const actors = rawActors
    .slice(0, 3)
    .map((x) => {
      if (typeof x === "object" && x !== null) {
        const actor = x as { name?: string; route?: string };
        return actor.route
          ? `"${s(actor.name)}: ${s(actor.route)}"`
          : `"${s(actor.name)}"`;
      }
      return `"${s(x)}"`;
    })
    .join(", ");
  // cause_effect from narrative; fallback to action_steps / process
  const rawChain =
    a(d.cause_effect).length > 0
      ? a(d.cause_effect)
      : a(d.action_steps).length > 0
        ? a(d.action_steps)
        : a(d.process);
  const chain = rawChain
    .slice(0, 3)
    .map((x, i) => `${i + 1}."${s(x)}"`)
    .join(" → ");
  // lesson from narrative; already in c.conclusion

  return `Create a vertical mobile-first infographic card in portrait orientation.
Visual style: ${visual}
6-section modular layout:
S1 HEADLINE: Bold "${c.headline}" + sub "${c.subheadline}"
S2 HERO VISUAL: Story scene of "${c.heroConcept}", ~25% height — render the SPECIFIC scene described, not a symbolic illustration
S3 SHIFT MAP: Three-stage horizontal flow with visible stage labels — [${l1}]:"${s1}" → [${l2}]:"${s2}" → [${l3}]:"${s3}". If this is a competitive wave narrative, the three stages represent wave transitions not just time periods.
S4 KEY ACTORS with strategic routes: ${actors} — show each actor's name as primary text with their route/approach as smaller sub-label below
S5 CAUSE & EFFECT: Arrow chain — ${chain}
S6 LESSON: Full-width conclusion bar — "${c.conclusion}" — typography should feel like a thesis statement, not a caption
Rules: Narrative editorial card. Story-driven. S3 Shift Map must visually convey competitive wave transition. Actor routes displayed as sub-labels. S6 Lesson bar is the dominant closing element. No invented events. Vertical social format.`;
}

// Layout 5: debate-split — 封面風格 5（漫畫解說風）
// 辯論型：正反對立→關鍵證據→裁決
function promptDebateSplit(
  d: Record<string, unknown>,
  visual: string,
  c: CommonFields,
): string {
  const pro = (d.pro_side as { label?: string; arguments?: unknown[] }) ?? {};
  const con = (d.con_side as { label?: string; arguments?: unknown[] }) ?? {};
  // Fallback: if not debate schema, construct left/right from opportunities/challenges
  const proLabel = s(pro.label || d.opp_label || "支持方");
  const conLabel = s(con.label || d.chal_label || "反對方");
  const rawProArgs =
    a(pro.arguments).length > 0 ? a(pro.arguments) : a(d.opportunities);
  const rawConArgs =
    a(con.arguments).length > 0 ? a(con.arguments) : a(d.challenges);
  const proArgs = rawProArgs
    .slice(0, 3)
    .map((x, i) => `P${i + 1}:"${s(x)}"`)
    .join(", ");
  const conArgs = rawConArgs
    .slice(0, 3)
    .map((x, i) => `C${i + 1}:"${s(x)}"`)
    .join(", ");
  const motion = s(d.motion || d.core_tension || "");
  const evidence = s(d.key_evidence || d.comparison || "");

  return `Create a vertical mobile-first infographic card in portrait orientation.
Visual style: ${visual}
7-section modular layout with a strong left-vs-right visual split:
S1 HEADLINE: Bold "${c.headline}" + sub "${c.subheadline}"
S2 HERO VISUAL: Illustration of "${c.heroConcept}", ~20% height
S3 MOTION BANNER: Full-width high-contrast panel — "${motion}" with gavel or scales icon
S4 PRO SIDE (left half, positive/warm tint): Label "${proLabel}" — ${proArgs}
S5 CON SIDE (right half, cautionary/cool tint): Label "${conLabel}" — ${conArgs}
S6 KEY EVIDENCE: Neutral center panel bridging both sides — "${evidence}"
S7 VERDICT: Full-width conclusion bar — "${c.conclusion}"
Rules: Debate card must show clear visual left-right split between pro and con. Symmetrical opposing panels. No invented facts. Qualitative language only unless article states specific data. Vertical social format.`;
}

function buildPromptFromTemplate(
  data: Record<string, unknown>,
  articleStyle: string,
  coverStyle: string,
): string {
  // Phase 2: layoutType 由 coverStyle 決定（佈局），schemaType 由 articleStyle 決定（萃取）
  // 兩者獨立，打破舊的死綁
  const layoutType: LayoutType = COVER_TO_LAYOUT[coverStyle] ?? "analysis-6";
  const visual = VISUAL_SPECS[coverStyle] ?? VISUAL_SPECS["2"];

  // 跨 schema fallback：不同 extraction schema 的欄位名稱不同，需統一取值
  const headline = s(data.headline);
  const subheadline = s(data.subheadline);
  const heroConcept = s(data.hero_concept);
  // takeaway / lesson / verdict → 統一取 "conclusion"
  const conclusion = s(data.takeaway || data.lesson || data.verdict || "");

  switch (layoutType) {
    case "explainer-card":
      return wrapPrompt(
        promptExplainerCard(data, visual, {
          headline,
          subheadline,
          heroConcept,
          conclusion,
        }),
      );
    case "analysis-6":
      return wrapPrompt(
        promptAnalysis6(data, visual, {
          headline,
          subheadline,
          heroConcept,
          conclusion,
        }),
      );
    case "metrics-dashboard":
      return wrapPrompt(
        promptMetricsDashboard(data, visual, {
          headline,
          subheadline,
          heroConcept,
          conclusion,
        }),
      );
    case "timeline-story":
      return wrapPrompt(
        promptTimelineStory(data, visual, {
          headline,
          subheadline,
          heroConcept,
          conclusion,
        }),
      );
    case "debate-split":
      return wrapPrompt(
        promptDebateSplit(data, visual, {
          headline,
          subheadline,
          heroConcept,
          conclusion,
        }),
      );
  }
}

// Wrap every generated prompt with a global no-label rule so gpt-image-2
// does not render section markers (S1, S2 … S7) as visible text in the image.
function wrapPrompt(prompt: string): string {
  return `IMPORTANT: The section markers in this prompt (S1, S2, S3 … S7) are LAYOUT STRUCTURE DIRECTIVES for your composition only. Do NOT render them as visible text, labels, or captions anywhere in the final image.\n\n${prompt}`;
}

// ── Fallback 靜態模板（JSON 萃取失敗時）──────────────────────────────
const FALLBACK_PROMPTS: Record<
  string,
  (title: string, excerpt: string) => string
> = {
  "1": (t, e) =>
    `Dark tech infographic card about "${t}": ${e}. White and navy palette, geometric data panels, consulting aesthetic, modular layout`,
  "2": (t, e) =>
    `Dark editorial infographic card for "${t}": ${e}. Cyan glow lines, modular panels, cybersecurity dashboard aesthetic`,
  "3": (t, e) =>
    `Bloomberg terminal infographic card for "${t}": ${e}. Dark background, glowing green data streams, financial chart elements`,
  "4": (t, e) =>
    `Educational infographic card for "${t}": ${e}. Pastel gradient, flat geometric icons, rounded panels, mobile-friendly`,
  "5": (t, e) =>
    `Comic editorial infographic card for "${t}": ${e}. Deep purple background, colorful panel borders, vibrant bold colors`,
  "6": (t, e) =>
    `Editorial broadsheet infographic card for "${t}": ${e}. Near-black, sepia undertones, high contrast, architectural`,
};

// POST /api/admin/ai-illustrate
// body: { post_id, title, excerpt, cover_style, article_style? }
export async function onRequestPost(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;

  if (!env.OPENAI_API_KEY) {
    console.error("[ai-illustrate] OPENAI_API_KEY not set");
    return json({ error: "OPENAI_API_KEY not configured" }, 503);
  }

  const body = (await request.json()) as {
    post_id?: number;
    title?: string;
    excerpt?: string;
    cover_style?: string;
    article_style?: string;
    layout_type?: LayoutType; // optional override (frontend 未來擴充用)
  };

  const postId = body.post_id;
  const title = body.title?.trim() ?? "";
  const excerpt = body.excerpt?.trim() ?? "";
  const coverStyleKey = body.cover_style ?? "2";
  const articleStyleKey = body.article_style ?? "4";
  // layoutType: 優先 body 顯式指定，其次由 coverStyle 決定
  const layoutType: LayoutType =
    body.layout_type ?? COVER_TO_LAYOUT[coverStyleKey] ?? "analysis-6";
  const schemaType = STYLE_TO_SCHEMA[articleStyleKey] ?? "explainer";
  console.log(
    `[ai-illustrate] START post_id=${postId} title="${title}" coverStyle=${coverStyleKey} articleStyle=${articleStyleKey} layoutType=${layoutType} schemaType=${schemaType}`,
  );

  if (!postId || !title)
    return json({ error: "post_id and title required" }, 400);

  // STEP A：先從 D1 取文章全文（給 GPT 足夠原始資料，避免幻覺）
  console.log(`[ai-illustrate] STEP_A fetching full content from D1`);
  const postRow = await env.BLOG_DB.prepare(
    "SELECT content FROM posts WHERE id = ?",
  )
    .bind(postId)
    .first<{ content: string }>();

  const fullText = postRow ? stripHtml(postRow.content) : excerpt;
  console.log(`[ai-illustrate] STEP_A content_len=${fullText.length}`);

  // STEP B：GPT 萃取結構化 JSON（全文 + 反幻覺規則）
  console.log(`[ai-illustrate] STEP_B extracting JSON`);
  const infographicData = await extractInfographicJson(
    env.OPENAI_API_KEY,
    title,
    fullText,
    articleStyleKey,
    EXTRACT_BUDGET_MS,
  );

  // STEP C：填入對應模板（確定性，無 AI）
  let imgPrompt: string;
  let promptSrc: string;
  const fallbackFn = FALLBACK_PROMPTS[coverStyleKey] ?? FALLBACK_PROMPTS["2"];
  const fastPrompt = fallbackFn(title, excerpt.slice(0, 100));
  if (infographicData) {
    imgPrompt = buildPromptFromTemplate(
      infographicData,
      articleStyleKey,
      coverStyleKey,
    );
    promptSrc = `layout:${layoutType}+schema:${schemaType}`;
    console.log(
      `[ai-illustrate] STEP_C layoutType=${layoutType} schemaType=${schemaType} prompt_len=${imgPrompt.length}`,
    );
  } else {
    imgPrompt = fastPrompt;
    promptSrc = "fallback";
    console.log(`[ai-illustrate] STEP_C using fallback`);
  }

  if (imgPrompt.length > FAST_IMAGE_PROMPT_MAX_LEN) {
    imgPrompt = fastPrompt;
    promptSrc = `${promptSrc}+fast-fallback`;
    console.log(
      `[ai-illustrate] STEP_C prompt too long, switching to fast prompt len=${imgPrompt.length}`,
    );
  }

  if (!postRow) {
    return json({ error: "post not found" }, 404);
  }

  console.log(`[ai-illustrate] STEP_D prepared prompt src=${promptSrc}`);
  return json({
    status: "prepared",
    image_url: null,
    img_prompt: imgPrompt,
    prompt_src: promptSrc,
  });
}
