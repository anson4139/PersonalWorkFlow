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

function normalizeEventTitle(title: string) {
  return title
    .normalize("NFKC")
    .toLowerCase()
    .replace(
      /\s+[-|｜]\s*(msn|聯合新聞網|經濟日報|ettoday財經雲|yahoo股市|鉅亨網|moneydj理財網|cnyes\.com)$/i,
      "",
    )
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
        if (typeof item === "string") return item;
        if (item && typeof item.title === "string") return item.title;
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
