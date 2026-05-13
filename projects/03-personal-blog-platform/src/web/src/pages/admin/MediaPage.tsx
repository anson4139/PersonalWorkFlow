import { Copy, Image, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MediaObject, deleteMedia, getMedia } from "../../lib/adminApi";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortName(key: string): string {
  const parts = key.split("/");
  return parts[parts.length - 1] ?? key;
}

export default function MediaPage() {
  const [objects, setObjects] = useState<MediaObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMedia();
      setObjects(
        [...data.objects].sort(
          (a, b) =>
            new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime(),
        ),
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCopy(url: string) {
    const fullUrl = `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleDelete(key: string) {
    const name = shortName(key);
    if (
      !confirm(
        `刪除圖片「${name}」？此操作無法復原，請確認沒有文章引用此圖片。`,
      )
    )
      return;
    setDeleting(key);
    try {
      await deleteMedia(key);
      setObjects((prev) => prev.filter((o) => o.key !== key));
    } catch (e) {
      alert(`刪除失敗：${String(e)}`);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Title bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            媒體庫
          </h1>
          {!loading && (
            <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
              共 {objects.length} 張圖片（Cloudflare R2）
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
          className="mb-6 px-4 py-3 rounded-lg text-sm"
          style={{
            background: "#450a0a",
            color: "#fca5a5",
            border: "1px solid #7f1d1d",
          }}
        >
          {error.includes("R2 not configured") ? (
            <>
              <strong>R2 未啟用：</strong>請至 Cloudflare Dashboard 確認 Bucket
              Binding 設定。
            </>
          ) : (
            error
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          className="flex items-center justify-center py-20"
          style={{ color: "var(--text-dim)" }}
        >
          <RefreshCw size={20} className="animate-spin mr-2" />
          載入中…
        </div>
      )}

      {/* Empty */}
      {!loading && !error && objects.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 gap-3"
          style={{ color: "var(--text-dim)" }}
        >
          <Image size={40} strokeWidth={1.2} />
          <p className="text-sm">尚未上傳任何圖片</p>
          <p className="text-xs">在文章編輯器中上傳圖片後會顯示在此</p>
        </div>
      )}

      {/* Grid */}
      {!loading && objects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {objects.map((obj) => (
            <div
              key={obj.key}
              className="rounded-xl overflow-hidden flex flex-col"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Thumbnail */}
              <div
                className="relative aspect-square overflow-hidden"
                style={{ background: "var(--bg)" }}
              >
                <img
                  src={obj.url}
                  alt={shortName(obj.key)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              {/* Info + Actions */}
              <div className="p-3 flex flex-col gap-2">
                <p
                  className="text-xs font-medium truncate leading-snug"
                  style={{ color: "var(--text)" }}
                  title={shortName(obj.key)}
                >
                  {shortName(obj.key)}
                </p>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {formatSize(obj.size)} · {formatDate(obj.uploaded)}
                </p>
                <div className="flex gap-1.5 mt-1">
                  <button
                    onClick={() => handleCopy(obj.url)}
                    title="複製圖片 URL"
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs hover:opacity-70 transition-opacity"
                    style={{
                      background:
                        copied === obj.url ? "var(--green)" : "var(--bg)",
                      color: copied === obj.url ? "#000" : "var(--text-dim)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <Copy size={11} />
                    {copied === obj.url ? "已複製" : "複製"}
                  </button>
                  <button
                    onClick={() => handleDelete(obj.key)}
                    disabled={deleting === obj.key}
                    title="刪除圖片"
                    className="px-2 py-1 rounded text-xs hover:opacity-70 disabled:opacity-50 transition-opacity"
                    style={{
                      background: "var(--bg)",
                      color: "#f87171",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
