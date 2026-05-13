import DOMPurify from "dompurify";
import { ExternalLink, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  aiCover,
  aiGenerate,
  aiIllustrate,
  aiIllustrateRender,
  aiIllustrateStatus,
  aiImageJobStatus,
  trackEvent,
  type AiCoverResult,
  type AiGenerateResult,
} from "../../lib/adminApi";

const ARTICLE_STYLE = "fb-post";
const ARTICLE_ILLUSTRATE_STYLE = "1";
const ILLUSTRATION_POLL_INTERVAL_MS = 3000;
const IMAGE_JOB_MAX_POLLS = 40;

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
  const [coverStyle, setCoverStyle] = useState("2");
  const [manualContent, setManualContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiGenerateResult | null>(null);
  const [error, setError] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverResult, setCoverResult] = useState<AiCoverResult | null>(null);
  const [coverError, setCoverError] = useState("");
  const [preview, setPreview] = useState(false);
  const [illustLoading, setIllusLoading] = useState(false);
  const [illustUrl, setIllusUrl] = useState<string | null>(null);
  const [illustError, setIllusError] = useState("");
  const [illustPrompt, setIllusPrompt] = useState<string | null>(null);
  const [illustPromptOpen, setIllusPromptOpen] = useState(false);
  const [articlePromptOpen, setArticlePromptOpen] = useState(false);

  const waitForImageJob = async (jobId: string) => {
    for (let attempt = 0; attempt < IMAGE_JOB_MAX_POLLS; attempt += 1) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, ILLUSTRATION_POLL_INTERVAL_MS);
      });
      const status = await aiImageJobStatus(jobId);
      if (status.status === "ready" || status.status === "failed") {
        return status;
      }
    }
    return null;
  };

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError("請輸入來源 URL");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setCoverResult(null);
    setCoverError("");
    setIllusUrl(null);
    setIllusError("");
    setIllusPrompt(null);
    setIllusPromptOpen(false);
    trackEvent("ai_generate", "/admin/ai-generate", {
      url: url.trim(),
      style: ARTICLE_STYLE,
      coverStyle,
    });
    try {
      // Stage 1: 只生文章草稿，封面/解析圖改由使用者手動觸發
      const data = await aiGenerate(
        url.trim(),
        ARTICLE_STYLE,
        manualContent.trim() || undefined,
      );
      setResult(data);
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
          輸入新聞 / 文章 URL，由 gpt-5.5 轉成 FB PO 文草稿
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

        <div
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--green-border)",
            background: "var(--green-dim)",
            color: "var(--green)",
          }}
        >
          輸出模式固定為 FB
          PO文：會先過濾主文、排除推薦與雜訊，再生成含主題列、正文、Hashtag
          與出處的貼文草稿。
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
          {loading ? "Stage 1 生文章中，約需 15~25 秒..." : "開始生成"}
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
                  setCoverLoading(true);
                  setCoverError("");
                  try {
                    const cover = await aiCover(
                      result.post_id,
                      result.title,
                      result.excerpt,
                      coverStyle,
                    );
                    setCoverResult(cover);
                    if (cover.job_id && !cover.cover_url) {
                      const finalStatus = await waitForImageJob(cover.job_id);
                      if (
                        finalStatus?.status === "ready" &&
                        finalStatus.image_url
                      ) {
                        setCoverResult({
                          ...cover,
                          status: "ready",
                          cover_url: finalStatus.image_url,
                        });
                      } else if (finalStatus?.status === "failed") {
                        setCoverError(
                          finalStatus.error ?? "封面圖背景任務失敗",
                        );
                      } else {
                        setCoverError(
                          "封面圖背景任務仍在處理中，請稍後重新整理查看結果",
                        );
                      }
                    }
                  } catch (e) {
                    setCoverError(String(e));
                  } finally {
                    setCoverLoading(false);
                  }
                }}
                disabled={coverLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{
                  borderColor: "var(--green-border)",
                  color: "var(--green)",
                  background: "var(--green-dim)",
                }}
              >
                {coverLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ImagePlus size={13} />
                )}
                {coverLoading ? "封面生成中…" : "生成封面圖"}
              </button>
              <button
                onClick={async () => {
                  if (!result) return;
                  setIllusLoading(true);
                  setIllusError("");
                  try {
                    const prepared = await aiIllustrate(
                      result.post_id,
                      result.title,
                      result.excerpt,
                      coverStyle,
                      ARTICLE_ILLUSTRATE_STYLE,
                    );
                    if (!prepared.img_prompt) {
                      throw new Error("解析圖 prompt 準備失敗");
                    }

                    const rendered = await aiIllustrateRender(
                      result.post_id,
                      result.title,
                      prepared.img_prompt,
                      prepared.prompt_src,
                    );

                    if (rendered.image_url) {
                      setIllusUrl(rendered.image_url);
                      setIllusError("");
                    } else if (rendered.job_id) {
                      const finalStatus = await waitForImageJob(
                        rendered.job_id,
                      );
                      if (
                        finalStatus?.status === "ready" &&
                        finalStatus.image_url
                      ) {
                        setIllusUrl(finalStatus.image_url);
                        setIllusError("");
                      } else if (finalStatus?.status === "failed") {
                        setIllusError(
                          finalStatus.error ?? "解析圖背景任務失敗",
                        );
                      } else {
                        setIllusError(
                          "解析圖背景任務仍在處理中，請稍後重新整理查看結果",
                        );
                      }
                    } else {
                      const fallbackStatus = await aiIllustrateStatus(
                        result.post_id,
                      );
                      if (fallbackStatus.image_url)
                        setIllusUrl(fallbackStatus.image_url);
                    }
                    setIllusPrompt(prepared.img_prompt ?? null);
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
            {/* Stage 2: 封面圖 */}
            {coverLoading && (
              <div
                className="flex items-center gap-2 text-xs rounded-lg p-3"
                style={{
                  background: "var(--surface-3)",
                  color: "var(--text-muted)",
                }}
              >
                <Loader2 size={13} className="animate-spin" />
                封面圖任務已送出，背景處理中…
              </div>
            )}
            {coverResult?.cover_url && (
              <img
                src={coverResult.cover_url}
                alt="cover"
                className="w-full rounded-lg object-cover h-48"
              />
            )}
            {coverError && (
              <div className="text-xs" style={{ color: "tomato" }}>
                封面圖生成失敗：{coverError}
              </div>
            )}
            {!coverLoading && !coverResult?.cover_url && !coverError && (
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                封面圖已改成第二段手動生成，不會在文章建立後自動觸發。
              </div>
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
                    解析圖任務已送出，背景處理中…
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
            {/* Stage 2 debug 資訊 */}
            {coverResult && (
              <div
                className="text-xs rounded p-2 space-y-0.5"
                style={{
                  background: "var(--surface-3)",
                  color: "var(--text-dim)",
                }}
              >
                <div>
                  R2:{" "}
                  <span
                    style={{
                      color: coverResult.r2_available
                        ? "var(--green)"
                        : "tomato",
                    }}
                  >
                    {coverResult.r2_available ? "OK" : "未連接"}
                  </span>{" "}
                  封面:{" "}
                  <span
                    style={{
                      color: coverResult.cover_url ? "var(--green)" : "tomato",
                    }}
                  >
                    {coverResult.cover_url ? "OK" : "無"}
                  </span>
                </div>
                {coverResult.img_error && (
                  <div style={{ color: "tomato" }}>
                    Error: {coverResult.img_error}
                  </div>
                )}
              </div>
            )}

            {/* Article Prompt 可收折 */}
            {result.article_prompt && (
              <div>
                <button
                  onClick={() => setArticlePromptOpen((o) => !o)}
                  className="text-xs flex items-center gap-1"
                  style={{ color: "var(--text-dim)" }}
                >
                  <span style={{ fontSize: 10 }}>
                    {articlePromptOpen ? "▼" : "▶"}
                  </span>
                  {articlePromptOpen
                    ? "隱藏 Article Prompt"
                    : "查看 Article Prompt（送給 gpt-5.5 的 system prompt）"}
                </button>
                {articlePromptOpen && (
                  <textarea
                    readOnly
                    value={result.article_prompt}
                    rows={12}
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
