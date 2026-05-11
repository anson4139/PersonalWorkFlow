import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../../lib/adminApi";

const FIELDS = [
  { key: "author_name", label: "作者名稱", type: "text" },
  { key: "author_bio", label: "作者簡介", type: "textarea" },
  { key: "author_avatar", label: "大頭照 URL", type: "text" },
  { key: "site_title", label: "網站標題", type: "text" },
  { key: "site_url", label: "網站 URL", type: "text" },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSettings()
      .then(setValues)
      .catch((e) => setError(String(e)));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await updateSettings(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        網站設定
      </h1>
      {error && <div className="text-sm text-red-400">{error}</div>}

      <div
        className="rounded-xl border p-6 space-y-5"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
      >
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              {f.label}
            </label>
            {f.type === "textarea" ? (
              <textarea
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                rows={3}
                className="w-full bg-transparent rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              />
            ) : (
              <input
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                className="w-full bg-transparent rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              />
            )}
          </div>
        ))}

        {/* Avatar preview */}
        {values.author_avatar && (
          <div>
            <div
              className="text-xs mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              頭像預覽
            </div>
            <img
              src={values.author_avatar}
              alt="avatar"
              className="w-16 h-16 rounded-full object-cover border"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{
          background: saved ? "#22c55e" : "var(--green)",
          color: "#000",
        }}
      >
        <Save size={14} />
        {saving ? "儲存中..." : saved ? "已儲存!" : "儲存設定"}
      </button>
    </div>
  );
}
