import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Discussion,
  DiscussionComment,
  getDiscussions,
  replyDiscussion,
} from "../../lib/adminApi";

// ── 時間格式化 ────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── 單則留言 + 回覆區塊 ────────────────────────────────────────────────────────
function CommentItem({
  comment,
  discussionId,
  onReplied,
}: {
  comment: DiscussionComment;
  discussionId: string;
  onReplied: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleReply() {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await replyDiscussion({
        discussionId,
        body: replyBody.trim(),
        replyToId: comment.id,
      });
      setReplyBody("");
      setShowReply(false);
      onReplied();
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rounded-lg p-3 mb-2"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        {comment.author?.avatarUrl && (
          <img
            src={comment.author.avatarUrl}
            alt={comment.author.login}
            className="w-6 h-6 rounded-full"
          />
        )}
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {comment.author?.login ?? "unknown"}
        </span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          {formatDate(comment.createdAt)}
        </span>
      </div>

      {/* Body */}
      <p
        className="text-sm whitespace-pre-wrap mb-2"
        style={{ color: "var(--text)" }}
      >
        {comment.body}
      </p>

      {/* Nested replies */}
      {comment.replies.nodes.length > 0 && (
        <div className="ml-6 mt-2 space-y-2">
          {comment.replies.nodes.map((r) => (
            <div
              key={r.id}
              className="rounded p-2"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                {r.author?.avatarUrl && (
                  <img
                    src={r.author.avatarUrl}
                    alt={r.author.login}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {r.author?.login ?? "unknown"}
                </span>
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {formatDate(r.createdAt)}
                </span>
              </div>
              <p
                className="text-xs whitespace-pre-wrap"
                style={{ color: "var(--text)" }}
              >
                {r.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reply toggle */}
      <button
        onClick={() => {
          setShowReply((v) => !v);
          setError(null);
          setTimeout(() => textareaRef.current?.focus(), 50);
        }}
        className="mt-2 text-xs px-2 py-1 rounded transition-opacity hover:opacity-70"
        style={{
          background: "var(--green-dim)",
          color: "var(--green)",
          border: "1px solid var(--green)",
        }}
      >
        回覆此留言
      </button>

      {showReply && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="輸入回覆內容…"
            rows={3}
            className="w-full text-sm rounded px-2 py-1.5 resize-y"
            style={{
              background: "var(--bg)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          />
          {error && (
            <p className="text-xs" style={{ color: "#f87171" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleReply}
              disabled={submitting || !replyBody.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
              style={{ background: "var(--green)", color: "#000" }}
            >
              <Send size={12} />
              {submitting ? "送出中…" : "送出回覆"}
            </button>
            <button
              onClick={() => {
                setShowReply(false);
                setReplyBody("");
                setError(null);
              }}
              className="px-3 py-1.5 rounded text-xs hover:opacity-70"
              style={{
                background: "var(--surface)",
                color: "var(--text-dim)",
                border: "1px solid var(--border)",
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 單篇 Discussion 折疊區塊 ───────────────────────────────────────────────────
function DiscussionCard({
  discussion,
  postTitle,
  onReplied,
}: {
  discussion: Discussion;
  postTitle?: string;
  onReplied: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTopLevel, setShowTopLevel] = useState(false);
  const [topBody, setTopBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTopLevelReply() {
    if (!topBody.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await replyDiscussion({
        discussionId: discussion.id,
        body: topBody.trim(),
      });
      setTopBody("");
      setShowTopLevel(false);
      onReplied();
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rounded-xl mb-3"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3 min-w-0">
          <MessageCircle
            size={16}
            style={{ color: "var(--green)", flexShrink: 0 }}
          />
          <div className="flex flex-col min-w-0">
            {postTitle && (
              <span
                className="text-sm font-semibold truncate leading-tight"
                style={{ color: "var(--text)" }}
              >
                {postTitle}
              </span>
            )}
            <span
              className="text-xs truncate"
              style={{
                color: postTitle ? "var(--text-dim)" : "var(--text)",
                fontWeight: postTitle ? 400 : 500,
              }}
            >
              {discussion.title}
            </span>
          </div>
          <span
            className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: "var(--green-dim)", color: "var(--green)" }}
          >
            {discussion.comments.totalCount} 則
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
            {formatDate(discussion.updatedAt)}
          </span>
          <a
            href={discussion.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:opacity-70"
            style={{ color: "var(--text-dim)" }}
          >
            <ExternalLink size={13} />
          </a>
          {expanded ? (
            <ChevronUp size={15} style={{ color: "var(--text-dim)" }} />
          ) : (
            <ChevronDown size={15} style={{ color: "var(--text-dim)" }} />
          )}
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4">
          {discussion.comments.nodes.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              尚無留言
            </p>
          ) : (
            discussion.comments.nodes.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                discussionId={discussion.id}
                onReplied={onReplied}
              />
            ))
          )}

          {/* Top-level new comment */}
          <div className="mt-3">
            {showTopLevel ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={topBody}
                  onChange={(e) => setTopBody(e.target.value)}
                  placeholder="新增頂層留言…"
                  rows={3}
                  className="w-full text-sm rounded px-2 py-1.5 resize-y"
                  style={{
                    background: "var(--bg)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                />
                {error && (
                  <p className="text-xs" style={{ color: "#f87171" }}>
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleTopLevelReply}
                    disabled={submitting || !topBody.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                    style={{ background: "var(--green)", color: "#000" }}
                  >
                    <Send size={12} />
                    {submitting ? "送出中…" : "新增留言"}
                  </button>
                  <button
                    onClick={() => {
                      setShowTopLevel(false);
                      setTopBody("");
                      setError(null);
                    }}
                    className="px-3 py-1.5 rounded text-xs hover:opacity-70"
                    style={{
                      background: "var(--bg)",
                      color: "var(--text-dim)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowTopLevel(true)}
                className="text-xs px-3 py-1.5 rounded hover:opacity-70"
                style={{
                  background: "var(--bg)",
                  color: "var(--text-dim)",
                  border: "1px solid var(--border)",
                }}
              >
                + 新增留言
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 主頁面 ────────────────────────────────────────────────────────────────────
export default function CommentsPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [postTitles, setPostTitles] = useState<Record<string, string>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getDiscussions();
      if (data.error) setError(data.error);
      setDiscussions(data.discussions);
      setPostTitles(data.postTitles ?? {});
      setTotal(data.total);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Title bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            留言管理
          </h1>
          {!loading && (
            <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
              共 {total} 篇討論（Blog Comments · GitHub Discussions）
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm hover:opacity-70 disabled:opacity-50"
          style={{
            background: "var(--surface)",
            color: "var(--text-dim)",
            border: "1px solid var(--border)",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          重新整理
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm"
          style={{
            background: "#450a0a",
            color: "#fca5a5",
            border: "1px solid #7f1d1d",
          }}
        >
          {error.includes("write:discussion") ||
          error.includes("Resource not accessible") ? (
            <>
              <strong>PAT 權限不足：</strong>請至 GitHub Settings → Developer
              settings → Personal access tokens，確認 token 已包含{" "}
              <code className="font-mono">write:discussion</code> scope。
              <br />
              <span className="mt-1 block">{error}</span>
            </>
          ) : (
            error
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          className="flex items-center justify-center py-16"
          style={{ color: "var(--text-dim)" }}
        >
          <RefreshCw size={20} className="animate-spin mr-2" />
          載入中…
        </div>
      )}

      {/* Empty */}
      {!loading && !error && discussions.length === 0 && (
        <p className="text-center py-16" style={{ color: "var(--text-dim)" }}>
          目前沒有任何 Discussion 留言
        </p>
      )}

      {/* List */}
      {!loading && discussions.length > 0 && (
        <div>
          {discussions.map((d) => (
            <DiscussionCard
              key={d.id}
              discussion={d}
              postTitle={postTitles[d.title]}
              onReplied={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
