"""
pdf_convert_ai_basic.py
將初級 AI 應用規劃師兩科 PDF 轉換為 JSON 題庫（每科含多屆次）。

來源：AI應用規劃師試題/初級/*.pdf
      - 114年第四梯次：第一科、第二科
      - 115年第一次：第一科、第二科

輸出：
  data/subjects/ai-planning-basic.json
  data/subjects/gen-ai-basic.json
  src/web/public/data/subjects/ (同步)

用法：
  python pdf_convert_ai_basic.py               # 處理全部
  python pdf_convert_ai_basic.py --dry-run     # 只顯示解析結果
  python pdf_convert_ai_basic.py --subject 第一科  # 只處理特定科目
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

PDF_DIR = PROJECT_ROOT / "data" / "raw-pdf" / "ai-planning" / "初級"
OUTPUT_DIRS = [
    PROJECT_ROOT / "data" / "subjects",
    PROJECT_ROOT / "src" / "web" / "public" / "data" / "subjects",
]

PLACEHOLDER_EXPLANATION = "PDF 原始試題未附解析"

# ── 科目對應設定 ──────────────────────────────────────────────────────────────
# 每個 subject_key 對應多個 PDF 檔（每個 PDF = 一個 session）
SUBJECT_MAP = [
    {
        "key": "ai-planning-basic",
        "title": "AI應用規劃師（初級）第一科｜人工智慧基礎概論",
        "total": 50,
        "pdfs": [
            {
                "filename_kw": "第四梯次初級AI應用規劃師第一科",
                "session": "第114屆第四梯次",
            },
            {"filename_kw": "第一科_人工智慧基礎概論", "session": "第115屆第一次"},
        ],
    },
    {
        "key": "gen-ai-basic",
        "title": "AI應用規劃師（初級）第二科｜生成式AI應用與規劃",
        "total": 50,
        "pdfs": [
            {
                "filename_kw": "第四梯次初級AI應用規劃師第二科",
                "session": "第114屆第四梯次",
            },
            {"filename_kw": "第二科_生成式AI應用與規劃", "session": "第115屆第一次"},
        ],
    },
]

# ── 全形→半形字母轉換 ─────────────────────────────────────────────────────────
FW_TO_HW = str.maketrans("ＡＢＣＤ", "ABCD")

# ── PDF 頁首過濾 Patterns ─────────────────────────────────────────────────────
PAGE_HEADER_PATTERNS = [
    re.compile(r"^11[45]\s*年"),  # 114/115 年開頭的考試標題
    re.compile(r"^第[一二三]科："),
    re.compile(r"^考試日期："),
    re.compile(r"^第\s*\d+\s*頁[，,\s]\s*共\s*\d+\s*頁"),  # 頁碼
    re.compile(r"^答案\s*題[\s　]*目$"),  # 「答案 題    目」欄位標題
    re.compile(r"^答$"),
    re.compile(r"^案\s*$"),
    re.compile(r"^題[\s　]*目$"),
    re.compile(r"^一[、,，]\s*選擇題"),  # 「一、選擇題」
    re.compile(r"^新$"),
    re.compile(r"^《以下空白》"),
]

# ── 題目起始正規式 ────────────────────────────────────────────────────────────
Q_START_RE = re.compile(r"^([A-DＡＢＣＤ])\s+(\d+)\.\s*(.*)", re.DOTALL)
OPT_RE = re.compile(r"^\(([A-D])\)(.*)")
MULTI_OPT_RE = re.compile(r"\(([A-D])\)([^(]+?)(?=\([A-D]\)|$)")


def is_header_line(line: str) -> bool:
    stripped = line.strip()
    return any(p.match(stripped) for p in PAGE_HEADER_PATTERNS)


def normalize_option_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    text = text.rstrip("；").strip()
    return text


def pdf_to_lines(pdf_path: Path) -> list[str]:
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
    questions: list[dict] = []
    current_q: dict | None = None
    current_opt: str | None = None
    state = "idle"

    def flush_option():
        if current_q and current_opt and current_opt in current_q["options"]:
            current_q["options"][current_opt] = normalize_option_text(
                current_q["options"][current_opt]
            )

    def flush_question():
        if current_q:
            flush_option()
            q_text = re.sub(r"\s+", " ", current_q["question"]).strip()
            current_q["question"] = q_text
            questions.append(current_q)

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

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

        m_opt = OPT_RE.match(line)
        if m_opt:
            flush_option()
            current_opt = m_opt.group(1)
            current_q["options"][current_opt] = m_opt.group(2).strip()
            state = "option"
            continue

        if state == "question":
            current_q["question"] += " " + line
        elif state == "option" and current_opt:
            current_q["options"][current_opt] += " " + line

    flush_question()
    return questions


def detect_image_questions(questions: list[dict]) -> None:
    image_keywords = ["附圖", "如圖所示", "下圖所示", "參考下圖", "參考附圖"]
    for q in questions:
        if any(kw in q["question"] for kw in image_keywords):
            q["image_url"] = f"/images/questions/placeholder-q{q['no']}.webp"


def process_pdf(pdf_path: Path, session_name: str, total: int) -> list[dict]:
    lines = pdf_to_lines(pdf_path)
    questions = parse_questions(lines)
    detect_image_questions(questions)

    answered = sum(1 for q in questions if q["answer"])
    missing_opts = [q["no"] for q in questions if not all(q["options"].values())]
    image_qs = [q["no"] for q in questions if q["image_url"]]

    print(f"  [{session_name}] 解析 {len(questions)}/{total} 題，有正解 {answered} 題")
    if missing_opts:
        print(f"    [WARNING] 選項不完整：{missing_opts}")
    if image_qs:
        print(f"    [INFO] 含圖題：{image_qs}")

    return questions


def process_subject(meta: dict, pdfs: list[Path], dry_run: bool) -> int:
    print(f"\n── {meta['key']} ──")

    sessions = []
    for pdf_meta in meta["pdfs"]:
        matched = [p for p in pdfs if pdf_meta["filename_kw"] in p.name]
        if not matched:
            print(f"  [SKIP] 找不到含「{pdf_meta['filename_kw']}」的 PDF")
            continue

        questions = process_pdf(matched[0], pdf_meta["session"], meta["total"])
        sessions.append(
            {
                "session": pdf_meta["session"],
                "questions": questions,
            }
        )

    if dry_run or not sessions:
        return sum(len(s["questions"]) for s in sessions)

    data = {
        "key": meta["key"],
        "title": meta["title"],
        "total": meta["total"],
        "sessions": sessions,
    }

    for out_dir in OUTPUT_DIRS:
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{meta['key']}.json"
        out_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    total_q = sum(len(s["questions"]) for s in sessions)
    print(f"  [OK] 已寫入 {meta['key']}.json（{len(sessions)} 屆次，{total_q} 題）")
    return total_q


def main() -> None:
    ap = argparse.ArgumentParser(description="初級 AI 應用規劃師 PDF → JSON")
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
        if args.subject and args.subject not in meta["key"]:
            continue
        total_ok += process_subject(meta, pdfs, args.dry_run)

    print(f"\n[DONE] 合計解析 {total_ok} 題")


if __name__ == "__main__":
    main()
