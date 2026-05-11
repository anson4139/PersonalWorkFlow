import { Calendar, Tag as TagIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { Post } from "../types";

interface PostCardProps {
  post: Post;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article
      className="rounded-2xl overflow-hidden transition-all group"
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
      {/* Cover image / accent bar */}
      {post.cover_url ? (
        <img
          src={post.cover_url}
          alt={post.title}
          className="w-full h-44 object-cover"
        />
      ) : (
        <div
          className="w-full h-1.5 group-hover:h-2.5 transition-all"
          style={{ backgroundColor: "var(--green)" }}
        />
      )}

      <div className="p-5">
        {/* Categories */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="text-xs font-semibold px-2 py-0.5 rounded-full transition-colors"
              style={{
                background: "var(--green-dim)",
                color: "var(--green-light)",
                border: "1px solid var(--green-border)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Title */}
        <h2
          className="text-lg font-bold leading-snug mb-2 transition-colors"
          style={{ color: "var(--text)" }}
        >
          <Link
            to={`/posts/${post.slug}`}
            style={{ color: "inherit" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
          >
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p
          className="text-sm leading-relaxed mb-4 line-clamp-3"
          style={{ color: "var(--text-dim)" }}
        >
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <Calendar size={12} />
            <span>{formatDate(post.published_at)}</span>
          </div>
          {post.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <TagIcon size={11} style={{ color: "var(--text-muted)" }} />
              {post.tags.slice(0, 2).map((t) => (
                <Link
                  key={t.id}
                  to={`/tags/${t.slug}`}
                  className="text-xs transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--green-light)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          to={`/posts/${post.slug}`}
          className="mt-4 inline-block text-sm font-semibold transition-colors"
          style={{ color: "var(--green)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--green-light)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--green)")}
        >
          繼續閱讀 →
        </Link>
      </div>
    </article>
  );
}
