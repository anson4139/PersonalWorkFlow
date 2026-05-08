# Projects Index

> **[AI 規則] 每當新增或更新任何提案文件（`docs/proposals/`），或對專案進行重大實作變更時，必須同步更新本檔的「提案異動歷程」表，補上一筆記錄後再進行其他操作。**

---

## 專案總覽

| 編號 | 資料夾                        | 名稱         | 狀態            | 部署網址                  |
| ---- | ----------------------------- | ------------ | --------------- | ------------------------- |
| 01   | `01-exam-study-platform/`     | 考試學習平台 | active / 已部署 | https://exam.buclaw.org   |
| 02   | `02-personal-resume-website/` | 個人履歷網站 | closed / 已部署 | https://resume.buclaw.org |

---

## 提案 ↔ 專案對應

| 提案文件                                                                                           | 狀態   | 對應專案                      |
| -------------------------------------------------------------------------------------------------- | ------ | ----------------------------- |
| [01-exam-study-platform.md](../docs/proposals/03-closed/01-exam-study-platform.md)                 | closed | `01-exam-study-platform/`     |
| [02-personal-resume-website.md](../docs/proposals/03-closed/02-personal-resume-website.md)         | closed | `02-personal-resume-website/` |
| [03_01_expansion.md](../docs/proposals/03-closed/03_01_expansion.md)                               | closed | `01-exam-study-platform/`     |
| [04_01_permission.md](../docs/proposals/03-closed/04_01_permission.md)                             | closed | `01-exam-study-platform/`     |
| [05_01_question-bank.md](../docs/proposals/03-closed/05_01_question-bank.md)                       | closed | `01-exam-study-platform/`     |
| [06_01_monster-battle.md](../docs/proposals/03-closed/06_01_monster-battle.md)                     | closed | `01-exam-study-platform/`     |
| [07_02_resume-thesis-pdf-viewer.md](../docs/proposals/03-closed/07_02_resume-thesis-pdf-viewer.md) | closed | `02-personal-resume-website/` |
| [09_01_midlevel-fix-basic-bank.md](../docs/proposals/03-closed/09_01_midlevel-fix-basic-bank.md)   | closed | `01-exam-study-platform/`     |
| [08_02_resume-104-sync.md](../docs/proposals/03-closed/08_02_resume-104-sync.md)                   | closed | `02-personal-resume-website/` |
| [10_01_battle-v2-advanced.md](../docs/proposals/02-active/10_01_battle-v2-advanced.md)             | active | `01-exam-study-platform/`     |

---

## 提案異動歷程

> 每次提案新增、狀態變更或重大實作里程碑，在此補一筆。最新在上。

| 日期       | 提案                           | 對應專案                      | 異動摘要                                                                                                                                          |
| ---------- | ------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-08 | 10_01_battle-v2-advanced       | `01-exam-study-platform/`     | 提案建立：對戰模式 v6 全面升級——25 隻怪獸（10普通/10強化/5Boss）、世界觀劇情、11 項玩法優化、分數公式、localStorage schema、30 張新圖 Prompt      |
| 2026-05-08 | 09_01_midlevel-fix-basic-bank  | `01-exam-study-platform/`     | **結案**：中/初級共 250 題解析補齊、含圖題渲染（code_block/image_url）、KaTeX 數學符號、前端接入初級科目、production 部署正常                     |
| 2026-05-08 | 09_01_midlevel-fix-basic-bank  | `01-exam-study-platform/`     | v0.2：補入含圖題方案A+C（圖片提取+code_block欄位）與KaTeX數學符號渲染、JSON Schema擴充                                                            |
| 2026-05-08 | 09_01_midlevel-fix-basic-bank  | `01-exam-study-platform/`     | 提案建立：中級三科 150 題修正（截斷/殘留字元/補解析）+ 初級兩科四梯次 PDF 轉換建立 + 前端接入                                                     |
| 2026-05-07 | 08_02_resume-104-sync          | `02-personal-resume-website/` | 實作完成：修正職稱（2項）、新增翔騰/明台/皇將經歷、補僑光學歷、TIPCI認證、前端技能，提案結案                                                      |
| 2026-05-07 | 08_02_resume-104-sync          | `02-personal-resume-website/` | 提案建立：104 資料同步更新——補齊 3 段工作經歷、修正職稱錯誤、補充僑光學歷與 TIPCI 證照，含 13 份截圖 OCR 參考資料                                 |
| 2026-05-07 | 07_02_resume-thesis-pdf-viewer | `02-personal-resume-website/` | 提案建立：在履歷網站論文專案卡片加入 PDF 展示功能（Lightbox Viewer / 下載），三方案供選擇                                                         |
| 2026-05-07 | 06_01_monster-battle           | `01-exam-study-platform/`     | V4 v0.7 **結案**：MVP 全數完成上線——三 Tab 架構（單題/10題/對戰）、4支 API、remote D1 migrations、20張怪獸圖、exam.buclaw.org 正式部署            |
| 2026-05-07 | 06_01_monster-battle           | `01-exam-study-platform/`     | V4 v0.6：修正介面架構——對戰模式為 Home.tsx 第三 Tab（取代「測試模式」），保留單題/10題兩 Tab；BattlePage 改為接受 initialKey/initialSession props |
| 2026-05-07 | 06_01_monster-battle           | `01-exam-study-platform/`     | V4 v0.5：修正怪獸切換規則——切換觸發改為 HP 歸零事件驅動，`qPerMonster` 僅作傷害量計算，非題目輪換依據                                             |
| 2026-05-07 | 06_01_monster-battle           | `01-exam-study-platform/`     | V4 v0.4：怪獸素材就位，20 張 PNG 縮放至 512×512 並存入 `src/web/public/images/monsters/`                                                          |
| 2026-05-07 | 06_01_monster-battle           | `01-exam-study-platform/`     | V4 v0.3：更新 AI 怪獸圖生成語法，改為透明背景優先，加入各怪獸 Rim Light 色表與 Negative Prompt                                                    |
| 2026-05-07 | 06_01_monster-battle           | `01-exam-study-platform/`     | V4 v0.2：確認全數 14 項決策；新增動態題數規則、RWD 單畫面設計規格、AI 怪獸圖生成語法、DiceBear 頭像方案                                           |
| 2026-05-07 | 06_01_monster-battle           | `01-exam-study-platform/`     | V4 草案建立：遊戲化怪獸對戰答題模式，含規則設計、畫面配置、資料表結構、素材清單與 MVP 範圍                                                        |
| 2026-05-05 | 05_01_question-bank            | `01-exam-study-platform/`     | V3 結案：新增測試模式 MVP、PDF 全量轉換（105~115）、LLM 解析 2150 題、joan 授權、正式站部署                                                       |
| 2025-xx-xx | 04_01_permission               | `01-exam-study-platform/`     | V2 結案：（請補充摘要）                                                                                                                           |
| 2025-xx-xx | 03_01_expansion                | `01-exam-study-platform/`     | V1 結案：（請補充摘要）                                                                                                                           |
| 2025-xx-xx | 02-personal-resume-website     | `02-personal-resume-website/` | 個人履歷網站完成部署                                                                                                                              |
| 2025-xx-xx | 01-exam-study-platform         | `01-exam-study-platform/`     | 考試學習平台提案建立                                                                                                                              |

---

## 範本

| 資料夾                  | 用途                      |
| ----------------------- | ------------------------- |
| `_template/`            | 通用 Python 專案範本      |
| `_template-ai/`         | AI Agent 專案範本         |
| `_template-dotnet/`     | .NET MVC 專案範本         |
| `_template-dotnet-spa/` | .NET API + React SPA 範本 |
| `_template-webforms/`   | ASP.NET WebForms 範本     |
| `_template-winforms/`   | WinForms 桌面應用範本     |
