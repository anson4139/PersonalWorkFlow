"""
explain_gen.py
用 OpenAI API 批次補齊題庫 JSON 的 explanation 欄位。

用法：
  python explain_gen.py --subject securities-broker-law-110          # 單一科目
  python explain_gen.py --all                                         # 全部有需要的科目
  python explain_gen.py --subject securities-broker-law-110 --dry-run # 只顯示 token 估算
  python explain_gen.py --subject securities-broker-law-110 --start-no 11  # 從第 11 題續跑

說明：
  - 只補 explanation == 'PDF 原始試題未附解析' 的題目（不覆蓋已有內容）
  - 每題呼叫一次 API，間隔 0.6 秒（避免 rate limit）
  - 失敗自動 retry 3 次（指數退避）
  - 完成後原地覆蓋 JSON（同時更新 public/data/subjects/ 的副本）
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

sys.stdout.reconfigure(encoding='utf-8')

# ── 路徑設定 ──────────────────────────────────────────────────────────────────
SCRIPTS_DIR  = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parents[1]
DATA_DIR     = PROJECT_ROOT / 'data' / 'subjects'
PUBLIC_DIR   = PROJECT_ROOT / 'src' / 'web' / 'public' / 'data' / 'subjects'

load_dotenv(SCRIPTS_DIR / '.env')

PLACEHOLDER = 'PDF 原始試題未附解析'
RETRY_LIMIT = 3
REQUEST_INTERVAL = 0.6   # 秒

# ── OpenAI prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    '你是台灣「證券商業務員（初業）」考試的解題老師，擅長證券交易法規與財務分析。'
    '請用繁體中文、100~200 字說明正確答案的理由，並簡要說明其他選項為何不選。'
    '不要直接複製題目原文，用自己的話解釋。'
)


def make_user_prompt(q: dict) -> str:
    opts = q['options']
    lines = [
        f'題目：{q["question"]}',
        f'(A) {opts.get("A", "")}',
        f'(B) {opts.get("B", "")}',
        f'(C) {opts.get("C", "")}',
        f'(D) {opts.get("D", "")}',
        f'正確答案：({q["answer"]})',
        '請說明為何此選項正確，以及其他選項錯在哪裡。',
    ]
    return '\n'.join(lines)


# ── API 呼叫（含 retry）───────────────────────────────────────────────────────
def call_api(client: OpenAI, q: dict) -> str:
    prompt = make_user_prompt(q)
    for attempt in range(1, RETRY_LIMIT + 1):
        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    {'role': 'user',   'content': prompt},
                ],
                max_tokens=300,
                temperature=0.3,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if attempt == RETRY_LIMIT:
                raise
            wait = 2 ** attempt
            print(f'    [retry {attempt}/{RETRY_LIMIT}] {e}，等待 {wait}s…')
            time.sleep(wait)
    return ''


# ── 單一 JSON 檔處理 ──────────────────────────────────────────────────────────
def process_file(
    path: Path,
    client: OpenAI | None,
    start_no: int,
    dry_run: bool,
) -> tuple[int, int]:
    """回傳 (處理題數, 跳過題數)"""
    data = json.loads(path.read_text(encoding='utf-8'))
    processed = 0
    skipped   = 0
    changed   = False

    for session in data.get('sessions', []):
        for q in session.get('questions', []):
            if q.get('explanation', PLACEHOLDER) != PLACEHOLDER:
                skipped += 1
                continue
            if q.get('no', 0) < start_no:
                skipped += 1
                continue
            if not q.get('answer'):
                skipped += 1
                continue

            if dry_run:
                processed += 1
                continue

            try:
                explanation = call_api(client, q)
                q['explanation'] = explanation
                changed = True
                processed += 1
                print(f'    [{q["no"]:>2}] {q["question"][:30]}… -> 已補齊')
            except Exception as e:
                print(f'    [{q["no"]:>2}] ERROR: {e}')
                skipped += 1

            time.sleep(REQUEST_INTERVAL)

    if changed and not dry_run:
        content = json.dumps(data, ensure_ascii=False, indent=2)
        path.write_text(content, encoding='utf-8')

        # 同步更新 public 副本
        public_path = PUBLIC_DIR / path.name
        if public_path.exists():
            public_path.write_text(content, encoding='utf-8')

    return processed, skipped


# ── 主流程 ────────────────────────────────────────────────────────────────────
def main() -> None:
    ap = argparse.ArgumentParser(description='LLM 補齊題庫解析')
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument('--subject',  help='科目 key，例如 securities-broker-law-110')
    group.add_argument('--all',      action='store_true', help='處理全部有空白解析的科目')
    ap.add_argument('--dry-run',  action='store_true', help='只計算需補題數，不呼叫 API')
    ap.add_argument('--start-no', type=int, default=1, help='從指定題號開始（續跑用）')
    args = ap.parse_args()

    api_key = os.getenv('OPENAI_API_KEY', '')
    if not args.dry_run and not api_key.startswith('sk-'):
        print('[ERROR] 找不到有效的 OPENAI_API_KEY。')
        print('        請在 src/scripts/.env 設定：OPENAI_API_KEY=sk-...')
        sys.exit(1)

    client = OpenAI(api_key=api_key) if not args.dry_run else None

    # 決定目標檔案
    if args.subject:
        targets = [DATA_DIR / f'{args.subject}.json']
    else:
        targets = sorted(DATA_DIR.glob('securities-broker-*.json'))
        # 排除 PoC 舊檔（poc 結尾）
        targets = [t for t in targets if 'poc' not in t.stem]

    total_proc = 0
    total_skip = 0

    for path in targets:
        if not path.exists():
            print(f'[SKIP] 找不到 {path.name}')
            continue

        print(f'\n── {path.stem} ──')
        proc, skip = process_file(path, client, args.start_no, args.dry_run)
        total_proc += proc
        total_skip += skip
        label = '預計補齊' if args.dry_run else '已補齊'
        print(f'  {label} {proc} 題，跳過 {skip} 題')

    print(f'\n[DONE] 合計 {label} {total_proc} 題，跳過 {total_skip} 題')
    if args.dry_run:
        est_cost = total_proc * 0.0003   # gpt-4o-mini 估算 ~$0.0003/題
        print(f'       預估費用：約 ${est_cost:.2f} USD')


if __name__ == '__main__':
    main()
