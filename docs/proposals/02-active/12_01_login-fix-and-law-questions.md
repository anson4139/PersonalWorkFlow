# 考題學習平台 v8：登入問題修正 + 法規題庫品質提升

> **[AI 規則] 每次修改本文件，必須同時執行以下兩個動作，否則視為不完整的更新：**
>
> 1. **在本文件的「異動記錄」表格最上方新增一筆記錄（日期 / 版本 / 更新人 / 變更說明）**
> 2. **在 `projects/README.md` 的「提案異動歷程」表格最上方同步新增一筆記錄（日期 / 提案 / 對應專案 / 異動摘要）**

| 項目     | 內容                               |
| -------- | ---------------------------------- |
| 狀態     | `active`                           |
| 建立日期 | 2026-05-09                         |
| 最後更新 | 2026-05-09（v0.1 提案初稿）        |
| 對應專案 | `projects/01-exam-study-platform/` |

---

<details>
<summary>## 異動記錄</summary>

| 日期       | 版本 | 更新人 | 變更說明     |
| ---------- | ---- | ------ | ------------ |
| 2026-05-09 | v0.1 | Anson  | 建立提案初稿 |

</details>

---

<details>
<summary>## 背景與問題診斷</summary>

### 問題 1：CF Access「Invalid login session」

**現象**：使用者（含管理者）訪問 `exam.buclaw.org` 時，偶爾出現 Cloudflare Access 的「Invalid login session」錯誤頁面。同學測試說用無痕才準。

**根因**：`CF_Authorization` cookie 存在但已過期或無效，Cloudflare Access 無法完成身份驗證，導致 redirect loop 最終顯示錯誤頁。舊 cookie 在正常瀏覽器中不會自動清除，無痕模式因沒有舊 cookie 才能正常跑完 OAuth 流程。

**修正方向**：

- 在前端 `useViewer` 或 App 層偵測 session 失效（`/api/session` 回傳 401 或 email 為 null 且有 `CF_Authorization` cookie 殘留），提供「重新登入」按鈕，跳轉至 `/cdn-cgi/access/logout?redirect_to=https://exam.buclaw.org/` 清除舊 session 並重新觸發 OAuth 流程。
- 補充：Cloudflare Access 本身的 session duration 可在 Zero Trust → Access → Applications 調長（建議 24h），減少觸發頻率。

---

### 問題 2：「進入權限管理」連結可見範圍（確認已正確）

**現象**：首頁出現「進入權限管理」連結，使用者疑問是否只有管理者能看到。

**現況調查**：已確認**正確處理**，不需修改：

| 層面         | 實作位置                            | 控制方式                                  |
| ------------ | ----------------------------------- | ----------------------------------------- |
| 前端連結顯示 | `Home.tsx` L117-130                 | `{viewer.isAdmin && ...}` 條件渲染        |
| 頁面進入     | `AdminAccess.tsx` `!viewer.isAdmin` | 非管理者顯示「只有管理者可進入」訊息      |
| API 存取     | `functions/api/admin/access.ts`     | `requireAdmin()` 驗 CF-Access header，403 |

第三張截圖（「管理者已登入：anson4139@gmail.com」）已確認正常運作，此問題不須實作。

---

### 問題 3：法規與實務題庫解析品質問題

**現象**：「證券商業務員(初業) → 法規與實務」的題目、選項有問題，未分析好。

**現況調查**：

| 年份    | Sessions 數 | 問題                                                          |
| ------- | ----------- | ------------------------------------------------------------- |
| 105     | Q2/Q3/Q4    | 解析有但品質待確認（來自舊 PDF 來源）                         |
| 106     | Q2/Q3/Q4    | 同上                                                          |
| 107     | Q1/Q2/Q3/Q4 | **answer 全為空字串**，explanation 為「PDF 原始試題未附解析」 |
| 108     | Q1/Q2/Q3/Q4 | 待確認（107 同源可能同樣問題）                                |
| 109     | Q1-Q4       | 待確認                                                        |
| 110-114 | Q1/Q2/Q3    | 待確認                                                        |
| 115     | Q1 only     | 待確認                                                        |

**新 PDF 來源**：`D:\Anson\PersonalWorkFlow\drive-download-20260509T110258Z-3-001`

| 年份    | 新 PDF 內容                                 |
| ------- | ------------------------------------------- |
| 105     | Q2/Q3/Q4（法規 + 財分）                     |
| 106     | Q2/Q3/Q4（法規 + 財分）                     |
| 107     | Q1/Q2/Q3/Q4（法規 + 財分）← 含答案          |
| 108     | Q1/Q2/Q3/Q4（法規 + 財分）← Q3 有更正說明檔 |
| 109     | Q1/Q2（中文命名）+ 10903/10904（B 類命名）  |
| 110     | 11001/11002/11003（B 類：Q1/Q2/Q3）         |
| 111-114 | 同 110 格式                                 |
| 115     | 11501（Q1 only）                            |

現有 `pdf_convert_all.py` 使用舊來源目錄，需針對新 PDF 目錄建立新轉換腳本。

</details>

---

<details>
<summary>## 功能規格</summary>

### A. 登入 session 修正（Issue 1）

**目標**：使用者遇到 CF Access session 失效時，有明確的重新登入方式，不需要靠「切無痕」解決。

**行為設計**：

| 情境                                      | 目前行為                 | 修正後行為                                                                |
| ----------------------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `CF_Authorization` cookie 無效            | CF 顯示錯誤頁            | CF 顯示錯誤頁（CF 層無法改）                                              |
| 從 CF 錯誤頁點「URL of your application」 | 正常回主頁               | 同左（CF 行為不變）                                                       |
| `/api/session` 回傳 email=null            | 顯示「辨識身份中」或空白 | 若偵測到 cookie 存在但無法取得 email，顯示「重新登入」按鈕                |
| 點「重新登入」                            | 無此按鈕                 | redirect to `/cdn-cgi/access/logout?redirect_to=https://exam.buclaw.org/` |

**實作範圍**：

- `useViewer.ts`：偵測 session 失效狀態（fetch `/api/session` 失敗或回傳 401）
- `Home.tsx`：在身份辨識失敗時顯示「重新登入」按鈕
- 可選：在 CF Zero Trust 將 exam.buclaw.org 的 session duration 從預設值改為 24h

---

### B. 法規題庫重新解析（Issue 3）

**目標**：使用新 PDF 來源，重新解析 105-115 年「法規與實務」所有 sessions，確保答案正確、解析完整。

**解析策略**：

| PDF 類型 | 年份               | 解析方式                                                  |
| -------- | ------------------ | --------------------------------------------------------- |
| 中文命名 | 105-108、109 Q1/Q2 | A-class 解析器（題目 + 答案在同一 PDF 末尾）              |
| B 類命名 | 109 Q3/Q4、110-115 | B-class 解析器（`YYQN.pdf` + `YYQNa.pdf`，答案在 `a` 檔） |

**輸出目標**：

- 重新輸出 `data/subjects/securities-broker-law-{105..115}.json`
- 同步輸出至 `src/web/public/data/subjects/`
- 108 Q3 有更正檔（`Q3證券交易相關法規與實務第2題，證基會答案更正.pdf`），需套用 answer patch

**AI 解析補齊**：

- 針對解析欄位為空（`"answer": ""`）或 "PDF 原始試題未附解析" 的題目，使用 `explain_gen.py` 批次補齊
- 優先處理 107、108 年

</details>

---

<details>
<summary>## 實作計畫</summary>

### Phase 0：確認 CF Access 設定（手動操作）

- [ ] Cloudflare Zero Trust → Access → Applications → `exam.buclaw.org`
- [ ] 將 Session Duration 設為 24h（減少 session 失效頻率）
- [ ] 確認 Policy 設定（建議：Allow → Include → Emails → anson4139@gmail.com + Bypass 所有其他路由，或改用 Allow Everyone 讓登入識別身份用）

### Phase 1：前端重新登入機制

- [ ] `useViewer.ts`：當 `/api/session` 返回 401 或網路錯誤，設 `sessionFailed = true`
- [ ] `Home.tsx`：`sessionFailed` 時在頂部顯示「登入 session 已失效，請重新登入」+ 按鈕，跳轉 `/cdn-cgi/access/logout?redirect_to=https://exam.buclaw.org/`
- [ ] 部署並驗證（用無痕 + 正常模式各測一次）

### Phase 2：法規題庫 PDF 重新解析

- [ ] 建立 `src/scripts/pdf_convert_law_v2.py`，來源指向 `drive-download-20260509T110258Z-3-001/`
- [ ] 支援 A-class（中文命名，105-108、109 Q1/Q2）與 B-class（代碼命名，109 Q3/Q4、110-115）
- [ ] 套用 108 Q3 答案更正 patch
- [ ] dry-run 驗證：確認每年 sessions 數量與題數正確
- [ ] 輸出正式 JSON，覆蓋 `data/subjects/` 與 `public/data/subjects/`

### Phase 3：AI 解析補齊

- [ ] 執行 `explain_gen.py --subject securities-broker-law-107`（answer 為空的年份）
- [ ] 執行 `explain_gen.py --subject securities-broker-law-108`
- [ ] 視品質決定是否補齊 105-115 全年

### Phase 4：部署與驗收

- [ ] git commit + push
- [ ] wrangler 部署（`npx wrangler pages deploy dist --project-name exam-study-platform --branch main`）
- [ ] 驗收：瀏覽 exam.buclaw.org，測試登入 session 修正、法規題庫正確性

</details>

---

<details>
<summary>## 工作拆解與優先順序</summary>

| 優先 | 項目                            | 類型 | 說明                                          |
| ---- | ------------------------------- | ---- | --------------------------------------------- |
| P0   | CF Access session duration 調整 | 設定 | Zero Trust 後台操作，立即減少觸發頻率         |
| P1   | 前端重新登入按鈕                | 前端 | `useViewer` 偵測 session 失效 + Home 顯示按鈕 |
| P1   | PDF 轉換腳本 v2                 | 腳本 | 新來源目錄 + A/B class + answer patch         |
| P2   | 法規 JSON 重新輸出              | 資料 | 105-115 全年覆蓋                              |
| P2   | AI 解析補齊                     | 資料 | 107、108 優先，answer 空白題目補解析          |
| P3   | 部署 + 驗收                     | 發布 | wrangler deploy + 功能確認                    |

</details>
