import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import { getPosts } from "../lib/api";
import type { Post } from "../types";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputVal, setInputVal] = useState(q);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!q.trim()) {
      setPosts([]);
      return;
    }
    setLoading(true);
    getPosts(1, 20, undefined, undefined, q)
      .then((res) => setPosts(res.posts))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1
        className="text-2xl font-black mb-6"
        style={{
          color: "var(--text)",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}
      >
        搜尋文章
      </h1>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="輸入關鍵字..."
          className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--green)", color: "#000" }}
        >
          <Search size={15} />
          搜尋
        </button>
      </form>

      {/* Results */}
      {q && (
        <p className="text-sm mb-5" style={{ color: "var(--text-dim)" }}>
          「
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            {q}
          </span>
          」的搜尋結果：共 <span className="font-semibold">{posts.length}</span>{" "}
          篇
        </p>
      )}

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
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : q ? (
        <div className="text-center py-16" style={{ color: "var(--text-dim)" }}>
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">找不到相關文章，試試其他關鍵字？</p>
          <Link
            to="/"
            className="mt-4 inline-block text-sm font-semibold transition-colors"
            style={{ color: "var(--green)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--green-light)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--green)")}
          >
            瀏覽所有文章
          </Link>
        </div>
      ) : null}
    </div>
  );
}
