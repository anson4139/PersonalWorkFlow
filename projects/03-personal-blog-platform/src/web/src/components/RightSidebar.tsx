import { Tag as TagIcon, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPosts, getTags } from "../lib/api";
import type { Post, Tag } from "../types";
import AuthorCard from "./AuthorCard";

const cardStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
};

export default function RightSidebar() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [hotPosts, setHotPosts] = useState<Post[]>([]);

  useEffect(() => {
    getTags().then(setTags).catch(console.error);
    getPosts(1, 5)
      .then((res) => setHotPosts(res.posts))
      .catch(console.error);
  }, []);

  return (
    <aside className="space-y-4">
      <AuthorCard />

      {/* Hot Posts */}
      {hotPosts.length > 0 && (
        <div className="rounded-xl p-4" style={cardStyle}>
          <div
            className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            <TrendingUp size={12} style={{ color: "var(--green)" }} />
            熱門文章
          </div>
          <ul className="space-y-3">
            {hotPosts.map((post, i) => (
              <li key={post.id} className="flex items-start gap-2.5">
                <span
                  className="text-xs font-black mt-0.5 w-4 shrink-0 text-right"
                  style={{
                    color: i < 3 ? "var(--green)" : "var(--text-muted)",
                  }}
                >
                  {i + 1}
                </span>
                <Link
                  to={`/posts/${post.slug}`}
                  className="text-xs leading-snug transition-colors"
                  style={{
                    color: "var(--text-dim)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--green-light)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-dim)")
                  }
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tag Cloud */}
      {tags.length > 0 && (
        <div className="rounded-xl p-4" style={cardStyle}>
          <div
            className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            <TagIcon size={12} style={{ color: "var(--green)" }} />
            標籤
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tags/${tag.slug}`}
                className="text-xs px-2 py-0.5 rounded-full transition-colors"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--green-border)";
                  e.currentTarget.style.color = "var(--green-light)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-dim)";
                }}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
