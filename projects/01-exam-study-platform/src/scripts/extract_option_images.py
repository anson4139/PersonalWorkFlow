"""
extract_option_images.py
從中級 AI 規劃師 PDF 萃取「選項圖片」（選項內容是程式碼圖片而非文字的題目）。

策略：
  1. 在 PDF 頁面中搜尋選項標籤 (A)、(B)、(C)、(D) 的 y 座標
  2. 以相鄰標籤的 y 區間為邊界，截取該範圍內所有圖片
  3. 垂直合併並存為 PNG
  4. 更新 JSON 的 option_images 欄位

用法：
  python extract_option_images.py --subject machine-learning --question 45
  python extract_option_images.py --subject machine-learning --question 45 --dry-run
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

PDF_DIR = PROJECT_ROOT / "data" / "raw-pdf" / "ai-planning" / "中級"
DATA_DIR = PROJECT_ROOT / "data" / "subjects"
PUBLIC_DATA_DIR = PROJECT_ROOT / "src" / "web" / "public" / "data" / "subjects"
PUBLIC_IMG_DIR = PROJECT_ROOT / "src" / "web" / "public" / "images" / "questions"

SUBJECT_PDF_KW: dict[str, str] = {
    "big-data": "第二科",
    "machine-learning": "第三科",
    "ai-planning": "第一科",
}

ZOOM = 2.0  # 高解析度萃取（適合程式碼圖片）
OPTION_LABELS = ["(A)", "(B)", "(C)", "(D)"]
OPT_KEYS = ["A", "B", "C", "D"]
MIN_IMG_W = 80
MIN_IMG_H = 20
MAX_SCAN_PAGES = 8  # Q45 所在頁往後最多掃描幾頁


# ── 工具函式 ──────────────────────────────────────────────────────────────────


def find_pdf(subject: str) -> Path:
    kw = SUBJECT_PDF_KW[subject]
    for pdf in PDF_DIR.glob("*.pdf"):
        if kw in pdf.name:
            return pdf
    raise FileNotFoundError(f"找不到含 '{kw}' 的 PDF（目錄：{PDF_DIR}）")


def find_question_page(doc: fitz.Document, question_text: str) -> int | None:
    """回傳 1-indexed 頁碼。"""
    for needle_len in (15, 10, 6):
        needle = question_text.strip()[:needle_len]
        for pg_idx, page in enumerate(doc):
            if needle in page.get_text():
                return pg_idx + 1
    return None


def scan_option_positions(
    doc: fitz.Document,
    start_pg: int,
    question_y: float,
) -> list[tuple[int, float, str]]:
    """
    從 start_pg 往後掃描，找 (A)/(B)/(C)/(D) 標籤在 PDF 中的位置。
    回傳 [(page_1indexed, y, label), ...] 按順序排列。
    """
    results: list[tuple[int, float, str]] = []
    found_labels: set[str] = set()

    for pg_offset in range(MAX_SCAN_PAGES):
        pg_no = start_pg + pg_offset
        if pg_no > len(doc):
            break

        page = doc[pg_no - 1]
        # 在這一頁搜尋每個還未找到的 label
        for label in OPTION_LABELS:
            if label in found_labels:
                continue
            rects = page.search_for(label)
            for r in rects:
                # 第一頁只取在題目文字之後的標籤
                if pg_no == start_pg and r.y0 < question_y - 10:
                    continue
                results.append((pg_no, r.y0, label))
                found_labels.add(label)
                break  # 每頁每個 label 只取第一個出現位置

        if len(found_labels) == 4:
            break

    # 按頁碼 + y 排序
    results.sort(key=lambda x: (x[0], x[1]))
    return results


def collect_images_for_option(
    doc: fitz.Document,
    opt_pg: int,
    opt_y: float,
    next_opt_pg: int | None,
    next_opt_y: float | None,
) -> list[tuple[int, fitz.Rect]]:
    """收集某個選項範圍內的圖片（起自 opt_y，止於 next_opt_y）。"""
    regions: list[tuple[int, fitz.Rect]] = []

    for pg_offset in range(MAX_SCAN_PAGES):
        pg_no = opt_pg + pg_offset

        # 超過下一個選項所在頁則停止
        if next_opt_pg is not None and pg_no > next_opt_pg:
            break
        if pg_no > len(doc):
            break

        page = doc[pg_no - 1]

        for img_info in page.get_image_info(hashes=False):
            bbox = fitz.Rect(img_info["bbox"])
            w, h = bbox.width, bbox.height
            if w < MIN_IMG_W or h < MIN_IMG_H:
                continue

            # 起始頁：只取在選項標籤 y 以下的圖
            if pg_no == opt_pg and bbox.y1 < opt_y:
                continue

            # 終止頁：只取在下一個選項 y 以上的圖
            if next_opt_pg is not None and pg_no == next_opt_pg:
                if next_opt_y is not None and bbox.y0 >= next_opt_y:
                    continue

            regions.append((pg_no, bbox))

    return regions


def render_regions(
    doc: fitz.Document,
    regions: list[tuple[int, fitz.Rect]],
    margin: int = 6,
) -> Image.Image | None:
    if not regions:
        return None

    mat = fitz.Matrix(ZOOM, ZOOM)
    clips: list[Image.Image] = []

    for pg_no, bbox in regions:
        page = doc[pg_no - 1]
        clip = fitz.Rect(
            max(0, bbox.x0 - margin),
            max(0, bbox.y0 - margin),
            bbox.x1 + margin,
            bbox.y1 + margin,
        )
        pix = page.get_pixmap(matrix=mat, clip=clip)
        clips.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))

    if len(clips) == 1:
        return clips[0]

    gap = 4
    total_h = sum(c.height for c in clips) + gap * (len(clips) - 1)
    max_w = max(c.width for c in clips)
    combined = Image.new("RGB", (max_w, total_h), (30, 30, 30))
    y = 0
    for clip in clips:
        combined.paste(clip, (0, y))
        y += clip.height + gap

    return combined


# ── 主流程 ────────────────────────────────────────────────────────────────────


def process(subject: str, question_no: int, dry_run: bool) -> None:
    json_path = DATA_DIR / f"{subject}.json"
    if not json_path.exists():
        print(f"[ERROR] JSON 不存在：{json_path}")
        return

    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    # 找題目資料
    target_q: dict | None = None
    for sess in data["sessions"]:
        for q in sess["questions"]:
            if q["no"] == question_no:
                target_q = q
                break
        if target_q:
            break

    if not target_q:
        print(f"[ERROR] 找不到 Q{question_no}")
        return

    pdf_path = find_pdf(subject)
    print(f"PDF: {pdf_path.name}")
    doc = fitz.open(str(pdf_path))

    # 找題目所在頁
    q_pg = find_question_page(doc, target_q["question"])
    if q_pg is None:
        print(f"[ERROR] 找不到 Q{question_no} 在 PDF 中的頁面")
        doc.close()
        return

    # 取得題目文字在該頁的 y 座標
    page = doc[q_pg - 1]
    needle = target_q["question"].strip()[:15]
    rects = page.search_for(needle) or page.search_for(needle[:8])
    q_y = rects[0].y0 if rects else 0.0
    print(f"Q{question_no} 在 p{q_pg}，y={q_y:.0f}")

    # 掃描選項標籤位置
    opt_positions = scan_option_positions(doc, q_pg, q_y)
    print(
        f"找到選項標籤：{[(lab, f'p{pg} y={y:.0f}') for pg, y, lab in opt_positions]}"
    )

    if len(opt_positions) < 4:
        print(f"[WARNING] 只找到 {len(opt_positions)} 個選項標籤（需要 4 個）")

    # 估算選項間距（用前三個選項的平均間距），用於限制最後一個選項的高度
    opt_gap: float | None = None
    if len(opt_positions) >= 2:
        gaps = []
        for i in range(1, len(opt_positions)):
            pg_a, y_a, _ = opt_positions[i - 1]
            pg_b, y_b, _ = opt_positions[i]
            if pg_a == pg_b:
                gaps.append(y_b - y_a)
        if gaps:
            opt_gap = sum(gaps) / len(gaps)

    # 萃取每個選項的圖片
    out_dir = PUBLIC_IMG_DIR / subject
    if not dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)

    saved_option_images: dict[str, str] = {}

    for i, (pg, y, label) in enumerate(opt_positions):
        opt_key = label[1]  # "(A)" → "A"
        next_pg = opt_positions[i + 1][0] if i + 1 < len(opt_positions) else None
        next_y = opt_positions[i + 1][1] if i + 1 < len(opt_positions) else None

        # 最後一個選項（D）沒有下邊界，用估算間距推算
        if next_y is None and opt_gap is not None:
            next_pg = pg
            next_y = y + opt_gap * 1.1  # 多留 10% 空間

        regions = collect_images_for_option(doc, pg, y, next_pg, next_y)
        print(f"  [{label}] p{pg} y={y:.0f} → {len(regions)} 個圖片區域")

        if not regions:
            print(f"    [WARNING] 沒有找到圖片，略過")
            continue

        img = render_regions(doc, regions)
        if img is None:
            print(f"    [ERROR] 渲染失敗")
            continue

        print(f"    → {img.width}×{img.height} px")

        filename = f"q{question_no}-{opt_key.lower()}.png"
        url = f"/images/questions/{subject}/{filename}"

        if not dry_run:
            out_path = out_dir / filename
            img.save(out_path, "PNG", optimize=True)
            print(f"    ✓ 儲存：{out_path.relative_to(PROJECT_ROOT)}")

        saved_option_images[opt_key] = url

    doc.close()

    if dry_run or not saved_option_images:
        print(f"\n[DRY-RUN] 完成。不儲存 JSON。")
        return

    # 更新 JSON
    target_q["option_images"] = saved_option_images
    print(f"\n更新 option_images：{saved_option_images}")

    for out_json_dir in [DATA_DIR, PUBLIC_DATA_DIR]:
        dest = out_json_dir / f"{subject}.json"
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ JSON 已更新（{len(saved_option_images)} 個選項）")


def main() -> None:
    parser = argparse.ArgumentParser(description="萃取題目選項圖片")
    parser.add_argument("--subject", required=True, choices=list(SUBJECT_PDF_KW.keys()))
    parser.add_argument("--question", type=int, required=True, help="題號")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    process(args.subject, args.question, args.dry_run)


if __name__ == "__main__":
    main()
