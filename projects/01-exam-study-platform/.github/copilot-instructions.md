---
name: exam-study-platform
description: 考題學習平台 AI 規則
---

# 專案規則

## 技術棧
- 前端：React 18 + Vite + TypeScript + Tailwind CSS
- 題庫處理：Python 腳本（src/scripts/）
- 資料格式：JSON（data/subjects/）
- 進度儲存：localStorage（無後端）

## 資料夾職責
- `src/web/` — React 前端，所有 UI 元件
- `src/scripts/` — Python 轉換腳本，只處理 .md → JSON
- `data/subjects/` — 轉換後的題庫 JSON，不手動編輯
- `specs/` — 行為規格與 JSON Schema，實作前必須讀取
- `tests/` — 測試，unit/ 測試腳本邏輯，e2e/ 測試頁面行為

## 規範
- 所有 Python 檔案加 `sys.stdout.reconfigure(encoding='utf-8')`
- 不得硬編碼路徑，使用相對路徑或環境變數
- 手機優先（Mobile-first）：所有 UI 元件先確認 375px 寬度正常
