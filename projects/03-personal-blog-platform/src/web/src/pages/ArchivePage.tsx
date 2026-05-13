import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import { getPosts } from "../lib/api";
import type { Post } from "../types";

export default function ArchivePage() {
  const [searchParams] = useSearchParams();
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const parsedYear = year ? Number.parseInt(year, 10) : null;
  const parsedMonth = month ? Number.parseInt(month, 10) : null;
  const hasValidYear = parsedYear !== null && Number.isFinite(parsedYear);
  const hasValidMonth =
    parsedMonth !== null &&
    Number.isFinite(parsedMonth) &&
    parsedMonth >= 1 &&
    parsedMonth <= 12;

  const label =
    hasValidYear && hasValidMonth
      ? `${parsedYear} 年 ${parsedMonth} 月`
      : hasValidYear
        ? `${parsedYear} 年`
        : "全部文章";

  useEffect(() => {
    setLoading(true);
    getPosts(1, 100)
      .then((res) => {
        let filtered = res.posts;
        if (hasValidYear || hasValidMonth) {
          filtered = filtered.filter((p: Post) => {
            const d = new Date(p.published_at);
            if (Number.isNaN(d.getTime())) return false;
            if (hasValidYear && d.getFullYear() !== parsedYear) return false;
            if (hasValidMonth && d.getMonth() + 1 !== parsedMonth) return false;
            return true;
          });
        }
        setPosts(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hasValidMonth, hasValidYear, parsedMonth, parsedYear]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          to="/"
          className="text-sm mb-3 inline-block transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text-dim)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          ← 首頁
        </Link>
        <h1
          className="text-2xl font-black"
          style={{
            color: "var(--text)",
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          文章歸檔 <span style={{ color: "var(--green)" }}>/ {label}</span>
        </h1>
        {!loading && (
          <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            共 {posts.length} 篇文章
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl h-48 animate-pulse"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p style={{ color: "var(--text-dim)" }}>此時間區間沒有文章。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
