import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
import pathlib as _pathlib

from pypdf import PdfReader

SOURCE = str(
    _pathlib.Path(__file__).resolve().parents[2]
    / "data"
    / "raw-pdf"
    / "securities-broker"
)


def find_q_raw(pdf_path, q_no):
    try:
        reader = PdfReader(pdf_path)
        for page in reader.pages:
            text = page.extract_text() or ""
            pat = re.compile(rf"(?<!\d){q_no}\.[^\n]{{0,5}}")
            if pat.search(text):
                idx = pat.search(text).start()
                return text[max(0, idx - 5) : idx + 300]
        return "[NOT FOUND]"
    except Exception as e:
        return f"[ERROR: {e}]"


cases = [
    (
        rf"{SOURCE}\105\105Q3\u8b49\u5238\u6295\u8cc7\u8207\u8ca1\u52d9\u5206\u6790.pdf",
        5,
        "105Q3\u8ca1 Q5",
    ),
    (
        rf"{SOURCE}\105\105Q3\u8b49\u5238\u6295\u8cc7\u8207\u8ca1\u52d9\u5206\u6790.pdf",
        24,
        "105Q3\u8ca1 Q24",
    ),
    (
        rf"{SOURCE}\105\Q4\u8b49\u5238\u5546\u696d\u52d9\u54e1-\u8b49\u5238\u6295\u8cc7\u8207\u8ca1\u52d9\u5206\u6790.pdf",
        5,
        "105Q4\u8ca1 Q5",
    ),
    (
        rf"{SOURCE}\106\106\u5e74Q2\u8b49\u5238\u6295\u8cc7\u8207\u8ca1\u52d9\u5206\u6790-106\u5e74\u8b49\u5238\u5546\u696d\u52d9\u54e1.pdf",
        7,
        "106Q2\u8ca1 Q7",
    ),
]

for pdf, qno, desc in cases:
    print(f"=== {desc} ===")
    print(repr(find_q_raw(pdf, qno)[:300]))
    print()
