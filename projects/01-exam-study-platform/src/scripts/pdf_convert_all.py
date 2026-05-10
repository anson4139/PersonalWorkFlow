"""
pdf_convert_all.py
全量 PDF 轉 JSON：105~115 年度，支援兩種命名族群。

  B class（代碼命名）：YYY0N.pdf + YYY0Na.pdf — 109 Q3/Q4、110~115
  A class（中文長檔名）：單科 PDF，答案附於同一檔末尾 — 105~108、109 Q1/Q2

用法：
  python pdf_convert_all.py                       # 全部年份
  python pdf_convert_all.py --years 110 111       # 指定年份
  python pdf_convert_all.py --dry-run             # 只顯示偵測結果，不輸出 JSON
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from pypdf import PdfReader

sys.stdout.reconfigure(encoding="utf-8")

# ── 路徑 ──────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parents[2]
WORKSPACE_ROOT = PROJECT_ROOT.parents[1]
DEFAULT_SOURCE_ROOT = (
    WORKSPACE_ROOT
    / "證券商業務員(初業)10501-11501-20260504T094529Z-3-001"
    / "證券商業務員(初業)10501-11501"
)
OUTPUT_DIRS = [
    PROJECT_ROOT / "data" / "subjects",
    PROJECT_ROOT / "src" / "web" / "public" / "data" / "subjects",
]

# ── 型別 ──────────────────────────────────────────────────────────────────────
SubjectCode = Literal["law", "finance"]

SUBJECT_META: dict[SubjectCode, dict] = {
    "law": {"label": "證券交易相關法規與實務"},
    "finance": {"label": "證券投資與財務分析"},
}


def subject_key(subject: SubjectCode, year: str) -> str:
    return f"securities-broker-{subject}-{year}"


def subject_title(subject: SubjectCode, year: str) -> str:
    return f"證券商業務員｜{SUBJECT_META[subject]['label']}（{year}年）"


# ── 已知答案更正 ───────────────────────────────────────────────────────────────
# (year, session_no, subject, question_no) -> correct_answer
ANSWER_PATCHES: dict[tuple[int, int, SubjectCode, int], str] = {
    (108, 3, "law", 2): "D",  # 108年Q3 法規第2題 應更正為D（來源：108/更正txt）
    (109, 3, "law", 9): "均給分",  # 109年Q3 法規第9題 審題委員決定均給分
}

# ── 圖片嵌入答案（106 Q3/Q4、107 Q1-Q4、108 Q1-Q4、109 Q1/Q2）─────────────────
# 這些 PDF 最後一頁以圖片方式嵌入答案，文字萃取無法取得，手動辨識後記錄於此。
# 優先權：ANSWER_PATCHES > IMAGE_EXTRACTED_ANSWERS > extract_answers_from_end
IMAGE_EXTRACTED_ANSWERS: dict[tuple[int, int, SubjectCode], dict[int, str]] = {
    (106, 3, "law"): {
        1: "A",
        2: "C",
        3: "C",
        4: "D",
        5: "B",
        6: "B",
        7: "A",
        8: "C",
        9: "C",
        10: "D",
        11: "C",
        12: "B",
        13: "B",
        14: "B",
        15: "C",
        16: "A",
        17: "B",
        18: "D",
        19: "D",
        20: "A",
        21: "A",
        22: "D",
        23: "C",
        24: "C",
        25: "C",
        26: "A",
        27: "A",
        28: "A",
        29: "B",
        30: "A",
        31: "D",
        32: "D",
        33: "B",
        34: "C",
        35: "D",
        36: "B",
        37: "D",
        38: "C",
        39: "C",
        40: "A",
        41: "D",
        42: "D",
        43: "D",
        44: "C",
        45: "D",
        46: "C",
        47: "C",
        48: "D",
        49: "B",
        50: "A",
    },
    (106, 3, "finance"): {
        1: "A",
        2: "A",
        3: "D",
        4: "B",
        5: "C",
        6: "C",
        7: "D",
        8: "C",
        9: "A",
        10: "C",
        11: "A",
        12: "B",
        13: "D",
        14: "D",
        15: "B",
        16: "A",
        17: "A",
        18: "C",
        19: "B",
        20: "A",
        21: "D",
        22: "B",
        23: "C",
        24: "D",
        25: "D",
        26: "C",
        27: "A",
        28: "D",
        29: "D",
        30: "D",
        31: "D",
        32: "C",
        33: "C",
        34: "A",
        35: "B",
        36: "A",
        37: "D",
        38: "A",
        39: "D",
        40: "C",
        41: "B",
        42: "B",
        43: "B",
        44: "D",
        45: "A",
        46: "D",
        47: "B",
        48: "D",
        49: "D",
        50: "D",
    },
    (106, 4, "law"): {
        1: "A",
        2: "C",
        3: "C",
        4: "D",
        5: "C",
        6: "D",
        7: "C",
        8: "A",
        9: "D",
        10: "C",
        11: "D",
        12: "D",
        13: "C",
        14: "A",
        15: "B",
        16: "B",
        17: "B",
        18: "D",
        19: "B",
        20: "B",
        21: "C",
        22: "C",
        23: "C",
        24: "C",
        25: "C",
        26: "B",
        27: "C",
        28: "D",
        29: "B",
        30: "D",
        31: "D",
        32: "D",
        33: "B",
        34: "A",
        35: "A",
        36: "B",
        37: "C",
        38: "D",
        39: "D",
        40: "D",
        41: "D",
        42: "D",
        43: "D",
        44: "A",
        45: "A",
        46: "A",
        47: "A",
        48: "B",
        49: "B",
        50: "A",
    },
    (106, 4, "finance"): {
        1: "D",
        2: "D",
        3: "C",
        4: "B",
        5: "C",
        6: "B",
        7: "C",
        8: "A",
        9: "A",
        10: "D",
        11: "C",
        12: "C",
        13: "D",
        14: "B",
        15: "D",
        16: "A",
        17: "D",
        18: "B",
        19: "D",
        20: "A",
        21: "B",
        22: "C",
        23: "C",
        24: "A",
        25: "C",
        26: "D",
        27: "D",
        28: "C",
        29: "D",
        30: "D",
        31: "D",
        32: "A",
        33: "D",
        34: "B",
        35: "D",
        36: "D",
        37: "D",
        38: "B",
        39: "B",
        40: "B",
        41: "A",
        42: "D",
        43: "C",
        44: "D",
        45: "C",
        46: "D",
        47: "B",
        48: "C",
        49: "B",
        50: "C",
    },
    (107, 1, "law"): {
        1: "C",
        2: "C",
        3: "A",
        4: "C",
        5: "B",
        6: "C",
        7: "C",
        8: "A",
        9: "D",
        10: "A",
        11: "C",
        12: "B",
        13: "B",
        14: "B",
        15: "A",
        16: "D",
        17: "B",
        18: "D",
        19: "C",
        20: "C",
        21: "B",
        22: "C",
        23: "B",
        24: "C",
        25: "C",
        26: "D",
        27: "D",
        28: "B",
        29: "D",
        30: "A",
        31: "D",
        32: "B",
        33: "C",
        34: "D",
        35: "D",
        36: "B",
        37: "B",
        38: "C",
        39: "D",
        40: "A",
        41: "C",
        42: "C",
        43: "D",
        44: "C",
        45: "B",
        46: "D",
        47: "C",
        48: "A",
        49: "A",
        50: "A",
    },
    (107, 1, "finance"): {
        1: "A",
        2: "A",
        3: "B",
        4: "A",
        5: "A",
        6: "A",
        7: "B",
        8: "D",
        9: "B",
        10: "D",
        11: "A",
        12: "B",
        13: "B",
        14: "D",
        15: "D",
        16: "A",
        17: "A",
        18: "A",
        19: "C",
        20: "D",
        21: "B",
        22: "A",
        23: "C",
        24: "A",
        25: "D",
        26: "C",
        27: "B",
        28: "D",
        29: "D",
        30: "C",
        31: "B",
        32: "B",
        33: "C",
        34: "B",
        35: "B",
        36: "B",
        37: "A",
        38: "D",
        39: "D",
        40: "D",
        41: "A",
        42: "D",
        43: "B",
        44: "D",
        45: "C",
        46: "C",
        47: "C",
        48: "D",
        49: "D",
        50: "C",
    },
    (107, 2, "law"): {
        1: "B",
        2: "A",
        3: "B",
        4: "B",
        5: "B",
        6: "C",
        7: "B",
        8: "B",
        9: "A",
        10: "C",
        11: "B",
        12: "C",
        13: "C",
        14: "A",
        15: "D",
        16: "C",
        17: "A",
        18: "C",
        19: "D",
        20: "A",
        21: "C",
        22: "D",
        23: "B",
        24: "B",
        25: "C",
        26: "B",
        27: "D",
        28: "C",
        29: "D",
        30: "B",
        31: "D",
        32: "D",
        33: "D",
        34: "B",
        35: "C",
        36: "D",
        37: "C",
        38: "A",
        39: "B",
        40: "D",
        41: "D",
        42: "C",
        43: "A",
        44: "C",
        45: "A",
        46: "A",
        47: "A",
        48: "A",
        49: "A",
        50: "B",
    },
    (107, 2, "finance"): {
        1: "C",
        2: "C",
        3: "D",
        4: "B",
        5: "B",
        6: "A",
        7: "B",
        8: "A",
        9: "B",
        10: "B",
        11: "A",
        12: "C",
        13: "D",
        14: "D",
        15: "A",
        16: "C",
        17: "C",
        18: "B",
        19: "D",
        20: "C",
        21: "B",
        22: "A",
        23: "D",
        24: "A",
        25: "B",
        26: "C",
        27: "D",
        28: "D",
        29: "B",
        30: "B",
        31: "A",
        32: "D",
        33: "A",
        34: "A",
        35: "A",
        36: "C",
        37: "D",
        38: "D",
        39: "B",
        40: "D",
        41: "A",
        42: "A",
        43: "C",
        44: "D",
        45: "B",
        46: "D",
        47: "D",
        48: "C",
        49: "C",
        50: "C",
    },
    (107, 3, "law"): {
        1: "B",
        2: "A",
        3: "C",
        4: "C",
        5: "D",
        6: "D",
        7: "A",
        8: "B",
        9: "D",
        10: "D",
        11: "C",
        12: "A",
        13: "B",
        14: "C",
        15: "B",
        16: "B",
        17: "B",
        18: "A",
        19: "D",
        20: "B",
        21: "B",
        22: "A",
        23: "B",
        24: "A",
        25: "C",
        26: "D",
        27: "A",
        28: "D",
        29: "C",
        30: "D",
        31: "A",
        32: "D",
        33: "C",
        34: "C",
        35: "C",
        36: "B",
        37: "B",
        38: "D",
        39: "D",
        40: "A",
        41: "D",
        42: "B",
        43: "A",
        44: "D",
        45: "B",
        46: "C",
        47: "A",
        48: "C",
        49: "D",
        50: "C",
    },
    (107, 3, "finance"): {
        1: "C",
        2: "C",
        3: "C",
        4: "D",
        5: "C",
        6: "B",
        7: "B",
        8: "C",
        9: "A",
        10: "C",
        11: "A",
        12: "C",
        13: "B",
        14: "D",
        15: "A",
        16: "C",
        17: "A",
        18: "B",
        19: "C",
        20: "B",
        21: "B",
        22: "A",
        23: "C",
        24: "D",
        25: "A",
        26: "D",
        27: "D",
        28: "D",
        29: "C",
        30: "C",
        31: "B",
        32: "D",
        33: "B",
        34: "B",
        35: "C",
        36: "A",
        37: "B",
        38: "C",
        39: "D",
        40: "B",
        41: "D",
        42: "B",
        43: "B",
        44: "C",
        45: "D",
        46: "D",
        47: "C",
        48: "B",
        49: "D",
        50: "D",
    },
    (107, 4, "law"): {
        1: "A",
        2: "D",
        3: "A",
        4: "C",
        5: "A",
        6: "B",
        7: "A",
        8: "A",
        9: "C",
        10: "B",
        11: "D",
        12: "A",
        13: "C",
        14: "B",
        15: "D",
        16: "C",
        17: "D",
        18: "D",
        19: "D",
        20: "C",
        21: "C",
        22: "D",
        23: "B",
        24: "A",
        25: "A",
        26: "A",
        27: "D",
        28: "D",
        29: "C",
        30: "A",
        31: "B",
        32: "D",
        33: "D",
        34: "B",
        35: "D",
        36: "C",
        37: "D",
        38: "D",
        39: "C",
        40: "D",
        41: "A",
        42: "A",
        43: "C",
        44: "D",
        45: "C",
        46: "A",
        47: "B",
        48: "B",
        49: "B",
        50: "D",
    },
    (107, 4, "finance"): {
        1: "D",
        2: "B",
        3: "D",
        4: "D",
        5: "D",
        6: "A",
        7: "C",
        8: "B",
        9: "B",
        10: "C",
        11: "C",
        12: "B",
        13: "D",
        14: "D",
        15: "A",
        16: "D",
        17: "D",
        18: "B",
        19: "B",
        20: "D",
        21: "A",
        22: "C",
        23: "A",
        24: "B",
        25: "C",
        26: "A",
        27: "B",
        28: "B",
        29: "D",
        30: "A",
        31: "C",
        32: "C",
        33: "D",
        34: "C",
        35: "D",
        36: "B",
        37: "B",
        38: "D",
        39: "C",
        40: "B",
        41: "A",
        42: "A",
        43: "C",
        44: "C",
        45: "C",
        46: "D",
        47: "D",
        48: "C",
        49: "A",
        50: "D",
    },
    (108, 1, "law"): {
        1: "B",
        2: "A",
        3: "A",
        4: "A",
        5: "D",
        6: "D",
        7: "B",
        8: "D",
        9: "B",
        10: "D",
        11: "A",
        12: "C",
        13: "B",
        14: "C",
        15: "B",
        16: "B",
        17: "D",
        18: "B",
        19: "D",
        20: "D",
        21: "A",
        22: "D",
        23: "A",
        24: "B",
        25: "D",
        26: "C",
        27: "D",
        28: "D",
        29: "D",
        30: "A",
        31: "B",
        32: "B",
        33: "D",
        34: "C",
        35: "D",
        36: "D",
        37: "D",
        38: "B",
        39: "C",
        40: "B",
        41: "B",
        42: "D",
        43: "C",
        44: "A",
        45: "D",
        46: "D",
        47: "A",
        48: "C",
        49: "C",
        50: "B",
    },
    (108, 1, "finance"): {
        1: "D",
        2: "A",
        3: "D",
        4: "A",
        5: "D",
        6: "A",
        7: "C",
        8: "D",
        9: "A",
        10: "B",
        11: "A",
        12: "A",
        13: "A",
        14: "D",
        15: "B",
        16: "B",
        17: "C",
        18: "B",
        19: "C",
        20: "A",
        21: "B",
        22: "D",
        23: "C",
        24: "B",
        25: "B",
        26: "C",
        27: "B",
        28: "B",
        29: "B",
        30: "A",
        31: "B",
        32: "C",
        33: "A",
        34: "C",
        35: "B",
        36: "D",
        37: "B",
        38: "C",
        39: "A",
        40: "B",
        41: "D",
        42: "D",
        43: "D",
        44: "B",
        45: "C",
        46: "D",
        47: "C",
        48: "B",
        49: "C",
        50: "C",
    },
    (108, 2, "law"): {
        1: "C",
        2: "B",
        3: "D",
        4: "A",
        5: "D",
        6: "A",
        7: "B",
        8: "C",
        9: "C",
        10: "B",
        11: "C",
        12: "B",
        13: "A",
        14: "C",
        15: "D",
        16: "C",
        17: "C",
        18: "D",
        19: "C",
        20: "D",
        21: "A",
        22: "B",
        23: "B",
        24: "B",
        25: "A",
        26: "C",
        27: "C",
        28: "D",
        29: "C",
        30: "A",
        31: "B",
        32: "C",
        33: "D",
        34: "D",
        35: "D",
        36: "B",
        37: "A",
        38: "B",
        39: "C",
        40: "D",
        41: "D",
        42: "D",
        43: "D",
        44: "A",
        45: "C",
        46: "B",
        47: "C",
        48: "C",
        49: "C",
        50: "C",
    },
    (108, 2, "finance"): {
        1: "A",
        2: "B",
        3: "A",
        4: "C",
        5: "D",
        6: "C",
        7: "C",
        8: "B",
        9: "A",
        10: "C",
        11: "A",
        12: "A",
        13: "A",
        14: "B",
        15: "D",
        16: "A",
        17: "D",
        18: "A",
        19: "B",
        20: "B",
        21: "A",
        22: "A",
        23: "C",
        24: "D",
        25: "A",
        26: "B",
        27: "B",
        28: "A",
        29: "D",
        30: "A",
        31: "D",
        32: "B",
        33: "A",
        34: "B",
        35: "A",
        36: "C",
        37: "C",
        38: "B",
        39: "B",
        40: "A",
        41: "A",
        42: "D",
        43: "D",
        44: "B",
        45: "B",
        46: "B",
        47: "D",
        48: "B",
        49: "C",
        50: "D",
    },
    (108, 3, "law"): {
        1: "D",
        2: "C",
        3: "C",
        4: "A",
        5: "A",
        6: "B",
        7: "B",
        8: "D",
        9: "A",
        10: "D",
        11: "A",
        12: "C",
        13: "D",
        14: "A",
        15: "C",
        16: "D",
        17: "C",
        18: "B",
        19: "A",
        20: "C",
        21: "D",
        22: "C",
        23: "C",
        24: "A",
        25: "C",
        26: "C",
        27: "D",
        28: "C",
        29: "D",
        30: "B",
        31: "A",
        32: "D",
        33: "D",
        34: "B",
        35: "C",
        36: "C",
        37: "C",
        38: "D",
        39: "D",
        40: "B",
        41: "D",
        42: "B",
        43: "D",
        44: "A",
        45: "A",
        46: "D",
        47: "A",
        48: "B",
        49: "D",
        50: "D",
    },
    (108, 3, "finance"): {
        1: "A",
        2: "B",
        3: "C",
        4: "A",
        5: "D",
        6: "A",
        7: "D",
        8: "C",
        9: "A",
        10: "D",
        11: "A",
        12: "D",
        13: "A",
        14: "C",
        15: "B",
        16: "A",
        17: "D",
        18: "C",
        19: "A",
        20: "B",
        21: "C",
        22: "B",
        23: "D",
        24: "C",
        25: "B",
        26: "A",
        27: "D",
        28: "D",
        29: "B",
        30: "B",
        31: "B",
        32: "C",
        33: "C",
        34: "D",
        35: "B",
        36: "B",
        37: "A",
        38: "A",
        39: "D",
        40: "C",
        41: "D",
        42: "B",
        43: "A",
        44: "B",
        45: "C",
        46: "B",
        47: "B",
        48: "B",
        49: "C",
        50: "D",
    },
    (108, 4, "law"): {
        1: "C",
        2: "D",
        3: "A",
        4: "A",
        5: "B",
        6: "D",
        7: "C",
        8: "C",
        9: "B",
        10: "B",
        11: "A",
        12: "D",
        13: "C",
        14: "C",
        15: "A",
        16: "C",
        17: "A",
        18: "A",
        19: "A",
        20: "C",
        21: "D",
        22: "C",
        23: "A",
        24: "C",
        25: "C",
        26: "C",
        27: "A",
        28: "C",
        29: "D",
        30: "B",
        31: "C",
        32: "D",
        33: "C",
        34: "B",
        35: "B",
        36: "C",
        37: "C",
        38: "B",
        39: "D",
        40: "D",
        41: "D",
        42: "D",
        43: "B",
        44: "C",
        45: "B",
        46: "C",
        47: "B",
        48: "C",
        49: "C",
        50: "C",
    },
    (108, 4, "finance"): {
        1: "C",
        2: "A",
        3: "A",
        4: "D",
        5: "A",
        6: "D",
        7: "C",
        8: "B",
        9: "A",
        10: "B",
        11: "B",
        12: "B",
        13: "C",
        14: "A",
        15: "B",
        16: "A",
        17: "D",
        18: "A",
        19: "A",
        20: "B",
        21: "B",
        22: "A",
        23: "C",
        24: "A",
        25: "C",
        26: "A",
        27: "D",
        28: "D",
        29: "B",
        30: "C",
        31: "C",
        32: "A",
        33: "C",
        34: "A",
        35: "D",
        36: "A",
        37: "B",
        38: "D",
        39: "B",
        40: "D",
        41: "D",
        42: "C",
        43: "C",
        44: "A",
        45: "D",
        46: "D",
        47: "B",
        48: "C",
        49: "D",
        50: "C",
    },
    (109, 1, "law"): {
        1: "C",
        2: "C",
        3: "D",
        4: "A",
        5: "D",
        6: "C",
        7: "C",
        8: "D",
        9: "A",
        10: "B",
        11: "D",
        12: "A",
        13: "B",
        14: "A",
        15: "A",
        16: "B",
        17: "D",
        18: "D",
        19: "A",
        20: "D",
        21: "C",
        22: "C",
        23: "D",
        24: "A",
        25: "C",
        26: "A",
        27: "B",
        28: "B",
        29: "D",
        30: "A",
        31: "C",
        32: "D",
        33: "C",
        34: "C",
        35: "D",
        36: "B",
        37: "D",
        38: "A",
        39: "C",
        40: "D",
        41: "A",
        42: "B",
        43: "D",
        44: "A",
        45: "C",
        46: "D",
        47: "A",
        48: "C",
        49: "C",
        50: "B",
    },
    (109, 1, "finance"): {
        1: "A",
        2: "A",
        3: "B",
        4: "A",
        5: "A",
        6: "C",
        7: "D",
        8: "C",
        9: "D",
        10: "C",
        11: "B",
        12: "D",
        13: "C",
        14: "C",
        15: "B",
        16: "B",
        17: "D",
        18: "D",
        19: "D",
        20: "B",
        21: "C",
        22: "D",
        23: "D",
        24: "C",
        25: "A",
        26: "C",
        27: "B",
        28: "D",
        29: "C",
        30: "D",
        31: "B",
        32: "B",
        33: "D",
        34: "A",
        35: "D",
        36: "B",
        37: "D",
        38: "D",
        39: "B",
        40: "C",
        41: "D",
        42: "D",
        43: "D",
        44: "D",
        45: "C",
        46: "A",
        47: "A",
        48: "D",
        49: "D",
        50: "D",
    },
    (109, 2, "law"): {
        1: "C",
        2: "C",
        3: "C",
        4: "A",
        5: "B",
        6: "C",
        7: "B",
        8: "B",
        9: "B",
        10: "B",
        11: "D",
        12: "A",
        13: "C",
        14: "A",
        15: "C",
        16: "C",
        17: "C",
        18: "C",
        19: "D",
        20: "B",
        21: "D",
        22: "C",
        23: "C",
        24: "A",
        25: "D",
        26: "C",
        27: "C",
        28: "C",
        29: "D",
        30: "D",
        31: "A",
        32: "A",
        33: "B",
        34: "C",
        35: "C",
        36: "B",
        37: "A",
        38: "B",
        39: "D",
        40: "A",
        41: "D",
        42: "D",
        43: "C",
        44: "C",
        45: "D",
        46: "A",
        47: "C",
        48: "B",
        49: "D",
        50: "D",
    },
    (109, 2, "finance"): {
        1: "D",
        2: "A",
        3: "D",
        4: "D",
        5: "B",
        6: "C",
        7: "D",
        8: "B",
        9: "D",
        10: "A",
        11: "C",
        12: "C",
        13: "B",
        14: "C",
        15: "B",
        16: "A",
        17: "C",
        18: "D",
        19: "B",
        20: "D",
        21: "A",
        22: "B",
        23: "B",
        24: "D",
        25: "B",
        26: "C",
        27: "D",
        28: "B",
        29: "A",
        30: "B",
        31: "B",
        32: "C",
        33: "C",
        34: "D",
        35: "A",
        36: "B",
        37: "D",
        38: "B",
        39: "B",
        40: "A",
        41: "B",
        42: "D",
        43: "D",
        44: "A",
        45: "D",
        46: "C",
        47: "A",
        48: "C",
        49: "D",
        50: "D",
    },
}

# ── 正規式 ────────────────────────────────────────────────────────────────────
QUESTION_START_RE = re.compile(r"(?<!\d)([1-5]?\d)\.(?:\s|(?=[^\d\s]))")
# NOTE: OPTION_RE is kept for reference but replaced by parse_options_sequential()
# The old regex r"\(([A-D])\)\s*(.*?)(?=\([A-D]\)|$)" incorrectly splits
# options containing back-references like '(D)選項(A)(B)(C)皆非'
OPTION_RE = re.compile(r"\(([A-D])\)\s*(.*?)(?=\([A-D]\)|$)")
ANSWER_PAIR_RE = re.compile(r"(?<!\d)([1-5]?\d)\s+([A-D])(?![A-Z])")
# 「均給分」特殊答案的 regex（審題委員修正時使用）
ANSWER_JUNGEIFEN_RE = re.compile(r"(?<!\d)([1-5]?\d)\s+均給分")
SUBJECT_MARKERS: dict[SubjectCode, str] = {
    "law": "專業科目：證券交易相關法規與實務",
    "finance": "專業科目：證券投資與財務分析",
}
SESSION_FROM_NAME_RE = re.compile(r"Q(\d)", re.IGNORECASE)
TRAILING_DIGIT_RE = re.compile(r"(\d)\.pdf$", re.IGNORECASE)


# ── 資料類別 ──────────────────────────────────────────────────────────────────
@dataclass
class ParsedQuestion:
    no: int
    question: str
    options: dict[str, str]
    answer: str = ""
    explanation: str = "PDF 原始試題未附解析"


@dataclass
class SessionPlan:
    year: int
    session_no: int
    cls: Literal["A", "B"]
    # B class
    q_path: Path | None = None
    a_path: Path | None = None
    # A class (one entry per subject)
    a_files: dict[SubjectCode, Path] = field(default_factory=dict)


# ── 文字工具 ──────────────────────────────────────────────────────────────────
def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


# ── A class：偵測科目與屆次 ────────────────────────────────────────────────────
def detect_subject(name: str) -> SubjectCode | None:
    if "法規" in name:
        return "law"
    if "財務" in name or "財分" in name:
        return "finance"
    return None


def detect_session(name: str) -> int | None:
    m = SESSION_FROM_NAME_RE.search(name)
    if m:
        return int(m.group(1))
    m = TRAILING_DIGIT_RE.search(name)
    if m:
        return int(m.group(1))
    return None


# ── 選項解析（順序解析，不會被選項內容中的引用誤觸發）──────────────────────────────
def parse_options_sequential(option_block: str) -> dict[str, str]:
    """
    順序解析 A→B→C→D 選項。

    策略：
    1. 找「選項起始」時優先用嚴格模式（前置空白/字串開頭），
       找不到才 fallback 到自由模式（無前置要求）。
       → 避免 '(D)選項(A)(B)(C)皆非' 中的 (A) 誤觸發。
    2. 找「選項終止」時同樣先嚴格後自由。
       → 處理 '成交量過度異常者(D)選項' 這類無空白分隔的情況。
    """
    options: dict[str, str] = {}
    search_pos = 0
    for i, letter in enumerate("ABCD"):
        strict_pat = re.compile(r"(?:^| )\(" + letter + r"\)")
        m = strict_pat.search(option_block, search_pos)
        if not m and i > 0:
            # fallback：不要求前置空白（處理 '者(B)...' 等無空白情況）
            liberal_pat = re.compile(r"\(" + letter + r"\)")
            m = liberal_pat.search(option_block, search_pos)
        if not m:
            break
        content_start = m.end()
        if i < 3:
            next_letter = "ABCD"[i + 1]
            strict_end = re.compile(r"(?:^| )\(" + next_letter + r"\)")
            nm = strict_end.search(option_block, content_start)
            if not nm:
                # fallback：允許無前置空白終止（處理 '者(D)...' 等情況）
                liberal_end = re.compile(r"\(" + next_letter + r"\)")
                nm = liberal_end.search(option_block, content_start)
            content_end = nm.start() if nm else len(option_block)
            search_pos = nm.start() if nm else len(option_block)
        else:
            content_end = len(option_block)
        options[letter] = normalize(option_block[content_start:content_end])
    return options


# ── 題目解析（A/B class 共用）─────────────────────────────────────────────────
def parse_questions(text: str) -> list[ParsedQuestion]:
    clean = normalize(text)
    matches = list(QUESTION_START_RE.finditer(clean))
    items: list[ParsedQuestion] = []

    for idx, m in enumerate(matches):
        no = int(m.group(1))
        if not 1 <= no <= 50:
            continue
        start = m.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(clean)
        block = clean[start:end].strip()
        if not block:
            continue

        first_opt = re.search(r"\([A-D]\)", block)
        if not first_opt:
            continue

        stem = normalize(block[: first_opt.start()])
        options = parse_options_sequential(block[first_opt.start() :])

        if not stem or len(options) < 4:
            continue
        items.append(ParsedQuestion(no=no, question=stem, options=options))

    # 去重（保留最後一次）
    dedup: dict[int, ParsedQuestion] = {}
    for q in items:
        dedup[q.no] = q
    return [dedup[i] for i in sorted(dedup)]


# ── 答案解析 ──────────────────────────────────────────────────────────────────
def extract_answer_map(text: str, expected: int = 50) -> dict[int, str]:
    """從純文字中抽取題號->答案對應表，回傳第一段完整的 expected 題答案。"""
    clean = normalize(text)
    pairs = [
        (int(no), ans)
        for no, ans in ANSWER_PAIR_RE.findall(clean)
        if 1 <= int(no) <= expected
    ]
    # 依序組裝，遇到 no=1 且已有完整段則另起新段
    result: dict[int, str] = {}
    for no, ans in pairs:
        if no == 1 and result and len(result) >= expected - 5:
            break
        if no not in result:
            result[no] = ans
        if len(result) == expected:
            break
    return result


def extract_answer_map_from_file(path: Path, expected: int = 50) -> dict[int, str]:
    return extract_answer_map(pdf_text(path), expected)


def extract_answers_from_end(path: Path, expected: int = 50) -> dict[int, str]:
    """A class 答案在同一檔末尾——先嘗試找 '答案' 段落，否則用末 30% 文字。"""
    reader = PdfReader(str(path))
    pages = [page.extract_text() or "" for page in reader.pages]
    n = len(pages)

    # 找答案段起始頁
    answer_start = None
    for i, pg in enumerate(pages):
        if re.search(r"答\s*案", pg):
            answer_start = i
            break

    if answer_start is not None:
        section = "\n".join(pages[answer_start:])
    else:
        # 後 30% 頁面
        start = max(0, int(n * 0.7))
        section = "\n".join(pages[start:])

    result = extract_answer_map(section, expected)
    if len(result) < expected // 2:
        # fallback：全文搜尋
        result = extract_answer_map("\n".join(pages), expected)
    return result


# ── B class 解析（兩段答案，各對應 law/finance）────────────────────────────────
def parse_b_class_session(
    q_path: Path,
    a_path: Path,
    year: int,
    session_no: int,
) -> dict[SubjectCode, list[ParsedQuestion]]:
    # 依頁面分割兩科文字
    reader = PdfReader(str(q_path))
    subject_pages: dict[SubjectCode, list[str]] = {"law": [], "finance": []}
    current: SubjectCode | None = None

    for page in reader.pages:
        text = page.extract_text() or ""
        if SUBJECT_MARKERS["law"] in text:
            current = "law"
        if SUBJECT_MARKERS["finance"] in text:
            current = "finance"
        if current:
            subject_pages[current].append(text)

    result: dict[SubjectCode, list[ParsedQuestion]] = {}

    # 答案（兩段）
    a_text = pdf_text(a_path)
    a_clean = normalize(a_text)
    all_pairs = [
        (int(no), ans)
        for no, ans in ANSWER_PAIR_RE.findall(a_clean)
        if 1 <= int(no) <= 50
    ]
    # 補上「均給分」特殊答案（審題委員更正後全選項均得分）
    jungeifen_nos = {
        int(no) for no in ANSWER_JUNGEIFEN_RE.findall(a_clean) if 1 <= int(no) <= 50
    }
    # 合併：均給分的題號先不加，讓 ANSWER_PATCHES 優先處理
    # （若 ANSWER_PATCHES 未覆蓋，則在此補入均給分）
    existing_nos = {no for no, _ in all_pairs}
    for jno in sorted(jungeifen_nos):
        if jno not in existing_nos:
            all_pairs.append((jno, "均給分"))

    segments: list[dict[int, str]] = []
    seg: dict[int, str] = {}
    for no, ans in all_pairs:
        if no == 1 and seg and len(seg) >= 45:
            segments.append(seg)
            seg = {}
        if no not in seg:
            seg[no] = ans
        if len(seg) == 50:
            segments.append(seg)
            seg = {}
        if len(segments) >= 2:
            break
    if seg:
        segments.append(seg)

    answer_map: dict[SubjectCode, dict[int, str]] = {}
    if len(segments) >= 2:
        answer_map["law"] = segments[0]
        answer_map["finance"] = segments[1]
    elif len(segments) == 1:
        # 只解析出一段時，嘗試用科目標記區分
        answer_map["law"] = segments[0]
        answer_map["finance"] = {}
    else:
        answer_map["law"] = answer_map["finance"] = {}

    for subj, pages_list in subject_pages.items():
        questions = parse_questions("\n".join(pages_list))
        amap = answer_map.get(subj, {})
        for q in questions:
            patch_key = (year, session_no, subj, q.no)
            q.answer = ANSWER_PATCHES.get(patch_key, amap.get(q.no, ""))
        result[subj] = questions

    return result


# ── A class 解析（單科 PDF，答案在末尾）────────────────────────────────────────
def parse_a_class_file(
    path: Path,
    subject: SubjectCode,
    year: int,
    session_no: int,
) -> list[ParsedQuestion]:
    text = pdf_text(path)
    questions = parse_questions(text)
    amap = extract_answers_from_end(path)
    img_answers = IMAGE_EXTRACTED_ANSWERS.get((year, session_no, subject), {})
    for q in questions:
        patch_key = (year, session_no, subject, q.no)
        q.answer = ANSWER_PATCHES.get(
            patch_key,
            img_answers.get(q.no) or amap.get(q.no, ""),
        )
    return questions


# ── 年度資料夾分類 ─────────────────────────────────────────────────────────────
def classify_year_dir(year_dir: Path, year: int) -> list[SessionPlan]:
    code_re = re.compile(rf"^{year}0?(\d+)(a?)\.pdf$", re.IGNORECASE)
    b_q: dict[int, Path] = {}
    b_a: dict[int, Path] = {}
    a_files: dict[tuple[int, SubjectCode], list[Path]] = {}

    for f in sorted(year_dir.glob("*.pdf")):
        m = code_re.match(f.name)
        if m:
            sno = int(m.group(1))
            if m.group(2):
                b_a[sno] = f
            else:
                b_q[sno] = f
            continue

        # A class
        subj = detect_subject(f.name)
        sno = detect_session(f.name)
        if subj and sno:
            key = (sno, subj)
            if key not in a_files:
                a_files[key] = []
            a_files[key].append(f)

    plans: list[SessionPlan] = []

    # B class：需要 q + a 配對
    for sno in sorted(set(b_q) & set(b_a)):
        plans.append(
            SessionPlan(
                year=year,
                session_no=sno,
                cls="B",
                q_path=b_q[sno],
                a_path=b_a[sno],
            )
        )

    # A class：按屆次聚合
    session_map: dict[int, dict[SubjectCode, Path]] = {}
    for (sno, subj), files in sorted(a_files.items()):
        if sno not in session_map:
            session_map[sno] = {}
        session_map[sno][subj] = files[0]  # 有重複時取第一個，已有排序

    for sno, sf in sorted(session_map.items()):
        plans.append(
            SessionPlan(
                year=year,
                session_no=sno,
                cls="A",
                a_files=sf,
            )
        )

    return plans


# ── JSON 輸出 ─────────────────────────────────────────────────────────────────
def questions_to_dicts(questions: list[ParsedQuestion]) -> list[dict]:
    return [
        {
            "no": q.no,
            "question": q.question,
            "options": q.options,
            "answer": q.answer,
            "explanation": q.explanation,
        }
        for q in questions
    ]


def build_and_write(
    subject: SubjectCode,
    year: int,
    sessions_data: list[tuple[int, list[ParsedQuestion]]],
    output_dirs: list[Path],
    dry_run: bool,
) -> None:
    # 讀取既有 JSON 中的真實解析（非佔位符），避免重新轉換時覆蓋
    _PLACEHOLDER = "PDF 原始試題未附解析"
    existing_explain: dict[tuple[str, int], str] = {}
    fname_lookup = f"{subject_key(subject, str(year))}.json"
    for d in output_dirs:
        existing_path = d / fname_lookup
        if existing_path.exists():
            try:
                existing_data = json.loads(existing_path.read_text(encoding="utf-8"))
                for sess in existing_data.get("sessions", []):
                    sname = sess["session"]
                    for q in sess.get("questions", []):
                        exp = q.get("explanation", "")
                        if exp and exp != _PLACEHOLDER:
                            existing_explain[(sname, q["no"])] = exp
            except Exception:
                pass
            break  # 只需讀一份

    sessions_json = []
    for sno, questions in sessions_data:
        session_name = f"{year}年第{sno}次"
        q_dicts = []
        for q in questions:
            d_q = {
                "no": q.no,
                "question": q.question,
                "options": q.options,
                "answer": q.answer,
                "explanation": existing_explain.get(
                    (session_name, q.no), q.explanation
                ),
            }
            q_dicts.append(d_q)
        sessions_json.append({"session": session_name, "questions": q_dicts})

    total = sum(len(s["questions"]) for s in sessions_json)
    payload = {
        "key": subject_key(subject, str(year)),
        "title": subject_title(subject, str(year)),
        "total": total,
        "sessions": sessions_json,
        "meta": {
            "sourceType": "pdf-converted",
            "year": str(year),
            "subject": subject,
        },
    }

    fname = f"{subject_key(subject, str(year))}.json"
    if not dry_run:
        for d in output_dirs:
            d.mkdir(parents=True, exist_ok=True)
            out = d / fname
            out.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(f"  [WRITE] {out}")
    else:
        print(
            f"  [DRY-RUN] would write {fname} ({total} 題, {len(sessions_json)} 屆次)"
        )


# ── 主流程 ────────────────────────────────────────────────────────────────────
def process_all(
    source_root: Path,
    output_dirs: list[Path],
    years: list[int] | None,
    dry_run: bool,
) -> None:
    all_years = sorted(
        int(d.name) for d in source_root.iterdir() if d.is_dir() and d.name.isdigit()
    )
    target_years = years if years else all_years
    print(f"目標年份：{target_years}")

    for year in target_years:
        year_dir = source_root / str(year)
        if not year_dir.exists():
            print(f"\n[SKIP] 找不到 {year_dir}")
            continue

        print(f"\n── {year} 年 ──")
        plans = classify_year_dir(year_dir, year)
        if not plans:
            print(f"  [WARN] 無可用檔案")
            continue

        # 收集每科目的 sessions
        law_sessions: list[tuple[int, list[ParsedQuestion]]] = []
        finance_sessions: list[tuple[int, list[ParsedQuestion]]] = []

        for plan in plans:
            label = f"第{plan.session_no}次"
            if plan.cls == "B":
                print(f"  B class {label}: {plan.q_path.name} + {plan.a_path.name}")
                if dry_run:
                    law_sessions.append((plan.session_no, []))
                    finance_sessions.append((plan.session_no, []))
                    continue
                try:
                    parsed = parse_b_class_session(
                        plan.q_path, plan.a_path, year, plan.session_no
                    )
                    law_qs = parsed.get("law", [])
                    fin_qs = parsed.get("finance", [])
                    print(f"    法規 {len(law_qs)} 題 / 財分 {len(fin_qs)} 題", end="")
                    if law_qs and not all(q.answer for q in law_qs):
                        missing = sum(1 for q in law_qs if not q.answer)
                        print(f"  [WARN] 法規缺 {missing} 個答案", end="")
                    if fin_qs and not all(q.answer for q in fin_qs):
                        missing = sum(1 for q in fin_qs if not q.answer)
                        print(f"  [WARN] 財分缺 {missing} 個答案", end="")
                    print()
                    law_sessions.append((plan.session_no, law_qs))
                    finance_sessions.append((plan.session_no, fin_qs))
                except Exception as e:
                    print(f"\n    [ERROR] {e}")

            else:  # A class
                files_desc = ", ".join(f"{s}={p.name}" for s, p in plan.a_files.items())
                print(f"  A class {label}: {files_desc}")
                if dry_run:
                    if "law" in plan.a_files:
                        law_sessions.append((plan.session_no, []))
                    if "finance" in plan.a_files:
                        finance_sessions.append((plan.session_no, []))
                    continue
                for subj, path in plan.a_files.items():
                    try:
                        qs = parse_a_class_file(path, subj, year, plan.session_no)
                        missing = sum(1 for q in qs if not q.answer)
                        warn = f"  [WARN] 缺 {missing} 個答案" if missing else ""
                        print(f"    {subj} {len(qs)} 題{warn}")
                        if subj == "law":
                            law_sessions.append((plan.session_no, qs))
                        else:
                            finance_sessions.append((plan.session_no, qs))
                    except Exception as e:
                        print(f"    [ERROR] {subj}: {e}")

        # 輸出
        if law_sessions:
            build_and_write("law", year, law_sessions, output_dirs, dry_run)
        if finance_sessions:
            build_and_write("finance", year, finance_sessions, output_dirs, dry_run)


def main() -> None:
    ap = argparse.ArgumentParser(description="全量 PDF 轉 JSON（105~115 年）")
    ap.add_argument("--years", nargs="+", type=int, help="指定年份，例如 110 111")
    ap.add_argument("--source-root", default=str(DEFAULT_SOURCE_ROOT))
    ap.add_argument("--dry-run", action="store_true", help="只偵測，不輸出 JSON")
    args = ap.parse_args()

    process_all(
        source_root=Path(args.source_root),
        output_dirs=OUTPUT_DIRS,
        years=args.years,
        dry_run=args.dry_run,
    )
    print("\n[DONE]")


if __name__ == "__main__":
    main()
