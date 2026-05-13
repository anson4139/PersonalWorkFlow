import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createTag,
  deleteTag,
  getAdminTags,
  updateTag,
  type AdminTag,
} from "../../lib/adminApi";

export default function TagsPage() {
  const [items, setItems] = useState<AdminTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getAdminTags()
      .then(setItems)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setError("");
    try {
      await createTag(newName.trim());
      setNewName("");
      load();
    } catch (e) {
      setError(String(e));
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await updateTag(id, { name: editName.trim() });
      setEditId(null);
      load();
    } catch (e) {
      setError(String(e));
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`刪除標籤「${name}」？`)) return;
    try {
      await deleteTag(id);
      load();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        標籤管理
      </h1>
      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="新增標籤..."
          className="flex-1 bg-transparent rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        />
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80"
          style={{ background: "var(--green)", color: "#000" }}
        >
          <Plus size={14} /> 新增
        </button>
      </div>

      {/* Tag cloud + table */}
      <div className="flex flex-wrap gap-2">
        {!loading &&
          items.map((t) =>
            editId === t.id ? (
              <div
                key={t.id}
                className="flex items-center gap-1 border rounded-full px-3 py-1"
                style={{
                  borderColor: "var(--green)",
                  background: "var(--green-dim)",
                }}
              >
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdate(t.id)}
                  className="bg-transparent outline-none text-xs w-24"
                  style={{ color: "var(--green)" }}
                  autoFocus
                />
                <button onClick={() => handleUpdate(t.id)}>
                  <Check size={11} style={{ color: "var(--green)" }} />
                </button>
                <button onClick={() => setEditId(null)}>
                  <X size={11} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>
            ) : (
              <div
                key={t.id}
                className="flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs group"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-dim)",
                  background: "var(--surface-2)",
                }}
              >
                <span>{t.name}</span>
                <span className="text-xs opacity-50">{t.post_count}</span>
                <button
                  onClick={() => {
                    setEditId(t.id);
                    setEditName(t.name);
                  }}
                  className="opacity-40 hover:opacity-80 transition-opacity"
                >
                  <Pencil size={10} />
                </button>
                <button
                  onClick={() => handleDelete(t.id, t.name)}
                  className="opacity-40 hover:opacity-80 transition-opacity text-red-400"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ),
          )}
        {loading && (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            載入中...
          </span>
        )}
      </div>
    </div>
  );
}
