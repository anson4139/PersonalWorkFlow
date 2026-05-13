import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import LeftSidebar from "../components/LeftSidebar";
import PostCard from "../components/PostCard";
import RightSidebar from "../components/RightSidebar";
import { getCategories, getPosts } from "../lib/api";
import type { Category, Post } from "../types";

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(
    undefined,
  );
  const perPage = 6;

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    getPosts(page, perPage, activeCategory)
      .then((res) => {
        setPosts(res.posts);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, activeCategory]);

  const handleCategoryChange = (slug?: string) => {
    setActiveCategory(slug);
    setPage(1);
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_220px] gap-6 items-start">
        {/* Left Sidebar */}
        <aside className="hidden lg:block sticky top-4">
          <LeftSidebar activeCategory={activeCategory} />
        </aside>

        {/* Main Feed */}
        <main className="min-w-0">
          {/* Pill Filter Bar */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={
                !activeCategory
                  ? { background: "var(--green)", color: "#000" }
                  : {
                      background: "var(--surface-2)",
                      color: "var(--text-dim)",
                      border: "1px solid var(--border)",
                    }
              }
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.slug)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                style={
                  activeCategory === cat.slug
                    ? { background: "var(--green)", color: "#000" }
                    : {
                        background: "var(--surface-2)",
                        color: "var(--text-dim)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {cat.name}
                {cat.post_count !== undefined && (
                  <span className="ml-1 opacity-60">{cat.post_count}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl h-56 animate-pulse"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              此分類目前沒有文章。
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      border: "1px solid var(--border)",
                      color: "var(--text-dim)",
                    }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                        style={
                          p === page
                            ? { backgroundColor: "var(--green)", color: "#000" }
                            : {
                                border: "1px solid var(--border)",
                                color: "var(--text-dim)",
                              }
                        }
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      border: "1px solid var(--border)",
                      color: "var(--text-dim)",
                    }}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </>
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
