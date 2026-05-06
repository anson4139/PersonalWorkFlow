"""
convert.py
將題庫 .md 檔轉換成 JSON，輸出至 data/subjects/
"""
import sys
import re
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).resolve().parents[2]
WORKSPACE_ROOT = PROJECT_ROOT.parents[1]

# ---------- 來源設定 ----------
SOURCES = [
    {
        "key": "fintech",
        "title": "台灣金融科技力知識檢定",
        "src": Path(r"D:\Anson\OpenClaw\apps\study\subjects\fintech\fintech-question-bank-full.md"),
    },
    {
        "key": "ai-planning",
        "title": "AI應用規劃師 第一科",
        "src": Path(r"D:\Anson\OpenClaw\apps\study\subjects\ai-planning\ai-planning-question-bank.md"),
    },
    {
        "key": "big-data",
        "title": "AI應用規劃師 第二科",
        "src": Path(r"D:\Anson\OpenClaw\apps\study\subjects\big-data\big-data-question-bank.md"),
    },
    {
        "key": "machine-learning",
        "title": "AI應用規劃師 第三科",
        "src": Path(r"D:\Anson\OpenClaw\apps\study\subjects\machine-learning\machine-learning-question-bank.md"),
    },
    {
        "key": "ecommerce-finance-midterm-113",
        "title": "113電子商務財務管理(期中考)",
        "src": WORKSPACE_ROOT / "finance_25_questions_full_solutions.md",
        "parser": "finance_full",
    },
]

OUTPUT_DIR = PROJECT_ROOT / "data" / "subjects"
WEB_OUTPUT_DIR = PROJECT_ROOT / "src" / "web" / "public" / "data" / "subjects"

# ---------- 解析器 ----------
RE_SECTION   = re.compile(r'^##\s+(.+)')
RE_QUESTION  = re.compile(r'^\*\*(\d+)\.\s*(.+?)\*\*\s*$')
RE_OPTION    = re.compile(r'^-\s+\(([A-D])\)\s+(.+)')
RE_ANSWER    = re.compile(r'^>\s+\*\*答案：\(([A-D])\)\*\*')
RE_EXPLAIN   = re.compile(r'^>\s+\*\*說明：\*\*\s*(.*)')
RE_EXPLAIN_C = re.compile(r'^>\s+(.*)')   # 說明續行

RE_FINANCE_HEADING = re.compile(r'^##\s+(\d+)\.\s+(.+)$')
RE_FINANCE_OPTION = re.compile(r'^\(([a-dA-D])\)\s+(.+?)\s*$')
RE_FINANCE_ANSWER = re.compile(r'^\*\*答案：\s*([a-dA-D])\.\s*(.+?)\*\*$')


def parse_md(path: Path) -> list[dict]:
    """回傳 sessions 列表"""
    lines = path.read_text(encoding='utf-8').splitlines()
    sessions: list[dict] = []
    current_session: dict | None = None
    current_q: dict | None = None
    in_explain = False

    def commit_question():
        if current_q and current_session is not None:
            # 清理說明結尾空白
            if current_q.get('explanation'):
                current_q['explanation'] = current_q['explanation'].strip()
            current_session['questions'].append(current_q)

    for line in lines:
        # 屆次標題
        m = RE_SECTION.match(line)
        if m:
            commit_question()
            current_q = None
            in_explain = False
            current_session = {"session": m.group(1).strip(), "questions": []}
            sessions.append(current_session)
            continue

        # 題目
        m = RE_QUESTION.match(line)
        if m:
            commit_question()
            in_explain = False
            current_q = {
                "no": int(m.group(1)),
                "question": m.group(2).strip(),
                "options": {},
                "answer": "",
                "explanation": ""
            }
            continue

        if current_q is None:
            continue

        # 選項
        m = RE_OPTION.match(line)
        if m:
            current_q['options'][m.group(1)] = m.group(2).strip()
            in_explain = False
            continue

        # 答案
        m = RE_ANSWER.match(line)
        if m:
            current_q['answer'] = m.group(1)
            in_explain = False
            continue

        # 說明起始
        m = RE_EXPLAIN.match(line)
        if m:
            current_q['explanation'] = m.group(1).strip()
            in_explain = True
            continue

        # 說明續行
        if in_explain:
            m = RE_EXPLAIN_C.match(line)
            if m:
                tail = m.group(1).strip()
                if tail:
                    current_q['explanation'] += ' ' + tail
                continue
            else:
                in_explain = False

    commit_question()
    return sessions


def parse_finance_full_md(path: Path) -> list[dict]:
    """解析財務管理完整題庫，回傳單一 session。"""
    lines = path.read_text(encoding='utf-8').splitlines()
    session = {"session": "113期中考", "questions": []}
    current_q: dict | None = None
    collecting_question = False
    collecting_explanation = False

    def commit_question():
        if current_q is None:
            return
        current_q['question'] = current_q['question'].strip()
        current_q['explanation'] = current_q['explanation'].strip()
        session['questions'].append(current_q)

    for raw_line in lines:
        line = raw_line.rstrip()
        stripped = line.strip()

        heading_match = RE_FINANCE_HEADING.match(stripped)
        if heading_match:
            commit_question()
            current_q = {
                "no": int(heading_match.group(1)),
                "question": "",
                "options": {},
                "answer": "",
                "explanation": "",
            }
            collecting_question = False
            collecting_explanation = False
            continue

        if current_q is None:
            continue

        if stripped == "**題目：**":
            collecting_question = True
            collecting_explanation = False
            continue

        if stripped == "**選項：**":
            collecting_question = False
            collecting_explanation = False
            continue

        if stripped == "**解題過程：**":
            collecting_question = False
            collecting_explanation = True
            continue

        answer_match = RE_FINANCE_ANSWER.match(stripped)
        if answer_match:
            current_q['answer'] = answer_match.group(1).upper()
            collecting_question = False
            collecting_explanation = False
            continue

        option_match = RE_FINANCE_OPTION.match(stripped)
        if option_match:
            current_q['options'][option_match.group(1).upper()] = option_match.group(2).strip()
            collecting_question = False
            continue

        if stripped == "---":
            collecting_question = False
            collecting_explanation = False
            continue

        if collecting_question and stripped:
            current_q['question'] = f"{current_q['question']} {stripped}".strip()
            continue

        if collecting_explanation:
            if stripped.startswith("```"):
                continue
            if stripped:
                if current_q['explanation']:
                    current_q['explanation'] = f"{current_q['explanation']}\n{stripped}"
                else:
                    current_q['explanation'] = stripped

    commit_question()
    return [session]


# ---------- 主程式 ----------
def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    WEB_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for src in SOURCES:
        if not src['src'].exists():
            print(f"略過：{src['key']}（找不到來源：{src['src']}）")
            continue

        print(f"處理：{src['key']} ...", end=' ')
        parser = src.get('parser', 'default')
        if parser == 'finance_full':
            sessions = parse_finance_full_md(src['src'])
        else:
            sessions = parse_md(src['src'])
        total = sum(len(s['questions']) for s in sessions)

        payload = {
            "key": src['key'],
            "title": src['title'],
            "total": total,
            "sessions": sessions,
        }

        out = OUTPUT_DIR / f"{src['key']}.json"
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    web_out = WEB_OUTPUT_DIR / f"{src['key']}.json"
    web_out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"完成  {len(sessions)} 屆 / {total} 題  -> {out.name}")

    print("\n全部轉換完成。")


if __name__ == '__main__':
    main()
