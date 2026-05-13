import {
  FileText,
  FolderOpen,
  MessageCircle,
  Sparkles,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getAnalytics,
  getGiscusStats,
  getGiscusTimeline,
  getPostsTimeline,
  getStats,
  trackEvent,
  type AnalyticsData,
  type TimelinePoint,
} from "../../lib/adminApi";

interface Stats {
  posts: { total: number; published: number; draft: number };
  categories: number;
  tags: number;
  ai_generated: number;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3 border"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--text-dim)" }}>
          {label}
        </span>
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: color + "20", color }}
        >
          <Icon size={16} />
        </span>
      </div>
      <div>
        <div className="text-3xl font-bold" style={{ color: "var(--text)" }}>
          {value}
        </div>
        {sub && (
          <div
            className="text-xs mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [giscusStats, setGiscusStats] = useState<{
    total_discussions: number;
    total_comments: number;
  } | null>(null);
  const [postsTimeline, setPostsTimeline] = useState<TimelinePoint[]>([]);
  const [giscusTimeline, setGiscusTimeline] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    trackEvent("page_view", "/admin");
    Promise.all([
      getStats().catch((e) => {
        setError(String(e));
        return null;
      }),
      getAnalytics().catch(() => null),
      getGiscusStats().catch(() => null),
      getPostsTimeline().catch(() => null),
      getGiscusTimeline().catch(() => null),
    ])
      .then(([s, a, g, postTrend, commentTrend]) => {
        if (s) setStats(s);
        if (a) setAnalytics(a);
        if (g && !g.error) setGiscusStats(g);
        if (postTrend) setPostsTimeline(postTrend.timeline);
        if (commentTrend && !commentTrend.error)
          setGiscusTimeline(commentTrend.timeline);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
            {new Date().toLocaleDateString("zh-TW", { dateStyle: "full" })}
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          載入中...
        </div>
      )}
      {error && (
        <div className="text-sm text-red-400">載入統計失敗：{error}</div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="文章總數"
            value={stats.posts.total}
            sub={`已發布 ${stats.posts.published}｜草稿 ${stats.posts.draft}`}
            icon={FileText}
            color="var(--green)"
          />
          <StatCard
            label="分類"
            value={stats.categories}
            icon={FolderOpen}
            color="#60a5fa"
          />
          <StatCard
            label="標籤"
            value={stats.tags}
            icon={Tag}
            color="#f59e0b"
          />
          <StatCard
            label="AI 生文"
            value={stats.ai_generated}
            sub="現存 AI 文章篇數"
            icon={Sparkles}
            color="#a78bfa"
          />
        </div>
      )}

      {giscusStats && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Discussion 討論串"
            value={giscusStats.total_discussions}
            sub="Blog Comments 分類（Giscus）"
            icon={MessageCircle}
            color="#38bdf8"
          />
          <StatCard
            label="留言總數"
            value={giscusStats.total_comments}
            sub="所有討論串留言合計"
            icon={MessageCircle}
            color="#34d399"
          />
        </div>
      )}

      <div className="space-y-6">
        <h2
          className="text-sm font-medium"
          style={{ color: "var(--text-dim)" }}
        >
          內容趨勢（近 90 天）
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5 border"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>
              文章發佈趨勢
            </p>
            {postsTimeline.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                尚無發佈記錄
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={postsTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="文章數"
                    stroke="var(--green)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div
            className="rounded-xl p-5 border"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>
              留言趨勢
            </p>
            {giscusTimeline.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                尚無留言記錄
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={giscusTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="留言數"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      {analytics && (
        <div className="space-y-6">
          <h2
            className="text-sm font-medium"
            style={{ color: "var(--text-dim)" }}
          >
            使用者分析（近 90 天）
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 每日登入折線圖 */}
            <div
              className="rounded-xl p-5 border"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
            >
              <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>
                每日登入次數
              </p>
              {analytics.daily_logins.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  尚無登入記錄
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={analytics.daily_logins}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="登入次數"
                      stroke="var(--green)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 功能使用量長條圖 */}
            <div
              className="rounded-xl p-5 border"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
            >
              <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>
                功能使用量
              </p>
              {analytics.action_counts.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  尚無事件記錄
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={analytics.action_counts}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="action"
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="次數"
                      fill="var(--green)"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 活躍用戶清單 */}
          {analytics.top_users.length > 0 && (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="px-5 py-3 border-b text-xs font-medium"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-dim)",
                }}
              >
                活躍用戶（最近 20 名）
              </div>
              <div style={{ background: "var(--surface-2)" }}>
                {analytics.top_users.map((u) => (
                  <div
                    key={u.email}
                    className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0 text-sm"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            u.role === "admin"
                              ? "var(--green)"
                              : "var(--surface)",
                          color:
                            u.role === "admin" ? "#000" : "var(--text-dim)",
                        }}
                      >
                        {u.role}
                      </span>
                      <span style={{ color: "var(--text)" }}>{u.email}</span>
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {u.login_count} 次｜
                      {u.last_login
                        ? new Date(u.last_login).toLocaleDateString("zh-TW")
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
