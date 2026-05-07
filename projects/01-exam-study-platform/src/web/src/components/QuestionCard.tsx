import katex from "katex";
import type { Question } from "../types";

interface Props {
  question: Question;
  index: number;
  total: number;
  revealAnswer?: boolean;
  selectedOption?: string | null;
  onSelectOption?: (option: "A" | "B" | "C" | "D") => void;
  disableSelection?: boolean;
}

const OPTIONS = ["A", "B", "C", "D"] as const;

/** 將含 $...$ 或 $$...$$ 的字串轉成 KaTeX HTML，純文字直接回傳 */
function renderMath(text: string): string {
  if (!text.includes("$")) return escapeHtml(text);

  // 先處理 block $$...$$，再處理 inline $...$
  const parts: string[] = [];
  let remaining = text;
  const blockRe = /\$\$([\s\S]+?)\$\$/g;
  const inlineRe = /\$([^$\n]+?)\$/g;

  // 替換 $$ 為 placeholder，避免 inline 正規式誤判
  const blockPlaceholders: string[] = [];
  remaining = remaining.replace(blockRe, (_match, formula) => {
    blockPlaceholders.push(formula);
    return `%%BLOCK${blockPlaceholders.length - 1}%%`;
  });

  // 替換 $ inline
  remaining = remaining.replace(inlineRe, (_match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return _match;
    }
  });

  // 還原 block placeholder
  remaining = remaining.replace(/%%BLOCK(\d+)%%/g, (_match, idx) => {
    try {
      return katex.renderToString(blockPlaceholders[Number(idx)].trim(), {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return `$$${blockPlaceholders[Number(idx)]}$$`;
    }
  });

  parts.push(remaining);
  return parts.join("");
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function QuestionCard({
  question,
  index,
  total,
  revealAnswer = true,
  selectedOption = null,
  onSelectOption,
  disableSelection = false,
}: Props) {
  const isSelectable = Boolean(onSelectOption);
  const explanationHtml = renderMath(question.explanation ?? "");

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-5">
      {/* 題號 */}
      <p className="mb-3 text-xs text-gray-600">
        第 {index} / {total} 題
      </p>

      {/* 題目 */}
      <p className="mb-3 text-base font-medium leading-relaxed text-gray-100">
        {question.no}. {question.question}
      </p>

      {/* 程式碼區塊（含圖題 — 方案C） */}
      {question.code_block && (
        <div className="mb-4 overflow-x-auto rounded-lg border border-[#2a2a2a] bg-[#0d0d0d]">
          <pre className="p-4 text-xs leading-relaxed text-green-300 whitespace-pre">
            <code>{question.code_block}</code>
          </pre>
        </div>
      )}

      {/* 題目圖片（含圖題 — 方案A） */}
      {question.image_url && (
        <div className="mb-4">
          <img
            src={question.image_url}
            alt={`第 ${question.no} 題圖片`}
            loading="lazy"
            className="max-w-full rounded-lg border border-[#2a2a2a]"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const placeholder =
                target.nextElementSibling as HTMLElement | null;
              if (placeholder) placeholder.style.display = "flex";
            }}
          />
          <div
            style={{ display: "none" }}
            className="items-center gap-2 rounded-lg border border-dashed border-[#3a3a3a] bg-[#0d0d0d] px-4 py-3 text-sm text-gray-500"
          >
            <span className="text-yellow-500">⚠</span>
            本題含附圖，圖片尚未上傳，請參考原始試題
          </div>
        </div>
      )}

      {/* 選項 */}
      <div className="mb-5 space-y-2">
        {OPTIONS.map((opt) => {
          const text = question.options[opt];
          if (!text) return null;
          const isAnswer = opt === question.answer;
          const isSelected = selectedOption === opt;

          let optionClass = "border-[#1f1f1f] bg-[#0a0a0a] text-gray-400";
          if (revealAnswer) {
            if (isAnswer) {
              optionClass =
                "border-[#76b900] bg-[#0d1a00] text-[#76b900] font-semibold";
            } else if (isSelected) {
              optionClass = "border-red-500/60 bg-red-950/40 text-red-300";
            }
          } else if (isSelected) {
            optionClass =
              "border-[#76b900] bg-[#0f1900] text-[#b9ef65] font-semibold";
          }

          if (!isSelectable) {
            return (
              <div
                key={opt}
                className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${optionClass}`}
              >
                ({opt}) {text}
              </div>
            );
          }

          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelectOption?.(opt)}
              disabled={disableSelection}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm leading-relaxed transition ${optionClass} ${disableSelection ? "cursor-not-allowed opacity-80" : "hover:border-[#76b900] hover:text-white"}`}
            >
              ({opt}) {text}
            </button>
          );
        })}
      </div>

      {/* 解析（含 KaTeX 渲染） */}
      {revealAnswer &&
        question.explanation &&
        question.explanation !== "PDF 原始試題未附解析" && (
          <details className="rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-[#76b900]">
              查看解析
            </summary>
            <div
              className="mt-2 text-sm leading-relaxed text-gray-400 [&_.katex]:text-gray-200"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: explanationHtml.replace(/\n/g, "<br/>"),
              }}
            />
          </details>
        )}
    </div>
  );
}
