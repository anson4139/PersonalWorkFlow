import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AdminPermission,
  addPermission,
  deletePermission,
  getPermissions,
} from "../../lib/adminApi";

const SUPER_ADMIN_EMAIL = "anson4139@gmail.com";

const FEATURES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "posts", label: "文章管理" },
  { key: "ai-generate", label: "AI 生文" },
  { key: "comments", label: "留言管理" },
  { key: "media", label: "媒體庫" },
  { key: "categories", label: "分類" },
  { key: "tags", label: "標籤" },
  { key: "settings", label: "設定" },
] as const;

type FeatureKey = (typeof FEATURES)[number]["key"];

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formFeatures, setFormFeatures] = useState<FeatureKey[]>(["dashboard"]);
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPermissions();
      setPermissions(data.permissions);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleFeature(key: FeatureKey) {
    setFormFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const email = formEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setFormError("請輸入有效的 Gmail 地址");
      return;
    }
    if (email === SUPER_ADMIN_EMAIL) {
      setFormError("不能對 super_admin 帳號進行授權");
      return;
    }
    if (formFeatures.length === 0) {
      setFormError("請至少勾選一項功能");
      return;
    }
    setSubmitting(true);
    try {
      await addPermission({
        email,
        features: formFeatures,
        note: formNote.trim() || undefined,
      });
      setFormEmail("");
      setFormFeatures(["dashboard"]);
      setFormNote("");
      await load();
    } catch (e) {
      setFormError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(email: string) {
    if (!confirm(`確定要移除 ${email} 的後台存取權嗎？`)) return;
    try {
      await deletePermission(email);
      setPermissions((prev) => prev.filter((p) => p.email !== email));
    } catch (e) {
      alert(String(e));
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} style={{ color: "var(--green)" }} />
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          後台權限管理
        </h1>
      </div>

      {/* Super admin note */}
      <div
        className="text-sm px-4 py-3 rounded-lg border"
        style={{
          background: "rgba(74,222,128,.06)",
          borderColor: "rgba(74,222,128,.25)",
          color: "var(--text-muted)",
        }}
      >
        <strong style={{ color: "var(--text)" }}>Super Admin</strong>：
        {SUPER_ADMIN_EMAIL}（永久，不可移除，擁有全部後台功能含本頁面）
      </div>

      {/* 現有授權列表 */}
      <section>
        <h2
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--text-dim)" }}
        >
          已授權帳號
        </h2>
        {loading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            載入中…
          </p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : permissions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            目前無其他授權帳號
          </p>
        ) : (
          <div
            className="rounded-lg border divide-y text-sm overflow-hidden"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
            }}
          >
            {permissions.map((p) => (
              <div
                key={p.email}
                className="flex items-start gap-3 px-4 py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    style={{ color: "var(--text)" }}
                    className="font-medium truncate"
                  >
                    {p.email}
                  </p>
                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(Array.isArray(p.features) ? p.features : []).map((fk) => {
                      const feat = FEATURES.find((f) => f.key === fk);
                      return (
                        <span
                          key={fk}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(74,222,128,.12)",
                            color: "var(--green)",
                          }}
                        >
                          {feat?.label ?? fk}
                        </span>
                      );
                    })}
                  </div>
                  {p.note && (
                    <p
                      className="text-xs mt-1 truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {p.note}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs flex-shrink-0 hidden sm:block pt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {p.created_at ? p.created_at.slice(0, 10) : ""}
                </span>
                <button
                  onClick={() => handleDelete(p.email)}
                  className="p-1.5 rounded hover:opacity-70 flex-shrink-0"
                  style={{ color: "#f87171" }}
                  title="移除授權"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 新增授權表單 */}
      <section>
        <h2
          className="text-sm font-semibold mb-3 flex items-center gap-1.5"
          style={{ color: "var(--text-dim)" }}
        >
          <UserPlus size={14} />
          新增授權
        </h2>
        <form
          onSubmit={handleAdd}
          className="rounded-lg border p-4 space-y-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="space-y-1">
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>
              Google 帳號（Gmail）
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="someone@gmail.com"
              required
              className="w-full rounded-md px-3 py-2 text-sm outline-none border"
              style={{
                background: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Feature checkboxes */}
          <div className="space-y-2">
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>
              授權功能（可多選）
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FEATURES.map(({ key, label }) => {
                const checked = formFeatures.includes(key);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => toggleFeature(key)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors text-left"
                    style={{
                      background: checked
                        ? "rgba(74,222,128,.12)"
                        : "var(--bg)",
                      borderColor: checked ? "var(--green)" : "var(--border)",
                      color: checked ? "var(--green)" : "var(--text-dim)",
                    }}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: checked ? "var(--green)" : "var(--border)",
                        background: checked ? "var(--green)" : "transparent",
                      }}
                    >
                      {checked && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path
                            d="M1 3L3 5L7 1"
                            stroke="#000"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>
              備註（選填）
            </label>
            <input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="例：同事 A，協作用"
              className="w-full rounded-md px-3 py-2 text-sm outline-none border"
              style={{
                background: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {formError && <p className="text-xs text-red-400">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--green)", color: "#000" }}
          >
            {submitting ? "授權中…" : "新增授權"}
          </button>
        </form>
      </section>
    </div>
  );
}
