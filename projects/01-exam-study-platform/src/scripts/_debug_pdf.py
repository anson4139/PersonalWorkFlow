"""
_debug_pdf.py
臨時診斷腳本：分析選項空白的根本原因，試驗不同 pypdf 解析模式
"""

import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

from pypdf import PdfReader
from pypdf.generic import NameObject

# 先分析 105 Q2 財分 Q13 的原始 PDF 文字
_RAW_PDF_BASE = (
    pathlib.Path(__file__).resolve().parents[2]
    / "data"
    / "raw-pdf"
    / "securities-broker"
)
pdf_path = str(_RAW_PDF_BASE / "105" / "105 Q2證券投資與財務分析.pdf")
reader = PdfReader(pdf_path)
for i, page in enumerate(reader.pages):
    text = page.extract_text() or ""
    # Q13 判斷
    if re.search(r"(?<!\d)13\.", text):
        idx = max(0, text.rfind("12.") if "12." in text else 0)
        end = text.find("14.", idx) if "14." in text[idx:] else idx + 500
        chunk = text[idx : end + 100]
        print(f"=== Page {i} (raw) ===")
        print(repr(chunk[:600]))
        # 也試 visitor_text 模式
        parts = []

        def collect(txt, cm, tm, fd, fs):
            if txt.strip():
                parts.append((tm, txt))

        try:
            page.extract_text(visitor_text=collect)
        except Exception:
            pass
        # 排序：先 y（tm[5]），再 x（tm[4]）
        parts.sort(key=lambda p: (-round(p[0][5], 0), p[0][4]))
        q13_parts = []
        in_q13 = False
        for tm, t in parts:
            if re.search(r"(?<!\d)13\.", t):
                in_q13 = True
            if re.search(r"(?<!\d)14\.", t) and in_q13:
                break
            if in_q13:
                q13_parts.append(t)
        print(f"--- visitor_text for Q13 ---")
        print(q13_parts)
        break

if False:
    TEST_FILES = [
        # 107 A-class（答案全缺）
        str(_RAW_PDF_BASE / "107" / "(證券商業務員) 107年Q1證券交易相關法規與實務.pdf"),
        str(_RAW_PDF_BASE / "107" / "107年 證券商業務員_Q4證券交易相關法規與實務.pdf"),
        # 106 Q3（答案缺）
        str(_RAW_PDF_BASE / "106" / "106年證券商業務員_Q3證券交易相關法規與實務.pdf"),
        # 106 Q4（題答 PDF，答案缺）
        str(_RAW_PDF_BASE / "106" / "證券商業務員_Q4證券交易相關法規與實務_題答.pdf"),
    ]

ANSWER_PAIR_RE = re.compile(r"(?<!\d)([1-5]?\d)\s+([A-D])(?![A-Z])")

for fp in TEST_FILES:
    path = pathlib.Path(fp)
    if not path.exists():
        print(f"[NOT FOUND] {path.name}")
        continue
    reader = PdfReader(str(path))
    pages = [p.extract_text() or "" for p in reader.pages]
    print(f"\n{'=' * 60}")
    print(f"FILE: {path.name}  ({len(pages)} pages)")
    print(f"{'=' * 60}")
    # 印最後 3 頁
    for i, pg in enumerate(pages[-3:]):
        idx = len(pages) - min(3, len(pages)) + i
        pairs = ANSWER_PAIR_RE.findall(pg)
        print(f"  [page {idx + 1}] len={len(pg)} | answer_pairs={pairs[:10]}")
        print(pg[:800])
        print()
    # 搜尋 '答案' 關鍵字
    found_answer_page = None
    for i, pg in enumerate(pages):
        if re.search(r"答\s*案", pg):
            found_answer_page = (i, pg[:500])
            break
    if found_answer_page:
        print(f"  [ANSWER SECTION at page {found_answer_page[0] + 1}]")
        print(found_answer_page[1])
    else:
        print(f'  [NO "答案" keyword found in any page]')
