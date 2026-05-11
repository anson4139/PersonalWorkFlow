import type { Env } from "../_types";

interface ArchiveRow {
  year: number;
  month: number;
  count: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const result = await env.BLOG_DB.prepare(
    `
    SELECT
      CAST(strftime('%Y', published_at) AS INTEGER) AS year,
      CAST(strftime('%m', published_at) AS INTEGER) AS month,
      COUNT(*) AS count
    FROM posts
    WHERE status = 'published' AND published_at IS NOT NULL
    GROUP BY year, month
    ORDER BY year DESC, month DESC
  `,
  ).all<ArchiveRow>();

  // Group by year
  const yearMap = new Map<
    number,
    { month: number; label: string; count: number }[]
  >();
  for (const row of result.results) {
    if (!yearMap.has(row.year)) yearMap.set(row.year, []);
    yearMap.get(row.year)!.push({
      year: row.year,
      month: row.month,
      label: `${row.month}月`,
      count: row.count,
    });
  }

  const archive = Array.from(yearMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({ year, months }));

  return Response.json(archive);
};
