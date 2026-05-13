import { Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../lib/api";
import type { Category } from "../types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1
        className="text-2xl font-black mb-8"
        style={{
          color: "var(--text)",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}
      >
        所有分類
      </h1>
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl h-24 animate-pulse"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="rounded-2xl p-5 transition-all group"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--green-border)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            >
              <Layers
                size={20}
                className="mb-3 transition-colors"
                style={{ color: "var(--text-muted)" }}
              />
              <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
                {cat.name}
              </p>
              {cat.post_count !== undefined && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-dim)" }}
                >
                  {cat.post_count} 篇
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
