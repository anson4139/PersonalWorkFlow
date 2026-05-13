import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArchive, getCategories } from "../lib/api";
import type { ArchiveGroup, Category } from "../types";

const cardStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
};

interface Props {
  activeCategory?: string;
}

export default function LeftSidebar({ activeCategory }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [archive, setArchive] = useState<ArchiveGroup[]>([]);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getArchive()
      .then((data) => {
        setArchive(data);
        if (data.length > 0) setExpandedYears(new Set([data[0].year]));
      })
      .catch(console.error);
  }, []);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  return (
    <aside className="space-y-4">
      {/* Categories */}
      <div className="rounded-xl p-4" style={cardStyle}>
        <div
          className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          <Layers size={12} style={{ color: "var(--green)" }} />
          分類
        </div>
        <ul className="space-y-0.5">
          <li>
            <Link
              to="/"
              className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg transition-colors"
              style={
                !activeCategory
                  ? {
                      background: "var(--green-dim)",
                      color: "var(--green-light)",
                    }
                  : { color: "var(--text-dim)" }
              }
            >
              <span>全部文章</span>
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                to={`/categories/${cat.slug}`}
                className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg transition-colors"
                style={
                  activeCategory === cat.slug
                    ? {
                        background: "var(--green-dim)",
                        color: "var(--green-light)",
                      }
                    : { color: "var(--text-dim)" }
                }
                onMouseEnter={(e) => {
                  if (activeCategory !== cat.slug)
                    e.currentTarget.style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== cat.slug)
                    e.currentTarget.style.color = "var(--text-dim)";
                }}
              >
                <span>{cat.name}</span>
                {cat.post_count !== undefined && (
                  <span
                    className="text-xs rounded-full px-1.5 py-0.5"
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

      {/* Archive */}
      {archive.length > 0 && (
        <div className="rounded-xl p-4" style={cardStyle}>
          <div
            className="mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            文章歸檔
          </div>
          <ul className="space-y-0.5">
            {archive.map((group) => (
              <li key={group.year}>
                <button
                  onClick={() => toggleYear(group.year)}
                  className="flex items-center justify-between w-full text-sm px-2 py-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--text-dim)" }}
                >
                  <span className="font-semibold">{group.year}</span>
                  {expandedYears.has(group.year) ? (
                    <ChevronDown size={13} />
                  ) : (
                    <ChevronRight size={13} />
                  )}
                </button>
                {expandedYears.has(group.year) && (
                  <ul className="pl-3 mt-0.5 space-y-0.5">
                    {group.months.map((m) => (
                      <li key={m.month}>
                        <Link
                          to={`/archive?year=${m.year}&month=${m.month}`}
                          className="flex items-center justify-between text-xs px-2 py-1 rounded-lg transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "var(--green-light)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "var(--text-muted)")
                          }
                        >
                          <span>{m.label}</span>
                          <span>{m.count} 篇</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
