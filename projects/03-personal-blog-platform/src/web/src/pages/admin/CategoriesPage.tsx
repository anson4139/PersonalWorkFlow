import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
  type AdminCategory,
} from "../../lib/adminApi";

export default function CategoriesPage() {
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    setSelected(new Set());
    getAdminCategories()
      .then(setItems)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setError("");
    try {
      await createCategory(newName.trim(), newSlug.trim() || undefined);
      setNewName("");
      setNewSlug("");
      load();
    } catch (e) {
      setError(String(e));
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setError("");
    try {
      await updateCategory(id, { name: editName.trim() });
      setEditId(null);
      load();
    } catch (e) {
      setError(String(e));
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`刪除分類「${name}」？已使用此分類的文章不受影響。`)) return;
    try {
      await deleteCategory(id);
      load();
    } catch (e) {
      setError(String(e));
    }
  };

  const allSelected =
    items.length > 0 && items.every((c) => selected.has(c.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(items.map((c) => c.id)));
  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (
      !confirm(
        `確定刪除選取的 ${selected.size} 個分類？已使用此分類的文章不受影響。`,
      )
    )
      return;
    setBulkDeleting(true);
    await Promise.all(
      [...selected].map((id) => deleteCategory(id).catch(() => null)),
    );
    setBulkDeleting(false);
    load();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          分類管理
        </h1>
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
      </div>
      {error && <div className="text-sm text-red-400">{error}</div>}

      {/* Add new */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="新增分類名稱..."
            className="flex-1 bg-transparent rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="slug（選填，留空自動產生）"
            className="w-56 bg-transparent rounded-lg border px-3 py-2 text-sm outline-none font-mono"
            style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
          />
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ background: "var(--green)", color: "#000" }}
          >
            <Plus size={14} /> 新增
          </button>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Slug 僅允許英數與連字號，中文分類請手動填寫（如：taiwan-stock）
        </p>
      </div>

      {/* List */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--border)" }}
      >
        {loading ? (
          <div
            className="py-10 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            載入中...
          </div>
        ) : items.length === 0 ? (
          <div
            className="py-10 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            尚無分類
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
                    名稱
                  </th>
                  <th
                    className="text-left px-3 py-3 font-medium w-20"
                    style={{ color: "var(--text-dim)" }}
                  >
                    Slug
                  </th>
                  <th
                    className="text-left px-3 py-3 font-medium w-16"
                    style={{ color: "var(--text-dim)" }}
                  >
                    文章數
                  </th>
                  <th className="w-20 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c, i) => (
                  <tr
                    key={c.id}
                    className="border-b"
                    style={{
                      background: selected.has(c.id)
                        ? "color-mix(in srgb, var(--green) 10%, var(--surface))"
                        : i % 2 === 0
                          ? "var(--surface)"
                          : "var(--surface-2)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <td className="w-10 px-4 py-3">
                      {editId !== c.id && (
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleOne(c.id)}
                          className="cursor-pointer"
                        />
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editId === c.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleUpdate(c.id)
                          }
                          className="bg-transparent border-b outline-none text-sm w-full"
                          style={{
                            borderColor: "var(--green)",
                            color: "var(--text)",
                          }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ color: "var(--text)" }}>{c.name}</span>
                      )}
                    </td>
                    <td
                      className="px-3 py-3 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {c.slug}
                    </td>
                    <td
                      className="px-3 py-3 text-xs"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {c.post_count}
                    </td>
                    <td className="px-3 py-3">
                      {editId === c.id ? (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleUpdate(c.id)}
                            style={{ color: "var(--green)" }}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            style={{ color: "var(--text-muted)" }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              setEditId(c.id);
                              setEditName(c.name);
                            }}
                            style={{ color: "var(--text-dim)" }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            style={{ color: "#ef4444" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
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
                  全選（共 {items.length} 個）
                </span>
              </div>
              {items.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    background: selected.has(c.id)
                      ? "color-mix(in srgb, var(--green) 10%, var(--surface))"
                      : "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  {editId !== c.id && (
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                      className="cursor-pointer flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {editId === c.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleUpdate(c.id)
                        }
                        className="bg-transparent border-b outline-none text-sm w-full"
                        style={{
                          borderColor: "var(--green)",
                          color: "var(--text)",
                        }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <div
                          className="text-sm font-medium"
                          style={{ color: "var(--text)" }}
                        >
                          {c.name}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {c.slug} · {c.post_count} 篇
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editId === c.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(c.id)}
                          className="p-2"
                          style={{ color: "var(--green)" }}
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditId(c.id);
                            setEditName(c.name);
                          }}
                          className="p-2"
                          style={{ color: "var(--text-dim)" }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-2"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
