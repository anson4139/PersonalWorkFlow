
import os
import shutil
import sys
from pathlib import Path
from datetime import datetime

# Encoding safety
sys.stdout.reconfigure(encoding='utf-8')

# Define paths
# Current file: .agent/skills/project-rules/scripts/sync_to_doc.py
# We need to go up 5 levels to reach Project Root
PROJECT_ROOT = Path(__file__).resolve().parents[4]
SKILLS_ROOT = PROJECT_ROOT / ".agent" / "skills"
DOC_CONTEXT_DIR = PROJECT_ROOT / "_00_document" / "AI_Context"

def sync_skills():
    """
    Syncs markdown files from .agent/skills to _00_document/AI_Context
    so other LLMs/Humans can easily read the project's 'skills'.
    """
    if not SKILLS_ROOT.exists():
        print(f"Error: Skills root not found at {SKILLS_ROOT}")
        return

    # Target 1: _00_document/AI_Context (Universal Context)
    DOC_CONTEXT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Target 2: .cursorrules (For Cursor AI)
    CURSOR_RULES_FILE = PROJECT_ROOT / ".cursorrules"
    
    # Target 3: .github/copilot-instructions.md (For GitHub Copilot)
    COPILOT_DIR = PROJECT_ROOT / ".github"
    COPILOT_DIR.mkdir(parents=True, exist_ok=True)
    COPILOT_INSTRUCTIONS_FILE = COPILOT_DIR / "copilot-instructions.md"

    # Define Source: Project Rules Skill (The Core Truth)
    # We specifically want to enforce RULES across all platforms
    rules_skill = SKILLS_ROOT / "project-rules" / "SKILL.md"
    
    if rules_skill.exists():
        print(f"\n[Universal Sync] Propagating Project Rules...")
        
        # 1. Sync to .cursorrules
        try:
            shutil.copy2(rules_skill, CURSOR_RULES_FILE)
            print(f" [OK] Synced to .cursorrules (Cursor AI)")
        except Exception as e:
            print(f" [ERR] Failed to sync .cursorrules: {e}")
            
        # 2. Sync to .github/copilot-instructions.md
        try:
            shutil.copy2(rules_skill, COPILOT_INSTRUCTIONS_FILE)
            print(f" [OK] Synced to .github/copilot-instructions.md (GitHub Copilot)")
        except Exception as e:
            print(f" [ERR] Failed to sync copilot-instructions: {e}")

    print(f"\nSyncing all skills to {DOC_CONTEXT_DIR}...")

    # Iterate through all skill directories
    count = 0
    for skill_dir in SKILLS_ROOT.iterdir():
        if skill_dir.is_dir():
            skill_file = skill_dir / "SKILL.md"
            if skill_file.exists():
                # Destination filename: SKILL_[skillname].md
                dest_name = f"SKILL_{skill_dir.name}.md"
                dest_path = DOC_CONTEXT_DIR / dest_name
                
                try:
                    shutil.copy2(skill_file, dest_path)
                    print(f" [OK] Synced {skill_dir.name} -> {dest_name}")
                    count += 1
                except Exception as e:
                    print(f" [ERR] Failed to copy {skill_dir.name}: {e}")
    
    print(f"\nSync complete. {count} skills updated in AI_Context.")

def sync_thesis_references():
    """
    自動生成論文參考索引 (5_thesis/REFERENCES.md)
    掃描 _00_document 中的技術文檔，按類別整理成中文索引
    """
    doc_dir = PROJECT_ROOT / "_00_document"
    thesis_dir = PROJECT_ROOT / "5_thesis"
    ref_file = thesis_dir / "REFERENCES.md"
    
    if not doc_dir.exists():
        print(f"Error: Document directory not found at {doc_dir}")
        return
    
    thesis_dir.mkdir(parents=True, exist_ok=True)
    
    # 掃描所有 markdown 文件
    all_files = [f for f in os.listdir(doc_dir) if f.endswith('.md')]
    tech_docs = sorted([f for f in all_files if f.startswith('[技術]_')])
    design_docs = sorted([f for f in all_files if f.startswith('[設計]_')])
    proposal_docs = sorted([f for f in all_files if f.startswith('[提案]_')])
    report_docs = sorted([f for f in all_files if f.startswith('[報告]_')])
    
    # 生成中文索引
    content = "# 論文參考文檔索引\n\n"
    content += f"**自動生成時間**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    content += "本索引由 `.agent/skills/project-rules/scripts/sync_to_doc.py` 自動生成  \n"
    content += "每次新增或修改 `_00_document` 中的技術文檔後，請執行此腳本更新索引。\n\n"
    content += "---\n\n"
    
    # 資料庫規格
    content += "## 📊 資料庫規格書\n\n"
    db_docs = [d for d in tech_docs if "資料庫" in d]
    if db_docs:
        for doc in db_docs:
            doc_name = doc.replace('[技術]_', '').replace('.md', '').replace('_20260', ' (2026-0').replace('_', ' ') + ')'
            content += f"- [{doc_name}](../_00_document/{doc})\n"
    else:
        content += "*尚無文檔*\n"
    content += "\n"
    
    # 實驗與模型
    content += "## 🧪 實驗與模型架構\n\n"
    exp_docs = [d for d in tech_docs if any(k in d for k in ["實驗", "模型", "特徵"])]
    if exp_docs:
        for doc in exp_docs:
            doc_name = doc.replace('[技術]_', '').replace('.md', '').replace('_20260', ' (2026-0').replace('_', ' ') + ')'
            content += f"- [{doc_name}](../_00_document/{doc})\n"
    else:
        content += "*尚無文檔*\n"
    content += "\n"
    
    # 系統設計
    content += "## 🏗️ 系統設計與架構\n\n"
    sys_docs = [d for d in tech_docs if any(k in d for k in ["系統", "架構", "TPU", "5秒級"])]
    sys_docs.extend(design_docs)
    if sys_docs:
        for doc in sorted(set(sys_docs)):
            doc_name = doc.replace('[技術]_', '').replace('[設計]_', '').replace('.md', '').replace('_20260', ' (2026-0').replace('_', ' ') + ')'
            content += f"- [{doc_name}](../_00_document/{doc})\n"
    else:
        content += "*尚無文檔*\n"
    content += "\n"
    
    # 資安與工程
    content += "## 🔒 資安與工程規範\n\n"
    sec_docs = [d for d in tech_docs if any(k in d for k in ["資安", "環境變數", "Git", "清理"])]
    if sec_docs:
        for doc in sec_docs:
            doc_name = doc.replace('[技術]_', '').replace('.md', '').replace('_20260', ' (2026-0').replace('_', ' ') + ')'
            content += f"- [{doc_name}](../_00_document/{doc})\n"
    else:
        content += "*尚無文檔*\n"
    content += "\n"
    
    # 提案與可行性分析
    content += "## 📋 提案與可行性分析\n\n"
    if proposal_docs:
        for doc in proposal_docs:
            doc_name = doc.replace('[提案]_', '').replace('.md', '').replace('_20260', ' (2026-0').replace('_', ' ') + ')'
            content += f"- [{doc_name}](../_00_document/{doc})\n"
    else:
        content += "*尚無文檔*\n"
    content += "\n"
    
    # 實驗報告
    content += "## 📈 實驗分析報告\n\n"
    if report_docs:
        for doc in report_docs:
            doc_name = doc.replace('[報告]_', '').replace('.md', '').replace('_20260', ' (2026-0').replace('_', ' ') + ')'
            content += f"- [{doc_name}](../_00_document/{doc})\n"
    else:
        content += "*尚無文檔*\n"
    content += "\n"
    
    # 寫入檔案
    try:
        ref_file.write_text(content, encoding='utf-8')
        print(f"\n[論文參考索引] 已生成: {ref_file}")
        print(f" - 資料庫規格: {len(db_docs)} 份")
        print(f" - 實驗文檔: {len(exp_docs)} 份")
        print(f" - 系統設計: {len(set(sys_docs))} 份")
        print(f" - 資安規範: {len(sec_docs)} 份")
        print(f" - 提案文檔: {len(proposal_docs)} 份")
        print(f" - 實驗報告: {len(report_docs)} 份")
    except Exception as e:
        print(f"[ERR] 生成論文參考索引失敗: {e}")

if __name__ == "__main__":
    sync_skills()
    print("\n" + "="*50)
    sync_thesis_references()
