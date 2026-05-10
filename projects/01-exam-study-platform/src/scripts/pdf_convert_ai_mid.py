"""
pdf_convert_ai_mid.py
將中級 AI 應用規劃師三科 PDF 轉換為 JSON 題庫。

來源：AI應用規劃師試題/中級/*.pdf（114年第二梯次）
輸出：data/subjects/ai-planning.json、big-data.json、machine-learning.json
      src/web/public/data/subjects/（同步）

PDF 格式特徵：
  - 每頁首 5 行為頁首（考試名稱、科目、日期、頁碼、「答案 題目」）
  - 答案字母在題號前：「B 1.  題目文字」
  - 選項格式：「(A)text；」 或 「(A)text」（可能跨行）
  - 含圖題：題目含「附圖」，實際圖片為嵌入圖像，文字層空白
  - 程式碼表格（如 VGG16）：純文字可提取，視為 code_block

用法：
  python pdf_convert_ai_mid.py                 # 處理全部三科
  python pdf_convert_ai_mid.py --dry-run       # 只輸出解析結果，不寫 JSON
  python pdf_convert_ai_mid.py --subject 第一科 # 只處理特定科目
"""

import argparse
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

# ── 路徑設定 ──────────────────────────────────────────────────────────────────
SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parents[1]
WORKSPACE_ROOT = PROJECT_ROOT.parents[1]

PDF_DIR = PROJECT_ROOT / "data" / "raw-pdf" / "ai-planning" / "中級"
OUTPUT_DIRS = [
    PROJECT_ROOT / "data" / "subjects",
    PROJECT_ROOT / "src" / "web" / "public" / "data" / "subjects",
]

PLACEHOLDER_EXPLANATION = "PDF 原始試題未附解析"
IMAGE_PLACEHOLDER = "【附圖：請見原始 PDF 對應頁面，此題需圖片支援】"

# ── 科目對應設定 ──────────────────────────────────────────────────────────────
SUBJECT_MAP = [
    {
        "key": "ai-planning",
        "title": "AI應用規劃師（中級）第一科｜人工智慧技術應用與規劃",
        "filename_kw": "第一科",
        "session": "第114屆第二梯次",
        "total": 50,
    },
    {
        "key": "big-data",
        "title": "AI應用規劃師（中級）第二科｜大數據處理分析與應用",
        "filename_kw": "第二科",
        "session": "第114屆第二梯次",
        "total": 50,
    },
    {
        "key": "machine-learning",
        "title": "AI應用規劃師（中級）第三科｜機器學習技術與應用",
        "filename_kw": "第三科",
        "session": "第114屆第二梯次",
        "total": 50,
    },
]

# ── PDF 頁首過濾 Patterns ─────────────────────────────────────────────────────
PAGE_HEADER_PATTERNS = [
    re.compile(r"^114\s*年第二次AI\s*應用規劃師"),
    re.compile(r"^第[一二三]科："),
    re.compile(r"^考試日期："),
    re.compile(r"^第\s*\d+\s*頁[，,]\s*共\s*\d+\s*頁"),  # 含空格變體
    re.compile(r"^答案\s*題目$"),
    re.compile(r"^答$"),  # 「答案 題目」被拆第一行
    re.compile(r"^案\s*$"),  # 「答案 題目」被拆第二行
    re.compile(r"^題目$"),  # 「答案 題目」被拆第三行
    re.compile(r"^新$"),  # 「新」字標記（新題）
    re.compile(r"^《以下空白》"),
]

# ── 全形→半形字母轉換 ─────────────────────────────────────────────────────────
FW_TO_HW = str.maketrans("ＡＢＣＤ", "ABCD")

# ── 題目起始正規式：「答案字母 + 空格 + 題號. 」──────────────────────────────
# \s* 允許題號後無文字（如 「B 46.」 獨立一行）
Q_START_RE = re.compile(r"^([A-DＡＢＣＤ])\s+(\d+)\.\s*(.*)", re.DOTALL)
# 選項行：「(A)text」
OPT_RE = re.compile(r"^\(([A-D])\)(.*)")
# 選項嵌在同一行（多選項）：「(A)x；(B)y；...」
MULTI_OPT_RE = re.compile(r"\(([A-D])\)([^(]+?)(?=\([A-D]\)|$)")


def is_header_line(line: str) -> bool:
    stripped = line.strip()
    return any(p.match(stripped) for p in PAGE_HEADER_PATTERNS)


def normalize_option_text(text: str) -> str:
    """清除選項結尾的「；」，並合併多餘空白"""
    text = re.sub(r"\s+", " ", text).strip()
    text = text.rstrip("；").strip()
    return text


def pdf_to_lines(pdf_path: Path) -> list[str]:
    """提取 PDF 全部文字，回傳過濾頁首後的行列表"""
    try:
        from pypdf import PdfReader
    except ImportError:
        print("[ERROR] 需安裝 pypdf：pip install pypdf")
        sys.exit(1)

    reader = PdfReader(str(pdf_path))
    all_lines: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        for line in text.splitlines():
            if not is_header_line(line) and line.strip():
                all_lines.append(line)
    return all_lines


def parse_questions(lines: list[str]) -> list[dict]:
    """從行列表解析題目列表"""
    questions: list[dict] = []
    current_q: dict | None = None
    current_opt: str | None = None  # 當前正在累積的選項 key
    state = "idle"  # idle | question | option

    def flush_option():
        if current_q and current_opt and current_opt in current_q["options"]:
            current_q["options"][current_opt] = normalize_option_text(
                current_q["options"][current_opt]
            )

    def flush_question():
        if current_q:
            flush_option()
            # 清理題目文字
            q_text = re.sub(r"\s+", " ", current_q["question"]).strip()
            current_q["question"] = q_text
            questions.append(current_q)

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        # --- 嘗試偵測新題目開始（含全形字母正規化）---
        m_q = Q_START_RE.match(line)
        if m_q:
            flush_question()
            answer = m_q.group(1).translate(FW_TO_HW)
            no = int(m_q.group(2))
            q_text = m_q.group(3).strip()
            current_q = {
                "no": no,
                "question": q_text,
                "options": {"A": "", "B": "", "C": "", "D": ""},
                "answer": answer,
                "explanation": PLACEHOLDER_EXPLANATION,
                "code_block": None,
                "image_url": None,
            }
            current_opt = None
            state = "question"
            continue

        if current_q is None:
            continue

        # --- 嘗試偵測多選項同行（如 (A)MAE；(B)MSE；(C)RMSE；(D)R²）---
        if re.search(r"\([A-D]\)", line) and line.count("(") >= 2:
            matches = list(MULTI_OPT_RE.finditer(line))
            if len(matches) >= 2:
                flush_option()
                for match in matches:
                    key = match.group(1)
                    val = normalize_option_text(match.group(2))
                    current_q["options"][key] = val
                current_opt = None
                state = "option"
                continue

        # --- 嘗試偵測單選項起始 (A)... ---
        m_opt = OPT_RE.match(line)
        if m_opt:
            flush_option()
            current_opt = m_opt.group(1)
            current_q["options"][current_opt] = m_opt.group(2).strip()
            state = "option"
            continue

        # --- 累積延續文字 ---
        if state == "question":
            current_q["question"] += " " + line
        elif state == "option" and current_opt:
            current_q["options"][current_opt] += " " + line

    # 最後一題
    flush_question()

    return questions


def detect_image_questions(questions: list[dict]) -> None:
    """偵測含圖題，設定 image_url placeholder"""
    image_keywords = ["附圖", "如圖所示", "下圖所示", "參考下圖", "參考附圖"]
    for q in questions:
        if any(kw in q["question"] for kw in image_keywords):
            # 若選項均為空（圖片未被 OCR），標記為含圖題
            non_empty_opts = [v for v in q["options"].values() if v.strip()]
            if len(non_empty_opts) <= 2:
                # 幾乎空白的選項 → 代表選項也在圖裡
                q["image_url"] = f"/images/questions/placeholder-q{q['no']}.webp"
            # 不管如何，先標注題目類型（後續人工確認）
            if "附圖程式碼" in q["question"] or "參考下圖" in q["question"]:
                q["image_url"] = (
                    q["image_url"] or f"/images/questions/placeholder-q{q['no']}.webp"
                )


def build_json(meta: dict, questions: list[dict]) -> dict:
    return {
        "key": meta["key"],
        "title": meta["title"],
        "total": meta["total"],
        "sessions": [
            {
                "session": meta["session"],
                "questions": questions,
            }
        ],
    }


def merge_into_existing(existing: dict, new_session: dict) -> dict:
    """若既有 JSON 中已有相同 session，更新之；否則 append"""
    new_session_name = new_session["session"]
    for i, s in enumerate(existing.get("sessions", [])):
        if s["session"] == new_session_name:
            existing["sessions"][i] = new_session
            return existing
    existing.setdefault("sessions", []).append(new_session)
    return existing


def process_subject(meta: dict, pdf_path: Path, dry_run: bool) -> list[dict]:
    print(f"\n── {meta['key']} ({pdf_path.name}) ──")

    lines = pdf_to_lines(pdf_path)
    questions = parse_questions(lines)
    detect_image_questions(questions)

    print(f"  解析題目數：{len(questions)} / {meta['total']}")

    # 驗證
    answered = sum(1 for q in questions if q["answer"])
    missing_opts = [q["no"] for q in questions if not all(q["options"].values())]
    image_qs = [q["no"] for q in questions if q["image_url"]]

    print(f"  有正解：{answered} 題")
    if missing_opts:
        print(f"  [WARNING] 選項不完整題號：{missing_opts}")
    if image_qs:
        print(f"  [INFO] 含圖題（已標記 image_url placeholder）：{image_qs}")

    if dry_run:
        return questions

    # 直接以全新資料覆蓋（不保留舊 session）
    data = build_json(meta, questions)

    for out_dir in OUTPUT_DIRS:
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{meta['key']}.json"
        out_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    print(f"  [OK] 已寫入 {meta['key']}.json")
    return questions


def main() -> None:
    ap = argparse.ArgumentParser(description="中級 AI 應用規劃師 PDF → JSON")
    ap.add_argument("--dry-run", action="store_true", help="只解析，不寫 JSON")
    ap.add_argument("--subject", help="篩選科目關鍵字，例如「第一科」")
    args = ap.parse_args()

    if not PDF_DIR.exists():
        print(f"[ERROR] 找不到 PDF 目錄：{PDF_DIR}")
        sys.exit(1)

    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"[ERROR] {PDF_DIR} 下無 PDF 檔案")
        sys.exit(1)

    total_ok = 0
    for meta in SUBJECT_MAP:
        if args.subject and args.subject not in meta["filename_kw"]:
            continue

        matched = [p for p in pdfs if meta["filename_kw"] in p.name]
        if not matched:
            print(f"[SKIP] 找不到 {meta['filename_kw']} 的 PDF")
            continue

        qs = process_subject(meta, matched[0], args.dry_run)
        total_ok += len(qs)

    print(f"\n[DONE] 合計解析 {total_ok} 題")


if __name__ == "__main__":
    main()
