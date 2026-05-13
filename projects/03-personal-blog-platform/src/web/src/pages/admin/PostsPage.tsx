import { Eye, EyeOff, PenLine, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  deletePost,
  getAdminPosts,
  trackEvent,
  type AdminPost,
} from "../../lib/adminApi";

const STATUS_LABEL: Record<string, string> = {
  published: "已發布",
  draft: "草稿",
  scheduled: "排程",
};
const STATUS_COLOR: Record<string, string> = {
  published: "var(--green)",
  draft: "var(--text-muted)",
  scheduled: "#f59e0b",
};

export default function PostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = (p = page, f = filter) => {
    setLoading(true);
    setSelected(new Set());
    if (p === 1 && f === filter) trackEvent("page_view", "/admin/posts");
    getAdminPosts(p, f)
      .then((data) => {
        setPosts(data.posts);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1, filter);
  }, [filter]);
  useEffect(() => {
    load(page, filter);
  }, [page]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`確定刪除「${title}」？此操作不可復原。`)) return;
    trackEvent("post_delete", "/admin/posts", { post_id: id });
    await deletePost(id);
    load(page, filter);
  };

  const allSelected =
    posts.length > 0 && posts.every((p) => selected.has(p.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(posts.map((p) => p.id)));
  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`確定刪除選取的 ${selected.size} 篇文章？此操作不可復原。`))
      return;
    setBulkDeleting(true);
    await Promise.all(
      [...selected].map((id) => deletePost(id).catch(() => null)),
    );
    setBulkDeleting(false);
    load(page, filter);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          文章管理
        </h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
              style={{
                background: "#ef4444",
                color: "#fff",
                opacity: bulkDeleting ? 0.5 : 1,
              }}
            >
              <Trash2 size={13} />
              {bulkDeleting ? "刪除中..." : `刪除選取 (${selected.size})`}
            </button>
          )}
          <Link
            to="/admin/posts/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ background: "var(--green)", color: "#000" }}
          >
            <Plus size={14} />
            新增文章
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="flex gap-2 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {[
          ["", "全部"],
          ["published", "已發布"],
          ["draft", "草稿"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => {
              setFilter(val);
              setPage(1);
            }}
            className="px-4 py-2 text-sm transition-colors border-b-2 -mb-px"
            style={{
              borderColor: filter === val ? "var(--green)" : "transparent",
              color: filter === val ? "var(--green)" : "var(--text-dim)",
            }}
          >
            {label}
          </button>
        ))}
        <div
          className="ml-auto flex items-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          共 {total} 篇
        </div>
      </div>

      {/* Table / Cards */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--border)" }}
      >
        {loading ? (
          <div
            className="py-12 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            載入中...
          </div>
        ) : posts.length === 0 ? (
          <div
            className="py-12 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            沒有文章
          </div>
        ) : (
          <>
            {/* ── Desktop table (md+) ── */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--border)",
                  }}
                >
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th
                    className="text-left px-5 py-3 font-medium"
                    style={{ color: "var(--text-dim)" }}
                  >
                    標題
                  </th>
                  <th
                    className="text-left px-3 py-3 font-medium w-20"
                    style={{ color: "var(--text-dim)" }}
                  >
                    狀態
                  </th>
                  <th
                    className="text-left px-3 py-3 font-medium w-36"
                    style={{ color: "var(--text-dim)" }}
                  >
                    更新時間
                  </th>
                  <th className="w-24 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b transition-colors"
                    style={{
                      borderColor: "var(--border)",
                      background: selected.has(p.id)
                        ? "color-mix(in srgb, var(--green) 10%, var(--surface))"
                        : i % 2 === 0
                          ? "var(--surface)"
                          : "var(--surface-2)",
                    }}
                  >
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div
                        className="font-medium truncate max-w-xs"
                        style={{ color: "var(--text)" }}
                      >
                        {p.title}
                      </div>
                      {p.categories && (
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {p.categories}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: STATUS_COLOR[p.status] ?? "var(--text-muted)",
                        }}
                      >
                        {p.status === "published" ? (
                          <Eye size={12} className="inline mr-1" />
                        ) : (
                          <EyeOff size={12} className="inline mr-1" />
                        )}
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td
                      className="px-3 py-3 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(p.updated_at).toLocaleDateString("zh-TW")}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => navigate(`/admin/posts/${p.id}/edit`)}
                          className="p-1.5 rounded hover:opacity-80"
                          style={{ color: "var(--green)" }}
                          title="編輯"
                        >
                          <PenLine size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          className="p-1.5 rounded hover:opacity-80"
                          style={{ color: "#ef4444" }}
                          title="刪除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Mobile cards (< md) ── */}
            <div
              className="md:hidden divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Select-all row */}
              <div
                className="flex items-center gap-3 px-4 py-2.5"
                style={{ background: "var(--surface-2)" }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                  全選（共 {posts.length} 篇）
                </span>
              </div>
              {posts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors"
                  style={{
                    background: selected.has(p.id)
                      ? "color-mix(in srgb, var(--green) 10%, var(--surface))"
                      : "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    className="cursor-pointer mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium text-sm leading-snug"
                      style={{ color: "var(--text)" }}
                    >
                      {p.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: STATUS_COLOR[p.status] ?? "var(--text-muted)",
                        }}
                      >
                        {p.status === "published" ? (
                          <Eye size={11} className="inline mr-0.5" />
                        ) : (
                          <EyeOff size={11} className="inline mr-0.5" />
                        )}
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {new Date(p.updated_at).toLocaleDateString("zh-TW")}
                      </span>
                      {p.categories && (
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {p.categories}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/admin/posts/${p.id}/edit`)}
                      className="p-2 rounded hover:opacity-80"
                      style={{ color: "var(--green)" }}
                      title="編輯"
                    >
                      <PenLine size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="p-2 rounded hover:opacity-80"
                      style={{ color: "#ef4444" }}
                      title="刪除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 rounded text-sm"
                style={{
                  background: page === p ? "var(--green)" : "var(--surface-2)",
                  color: page === p ? "#000" : "var(--text-dim)",
                }}
              >
                {p}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
