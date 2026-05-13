import type { Env } from "../_types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

interface InsightRow {
  id: number;
  week_start: string;
  entity: string;
  entity_group: string;
  hit_count: number;
  direction: string;
  key_events: string | null; // JSON string
  impact: string;
  data_source: string;
  model_ver: string | null;
  created_at: string;
}

const SOURCE_SUFFIX_PATTERN =
  "(?:msn|yahoo(?:奇摩)?\\s*(?:新聞|股市)?|聯合\\s*(?:新聞網|報)|udn|經濟\\s*日報|ettoday\\s*(?:財經\\s*雲)?|鉅亨網|anue\\s*鉅亨|moneydj\\s*(?:理財網)?|(?:news\\.)?cnyes\\.com|工商\\s*時報|ctee|中時\\s*新聞網|自由\\s*財經|中央社|鏡週刊\\s*(?:mirror\\s*media)?|mirror\\s*media|財訊|今周刊|商周|數位\\s*時代|technews\\s*(?:科技\\s*新報)?|科技\\s*新報|tradingkey|investing\\.com|cmoney(?:投資網誌?)?|股市爆料同學會|非凡新聞|tvbs|三立\\s*新聞網|setn|東森\\s*新聞|華視\\s*新聞網|公視\\s*新聞網|民視\\s*新聞網)";

function stripSourceSuffix(title: string) {
  const sourceSuffix = new RegExp(
    `(?:\\s*(?:[-|｜])\\s*|\\s+)${SOURCE_SUFFIX_PATTERN}\\s*$`,
    "i",
  );
  let current = title.trim();
  let next = current.replace(sourceSuffix, "").trim();
  while (next && next !== current) {
    current = next;
    next = current.replace(sourceSuffix, "").trim();
  }
  const [headline, ...metadata] = current.split(/\s*[|｜]\s*/);
  if (metadata.length > 0 && headline.trim().length >= 12) {
    return headline.trim();
  }
  return current;
}

function normalizeEventTitle(title: string) {
  return stripSourceSuffix(title)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u3000"'“”‘’|｜:：,，.。!！?？;；、\-—–_()/（）【】]+/g, "");
}

function parseKeyEvents(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed
      .map((item) => {
        if (typeof item === "string") return stripSourceSuffix(item);
        if (item && typeof item.title === "string") {
          return stripSourceSuffix(item.title);
        }
        return "";
      })
      .filter((title) => {
        const key = normalizeEventTitle(title);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  } catch {
    return [];
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const entity = url.searchParams.get("entity"); // filter by company
  const impact = url.searchParams.get("impact"); // "high"|"medium"|"low"
  const weeks = Math.min(parseInt(url.searchParams.get("weeks") ?? "16"), 52);

  // Compute start boundary: N weeks back from today
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  let sql = `
    SELECT id, week_start, entity, entity_group, hit_count, direction,
           key_events, impact, data_source, model_ver, created_at
    FROM insights
    WHERE week_start >= ?
  `;
  const bindings: (string | number)[] = [cutoffStr];

  if (entity) {
    sql += ` AND entity = ?`;
    bindings.push(entity);
  }
  if (impact) {
    sql += ` AND impact = ?`;
    bindings.push(impact);
  }

  sql += ` ORDER BY week_start DESC, hit_count DESC`;

  try {
    const result = await env.BLOG_DB.prepare(sql)
      .bind(...bindings)
      .all<InsightRow>();
    const rows = (result.results ?? []).map((r) => ({
      ...r,
      key_events: parseKeyEvents(r.key_events),
    }));

    // Also return distinct entities for filter UI
    const entityResult = await env.BLOG_DB.prepare(
      `SELECT DISTINCT entity, entity_group FROM insights WHERE week_start >= ? ORDER BY entity`,
    )
      .bind(cutoffStr)
      .all<{ entity: string; entity_group: string }>();

    return Response.json(
      {
        insights: rows,
        entities: entityResult.results ?? [],
        meta: { weeks, cutoff: cutoffStr, total: rows.length },
      },
      { headers: CORS_HEADERS },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: msg },
      { status: 500, headers: CORS_HEADERS },
    );
  }
};
