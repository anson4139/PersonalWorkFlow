import DOMPurify from "dompurify";
import { ExternalLink, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  aiGenerate,
  aiIllustrate,
  trackEvent,
  type AiGenerateResult,
} from "../../lib/adminApi";

const STYLES = [
  { key: "1", label: "科普解說" },
  { key: "2", label: "批判分析" },
  { key: "3", label: "職場視角" },
  { key: "4", label: "懶人包" },
  { key: "5", label: "趨勢觀察" },
  { key: "6", label: "技術深潛" },
  { key: "7", label: "故事敘述" },
  { key: "8", label: "問答體" },
  { key: "9", label: "晨報風格" },
  { key: "10", label: "辯論觀點" },
];

const COVER_STYLES = [
  {
    key: "1",
    label: "商業簡報風",
    desc: "顧問/投資銀行 briefing，白底深藍重排版",
  },
  { key: "2", label: "新聞封面風", desc: "大標題＋主視覺，媒體社群衝擊感" },
  { key: "3", label: "交易員面板風", desc: "Bloomberg / 戰情板，數字圖表警示" },
  { key: "4", label: "知識卡片風", desc: "一頁一重點，乾淨手機滑讀" },
  { key: "5", label: "漫畫式解說風", desc: "場景角色把複雜關係講清楚" },
  { key: "6", label: "報紙頭版風", desc: "Editorial 感，大圖大標重點側欄" },
];

export default function AiGeneratePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [style, setStyle] = useState("4");
  const [coverStyle, setCoverStyle] = useState("2");
  const [manualContent, setManualContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiGenerateResult | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [illustLoading, setIllusLoading] = useState(false);
  const [illustUrl, setIllusUrl] = useState<string | null>(null);
  const [illustError, setIllusError] = useState("");
  const [illustPrompt, setIllusPrompt] = useState<string | null>(null);
  const [illustPromptOpen, setIllusPromptOpen] = useState(false);

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError("請輸入來源 URL");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    trackEvent("ai_generate", "/admin/ai-generate", {
      url: url.trim(),
      style,
      coverStyle,
    });
    try {
      const data = await aiGenerate(
        url.trim(),
        style,
        manualContent.trim() || undefined,
        coverStyle,
      );
      setResult(data);
      setIllusUrl(null);
      setIllusError("");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--text)" }}
        >
          <Sparkles size={22} style={{ color: "var(--green)" }} />
          AI 一鍵生文
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          輸入新聞 / 文章 URL，由 gpt-5.5 改寫並自動存為草稿
        </p>
      </div>

      {/* Input area */}
      <div
        className="rounded-xl border p-5 space-y-4"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
      >
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            來源 URL
          </label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://techcrunch.com/..."
            className="w-full bg-transparent rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            寫作風格
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setStyle(s.key)}
                className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                style={{
                  borderColor:
                    style === s.key ? "var(--green)" : "var(--border)",
                  background:
                    style === s.key ? "var(--green-dim)" : "transparent",
                  color: style === s.key ? "var(--green)" : "var(--text-dim)",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            封面情境風格
          </label>
          <div className="flex flex-wrap gap-2">
            {COVER_STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setCoverStyle(s.key)}
                title={s.desc}
                className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                style={{
                  borderColor:
                    coverStyle === s.key ? "var(--green)" : "var(--border)",
                  background:
                    coverStyle === s.key ? "var(--green-dim)" : "transparent",
                  color:
                    coverStyle === s.key ? "var(--green)" : "var(--text-dim)",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {COVER_STYLES.find((s) => s.key === coverStyle)?.desc}
          </p>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            手動貼上內文
            <span
              className="ml-2 text-xs font-normal"
              style={{ color: "var(--text-dim)" }}
            >
              （可選）若網站有防爬機制，請把原文複製貼在此處
            </span>
          </label>
          <textarea
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            placeholder="將新聞 / 文章的完整內文貼在這裡…"
            rows={6}
            className="w-full bg-transparent rounded-lg border px-3 py-2 text-sm outline-none resize-y"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "var(--green)", color: "#000" }}
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Sparkles size={15} />
          )}
          {loading ? "AI 生成中，約需 15~30 秒..." : "開始生成"}
        </button>

        {error && <div className="text-sm text-red-400">{error}</div>}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text)" }}
            >
              生成結果（草稿已儲存）
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setPreview((p) => !p)}
                className="px-3 py-1.5 text-sm border rounded-lg"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-dim)",
                }}
              >
                {preview ? "純文字" : "HTML 預覽"}
              </button>
              <button
                onClick={async () => {
                  if (!result) return;
                  setIllusLoading(true);
                  setIllusError("");
                  try {
                    const r = await aiIllustrate(
                      result.post_id,
                      result.title,
                      result.excerpt,
                      coverStyle,
                      style,
                    );
                    setIllusUrl(r.image_url);
                    setIllusPrompt(r.img_prompt ?? null);
                    setIllusPromptOpen(false);
                  } catch (e) {
                    setIllusError(String(e));
                  } finally {
                    setIllusLoading(false);
                  }
                }}
                disabled={illustLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{
                  borderColor: "var(--green-border)",
                  color: "var(--green)",
                  background: "var(--green-dim)",
                }}
              >
                {illustLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ImagePlus size={13} />
                )}
                {illustLoading ? "生成中…" : "生成解析圖"}
              </button>
              <button
                onClick={() => navigate(`/admin/posts/${result.post_id}/edit`)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "var(--green)", color: "#000" }}
              >
                <ExternalLink size={13} />
                進入編輯
              </button>
            </div>
          </div>

          <div
            className="rounded-xl border p-5 space-y-4"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            {result.cover_url && (
              <img
                src={result.cover_url}
                alt="cover"
                className="w-full rounded-lg object-cover h-48"
              />
            )}

            {/* 解析圖區塊 */}
            {(illustUrl || illustError || illustLoading) && (
              <div
                className="rounded-lg border p-3 space-y-2"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-3)",
                }}
              >
                <div
                  className="text-xs font-medium"
                  style={{ color: "var(--text-dim)" }}
                >
                  解析圖（已插入文章末尾）
                </div>
                {illustLoading && (
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Loader2 size={12} className="animate-spin" />
                    gpt-image-2 生成中，約需 20~40 秒…
                  </div>
                )}
                {illustPrompt && (
                  <div>
                    <button
                      onClick={() => setIllusPromptOpen((o) => !o)}
                      className="text-xs flex items-center gap-1"
                      style={{ color: "var(--text-dim)" }}
                    >
                      <span style={{ fontSize: 10 }}>
                        {illustPromptOpen ? "▼" : "▶"}
                      </span>
                      {illustPromptOpen
                        ? "隱藏 Image Prompt"
                        : "查看 Image Prompt"}
                    </button>
                    {illustPromptOpen && (
                      <textarea
                        readOnly
                        value={illustPrompt}
                        rows={5}
                        className="w-full mt-1 rounded p-2 text-xs font-mono resize-y"
                        style={{
                          background: "var(--surface-1)",
                          border: "1px solid var(--border)",
                          color: "var(--text-dim)",
                        }}
                      />
                    )}
                  </div>
                )}
                {illustUrl && (
                  <img
                    src={illustUrl}
                    alt="illustration"
                    className="w-full rounded object-cover"
                  />
                )}
                {illustError && (
                  <div className="text-xs" style={{ color: "tomato" }}>
                    {illustError}
                  </div>
                )}
              </div>
            )}
            {/* 除錯資訊：圖片生成狀態 */}
            <div
              className="text-xs rounded p-2 space-y-0.5"
              style={{
                background: "var(--surface-3)",
                color: "var(--text-dim)",
              }}
            >
              <div>
                R2 Binding:{" "}
                <span
                  style={{
                    color: result.r2_available ? "var(--green)" : "tomato",
                  }}
                >
                  {result.r2_available ? "OK" : "未連接"}
                </span>
              </div>
              <div>
                封面圖:{" "}
                <span
                  style={{
                    color: result.cover_url ? "var(--green)" : "tomato",
                  }}
                >
                  {result.cover_url || "無"}
                </span>
              </div>
              {result.img_error && (
                <div style={{ color: "tomato" }}>Error: {result.img_error}</div>
              )}
            </div>

            <div>
              <div
                className="text-xs mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                標題
              </div>
              <div
                className="text-xl font-bold"
                style={{ color: "var(--text)" }}
              >
                {result.title}
              </div>
            </div>

            <div>
              <div
                className="text-xs mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                摘要
              </div>
              <div className="text-sm" style={{ color: "var(--text-dim)" }}>
                {result.excerpt}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <span style={{ color: "var(--text-muted)" }}>
                分類：
                <span style={{ color: "var(--green)" }}>
                  {result.suggested_category}
                </span>
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                公司：
                <span style={{ color: "var(--text-dim)" }}>
                  {result.company_name || "—"}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(result.suggested_tags ?? []).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded text-xs border"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-dim)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            <div>
              <div
                className="text-xs mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                文章內容
              </div>
              {preview ? (
                <div
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(result.content_html),
                  }}
                />
              ) : (
                <pre
                  className="text-xs p-3 rounded-lg overflow-auto max-h-96"
                  style={{
                    background: "var(--surface-3)",
                    color: "var(--text-dim)",
                  }}
                >
                  {result.content_html}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
