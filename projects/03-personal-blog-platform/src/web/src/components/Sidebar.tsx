import { Layers, Tag as TagIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, getTags } from "../lib/api";
import type { Category, Tag } from "../types";
import AuthorCard from "./AuthorCard";

const cardStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
};

export default function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getTags().then(setTags).catch(console.error);
  }, []);

  return (
    <aside className="space-y-6">
      <AuthorCard />

      {/* Categories */}
      {categories.length > 0 && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div
            className="flex items-center gap-2 mb-3 text-sm font-bold"
            style={{ color: "var(--text)" }}
          >
            <Layers size={15} style={{ color: "var(--green)" }} />
            文章分類
          </div>
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  to={`/categories/${cat.slug}`}
                  className="flex items-center justify-between text-sm transition-colors"
                  style={{ color: "var(--text-dim)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--green-light)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-dim)")
                  }
                >
                  <span>{cat.name}</span>
                  {cat.post_count !== undefined && (
                    <span
                      className="text-xs rounded-full px-2 py-0.5"
                      style={{
                        background: "var(--surface-3)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {cat.post_count}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div
            className="flex items-center gap-2 mb-3 text-sm font-bold"
            style={{ color: "var(--text)" }}
          >
            <TagIcon size={15} style={{ color: "var(--green)" }} />
            標籤雲
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tags/${tag.slug}`}
                className="text-xs px-2.5 py-1 rounded-full transition-colors"
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
