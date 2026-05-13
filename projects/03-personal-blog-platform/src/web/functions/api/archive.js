export const onRequestGet = async ({ env }) => {
    const result = await env.BLOG_DB.prepare(`
    SELECT
      CAST(strftime('%Y', published_at) AS INTEGER) AS year,
      CAST(strftime('%m', published_at) AS INTEGER) AS month,
      COUNT(*) AS count
    FROM posts
    WHERE status = 'published' AND published_at IS NOT NULL
    GROUP BY year, month
    ORDER BY year DESC, month DESC
  `).all();
    // Group by year
    const yearMap = new Map();
    for (const row of result.results) {
        if (!yearMap.has(row.year))
            yearMap.set(row.year, []);
        yearMap.get(row.year).push({
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
