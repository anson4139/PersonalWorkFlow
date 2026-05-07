# 考題學習平台 v3：初業題庫納管與測試模式提案

| 項目 | 內容 |
|---|---|
| 狀態 | `closed` |
| 建立日期 | 2026-05-04 |
| 最後更新 | 2026-05-05（V3 範圍完成並結案） |
| 對應專案 | `projects/01-exam-study-platform/` |

---

<details>
<summary>## 結案摘要（先讀這段）</summary>

結論：**以本次 V3 定義的交付範圍，已可結案。**

本次 V3 已完成：
- 證券商業務員（初業）`110~115` 年題庫納入平台，前端可選科目已接入。
- 三模式完成統一：單題模式、10 題模式、測試模式。
- 測試模式已具備作答、送卷、計分、續測草稿、歷史紀錄與重測。
- PDF 全量轉檔管線完成，已輸出 `105~115` 題庫 JSON。
- LLM 解析批次完成，共補齊 `2150` 題 explanation，並同步到前端 public 題庫。
- 正式站權限模型已上線，並已可針對個別 Gmail 帳號授予指定題庫權限。

本次結案不阻擋但仍存在的已知限制：
- `105~109` 部分年份原始 PDF 缺答案，因此該區段仍有題目無法補齊正解與解析。
- `unit/e2e` 自動化測試尚未補齊，目前以建置、資料檢查與正式部署驗證為主。
- 解析品質目前以批次生成與基本抽查為主，若後續要做教材級精修，可另立 v4 或 maintenance 項目。

</details>

<details>
<summary>## 本次實作總覽（規格 / 前端 / 後端 / 設定）</summary>

### 1. 功能規格

V3 實際完成的功能規格如下：
- 題庫納管：證券商業務員（初業）`110~115` 年法規與實務、投資與財務分析，共 `12` 科。
- 學習模式：所有可見題庫統一支援單題模式、10 題模式、測試模式。
- 測試模式：支援逐題選答、送卷計分、顯示答對率、續做草稿、查看歷史結果、重新測驗。
- 題目解析：有正解的題目已批次補 explanation；無正解來源者保留空缺或佔位處理。
- 權限模型：正式站以 Cloudflare Access 驗證登入身份，再以 `allowedSubjects` 決定可見題庫。

### 2. 前端實作

前端技術與實作面：
- 技術棧：React、Vite、TypeScript、Tailwind CSS。
- 題庫選單與分類：由 `src/web/src/types.ts` 中的 `SUBJECTS`、`EXAM_GROUPS`、`SubjectKey` 控制。
- 首頁與模式切換：由 `src/web/src/pages/Home.tsx` 控制主流程。
- 題目呈現與解析顯示：由 `src/web/src/components/QuestionCard.tsx` 控制。
- 本機續測記憶：使用 localStorage，key 格式為：
   - `esp.practice.progress.<subjectKey>.<session>`
   - `esp.test.draft.<subjectKey>.<session>`
   - `esp.test.history.<subjectKey>.<session>`

### 3. 後端 / 平台側實作

此專案無傳統應用後端，V3 實際採用的是 Cloudflare Pages Functions + D1：
- 身份來源：Cloudflare Access + Google Login。
- session API：`src/web/functions/api/session.ts`
- 管理授權 API：`src/web/functions/api/admin/access.ts`
- 題庫 JSON 路徑保護：`src/web/functions/data/subjects/_middleware.ts`
- 權限解析核心：`src/web/functions/_shared/access-control.ts`
- 正式站權限資料庫：Cloudflare D1，binding 名稱為 `ACCESS_DB`
- 資料表：`user_access(email, is_admin, allowed_subjects, note, updated_at)`

權限語法與資料格式：
- `allowed_subjects` 使用 JSON array 字串儲存，例如：
   - `["securities-broker-law-110","securities-broker-finance-110"]`
- 管理者帳號由 `ANSON_EMAIL` 決定。
- 一般使用者若資料庫沒有專屬設定，則回落到 `PUBLIC_SUBJECT_KEYS`。

### 4. 題庫資料與腳本

V3 的資料處理採 Python 腳本分工：
- `src/scripts/pdf_convert_all.py`
   - 用途：將 `105~115` 年 PDF 題庫轉為既有 JSON schema。
   - 特點：支援 A/B 類 PDF 命名族群、答案 patch、同步寫入 `data/subjects/` 與 `src/web/public/data/subjects/`。
- `src/scripts/explain_gen.py`
   - 用途：呼叫 OpenAI API 批次補 `explanation`。
   - 特點：支援 `--all`、`--subject`、`--dry-run`、`--start-no`、retry 與 public 題庫同步覆蓋。

JSON 題庫 schema：
- `key`
- `title`
- `total`
- `sessions[]`
- `sessions[].questions[]`
- `question / options / answer / explanation`
- `meta`

### 5. 設定與部署

V3 實際用到的設定：
- 前端本機模擬：`src/web/.env`、`src/web/.env.example`
- Pages / D1 設定：`src/web/wrangler.jsonc`
- Cloudflare 變數：`ANSON_EMAIL`、必要時 `TEAM_DOMAIN`
- 開發模擬變數：`VITE_ADMIN_EMAIL`、`VITE_DEV_VIEWER_EMAIL`、`VITE_DEV_IS_ADMIN`、`VITE_DEV_ALLOWED_SUBJECTS`

V3 實際用到的指令：
- 前端建置：`npm run build`
- 正式部署：`npx wrangler pages deploy dist --project-name exam-study-platform --branch main --commit-dirty true`
- 遠端 D1 授權寫入：`npx wrangler d1 execute exam-study-platform-access --remote --file <sql-file>`

### 6. 驗證方式

本次 V3 主要驗證方式：
- `npm run build` 通過。
- 題庫 JSON 已同步至前端 public 路徑。
- 正式站 Pages deployment 完成。
- 遠端 D1 可成功新增與查詢指定使用者授權。
- `https://exam.buclaw.org/` 已使用同一 Pages 專案部署。

</details>

<details>
<summary>## 現況評估結論</summary>

可行，建議立案執行。

評估依據：
- 題庫來源目前是 `105~115` 年資料夾，共 71 份 PDF 與 1 份答案更正 txt（108 年 Q3 法規第 2 題應改為 D）。
- 全量 PDF 樣式已盤點完成，命名與版型可分為 3 大族群（見下方「PDF 樣式分類盤點」）。
- 既有轉檔流程僅支援 `.md -> JSON`，且目前腳本來源路徑有硬編碼，不能直接吃這批 PDF。
- 前端目前已有「單題模式 / 10題模式」，但沒有「測試模式」的作答、計分、送卷與歷史紀錄。
- 專案已採 localStorage 儲存進度，適合先做「本機記憶」版本（可續測、可重測、可看歷史）。

可行前提：
- 先完成 PDF 抽取與結構化清洗流程。
- 先確認題庫使用授權（該資料包含「版權所有」標示）。

</details>

<details>
<summary>## PDF 樣式分類盤點</summary>

盤點範圍：
- 路徑：`證券商業務員(初業)10501-11501/.../證券商業務員(初業)10501-11501/`
- 總數：71 份 PDF + 1 份更正 txt

年度分佈：
- 105：6
- 106：8
- 107：8
- 108：8
- 109：8
- 110：6
- 111：6
- 112：6
- 113：6
- 114：6
- 115：2
- 其他：1（考照說明 PDF）

命名/樣式族群：
- A 類（早期長檔名，多樣命名）：105~108、109 的部分，特徵為 `Qx + 中文科目`，夾雜括號/底線/連字號與全形空白。
- B 類（中期代碼檔名）：109~114 的核心檔，特徵為 `YYY0N.pdf` 與 `YYY0Na.pdf`（例如 `11001.pdf` / `11001a.pdf`）。
- C 類（115 特例）：`11501.pdf`、`11501a.pdf`，僅 Q1 一組，命名延續 B 類但資料量不完整。

對應解析策略：
- parser-1（代碼檔名）：優先支援 B/C 類，規則穩定、成功率高，適合先做 PoC。
- parser-2（長檔名）：支援 A 類，需做較強健的正規化（空白、異體字、括號符號、科目詞彙映射）。
- answer-overrides：套用已知更正（目前至少 108 Q3 法規第 2 題 -> D）。

PoC 建議順序：
1. 先做 `110` 年（純 B 類，6 檔）
2. 再做 `108` 年（A 類，含已知答案更正）
3. 最後擴到 105~115 全量

</details>

<details>
<summary>## 目標</summary>

在不改變現有專案技術棧（React + Vite + TypeScript + localStorage）的前提下，完成兩件事：

1. 將「證券商業務員(初業) 105~115」資料納入統一 JSON 題庫格式，掛入現有題庫平台。
2. 將所有題庫統一升級為三種模式：
   - 單題模式（現有）
   - 10題模式（現有）
   - 測試模式（新增：計時/計分/送卷/檢討/可重測）

</details>

<details>
<summary>## 範疇</summary>

**包含：**
- 建立 PDF 題庫轉換流程（抽取、解析、正規化、答案修正映射、輸出 JSON）。
- 新增初業題庫科目鍵值與分類顯示（前端可選、可載入）。
- 新增第三模式「測試模式」：
  - 作答狀態管理
  - 送卷計分
  - 成績摘要（分數、答對率、錯題清單）
  - 重新測驗
  - 延續上次未完成測驗
- 新增記憶資料結構（localStorage）：
  - 練習進度
  - 測驗草稿
  - 測驗歷史

**排除：**
- 後端帳號同步（跨裝置同步）
- 排行榜與社交功能
- AI 自動生成解析（若原始題目無解析，先以「無解析」處理）

</details>

<details>
<summary>## 設計</summary>

### A. 題庫納管設計

1. 新增資料來源區：
- 原始檔存放於專案內可控路徑（建議 `projects/01-exam-study-platform/data/raw/`）。

2. 轉檔流程分層：
- `extract`：PDF 文字抽取（必要時 OCR）
- `parse`：辨識題號、題幹、選項、答案
- `normalize`：轉成既有 Subject JSON 結構
- `patch`：套用已知答案修正（例如 108 Q3 法規第 2 題 -> D）
- `validate`：檢查欄位完整性與選項完整性

3. 輸出格式：
- 沿用既有 `data/subjects/*.json` schema，不破壞前端載入機制。

### B. 三模式設計

1. 單題模式（保留）：
- 逐題瀏覽、可看解析。

2. 10題模式（保留）：
- 區塊式練習，快速掃題。

3. 測試模式（新增）：
- 進入測驗後先隱藏正解。
- 使用者逐題選答，可跳題與回看。
- 按「送卷」後一次計分。
- 顯示結果頁：
  - 分數（答對題數 / 總題數）
  - 答對率
  - 錯題清單
  - 重新測驗
  - 續做上次未完成測驗

### C. 記憶功能（localStorage）

建議 key 設計：
- `esp.practice.progress.<subjectKey>.<session>`
- `esp.test.draft.<subjectKey>.<session>`
- `esp.test.history.<subjectKey>.<session>`

建議資料內容：
- `draft`：目前作答 map、開始時間、模式設定、最後更新時間。
- `history`：每次送卷結果（分數、答對率、作答明細、完成時間）。
- `progress`：練習模式目前頁碼與最近一次瀏覽位置。

### D. 互動學習感（好玩）

首版可做低風險增強：
- 成績分級標籤（例如 A / B / C）
- 連續答對計數（streak）
- 錯題回鍊按鈕（只重練本次錯題）

以上皆不需後端，可先快速落地。

</details>

<details>
<summary>## 決策紀錄</summary>

| 日期 | 決定 | 原因 |
|---|---|---|
| 2026-05-04 | 本案立為 `active` | 使用者已明確提出題庫納管 + 新測試模式需求 |
| 2026-05-04 | 三模式定義為「單題 / 10題 / 測試」 | 與現況連續、改動成本低、可快速上線 |
| 2026-05-04 | 記憶功能首版採 localStorage | 專案既有架構一致，不增加後端複雜度 |
| 2026-05-04 | 題庫納入採「轉檔+校正」管線 | 原始來源為 PDF，需先結構化才能納入既有 JSON 題庫 |

</details>

<details>
<summary>## 執行進度</summary>

| 里程碑 | 完成/預計日期 | 狀態 |
|---|---|---|
| 盤點 105~115 原始檔與格式 | 2026-05-04 | 完成 |
| v3 提案建立（本文件） | 2026-05-04 | 完成 |
| PDF 轉檔腳本 PoC（110 年） | 2026-05-04 | 完成 |
| 110 年 PoC 題庫輸出與 schema 相容性確認 | 2026-05-04 | 完成 |
| 前端測試模式 MVP（作答/送卷/計分） | 2026-05-04 | 完成 |
| 測試草稿續測（localStorage） | 2026-05-04 | 完成 |
| 前端建置驗證（`npm run build`） | 2026-05-04 | 完成 |
| 題庫 schema 驗證與答案更正機制擴展（105~115 全量） | 2026-05-04 | 完成 |
| LLM 自動解析腳本 `explain_gen.py` 實作 | 2026-05-04 | 完成 |
| 全量 2,150 題解析批次補齊（有答案者） | 2026-05-05 | 完成 |
| 正式站權限與指定帳號授權配置 | 2026-05-05 | 完成 |
| 正式部署至 `https://exam.buclaw.org/` | 2026-05-05 | 完成 |
| 測試（unit + e2e）與 UI 微調 | 後續 backlog | 非結案阻擋 |
| 上線前驗收（手機版優先） | 2026-05-05 | 完成 |
| V3 結案判定 | 2026-05-05 | 完成 |

</details>

<details>
<summary>## 風險與控管</summary>

1. PDF 抽取品質不穩（掃描版、字型、版面差異）
- 控管：先做單年度 PoC，建立可重跑的 parser + patch。

2. 官方答案偶有誤植
- 控管：建立 `answer_overrides` 清單，版本化管理，來源可追溯。

3. 題庫授權風險
- 控管：部署前先確認使用授權範圍；若僅限個人學習，則避免公開散佈原文內容。

4. localStorage 僅限單裝置
- 控管：在 UI 明確告知「紀錄存於本機瀏覽器」，後續若有需求再升級雲端同步。

</details>

<details>
<summary>## 解析自動補齊（新需求 2026-05-04）</summary>

### 需求背景

PDF 原始試題本身不含解析說明，轉出的 JSON 題庫目前所有題目的 `explanation` 欄位皆為佔位字串 `"PDF 原始試題未附解析"`。前端 `QuestionCard.tsx` 已有解析區塊（`<details>` 展開），只差內容。

範疇估算：
- 105~115 年 × 2 科 × 每科約 150 題 ≒ **3,300 題**

---

### 方案比較

| 方案 | 說明 | 優點 | 缺點 |
|---|---|---|---|
| A. 爬取第三方解析網站 | 到坊間補習/題庫網站抓對應解析 | 若來源有現成解析，品質最佳 | 網站反爬、版面異動、版權問題、題目文字比對困難；實測發現多個常見台灣金融題庫網站拒絕自動存取 |
| B. LLM API 自動生成 | 送題幹 + 選項 + 正解至 LLM（如 OpenAI GPT-4o），請它生成中文解析 | 可批次、穩定、不受網站結構影響；證券/法規類是 LLM 強項 | 需 API 費用（估 $1~3 USD / 全量 3,300 題）；生成內容需抽樣人工校對 |
| C. 手工 + 部分 LLM | 只對高頻錯題/重要題生成，其餘留空 | 省成本 | 覆蓋率低，使用者體驗不一致 |

**建議採方案 B（LLM API）**，理由：
- 台灣主要金融題庫網站（exambank、jinrong.tw）實測均無法自動抓取。
- 題目均為標準法規/財務計算題，LLM 生成準確率可接受。
- 費用可控，全量一次跑完即長期有效。
- 既有 `.env` 環境可直接放 `OPENAI_API_KEY`。

---

### 技術設計（方案 B）

1. 新增腳本 `src/scripts/explain_gen.py`：
   - 讀取指定 JSON 題庫檔
   - 對每題送一個 prompt：題幹 + 四選項 + 正解 -> 請 LLM 說明為何正解正確，錯誤選項為何錯
   - 支援 `--subject` / `--dry-run` / `--overwrite` 參數
   - 輸出覆蓋原始 JSON（或寫到新路徑）

2. Prompt 範本：
   ```
   你是台灣證券商業務員考試（初業）的解題老師。
   以下是一道考題，請用 100~200 字的中文說明正確答案的理由，
   並簡要說明其他選項為何錯誤。不要直接複製題目文字。

   題目：{question}
   選項：(A) {A}  (B) {B}  (C) {C}  (D) {D}
   正解：{answer}
   ```

3. 批次控制：
   - 每題間隔 0.5 秒（避免 rate limit）
   - 失敗自動 retry 3 次
   - 支援從指定題號續跑（`--start-no`）

---

### 執行順序

1. 先完成 PDF 全量轉 JSON（105~115 所有年份）
2. 再跑 `explain_gen.py` 補齊所有 JSON 題庫的 `explanation`
3. 抽樣驗收 10 題（每年 1 題）確認品質合格後視為完成

---

### 風險

| 風險 | 控管 |
|---|---|
| LLM 生成解析有誤 | 標注「AI 輔助解析，建議對照官方教材」；抽樣人工校對 |
| API 費用超預期 | 先用 `--dry-run` 計算 token 用量，估費用再開跑 |
| 生成速度慢 | 可分批跑，支援續跑；預估全量約 20~30 分鐘 |

</details>

<details>
<summary>## 結案 / 擱置 / 作廢備註</summary>

本案已於 2026-05-05 依 V3 原始目標完成並結案。

結案時點的實際成果：
- 證券商業務員（初業）110~115 年題庫已納入平台。
- 測試模式已完成並可用。
- explanation 已完成批次補齊並同步正式站。
- 正式站授權模型與指定帳號題庫白名單已上線。

未納入本次結案阻擋之後續事項：
- 105~109 缺答案題目若要補正，需另尋答案來源或人工校訂。
- 若要提升維護性，可後續補 unit / e2e 自動化測試。

</details>
