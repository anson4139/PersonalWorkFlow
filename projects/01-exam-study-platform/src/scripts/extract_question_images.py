"""
extract_question_images.py
從中級 AI 應用規劃師 PDF 萃取含圖題的圖片。

策略：
  1. 讀取 JSON 找出有 image_url 的題目
  2. 在 PDF 各頁搜尋題目文字，定位所在頁碼
  3. 取得題目在該頁的垂直起點 (y_top)
  4. 收集 y_top 以下、下一題 y_top 以上的所有圖片（含延伸頁）
  5. 垂直合併，存為 PNG
  6. 更新 JSON 的 image_url → /images/questions/<subject>/q<no>.png

輸出：
  src/web/public/images/questions/<subject>/q<no>.png
  data/subjects/<subject>.json（更新 image_url）
  src/web/public/data/subjects/<subject>.json（同步）

用法：
  python extract_question_images.py                     # 處理 big-data + machine-learning
  python extract_question_images.py --subject big-data  # 只處理單一科目
  python extract_question_images.py --dry-run           # 不儲存，只印偵測結果
"""

import argparse
import json
import sys
from pathlib import Path

import fitz  # pymupdf
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

# ── 路徑設定 ──────────────────────────────────────────────────────────────────
SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parents[1]
WORKSPACE_ROOT = PROJECT_ROOT.parents[1]

PDF_DIR = WORKSPACE_ROOT / "AI應用規劃師試題" / "中級"
DATA_DIR = PROJECT_ROOT / "data" / "subjects"
PUBLIC_DATA_DIR = PROJECT_ROOT / "src" / "web" / "public" / "data" / "subjects"
PUBLIC_IMG_DIR = PROJECT_ROOT / "src" / "web" / "public" / "images" / "questions"

# ── 科目→PDF 關鍵字對應 ───────────────────────────────────────────────────────
SUBJECT_PDF_KW: dict[str, str] = {
    "big-data": "第二科",
    "machine-learning": "第三科",
}

ZOOM = 1.5  # 渲染倍率（約 108 DPI，適合閱讀）
SEARCH_LEN = 12  # 題目文字搜尋前 N 字
MAX_CONT_PAGES = 6  # 最多往後追蹤幾個延伸頁
MIN_IMG_W = 100  # 圖片寬度下限（過濾裝飾小圖）
MIN_IMG_H = 30  # 圖片高度下限（程式碼片段圖可能僅 40px）


# ── 工具函式 ──────────────────────────────────────────────────────────────────


def find_pdf(keyword: str) -> Path:
    """根據關鍵字找 PDF 檔案。"""
    for pdf in PDF_DIR.glob("*.pdf"):
        if keyword in pdf.name:
            return pdf
    raise FileNotFoundError(f"找不到含 '{keyword}' 的 PDF（目錄：{PDF_DIR}）")


def find_question_page(doc: fitz.Document, q_text: str) -> int | None:
    """搜尋題目文字在哪一頁，回傳 1-indexed 頁碼；找不到回傳 None。"""
    for search_len in (SEARCH_LEN, 8, 5):
        needle = q_text.strip()[:search_len]
        for pg_idx, page in enumerate(doc):
            if needle in page.get_text():
                return pg_idx + 1  # 1-indexed
    return None


def get_q_y_on_page(page: fitz.Page, q_text: str) -> float:
    """回傳題目文字在頁面上的 y_top 座標；找不到回傳 0。"""
    for search_len in (SEARCH_LEN, 8, 5):
        rects = page.search_for(q_text.strip()[:search_len])
        if rects:
            return rects[0].y0
    return 0.0


def collect_images_in_range(
    doc: fitz.Document,
    start_pg: int,  # 1-indexed，題目所在頁
    y_top: float,  # 題目文字的 y 座標（在 start_pg 上）
    next_q_pg: int | None,  # 下一題所在頁（1-indexed），None 代表最後一題
    next_q_y: float,  # 下一題在其頁面上的 y_top
    y_margin: float = 120,  # 向上延伸的搜尋 margin（捕捉圖在題目文字上方的情況）
) -> list[tuple[int, fitz.Rect]]:
    """
    收集從 (start_pg, y_top - y_margin) 到 (next_q_pg, next_q_y) 之間的圖片。
    回傳 [(page_1indexed, rect), ...]，已過濾太小的圖。
    """
    results: list[tuple[int, fitz.Rect]] = []
    y_start = max(0.0, y_top - y_margin)

    for pg_no in range(start_pg, start_pg + MAX_CONT_PAGES + 1):
        if pg_no > len(doc):
            break
        # 超過下一題所在頁則停止
        if next_q_pg is not None and pg_no > next_q_pg:
            break

        page = doc[pg_no - 1]
        for img_info in page.get_image_info(hashes=False):
            bbox = fitz.Rect(img_info["bbox"])
            w, h = bbox.width, bbox.height
            if w < MIN_IMG_W or h < MIN_IMG_H:
                continue  # 太小，跳過

            # 在題目起始頁，只取 y_start 以下的圖
            if pg_no == start_pg and bbox.y1 < y_start:
                continue

            # 在下一題所在頁，只取 next_q_y 以上的圖
            if (
                next_q_pg is not None
                and pg_no == next_q_pg
                and bbox.y0 >= next_q_y - 10
            ):
                continue

            results.append((pg_no, bbox))

    return results


def render_image_regions(
    doc: fitz.Document,
    regions: list[tuple[int, fitz.Rect]],
    margin: int = 8,
) -> Image.Image | None:
    """
    渲染各頁上的指定區域並垂直合併為一張 PIL Image。
    regions: [(pg_1indexed, fitz.Rect), ...]
    """
    if not regions:
        return None

    mat = fitz.Matrix(ZOOM, ZOOM)
    clips: list[Image.Image] = []

    for pg_no, bbox in regions:
        page = doc[pg_no - 1]
        # 加 margin 避免圖片被截邊
        clip = fitz.Rect(
            max(0, bbox.x0 - margin),
            max(0, bbox.y0 - margin),
            bbox.x1 + margin,
            bbox.y1 + margin,
        )
        pix = page.get_pixmap(matrix=mat, clip=clip)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        clips.append(img)

    if len(clips) == 1:
        return clips[0]

    # 垂直合併（加小間隔）
    gap = 4
    total_h = sum(c.height for c in clips) + gap * (len(clips) - 1)
    max_w = max(c.width for c in clips)
    combined = Image.new("RGB", (max_w, total_h), (30, 30, 30))  # 深色背景配合 UI
    y = 0
    for clip in clips:
        combined.paste(clip, (0, y))
        y += clip.height + gap

    return combined


def fallback_render_page(doc: fitz.Document, pg_no: int) -> Image.Image:
    """備用：渲染整頁。"""
    mat = fitz.Matrix(ZOOM, ZOOM)
    pix = doc[pg_no - 1].get_pixmap(matrix=mat)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


# ── 主處理 ────────────────────────────────────────────────────────────────────


def process_subject(subject: str, pdf_kw: str, dry_run: bool = False) -> None:
    json_path = DATA_DIR / f"{subject}.json"
    if not json_path.exists():
        print(f"[SKIP] {json_path} 不存在")
        return

    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    # 收集所有含圖題，照題號排序
    image_questions: list[dict] = []
    for session in data["sessions"]:
        for q in session["questions"]:
            if q.get("image_url"):
                image_questions.append(q)
    image_questions.sort(key=lambda q: q["no"])

    if not image_questions:
        print(f"[{subject}] 無含圖題，跳過")
        return

    print(f"\n{'=' * 60}")
    print(f"[{subject}] 含圖題：{[q['no'] for q in image_questions]}")

    pdf_path = find_pdf(pdf_kw)
    doc = fitz.open(pdf_path)
    print(f"PDF：{pdf_path.name}（{len(doc)} 頁）")

    out_dir = PUBLIC_IMG_DIR / subject
    if not dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)

    # 建立「所有題目」的題號→題目文字對照表，用於精確邊界
    all_questions: dict[int, str] = {}
    for session in data["sessions"]:
        for q in session["questions"]:
            all_questions[q["no"]] = q["question"]

    updated = 0

    for i, q in enumerate(image_questions):
        no = q["no"]
        q_text = q["question"]

        # 1. 找題目所在頁
        pg = find_question_page(doc, q_text)
        if pg is None:
            print(f"  [Q{no}] ❌ 找不到頁碼，跳過（題目：{q_text[:20]}…）")
            continue

        # 2. 取得題目 y 座標
        y_top = get_q_y_on_page(doc[pg - 1], q_text)

        # 3. 找「緊接下一題」（no+1）作為邊界（非下一道含圖題，避免趪階）
        next_no = no + 1
        next_pg: int | None = None
        next_y = 0.0
        if next_no in all_questions:
            next_pg = find_question_page(doc, all_questions[next_no])
            if next_pg:
                next_y = get_q_y_on_page(doc[next_pg - 1], all_questions[next_no])

        # 4. 收集圖片區域
        # 導差：當下一題跟本題在同一頁且 y 座標差距 < 60，過濫範圍實際爲 0，直接用備用整頁渲染
        same_page_collision = (
            next_pg is not None and next_pg == pg and (next_y - y_top) < 60
        )
        if same_page_collision:
            regions = []
        else:
            regions = collect_images_in_range(doc, pg, y_top, next_pg, next_y)

        print(
            f"  [Q{no}] p{pg}（y={y_top:.0f}）→ 找到 {len(regions)} 個圖片區域", end=""
        )
        if next_pg:
            print(f"（下一題 Q{next_no} 在 p{next_pg}）")
        else:
            print("（最後一題）")

        if not regions:
            # 備用：渲染整頁
            print(f"    ⚠ 無圖片區域，備用整頁渲染 p{pg}")
            img = fallback_render_page(doc, pg)
        else:
            img = render_image_regions(doc, regions)

        if img is None:
            print(f"    ❌ 渲染失敗")
            continue

        print(f"    → {img.width}×{img.height} px")

        if not dry_run:
            out_path = out_dir / f"q{no}.png"
            img.save(out_path, "PNG", optimize=True)
            print(f"    ✓ 儲存：{out_path.relative_to(PROJECT_ROOT)}")

            new_url = f"/images/questions/{subject}/q{no}.png"
            q["image_url"] = new_url
            updated += 1

    doc.close()

    if not dry_run and updated > 0:
        for out_json_dir in [DATA_DIR, PUBLIC_DATA_DIR]:
            dest = out_json_dir / f"{subject}.json"
            with open(dest, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\n  ✓ 更新 {updated} 題 image_url，JSON 已存檔")


def main() -> None:
    parser = argparse.ArgumentParser(description="萃取 AI 規劃師試題圖片")
    parser.add_argument(
        "--subject", help="只處理單一科目 key（big-data / machine-learning）"
    )
    parser.add_argument("--dry-run", action="store_true", help="只偵測不儲存")
    args = parser.parse_args()

    targets = (
        {args.subject: SUBJECT_PDF_KW[args.subject]}
        if args.subject and args.subject in SUBJECT_PDF_KW
        else SUBJECT_PDF_KW
    )

    for subject, pdf_kw in targets.items():
        process_subject(subject, pdf_kw, dry_run=args.dry_run)

    print("\n[完成]")


if __name__ == "__main__":
    main()
