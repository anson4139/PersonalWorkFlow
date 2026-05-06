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

sys.stdout.reconfigure(encoding='utf-8')

# ── 路徑 ──────────────────────────────────────────────────────────────────────
PROJECT_ROOT  = Path(__file__).resolve().parents[2]
WORKSPACE_ROOT = PROJECT_ROOT.parents[1]
DEFAULT_SOURCE_ROOT = (
    WORKSPACE_ROOT
    / '證券商業務員(初業)10501-11501-20260504T094529Z-3-001'
    / '證券商業務員(初業)10501-11501'
)
OUTPUT_DIRS = [
    PROJECT_ROOT / 'data' / 'subjects',
    PROJECT_ROOT / 'src' / 'web' / 'public' / 'data' / 'subjects',
]

# ── 型別 ──────────────────────────────────────────────────────────────────────
SubjectCode = Literal['law', 'finance']

SUBJECT_META: dict[SubjectCode, dict] = {
    'law':     {'label': '證券交易相關法規與實務'},
    'finance': {'label': '證券投資與財務分析'},
}

def subject_key(subject: SubjectCode, year: str) -> str:
    return f'securities-broker-{subject}-{year}'

def subject_title(subject: SubjectCode, year: str) -> str:
    return f'證券商業務員｜{SUBJECT_META[subject]["label"]}（{year}年）'

# ── 已知答案更正 ───────────────────────────────────────────────────────────────
# (year, session_no, subject, question_no) -> correct_answer
ANSWER_PATCHES: dict[tuple[int, int, SubjectCode, int], str] = {
    (108, 3, 'law', 2): 'D',   # 108年Q3 法規第2題 應更正為D（來源：108/更正txt）
}

# ── 正規式 ────────────────────────────────────────────────────────────────────
QUESTION_START_RE  = re.compile(r'(?<!\d)([1-5]?\d)\.\s')
OPTION_RE          = re.compile(r'\(([A-D])\)\s*(.*?)(?=\([A-D]\)|$)')
ANSWER_PAIR_RE     = re.compile(r'(?<!\d)([1-5]?\d)\s+([A-D])(?![A-Z])')
SUBJECT_MARKERS: dict[SubjectCode, str] = {
    'law':     '專業科目：證券交易相關法規與實務',
    'finance': '專業科目：證券投資與財務分析',
}
SESSION_FROM_NAME_RE = re.compile(r'Q(\d)', re.IGNORECASE)
TRAILING_DIGIT_RE    = re.compile(r'(\d)\.pdf$', re.IGNORECASE)

# ── 資料類別 ──────────────────────────────────────────────────────────────────
@dataclass
class ParsedQuestion:
    no: int
    question: str
    options: dict[str, str]
    answer: str = ''
    explanation: str = 'PDF 原始試題未附解析'

@dataclass
class SessionPlan:
    year: int
    session_no: int
    cls: Literal['A', 'B']
    # B class
    q_path: Path | None = None
    a_path: Path | None = None
    # A class (one entry per subject)
    a_files: dict[SubjectCode, Path] = field(default_factory=dict)

# ── 文字工具 ──────────────────────────────────────────────────────────────────
def normalize(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()

def pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    return '\n'.join(page.extract_text() or '' for page in reader.pages)

# ── A class：偵測科目與屆次 ────────────────────────────────────────────────────
def detect_subject(name: str) -> SubjectCode | None:
    if '法規' in name:
        return 'law'
    if '財務' in name or '財分' in name:
        return 'finance'
    return None

def detect_session(name: str) -> int | None:
    m = SESSION_FROM_NAME_RE.search(name)
    if m:
        return int(m.group(1))
    m = TRAILING_DIGIT_RE.search(name)
    if m:
        return int(m.group(1))
    return None

# ── 題目解析（A/B class 共用）─────────────────────────────────────────────────
def parse_questions(text: str) -> list[ParsedQuestion]:
    clean   = normalize(text)
    matches = list(QUESTION_START_RE.finditer(clean))
    items: list[ParsedQuestion] = []

    for idx, m in enumerate(matches):
        no = int(m.group(1))
        if not 1 <= no <= 50:
            continue
        start = m.end()
        end   = matches[idx + 1].start() if idx + 1 < len(matches) else len(clean)
        block = clean[start:end].strip()
        if not block:
            continue

        first_opt = re.search(r'\([A-D]\)', block)
        if not first_opt:
            continue

        stem    = normalize(block[:first_opt.start()])
        options: dict[str, str] = {}
        for om in OPTION_RE.finditer(block[first_opt.start():]):
            options[om.group(1)] = normalize(om.group(2))

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
    pages  = [page.extract_text() or '' for page in reader.pages]
    n = len(pages)

    # 找答案段起始頁
    answer_start = None
    for i, pg in enumerate(pages):
        if re.search(r'答\s*案', pg):
            answer_start = i
            break

    if answer_start is not None:
        section = '\n'.join(pages[answer_start:])
    else:
        # 後 30% 頁面
        start = max(0, int(n * 0.7))
        section = '\n'.join(pages[start:])

    result = extract_answer_map(section, expected)
    if len(result) < expected // 2:
        # fallback：全文搜尋
        result = extract_answer_map('\n'.join(pages), expected)
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
    subject_pages: dict[SubjectCode, list[str]] = {'law': [], 'finance': []}
    current: SubjectCode | None = None

    for page in reader.pages:
        text = page.extract_text() or ''
        if SUBJECT_MARKERS['law']     in text: current = 'law'
        if SUBJECT_MARKERS['finance'] in text: current = 'finance'
        if current:
            subject_pages[current].append(text)

    result: dict[SubjectCode, list[ParsedQuestion]] = {}

    # 答案（兩段）
    a_text     = pdf_text(a_path)
    a_clean    = normalize(a_text)
    all_pairs  = [(int(no), ans) for no, ans in ANSWER_PAIR_RE.findall(a_clean) if 1 <= int(no) <= 50]

    segments: list[dict[int, str]] = []
    seg: dict[int, str] = {}
    for no, ans in all_pairs:
        if no == 1 and seg and len(seg) >= 45:
            segments.append(seg); seg = {}
        if no not in seg:
            seg[no] = ans
        if len(seg) == 50:
            segments.append(seg); seg = {}
        if len(segments) >= 2:
            break
    if seg:
        segments.append(seg)

    answer_map: dict[SubjectCode, dict[int, str]] = {}
    if len(segments) >= 2:
        answer_map['law']     = segments[0]
        answer_map['finance'] = segments[1]
    elif len(segments) == 1:
        # 只解析出一段時，嘗試用科目標記區分
        answer_map['law']     = segments[0]
        answer_map['finance'] = {}
    else:
        answer_map['law'] = answer_map['finance'] = {}

    for subj, pages_list in subject_pages.items():
        questions = parse_questions('\n'.join(pages_list))
        amap      = answer_map.get(subj, {})
        for q in questions:
            patch_key = (year, session_no, subj, q.no)
            q.answer = ANSWER_PATCHES.get(patch_key, amap.get(q.no, ''))
        result[subj] = questions

    return result

# ── A class 解析（單科 PDF，答案在末尾）────────────────────────────────────────
def parse_a_class_file(
    path: Path,
    subject: SubjectCode,
    year: int,
    session_no: int,
) -> list[ParsedQuestion]:
    text      = pdf_text(path)
    questions = parse_questions(text)
    amap      = extract_answers_from_end(path)
    for q in questions:
        patch_key = (year, session_no, subject, q.no)
        q.answer  = ANSWER_PATCHES.get(patch_key, amap.get(q.no, ''))
    return questions

# ── 年度資料夾分類 ─────────────────────────────────────────────────────────────
def classify_year_dir(year_dir: Path, year: int) -> list[SessionPlan]:
    code_re = re.compile(rf'^{year}0?(\d+)(a?)\.pdf$', re.IGNORECASE)
    b_q: dict[int, Path] = {}
    b_a: dict[int, Path] = {}
    a_files: dict[tuple[int, SubjectCode], list[Path]] = {}

    for f in sorted(year_dir.glob('*.pdf')):
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
        sno  = detect_session(f.name)
        if subj and sno:
            key = (sno, subj)
            if key not in a_files:
                a_files[key] = []
            a_files[key].append(f)

    plans: list[SessionPlan] = []

    # B class：需要 q + a 配對
    for sno in sorted(set(b_q) & set(b_a)):
        plans.append(SessionPlan(
            year=year, session_no=sno, cls='B',
            q_path=b_q[sno], a_path=b_a[sno],
        ))

    # A class：按屆次聚合
    session_map: dict[int, dict[SubjectCode, Path]] = {}
    for (sno, subj), files in sorted(a_files.items()):
        if sno not in session_map:
            session_map[sno] = {}
        session_map[sno][subj] = files[0]   # 有重複時取第一個，已有排序

    for sno, sf in sorted(session_map.items()):
        plans.append(SessionPlan(
            year=year, session_no=sno, cls='A',
            a_files=sf,
        ))

    return plans

# ── JSON 輸出 ─────────────────────────────────────────────────────────────────
def questions_to_dicts(questions: list[ParsedQuestion]) -> list[dict]:
    return [
        {
            'no':          q.no,
            'question':    q.question,
            'options':     q.options,
            'answer':      q.answer,
            'explanation': q.explanation,
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
    sessions_json = []
    for sno, questions in sessions_data:
        sessions_json.append({
            'session':   f'{year}年第{sno}次',
            'questions': questions_to_dicts(questions),
        })

    total = sum(len(s['questions']) for s in sessions_json)
    payload = {
        'key':      subject_key(subject, str(year)),
        'title':    subject_title(subject, str(year)),
        'total':    total,
        'sessions': sessions_json,
        'meta': {
            'sourceType': 'pdf-converted',
            'year':       str(year),
            'subject':    subject,
        },
    }

    fname = f'{subject_key(subject, str(year))}.json'
    if not dry_run:
        for d in output_dirs:
            d.mkdir(parents=True, exist_ok=True)
            out = d / fname
            out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
            print(f'  [WRITE] {out}')
    else:
        print(f'  [DRY-RUN] would write {fname} ({total} 題, {len(sessions_json)} 屆次)')

# ── 主流程 ────────────────────────────────────────────────────────────────────
def process_all(
    source_root: Path,
    output_dirs: list[Path],
    years: list[int] | None,
    dry_run: bool,
) -> None:
    all_years = sorted(
        int(d.name) for d in source_root.iterdir()
        if d.is_dir() and d.name.isdigit()
    )
    target_years = years if years else all_years
    print(f'目標年份：{target_years}')

    for year in target_years:
        year_dir = source_root / str(year)
        if not year_dir.exists():
            print(f'\n[SKIP] 找不到 {year_dir}')
            continue

        print(f'\n── {year} 年 ──')
        plans = classify_year_dir(year_dir, year)
        if not plans:
            print(f'  [WARN] 無可用檔案')
            continue

        # 收集每科目的 sessions
        law_sessions:     list[tuple[int, list[ParsedQuestion]]] = []
        finance_sessions: list[tuple[int, list[ParsedQuestion]]] = []

        for plan in plans:
            label = f'第{plan.session_no}次'
            if plan.cls == 'B':
                print(f'  B class {label}: {plan.q_path.name} + {plan.a_path.name}')
                if dry_run:
                    law_sessions.append((plan.session_no, []))
                    finance_sessions.append((plan.session_no, []))
                    continue
                try:
                    parsed = parse_b_class_session(plan.q_path, plan.a_path, year, plan.session_no)
                    law_qs = parsed.get('law', [])
                    fin_qs = parsed.get('finance', [])
                    print(f'    法規 {len(law_qs)} 題 / 財分 {len(fin_qs)} 題', end='')
                    if law_qs and not all(q.answer for q in law_qs):
                        missing = sum(1 for q in law_qs if not q.answer)
                        print(f'  [WARN] 法規缺 {missing} 個答案', end='')
                    if fin_qs and not all(q.answer for q in fin_qs):
                        missing = sum(1 for q in fin_qs if not q.answer)
                        print(f'  [WARN] 財分缺 {missing} 個答案', end='')
                    print()
                    law_sessions.append((plan.session_no, law_qs))
                    finance_sessions.append((plan.session_no, fin_qs))
                except Exception as e:
                    print(f'\n    [ERROR] {e}')

            else:  # A class
                files_desc = ', '.join(f'{s}={p.name}' for s, p in plan.a_files.items())
                print(f'  A class {label}: {files_desc}')
                if dry_run:
                    if 'law'     in plan.a_files: law_sessions.append((plan.session_no, []))
                    if 'finance' in plan.a_files: finance_sessions.append((plan.session_no, []))
                    continue
                for subj, path in plan.a_files.items():
                    try:
                        qs = parse_a_class_file(path, subj, year, plan.session_no)
                        missing = sum(1 for q in qs if not q.answer)
                        warn = f'  [WARN] 缺 {missing} 個答案' if missing else ''
                        print(f'    {subj} {len(qs)} 題{warn}')
                        if subj == 'law':
                            law_sessions.append((plan.session_no, qs))
                        else:
                            finance_sessions.append((plan.session_no, qs))
                    except Exception as e:
                        print(f'    [ERROR] {subj}: {e}')

        # 輸出
        if law_sessions:
            build_and_write('law', year, law_sessions, output_dirs, dry_run)
        if finance_sessions:
            build_and_write('finance', year, finance_sessions, output_dirs, dry_run)


def main() -> None:
    ap = argparse.ArgumentParser(description='全量 PDF 轉 JSON（105~115 年）')
    ap.add_argument('--years',       nargs='+', type=int, help='指定年份，例如 110 111')
    ap.add_argument('--source-root', default=str(DEFAULT_SOURCE_ROOT))
    ap.add_argument('--dry-run',     action='store_true', help='只偵測，不輸出 JSON')
    args = ap.parse_args()

    process_all(
        source_root=Path(args.source_root),
        output_dirs=OUTPUT_DIRS,
        years=args.years,
        dry_run=args.dry_run,
    )
    print('\n[DONE]')


if __name__ == '__main__':
    main()
