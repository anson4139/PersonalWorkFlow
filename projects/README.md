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

| 提案文件                                                                                   | 狀態     | 對應專案                      |
| ------------------------------------------------------------------------------------------ | -------- | ----------------------------- |
| [01-exam-study-platform.md](../docs/proposals/03-closed/01-exam-study-platform.md)         | closed   | `01-exam-study-platform/`     |
| [02-personal-resume-website.md](../docs/proposals/03-closed/02-personal-resume-website.md) | closed   | `02-personal-resume-website/` |
| [03-v1-exam-study-platform.md](../docs/proposals/03-closed/03-v1-exam-study-platform.md)   | closed   | `01-exam-study-platform/`     |
| [04-v2-exam-study-platform.md](../docs/proposals/03-closed/04-v2-exam-study-platform.md)   | closed   | `01-exam-study-platform/`     |
| [05-v3-exam-study-platform.md](../docs/proposals/03-closed/05-v3-exam-study-platform.md)   | closed   | `01-exam-study-platform/`     |
| [06-v4-exam-study-platform.md](../docs/proposals/01-drafting/06-v4-exam-study-platform.md) | drafting | `01-exam-study-platform/`     |

---

## 提案異動歷程

> 每次提案新增、狀態變更或重大實作里程碑，在此補一筆。最新在上。

| 日期       | 提案                       | 對應專案                      | 異動摘要                                                                                                |
| ---------- | -------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| 2026-05-07 | 06-v4-exam-study-platform  | `01-exam-study-platform/`     | V4 v0.4：怪獸素材就位，20 張 PNG 縮放至 512×512 並存入 `src/web/public/images/monsters/`                |
| 2026-05-07 | 06-v4-exam-study-platform  | `01-exam-study-platform/`     | V4 v0.3：更新 AI 怪獸圖生成語法，改為透明背景優先，加入各怪獸 Rim Light 色表與 Negative Prompt          |
| 2026-05-07 | 06-v4-exam-study-platform  | `01-exam-study-platform/`     | V4 v0.2：確認全數 14 項決策；新增動態題數規則、RWD 單畫面設計規格、AI 怪獸圖生成語法、DiceBear 頭像方案 |
| 2026-05-07 | 06-v4-exam-study-platform  | `01-exam-study-platform/`     | V4 草案建立：遊戲化怪獸對戰答題模式，含規則設計、畫面配置、資料表結構、素材清單與 MVP 範圍              |
| 2026-05-05 | 05-v3-exam-study-platform  | `01-exam-study-platform/`     | V3 結案：新增測試模式 MVP、PDF 全量轉換（105~115）、LLM 解析 2150 題、joan 授權、正式站部署             |
| 2025-xx-xx | 04-v2-exam-study-platform  | `01-exam-study-platform/`     | V2 結案：（請補充摘要）                                                                                 |
| 2025-xx-xx | 03-v1-exam-study-platform  | `01-exam-study-platform/`     | V1 結案：（請補充摘要）                                                                                 |
| 2025-xx-xx | 02-personal-resume-website | `02-personal-resume-website/` | 個人履歷網站完成部署                                                                                    |
| 2025-xx-xx | 01-exam-study-platform     | `01-exam-study-platform/`     | 考試學習平台提案建立                                                                                    |

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
