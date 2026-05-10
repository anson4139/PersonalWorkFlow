"""
batch_convert.py - 分批轉換所有年份 PDF，支援 checkpoint 中斷後接續。
用法：
  python src/scripts/batch_convert.py [--resume]
  python src/scripts/batch_convert.py --years 106 107
"""

import argparse
import datetime
import json
import pathlib
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = pathlib.Path(__file__).parent
CHECKPOINT = SCRIPT_DIR / "_batch_checkpoint.json"
PYTHON = sys.executable
CONVERT_SCRIPT = str(SCRIPT_DIR / "pdf_convert_all.py")
SOURCE = r"D:\Anson\PersonalWorkFlow\drive-download-20260509T110258Z-3-001"

ALL_YEARS = list(range(105, 116))  # 105-115


def load_checkpoint() -> dict:
    if CHECKPOINT.exists():
        return json.loads(CHECKPOINT.read_text(encoding="utf-8"))
    return {"done": [], "failed": []}


def save_checkpoint(state: dict):
    CHECKPOINT.write_text(
        json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def run_year(year: int) -> bool:
    print(f"\n{'=' * 50}")
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] 處理 {year} 年...")
    result = subprocess.run(
        [PYTHON, CONVERT_SCRIPT, "--source", SOURCE, "--years", str(year)],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    output = result.stdout + result.stderr
    print(output)
    if result.returncode != 0:
        print(f"[FAIL] {year} 年轉換失敗（exit={result.returncode}）")
        return False
    print(f"[OK] {year} 年完成")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--resume", action="store_true", help="跳過已完成的年份")
    parser.add_argument("--years", nargs="+", type=int, help="指定年份清單")
    parser.add_argument("--reset", action="store_true", help="清除 checkpoint")
    args = parser.parse_args()

    if args.reset:
        CHECKPOINT.unlink(missing_ok=True)
        print("[RESET] Checkpoint cleared")
        return

    state = load_checkpoint()
    target_years = args.years if args.years else ALL_YEARS

    if args.resume:
        pending = [y for y in target_years if y not in state["done"]]
        print(f"Resume mode: {len(state['done'])} 已完成, {len(pending)} 待處理")
    else:
        pending = target_years
        state = {"done": [], "failed": []}

    for year in pending:
        ok = run_year(year)
        if ok:
            state["done"].append(year)
            if year in state["failed"]:
                state["failed"].remove(year)
        else:
            if year not in state["failed"]:
                state["failed"].append(year)
        save_checkpoint(state)

    print(f"\n{'=' * 50}")
    print(f"[完成] 已處理: {sorted(state['done'])}")
    if state["failed"]:
        print(f"[失敗] 需重試: {state['failed']}")
    else:
        print("[ALL OK] 全部成功")


if __name__ == "__main__":
    main()
