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

| 提案文件                                                                                           | 狀態     | 對應專案                      |
| -------------------------------------------------------------------------------------------------- | -------- | ----------------------------- | --- | -------------------------------------------------------------------------------------------------------- | ------ | ------------------------- | --- | -------------------------------------------------------------------------------------------------------- | ------ | ------------------------- |
| [01-exam-study-platform.md](../docs/proposals/03-closed/01-exam-study-platform.md)                 | closed   | `01-exam-study-platform/`     |
| [02-personal-resume-website.md](../docs/proposals/03-closed/02-personal-resume-website.md)         | closed   | `02-personal-resume-website/` |
| [03_01_expansion.md](../docs/proposals/03-closed/03_01_expansion.md)                               | closed   | `01-exam-study-platform/`     |
| [04_01_permission.md](../docs/proposals/03-closed/04_01_permission.md)                             | closed   | `01-exam-study-platform/`     |
| [05_01_question-bank.md](../docs/proposals/03-closed/05_01_question-bank.md)                       | closed   | `01-exam-study-platform/`     |
| [06_01_monster-battle.md](../docs/proposals/03-closed/06_01_monster-battle.md)                     | closed   | `01-exam-study-platform/`     |
| [07_02_resume-thesis-pdf-viewer.md](../docs/proposals/03-closed/07_02_resume-thesis-pdf-viewer.md) | closed   | `02-personal-resume-website/` |
| [09_01_midlevel-fix-basic-bank.md](../docs/proposals/03-closed/09_01_midlevel-fix-basic-bank.md)   | closed   | `01-exam-study-platform/`     |
| [08_02_resume-104-sync.md](../docs/proposals/03-closed/08_02_resume-104-sync.md)                   | closed   | `02-personal-resume-website/` |
| [10_01_battle-v2-advanced.md](../docs/proposals/03-closed/10_01_battle-v2-advanced.md)             | closed   | `01-exam-study-platform/`     |
| [11_01_exam-admin-dashboard.md](../docs/proposals/02-active/11_01_exam-admin-dashboard.md)         | active   | `01-exam-study-platform/`     |     | [12_01_login-fix-and-law-questions.md](../docs/proposals/02-active/12_01_login-fix-and-law-questions.md) | active | `01-exam-study-platform/` |     | [12_01_login-fix-and-law-questions.md](../docs/proposals/02-active/12_01_login-fix-and-law-questions.md) | active | `01-exam-study-platform/` |
| [13_03_personal-blog-platform.md](../docs/proposals/03-closed/13_03_personal-blog-platform.md)     | closed   | `03-personal-blog-platform/`  |
| [14_03_blog-security-hardening.md](../docs/proposals/01-drafting/14_03_blog-security-hardening.md) | drafting | `03-personal-blog-platform/`  |

---

## 提案異動歷程

> 每次提案新增、狀態變更或重大實作里程碑，在此補一筆。最新在上。

| 日期       | 提案                              | 對應專案                                           | 異動摘要                                                                                                                                                                                                 |
| ---------- | --------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------- | --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------- | --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------- | ---------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 2026-05-11 | 14_03_blog-security-hardening     | `03-personal-blog-platform/`（**closed**）         | v0.2 全部修法完成：BUG-1 X-Dev-Admin bypass 移除 / BUG-2 DOMPurify XSS 防護 / BUG-3 SVG 上傳封鎖 + MIME 白名單；build + deploy 至 blog.buclaw.org ✅                                                     |
| 2026-05-11 | 14_03_blog-security-hardening     | `03-personal-blog-platform/`（drafting）           | v0.1 建立提案初稿：診斷 Blog 三個資安漏洞（X-Dev-Admin bypass / XSS / SVG 上傳），規劃補強實作                                                                                                           |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（**closed**）         | v2.3 提案結案 ✅：P1～P6 全部完成，blog.buclaw.org 正式上線；P7 社群推送故意暫緩（Meta App Review 前置）                                                                                                 |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v2.2 P5-② 自訂域名 `blog.buclaw.org` ✅；所有 Functions SITE_URL 更新為正式域名；Deploy 完成                                                                                                             |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v2.1 P5 評估：① CI ③ Image最佳化 ⑤ Analytics 停掉；P5-③ sitemap.xml 完成 ✅（`functions/api/sitemap.ts` 動態產生 XML）                                                                                   |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v2.0 P6-① CategoryPage/TagPage 換新三欄版型 ✅（移除舊 Sidebar，改用 LeftSidebar + RightSidebar）                                                                                                        |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v1.9 P3-A Dashboard / P3-B 作者設定 / P3-C 文章管理 / P3-D 分類標籤全部完成 ✅；P4-④ 後台留言管理完成 ✅；P5 加狀態欄（① ❌手動deploy ② ❓ ③④⑤ ❌）；P6-① 修正描述（SearchPage 無需改動）                |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v1.8 P1-④ R2 Bucket 確認 ✅；P3-E 媒體庫全部完成 ✅（`GET /api/admin/media` + `DELETE /api/admin/media` + `MediaPage.tsx` 圖片格狀列表、複製 URL、刪除；加入 AdminLayout 導覽 + PermissionsPage 授權項） |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v1.7 P4-④ 留言管理三項改善：① PermissionsPage 加入「留言管理」可授權項；② AdminLayout sidebar 排序調整（留言管理置於 AI生文 之後）；③ CommentsPage 顯示 D1 文章標題取代原始 pathname slug                |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v1.6 P4 Giscus category-id 錯誤修正 ✅；規劃 P4-④ 後台留言管理頁面（/admin/comments，GitHub GraphQL + addDiscussionComment，PAT scope 確認）                                                             |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v1.5 P4-③ Dashboard 留言數串接 ✅（giscus-stats API + GitHub GraphQL + DashboardPage 留言統計卡）                                                                                                        |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v1.4 P2-⑤ 相關文章模組 ✅；P3-H 權限管理全部完成 ✅（migration/API/PermissionsPage/AdminLayout）；P4 Giscus 留言系統上線 ✅（GiscusComments.tsx + PostPage 整合）                                        |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v1.3 修正 P1 Bug C 設計（Google OAuth 登入系統 + 角色判斷）；新增 P3-G 使用者分析（G-0 Auth / G-1 行為追蹤 / G-2 統計圖表）                                                                              |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v1.2 確認 P1-➃ R2 binding ✅ / CF Dashboard 待確認；P3-E 後端 ✅ / MediaPage UI ❌；新增 P1 Bug 四項（A 移除外部連結 / B archive year=undefined / C 無登入入口 / D 未分類歸類）                          |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v1.0 解析圖模板系統：文章→JSON萃取→固定版面模板→gpt-image-2；縱式 1024×1536；6種情境視覺語言各自定型                                                                                                     |
| 2026-05-11 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v0.9 P3-F AI 生圖升級：封面圖與解析圖均加入 GPT 中間層（gpt-4.1-nano），依文章內容+情境規格動態生成精準 image prompt 再送 gpt-image-2；保留靜態 prompt 作降級 fallback                                   |
| 2026-05-10 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v0.8 確認最新 OpenAI 模型（gpt-5.5 / gpt-image-2）；新增 P3-F AI 生文模組規格（URL 輸入+10 種風格+自動生文生圖+MSSQL 備份）；新增 MSSQL news_articles schema 設計；詳述環境變數配置位置                  |     | 2026-05-10 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting） | v0.7 P1 完成（D1+migrations+CF Pages 部署+archive API）；P2 完成（TOC+上下篇+SEO meta+RSS Feed /api/feed）；部署網址 personal-blog-platform.pages.dev |     | 2026-05-10 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting） | v0.6 重整開發優先級：P2 閱讀功能提前（TOC/上下篇/SEO/RSS）、後台管理完整設計（CF Access/Dashboard/TipTap/大頭貼換頭/留言）、社群推送移為暫緩 P7 |     | 2026-05-10 | 13_03_personal-blog-platform | `03-personal-blog-platform/`（drafting） | v0.5 現況整理：Logo icon 加入 Navbar、作者大頭照真實照片、七、系統開發規格與八、前台缺口分析完整填入文件 |
| 2026-05-10 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v0.4 版型大改：採 HuggingFace 三欄結構（左分類+歸檔 / 主 Feed+篩選 Pill / 右熱門+標籤雲）；新增 /archive 路由                                                                                            |
| 2026-05-10 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v0.3 UI 規格更新：深色主題（同 resume/exam 站）、Nav 加入考題平台外連、關於我改連至 resume.buclaw.org                                                                                                    |
| 2026-05-10 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting）           | v0.2 確認決策：blog.buclaw.org / Giscus 留言 / FB Page + IG 升級創作者為社群推送前置 / 開發優先 P1+P2 前台閱讀版                                                                                         |
| 2025-07-14 | 13_03_personal-blog-platform      | `03-personal-blog-platform/`（drafting，尚未建立） | v0.1 建立提案：個人知識庫暨內容發布中心；TipTap 編輯器 + CF D1/R2 + Meta Graph API 社群推送 + Giscus 留言                                                                                                |
| 2026-05-09 | 10_01_battle-v2-advanced          | `01-exam-study-platform/`                          | v1.0 **結案**：P5 字體大小切換確認已實作，P0–P5 全部完成並部署，提案正式結案                                                                                                                             |     | 2026-05-10 | 12_01_login-fix-and-law-questions | `01-exam-study-platform/`                | v1.0 **結案**：Phase 1 前端重新登入機制、Phase 2 法規題庫重新解析、Phase 3 AI 解析補齊均完成；提案正式結案                                            |     | 2026-05-10 | 12_01_login-fix-and-law-questions | `01-exam-study-platform/`                | v0.2：Phase 0 完成（CF Session Duration 設為 24h）；Phase 4 驗收通過（無痕 + 正常模式登入均正常）                                               |
| 2026-05-09 | 12_01_login-fix-and-law-questions | `01-exam-study-platform/`                          | 建立提案：修正 CF Access 登入 session 失效問題 + 法規題庫重新解析（105-115），確認權限管理連結已正確處理                                                                                                 |
| 2026-05-09 | 11_01_exam-admin-dashboard        | `01-exam-study-platform/`                          | v0.3：還原圖表規格（recharts），個人檔案含折線圖＋橫條圖；確認 CF Access Zero Trust self-hosted 方案                                                                                                     |
| 2026-05-09 | 11_01_exam-admin-dashboard        | `01-exam-study-platform/`                          | v0.1 建立提案：examdashboard.buclaw.org 後台管理儀表板，Google OAuth（只允許 anson4139@gmail.com）、玩家監控、劇情+圖鑑進度查閱                                                                          |
| 2026-05-09 | 10_01_battle-v2-advanced          | `01-exam-study-platform/`                          | v0.6：P4 劇情模式（StoryPage）+ 排行榜（LeaderboardPage + D1 migration 0004）完成並部署；修正對戰退出 bug + API fallback bug + quiz tabs                                                                 |
| 2026-05-08 | 10_01_battle-v2-advanced          | `01-exam-study-platform/`                          | v0.4：P1/P2/P3 全部完成（連擊/計時/台詞/技能/圖鑑/統計/Boss機制/屬性克制/怪獸成長）；新增 P5 字體大小切換功能；更新驗收清單                                                                              |
| 2026-05-08 | 09_01_midlevel-fix-basic-bank     | `01-exam-study-platform/`                          | **結案**：中/初級共 250 題解析補齊、含圖題渲染（code_block/image_url）、KaTeX 數學符號、前端接入初級科目、production 部署正常                                                                            |
| 2026-05-08 | 09_01_midlevel-fix-basic-bank     | `01-exam-study-platform/`                          | v0.2：補入含圖題方案A+C（圖片提取+code_block欄位）與KaTeX數學符號渲染、JSON Schema擴充                                                                                                                   |
| 2026-05-08 | 09_01_midlevel-fix-basic-bank     | `01-exam-study-platform/`                          | 提案建立：中級三科 150 題修正（截斷/殘留字元/補解析）+ 初級兩科四梯次 PDF 轉換建立 + 前端接入                                                                                                            |
| 2026-05-07 | 08_02_resume-104-sync             | `02-personal-resume-website/`                      | 實作完成：修正職稱（2項）、新增翔騰/明台/皇將經歷、補僑光學歷、TIPCI認證、前端技能，提案結案                                                                                                             |
| 2026-05-07 | 08_02_resume-104-sync             | `02-personal-resume-website/`                      | 提案建立：104 資料同步更新——補齊 3 段工作經歷、修正職稱錯誤、補充僑光學歷與 TIPCI 證照，含 13 份截圖 OCR 參考資料                                                                                        |
| 2026-05-07 | 07_02_resume-thesis-pdf-viewer    | `02-personal-resume-website/`                      | 提案建立：在履歷網站論文專案卡片加入 PDF 展示功能（Lightbox Viewer / 下載），三方案供選擇                                                                                                                |
| 2026-05-07 | 06_01_monster-battle              | `01-exam-study-platform/`                          | V4 v0.7 **結案**：MVP 全數完成上線——三 Tab 架構（單題/10題/對戰）、4支 API、remote D1 migrations、20張怪獸圖、exam.buclaw.org 正式部署                                                                   |
| 2026-05-07 | 06_01_monster-battle              | `01-exam-study-platform/`                          | V4 v0.6：修正介面架構——對戰模式為 Home.tsx 第三 Tab（取代「測試模式」），保留單題/10題兩 Tab；BattlePage 改為接受 initialKey/initialSession props                                                        |
| 2026-05-07 | 06_01_monster-battle              | `01-exam-study-platform/`                          | V4 v0.5：修正怪獸切換規則——切換觸發改為 HP 歸零事件驅動，`qPerMonster` 僅作傷害量計算，非題目輪換依據                                                                                                    |
| 2026-05-07 | 06_01_monster-battle              | `01-exam-study-platform/`                          | V4 v0.4：怪獸素材就位，20 張 PNG 縮放至 512×512 並存入 `src/web/public/images/monsters/`                                                                                                                 |
| 2026-05-07 | 06_01_monster-battle              | `01-exam-study-platform/`                          | V4 v0.3：更新 AI 怪獸圖生成語法，改為透明背景優先，加入各怪獸 Rim Light 色表與 Negative Prompt                                                                                                           |
| 2026-05-07 | 06_01_monster-battle              | `01-exam-study-platform/`                          | V4 v0.2：確認全數 14 項決策；新增動態題數規則、RWD 單畫面設計規格、AI 怪獸圖生成語法、DiceBear 頭像方案                                                                                                  |
| 2026-05-07 | 06_01_monster-battle              | `01-exam-study-platform/`                          | V4 草案建立：遊戲化怪獸對戰答題模式，含規則設計、畫面配置、資料表結構、素材清單與 MVP 範圍                                                                                                               |
| 2026-05-05 | 05_01_question-bank               | `01-exam-study-platform/`                          | V3 結案：新增測試模式 MVP、PDF 全量轉換（105~115）、LLM 解析 2150 題、joan 授權、正式站部署                                                                                                              |
| 2025-xx-xx | 04_01_permission                  | `01-exam-study-platform/`                          | V2 結案：（請補充摘要）                                                                                                                                                                                  |
| 2025-xx-xx | 03_01_expansion                   | `01-exam-study-platform/`                          | V1 結案：（請補充摘要）                                                                                                                                                                                  |
| 2025-xx-xx | 02-personal-resume-website        | `02-personal-resume-website/`                      | 個人履歷網站完成部署                                                                                                                                                                                     |
| 2025-xx-xx | 01-exam-study-platform            | `01-exam-study-platform/`                          | 考試學習平台提案建立                                                                                                                                                                                     |

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
