"""
pdf_poc_110.py
單一年度 PDF 轉檔 PoC：將證券商業務員題庫轉成平台 JSON。

目前重點：驗證 110 年代碼檔名（11001/11001a ... 11003/11003a）可穩定入庫。
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from pypdf import PdfReader

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).resolve().parents[2]
WORKSPACE_ROOT = PROJECT_ROOT.parents[1]
DEFAULT_SOURCE_ROOT = WORKSPACE_ROOT / '證券商業務員(初業)10501-11501-20260504T094529Z-3-001' / '證券商業務員(初業)10501-11501'

SubjectCode = Literal['law', 'finance']

SUBJECT_META = {
    'law': {
        'key': 'securities-broker-law-110-poc',
        'title': '證券商業務員｜證券交易相關法規與實務（110年 PoC）',
    },
    'finance': {
        'key': 'securities-broker-finance-110-poc',
        'title': '證券商業務員｜證券投資與財務分析（110年 PoC）',
    },
}

QUESTION_SUBJECT_MARKERS: dict[SubjectCode, str] = {
    'law': '專業科目：證券交易相關法規與實務',
    'finance': '專業科目：證券投資與財務分析',
}

QUESTION_START_RE = re.compile(r'(?<!\d)([1-5]?\d)\.\s')
OPTION_RE = re.compile(r'\(([A-D])\)\s*(.*?)(?=\([A-D]\)|$)')
ANSWER_PAIR_RE = re.compile(r'(?<!\d)([1-5]?\d)\s+([A-D])(?![A-Z])')


@dataclass
class ParsedQuestion:
    no: int
    question: str
    options: dict[str, str]


def normalize_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


def extract_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    parts: list[str] = []
    for page in reader.pages:
        parts.append(page.extract_text() or '')
    return '\n'.join(parts)


def split_subject_text_from_question_pdf(path: Path) -> dict[SubjectCode, str]:
    reader = PdfReader(str(path))
    subject_text: dict[SubjectCode, list[str]] = {'law': [], 'finance': []}
    current_subject: SubjectCode | None = None

    for page in reader.pages:
        page_text = page.extract_text() or ''
        if QUESTION_SUBJECT_MARKERS['law'] in page_text:
            current_subject = 'law'
        if QUESTION_SUBJECT_MARKERS['finance'] in page_text:
            current_subject = 'finance'

        if current_subject:
            subject_text[current_subject].append(page_text)

    return {
        'law': '\n'.join(subject_text['law']),
        'finance': '\n'.join(subject_text['finance']),
    }


def parse_questions(text: str) -> list[ParsedQuestion]:
    clean = normalize_text(text)
    matches = list(QUESTION_START_RE.finditer(clean))
    questions: list[ParsedQuestion] = []

    for idx, match in enumerate(matches):
        no = int(match.group(1))
        if no < 1 or no > 50:
            continue

        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(clean)
        block = clean[start:end].strip()
        if not block:
            continue

        first_option = re.search(r'\([A-D]\)', block)
        if not first_option:
            continue

        stem = normalize_text(block[:first_option.start()])
        option_region = block[first_option.start():]
        options: dict[str, str] = {}
        for option_match in OPTION_RE.finditer(option_region):
            options[option_match.group(1)] = normalize_text(option_match.group(2))

        if not stem or len(options) < 4:
            continue

        questions.append(ParsedQuestion(no=no, question=stem, options=options))

    dedup: dict[int, ParsedQuestion] = {}
    for item in questions:
        dedup[item.no] = item

    return [dedup[i] for i in sorted(dedup.keys())]


def parse_answer_segments(path: Path) -> list[dict[int, str]]:
    text = extract_pdf_text(path)
    clean = normalize_text(text)
    pairs = [(int(no), ans) for no, ans in ANSWER_PAIR_RE.findall(clean) if 1 <= int(no) <= 50]

    segments: list[dict[int, str]] = []
    current: dict[int, str] = {}

    for no, ans in pairs:
        if no == 1 and current and len(current) >= 45:
            segments.append(current)
            current = {}

        if no not in current:
            current[no] = ans

        if len(current) == 50:
            segments.append(current)
            current = {}

        if len(segments) >= 2:
            break

    if len(segments) < 2:
        raise ValueError(f'答案解析不足兩段：{path.name}')

    return segments[:2]


def build_subject_payload(subject: SubjectCode, year: str, sessions: list[dict]) -> dict:
    total = sum(len(s['questions']) for s in sessions)
    return {
        'key': SUBJECT_META[subject]['key'],
        'title': SUBJECT_META[subject]['title'],
        'total': total,
        'sessions': sessions,
        'meta': {
            'sourceType': 'pdf-poc',
            'year': year,
            'subject': subject,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description='PDF to JSON PoC for a single year (default: 110).')
    parser.add_argument('--year', default='110', help='民國年度資料夾，例如 110')
    parser.add_argument('--source-root', default=str(DEFAULT_SOURCE_ROOT), help='原始 PDF 根資料夾')
    args = parser.parse_args()

    year = args.year
    source_root = Path(args.source_root)
    year_dir = source_root / year
    if not year_dir.exists():
        raise FileNotFoundError(f'找不到年度資料夾：{year_dir}')

    code_re = re.compile(rf'^{re.escape(year)}0([1-9]\d?)(a?)\.pdf$', re.IGNORECASE)
    question_files: dict[int, Path] = {}
    answer_files: dict[int, Path] = {}

    for file in sorted(year_dir.glob('*.pdf')):
        match = code_re.match(file.name)
        if not match:
            continue

        session_no = int(match.group(1))
        is_answer = bool(match.group(2))
        if is_answer:
            answer_files[session_no] = file
        else:
            question_files[session_no] = file

    available_sessions = sorted(set(question_files.keys()) & set(answer_files.keys()))
    if not available_sessions:
        raise RuntimeError(f'年度 {year} 找不到可配對的題目/答案檔')

    law_sessions: list[dict] = []
    finance_sessions: list[dict] = []

    for session_no in available_sessions:
        q_path = question_files[session_no]
        a_path = answer_files[session_no]

        subject_text = split_subject_text_from_question_pdf(q_path)
        law_questions = parse_questions(subject_text['law'])
        finance_questions = parse_questions(subject_text['finance'])
        answer_segments = parse_answer_segments(a_path)
        law_answers = answer_segments[0]
        finance_answers = answer_segments[1]

        law_sessions.append({
            'session': f'第{session_no}次',
            'questions': [
                {
                    'no': q.no,
                    'question': q.question,
                    'options': q.options,
                    'answer': law_answers.get(q.no, ''),
                    'explanation': 'PDF 原始試題未附解析',
                }
                for q in law_questions
            ],
        })

        finance_sessions.append({
            'session': f'第{session_no}次',
            'questions': [
                {
                    'no': q.no,
                    'question': q.question,
                    'options': q.options,
                    'answer': finance_answers.get(q.no, ''),
                    'explanation': 'PDF 原始試題未附解析',
                }
                for q in finance_questions
            ],
        })

        print(f'[OK] {q_path.name} + {a_path.name} -> 法規 {len(law_questions)} 題 / 財務 {len(finance_questions)} 題')

    output_dir = PROJECT_ROOT / 'data' / 'subjects'
    output_dir.mkdir(parents=True, exist_ok=True)
    web_output_dir = PROJECT_ROOT / 'src' / 'web' / 'public' / 'data' / 'subjects'
    web_output_dir.mkdir(parents=True, exist_ok=True)

    law_payload = build_subject_payload('law', year, law_sessions)
    finance_payload = build_subject_payload('finance', year, finance_sessions)

    law_file = f'securities-broker-law-{year}-poc.json'
    finance_file = f'securities-broker-finance-{year}-poc.json'

    (output_dir / law_file).write_text(json.dumps(law_payload, ensure_ascii=False, indent=2), encoding='utf-8')
    (output_dir / finance_file).write_text(json.dumps(finance_payload, ensure_ascii=False, indent=2), encoding='utf-8')
    (web_output_dir / law_file).write_text(json.dumps(law_payload, ensure_ascii=False, indent=2), encoding='utf-8')
    (web_output_dir / finance_file).write_text(json.dumps(finance_payload, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f'[DONE] 寫入 {law_file} / {finance_file}')
    print(f'      總題數：法規 {law_payload["total"]} 題，財務 {finance_payload["total"]} 題')


if __name__ == '__main__':
    main()
