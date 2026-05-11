import DOMPurify from "dompurify";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clipboard,
  Facebook,
  Share2,
  Tag as TagIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import GiscusComments from "../components/GiscusComments";
import TableOfContents from "../components/TableOfContents";
import { getPost } from "../lib/api";
import type { Post, RelatedPost } from "../types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleCopyText = () => {
    const text = contentRef.current?.innerText ?? "";
    if (!text) return;
    navigator.clipboard
      .writeText(`${post?.title ?? ""}\n\n${text}`)
      .then(() => {
        setTextCopied(true);
        setTimeout(() => setTextCopied(false), 2000);
      });
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setPost(null);
    getPost(slug)
      .then((p) => {
        if (!p) setNotFound(true);
        else setPost(p);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // SEO: update title + og meta
  useEffect(() => {
    if (!post) {
      document.title = "BU AN LA AI.";
      return;
    }
    document.title = `${post.title} \u2014 BU AN LA AI.`;

    const setMeta = (name: string, content: string, prop = false) => {
      const selector = prop
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        if (prop) el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", post.excerpt);
    setMeta("og:title", post.title, true);
    setMeta("og:description", post.excerpt, true);
    setMeta("og:type", "article", true);
    setMeta("og:url", window.location.href, true);
    if (post.cover_url) setMeta("og:image", post.cover_url, true);
    setMeta("article:published_time", post.published_at, true);

    return () => {
      document.title = "BU AN LA AI.";
    };
  }, [post]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div
          className="h-8 rounded animate-pulse mb-4 w-3/4"
          style={{ background: "var(--surface)" }}
        />
        <div
          className="h-4 rounded animate-pulse mb-2 w-1/3"
          style={{ background: "var(--surface)" }}
        />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded animate-pulse"
              style={{ background: "var(--surface)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p
          className="text-5xl font-black mb-4"
          style={{
            color: "var(--surface-3)",
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          404
        </p>
        <p className="mb-6" style={{ color: "var(--text-dim)" }}>
          找不到這篇文章。
        </p>
        <button
          onClick={() => navigate("/")}
          className="text-sm font-semibold transition-colors"
          style={{ color: "var(--green)" }}
        >
          ← 回首頁
        </button>
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="xl:grid xl:grid-cols-[1fr_220px] xl:gap-12">
        {/* ---- Article ---- */}
        <article>
          {/* Back */}
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm mb-6 transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-dim)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            <ArrowLeft size={14} />
            所有文章
          </Link>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
                style={{
                  background: "var(--green-dim)",
                  color: "var(--green-light)",
                  border: "1px solid var(--green-border)",
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1
            className="text-3xl font-black leading-tight mb-4"
            style={{ color: "var(--text)" }}
          >
            {post.title}
          </h1>

          {/* Meta */}
          <div
            className="flex flex-wrap items-center gap-4 text-sm border-b pb-6 mb-8"
            style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
          >
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              {formatDate(post.published_at)}
            </span>
            {post.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <TagIcon size={13} />
                {post.tags.map((t) => (
                  <Link
                    key={t.id}
                    to={`/tags/${t.slug}`}
                    className="transition-colors"
                    style={{ color: "inherit" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--green-light)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    #{t.name}
                  </Link>
                ))}
              </span>
            )}
            {/* Share */}
            <div className="ml-auto flex items-center gap-2">
              <a
                href={fbShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-colors"
                style={{
                  background: "rgba(59,130,246,0.12)",
                  color: "#60a5fa",
                  border: "1px solid rgba(59,130,246,0.25)",
                }}
              >
                <Facebook size={12} />
                分享
              </a>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-colors"
                style={{
                  background: linkCopied
                    ? "var(--green-dim)"
                    : "var(--surface)",
                  color: linkCopied ? "var(--green)" : "var(--text-dim)",
                  border: `1px solid ${linkCopied ? "var(--green-border)" : "var(--border)"}`,
                }}
              >
                {linkCopied ? <Check size={12} /> : <Share2 size={12} />}
                {linkCopied ? "已複製！" : "複製連結"}
              </button>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-colors"
                style={{
                  background: textCopied
                    ? "var(--green-dim)"
                    : "var(--surface)",
                  color: textCopied ? "var(--green)" : "var(--text-dim)",
                  border: `1px solid ${textCopied ? "var(--green-border)" : "var(--border)"}`,
                }}
              >
                {textCopied ? <Check size={12} /> : <Clipboard size={12} />}
                {textCopied ? "已複製！" : "複製文字"}
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            className="prose prose-invert max-w-none prose-headings:font-black prose-a:text-[#76b900] prose-code:px-1.5 prose-code:rounded prose-pre:bg-[#161616]"
            style={
              {
                "--tw-prose-code-bg": "var(--surface-3)",
              } as React.CSSProperties
            }
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(post.content),
            }}
          />

          {/* Tags footer */}
          {post.tags.length > 0 && (
            <div
              className="mt-10 pt-6 border-t flex flex-wrap gap-2"
              style={{ borderColor: "var(--border)" }}
            >
              {post.tags.map((t) => (
                <Link
                  key={t.id}
                  to={`/tags/${t.slug}`}
                  className="text-xs px-3 py-1 rounded-full transition-colors"
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
                  #{t.name}
                </Link>
              ))}
            </div>
          )}

          {/* Prev / Next navigation */}
          {(post.prev_post || post.next_post) && (
            <div
              className="mt-10 pt-6 border-t grid grid-cols-2 gap-4"
              style={{ borderColor: "var(--border)" }}
            >
              {post.prev_post ? (
                <Link
                  to={`/posts/${post.prev_post.slug}`}
                  className="flex flex-col gap-1 rounded-xl p-4 transition-colors"
                  style={{
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--green-border)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <ArrowLeft size={12} />
                    上一篇
                  </span>
                  <span
                    className="text-sm font-semibold leading-snug line-clamp-2"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {post.prev_post.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {post.next_post ? (
                <Link
                  to={`/posts/${post.next_post.slug}`}
                  className="flex flex-col items-end gap-1 rounded-xl p-4 transition-colors"
                  style={{
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--green-border)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    下一篇
                    <ArrowRight size={12} />
                  </span>
                  <span
                    className="text-sm font-semibold leading-snug text-right line-clamp-2"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {post.next_post.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>
          )}

          {/* Related Posts */}
          {post.related_posts && post.related_posts.length > 0 && (
            <div
              className="mt-10 pt-6 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <h2
                className="text-base font-bold mb-3"
                style={{ color: "var(--text-dim)" }}
              >
                相關文章
              </h2>
              <div className="space-y-2">
                {(post.related_posts as RelatedPost[]).map((r) => (
                  <Link
                    key={r.slug}
                    to={`/posts/${r.slug}`}
                    className="block rounded-xl p-4 transition-colors"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--green-border)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    <p
                      className="text-sm font-semibold line-clamp-2 mb-1"
                      style={{ color: "var(--text)" }}
                    >
                      {r.title}
                    </p>
                    <p
                      className="text-xs line-clamp-2 mb-1"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {r.excerpt}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDate(r.published_at)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Giscus comments */}
          <div
            className="mt-14 pt-10 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "var(--text)" }}
            >
              留言討論
            </h2>
            <GiscusComments />
          </div>
        </article>

        {/* ---- TOC sidebar (xl+ only) ---- */}
        <aside className="hidden xl:block">
          <TableOfContents contentRef={contentRef} />
        </aside>
      </div>
    </div>
  );
}
