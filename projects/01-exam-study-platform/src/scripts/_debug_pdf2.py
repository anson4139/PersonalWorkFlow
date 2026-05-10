"""
_debug_pdf.py - v2
臨時診斷腳本：比較有效 vs 無效 PDF 的答案區格式
"""

import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

from pypdf import PdfReader

BASE = (
    pathlib.Path(__file__).resolve().parents[2]
    / "data"
    / "raw-pdf"
    / "securities-broker"
)
ANSWER_PAIR_RE = re.compile(r"(?<!\d)([1-5]?\d)\s+([A-D])(?![A-Z])")


def check_pdf(path_obj):
    path = pathlib.Path(path_obj)
    if not path.exists():
        print(f"[NOT FOUND] {path}")
        return
    reader = PdfReader(str(path))
    pages = [p.extract_text() or "" for p in reader.pages]
    print(f"\n{'=' * 60}")
    print(f"FILE: {path.name}  ({len(pages)} pages)")
    print(f"{'=' * 60}")
    for i, pg in enumerate(pages[-3:]):
        idx = len(pages) - min(3, len(pages)) + i
        pairs = ANSWER_PAIR_RE.findall(pg)
        print(f"  [page {idx + 1}] len={len(pg)} | answer_pairs={pairs[:15]}")
        print(pg[:600])
        print()
    found = None
    for i, pg in enumerate(pages):
        if re.search(r"[答案]{2}", pg) and i >= len(pages) // 2:
            found = (i, pg[:300])
            break
    if found:
        print(f"  [ANSWER SECTION found at page {found[0] + 1}]")
        print(found[1])
    else:
        print(f"  [NO answer section in second half]")


check_pdf(
    BASE
    / "105"
    / "105Q2\u8b49\u5238\u4ea4\u6613\u76f8\u95dc\u6cd5\u898f\u8207\u5be6\u52d9 .pdf"
)
check_pdf(
    BASE
    / "106"
    / "Q2\u8b49\u5238\u4ea4\u6613\u76f8\u95dc\u6cd5\u898f\u8207\u5be6\u52d9_1.pdf"
)
check_pdf(
    BASE
    / "106"
    / "106\u5e74\u8b49\u5238\u5546\u696d\u52d9\u54e1_Q3\u8b49\u5238\u4ea4\u6613\u76f8\u95dc\u6cd5\u898f\u8207\u5be6\u52d9.pdf"
)
check_pdf(
    BASE
    / "106"
    / "\u8b49\u5238\u5546\u696d\u52d9\u54e1_Q4\u8b49\u5238\u4ea4\u6613\u76f8\u95dc\u6cd5\u898f\u8207\u5be6\u52d9_\u984c\u7b54.pdf"
)
