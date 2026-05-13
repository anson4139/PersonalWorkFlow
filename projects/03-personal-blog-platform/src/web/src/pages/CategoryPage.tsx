import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";
import PostCard from "../components/PostCard";
import RightSidebar from "../components/RightSidebar";
import { getCategories, getPosts } from "../lib/api";
import type { Category, Post } from "../types";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([getPosts(1, 20, slug), getCategories()])
      .then(([postsRes, cats]) => {
        setPosts(postsRes.posts);
        setCategory(cats.find((c) => c.slug === slug) ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_220px] gap-6 items-start">
        {/* Left Sidebar */}
        <aside className="hidden lg:block sticky top-4">
          <LeftSidebar />
        </aside>

        {/* Main */}
        <main className="min-w-0">
          <div className="mb-8">
            <Link
              to="/"
              className="text-sm mb-2 inline-block transition-colors"
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
              分類：
              <span style={{ color: "var(--green)" }}>
                {category?.name ?? slug}
              </span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              共 {posts.length} 篇文章
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl h-64 animate-pulse"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              此分類尚無文章。
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block sticky top-4">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
}
