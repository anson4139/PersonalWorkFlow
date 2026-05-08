# 考題學習平台 v5：中級題庫品質修正與初級題庫納管

> **[AI 規則] 每次修改本文件，必須同時執行以下兩個動作，否則視為不完整的更新：**
>
> 1. **在本文件的「異動記錄」表格最上方新增一筆記錄（日期 / 版本 / 更新人 / 變更說明）**
> 2. **在 `projects/README.md` 的「提案異動歷程」表格最上方同步新增一筆記錄（日期 / 提案 / 對應專案 / 異動摘要）**

| 項目     | 內容                                                   |
| -------- | ------------------------------------------------------ |
| 狀態     | `closed`                                               |
| 建立日期 | 2026-05-08                                             |
| 最後更新 | 2026-05-08（v1.0 全交付完成，結案）                    |
| 對應專案 | `projects/01-exam-study-platform/`                     |

---

<details>
<summary>## 異動記錄</summary>

| 日期       | 版本 | 更新人 | 變更說明                                                                                                          |
| ---------- | ---- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| 2026-05-08 | v1.0 | Anson  | 全交付完成結案：中/初級共 250 題解析補齊、含圖題 code_block/image_url 渲染、KaTeX 數學符號、前端接入、production 部署正常 |
| 2026-05-08 | v0.2 | Anson  | 補入含圖題處理方案（A+C）與數學符號 KaTeX 渲染需求                                                                |
| 2026-05-08 | v0.1 | Anson  | 建立提案初稿                                                                                                      |

</details>

---

<details>
<summary>## 背景與問題診斷</summary>

### 為什麼需要這個提案

平台目前已納入中級 AI 應用規劃師三科題庫（114 年第二梯次），但存在**三類品質問題**，且完全未納入初級科目，導致僅有中階使用者可練習，初學者無法使用。

### 問題診斷：中級題庫

來源 JSON：`data/subjects/ai-planning.json`、`big-data.json`、`machine-learning.json`

| 問題類型                        | 說明                                                                                                                                         | 嚴重性                                      | 例子                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **P1：全部缺解析**              | 三科共 150 題的 `explanation` 欄位全為 `"PDF 原始試題未附解析"`                                                                              | 高 — 學習體驗差，練完不知道為什麼錯         | 所有題目                                                                                              |
| **P2：選項文字截斷**            | PDF OCR 換行符號殘留，導致選項句子在中間被截斷                                                                                               | 高 — 題目語意不完整，無法判斷正確性         | `ai-planning.json` Q4 選項 D：`"而 GloVe 可應用於即時語料更"` — 明顯截斷                              |
| **P3：PDF 殘留字元**            | OCR 過程中，PDF 版面元素（如頁尾「答 案 題目」）被誤植入選項                                                                                 | 中 — 閱讀障礙，內容干擾                     | `big-data.json` Q4 選項 B：`"...PDF）的積分 答 案 題目"`                                              |
| **P4：選項結尾符號不一致**      | 部分選項結尾有「；」，部分無，為 OCR 殘留                                                                                                    | 低 — 不影響理解，但不整潔                   | `ai-planning.json` Q2 選項 A、C                                                                       |
| **P5：含圖題圖片遺失**          | 題目文字保留（如「附圖程式碼…」），但對應的程式碼截圖或圖表圖片**完全未提取**，PDF OCR 只取文字層                                            | 高 — 作答者看不到題目所指的圖，題目等同殘缺 | `machine-learning.json` Q38–Q50（12題程式碼/執行結果截圖）、`big-data.json` Q3（偏態分布圖）等 ~15 題 |
| **P6：數學符號 LaTeX 渲染缺失** | explanation 內部分使用 LaTeX 語法（`\frac{}`、`\sum` 等），前端 `formatExplanation()` 只做正則文字替換，分數顯示為 `(a)/(b)`，複雜式顯示亂碼 | 中 — 影響解析閱讀品質                       | `QuestionCard.tsx` 現有 `formatExplanation()` 無法完整處理                                            |

**來源 PDF 已備齊**：`AI應用規劃師試題/中級/` 下有 3 份官方 PDF。

### 問題診斷：初級題庫

初級 AI 應用規劃師題庫**完全未建立**：

| 科目                           | 現況       | 來源 PDF                                                     |
| ------------------------------ | ---------- | ------------------------------------------------------------ |
| 初級第一科：人工智慧基礎概論   | **不存在** | `AI應用規劃師試題/初級/` — 114第四梯次、115第一次（共 2 份） |
| 初級第二科：生成式AI應用與規劃 | **不存在** | `AI應用規劃師試題/初級/` — 114第四梯次、115第一次（共 2 份） |

**初級定位**：相較中級更注重概念理解，適合 AI 入門者，與現有學習路徑（`docs/guides/ai-learning-path.md`）高度互補。

</details>

---

<details>
<summary>## 交付範圍（MVP）</summary>

### Phase 1：中級題庫品質修正

| 工作項目                   | 說明                                                                             | 輸出                                                              |
| -------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **1-A 重新轉換 PDF**       | 使用修正後的轉換腳本，重新解析 3 份中級 PDF，處理換行截斷與殘留字元問題          | 更新 `ai-planning.json`、`big-data.json`、`machine-learning.json` |
| **1-B LLM 批次補解析**     | 呼叫 OpenAI API（複用 `explain_gen.py` 流程），為 150 題生成高品質 `explanation` | 同上 JSON 更新，explanation 欄位填入實質解析                      |
| **1-C 同步 public 資料夾** | 確保 `src/web/public/data/subjects/` 同步最新 JSON                               | 前端自動受益                                                      |

**解析品質要求**：

- 說明**為何答案正確**（理論依據）
- 點出**各錯誤選項的錯誤原因**（至少簡短說明）
- 長度：100–300 字，技術術語附中文釋義

### Phase 2：初級題庫建立

| 工作項目                   | 說明                                                                                                         | 輸出                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **2-A 建立 PDF 轉換腳本**  | 建立 `src/scripts/pdf_convert_ai_basic.py`，解析初級 4 份 PDF                                                | 草稿 JSON                         |
| **2-B 建立初級 JSON**      | `ai-planning-basic.json`（第一科）、`gen-ai-basic.json`（第二科），每個含 2 sessions（114梯次、115年第一次） | 新增 `data/subjects/` 下 2 個檔案 |
| **2-C LLM 批次補解析**     | 為初級所有題目（估計 ~160–200 題）補 explanation                                                             | 同上                              |
| **2-D 同步 public 資料夾** | 同步至 `src/web/public/data/subjects/`                                                                       | 前端可讀取                        |

**初級 JSON Schema 與中級一致**（複用現有格式）：

```json
{
  "key": "ai-planning-basic",
  "title": "AI應用規劃師 初級 第一科",
  "total": 40,
  "sessions": [
    { "session": "第114屆第四梯次", "questions": [...] },
    { "session": "第115屆第一次", "questions": [...] }
  ]
}
```

### Phase 3：前端接入初級科目

| 工作項目                      | 說明                                                                       | 涉及檔案                       |
| ----------------------------- | -------------------------------------------------------------------------- | ------------------------------ |
| **3-A 新增 SubjectKey**       | 在 `src/web/src/types.ts` 加入 `"ai-planning-basic"` 和 `"gen-ai-basic"`   | `types.ts`                     |
| **3-B 新增 SUBJECTS 設定**    | 補充科目名稱、說明、icon 配置                                              | `types.ts`                     |
| **3-C 新增 EXAM_GROUPS 分類** | 在首頁選單加入「初級 AI 應用規劃師」分組，與現有「中級 AI 應用規劃師」並列 | `types.ts` 或 `Home.tsx`       |
| **3-D 權限設定**              | 將初級科目加入 `PUBLIC_SUBJECT_KEYS`（公開可練習），或依需求設定           | `access-control.ts` 或 D1 設定 |

### Phase 4：含圖題處理與數學符號渲染

#### 4-A 含圖題：方案 A+C 混合

中級三科估計有 **~15 題含圖**，依內容分兩類處理：

| 題型                                         | 判斷方式                                                                  | 處理方案                                                                                                                    | 輸出                                    |
| -------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **程式碼截圖 / 執行結果截圖**（佔多數）      | 題目含「附圖程式碼」「參考下圖執行結果」，且 PDF OCR 部分已提取程式碼文字 | **方案 C**：整理 OCR 到的程式碼文字 → 寫入 JSON 新欄位 `code_block`，前端用 `<pre><code>` 渲染，保留 monospace 排版         | JSON 新增 `code_block` 欄位（nullable） |
| **純圖表**（統計分布圖、混淆矩陣、折線圖等） | 題目含「附圖」但無可提取文字內容                                          | **方案 A**：`pymupdf` 從 PDF 提取嵌入圖片 → PNG/WebP → 上傳 `src/web/public/images/questions/` → JSON 寫入 `image_url` 欄位 | JSON 新增 `image_url` 欄位（nullable）  |

**JSON Schema 擴充（向下相容）：**

```json
{
  "no": 38,
  "question": "附圖程式碼所計算的是哪一類型的評估指標？",
  "code_block": "from sklearn.metrics import ...\n\ny_true = [...]\ny_pred = [...]",
  "image_url": null,
  "options": { ... },
  "answer": "B",
  "explanation": "..."
}
```

**前端 `QuestionCard.tsx` 異動**：

- 若 `code_block` 非 null → 題目下方插入 `<pre><code className="language-python">` 區塊
- 若 `image_url` 非 null → 題目下方插入 `<img>` + `max-w-full` + `rounded` + lazy loading（手機安全）
- 圖片在 375px 寬度下需可水平捲動（`overflow-x-auto`）

#### 4-B 數學符號：引入 KaTeX

**決策**：KaTeX（輕量 ~250KB、渲染快、SSR 友善），不選 MathJax（體積大、載入慢）。

**做法**：

1. `npm install katex` 於 `src/web/`
2. `QuestionCard.tsx` 移除現有 `formatExplanation()` 正則替換，改用 KaTeX `renderToString()` 處理含 `$...$`（inline）或 `$$...$$`（block）的 explanation
3. `explain_gen.py` System Prompt 調整：要求 LLM 生成 explanation 時，數學式一律用 `$...$` 包裹（標準 LaTeX inline 格式），避免裸 `\frac` 語法
4. 引入 `katex/dist/katex.min.css`（約 28KB）

**降級策略**：若文字不含 `$`，直接渲染純文字，零效能損耗。

### 非本提案範圍（排除）

- 中級多年份題庫（如 113 年或更早期）— 目前只有 114 年 PDF
- 初級 114年前三梯次（無 PDF 來源）
- 題庫精修至「教材級」品質（需人工逐題審查）
- 前端 UI 大改版

</details>

---

<details>
<summary>## 技術實作細節</summary>

### 中級 PDF 重新轉換策略

現有 `pdf_convert_all.py` 已處理過初業（證券商）的 PDF，但中級 AI 題庫 PDF 格式不同，需確認：

1. **換行截斷修正**：PDF 中的選項往往跨行，OCR 時需要「合併同屬選項的多行文字」
    - 策略：以「A.」「B.」「C.」「D.」作為選項開頭偵測符，兩個選項開頭之間的所有文字合併為一個選項
    - 需處理全形「（A）」與半形「A.」兩種格式
2. **殘留字元清除**：過濾已知的 PDF 版面字串（如「答 案 題目」、頁碼、頁首頁尾）
3. **正確答案解析**：中級 PDF 答案表格格式需特別處理（確認其在 PDF 末頁或獨立答案區塊）

### explain_gen.py 複用

現有 `explain_gen.py` 已具備批次補解析能力，可直接複用。調整點：

- `SUBJECT_KEYS` 設定加入中級與初級的 key
- System Prompt 需針對 AI 應用規劃師考試調整（強調：解題邏輯 + 錯誤選項分析 + 技術術語釋義）
- Rate limit：150 題中級 + ~180 題初級 = ~330 次 API 呼叫，建議加入 retry + 進度存檔機制

### 腳本建議：pdf_convert_ai_basic.py

```
用途：將初級 AI 應用規劃師 4 份 PDF 轉為 JSON
輸入：AI應用規劃師試題/初級/*.pdf
輸出：
  data/subjects/ai-planning-basic.json
  data/subjects/gen-ai-basic.json
  src/web/public/data/subjects/（同步）
邏輯：
  1. 依檔名判斷科目（第一科 / 第二科）
  2. 依年份分組 session
  3. 解析題目 / 選項 / 答案
  4. 合併兩個 session 寫入同一 JSON
```

### 含圖題圖片提取腳本：extract_question_images.py（新增）

```
用途：從中級 PDF 提取嵌入圖片，與題目編號對齊
輸入：AI應用規劃師試題/中級/*.pdf
輸出：src/web/public/images/questions/<subject>/<no>.webp
邏輯：
  1. 用 pymupdf（fitz）掃描每頁的圖片資源
  2. 過濾：寬度 > 200px 且高度 > 100px（排除 icon / logo）
  3. 依頁碼對應題目編號（需人工確認對齊表 images_manifest.json）
  4. 輸出 WebP 格式（檔案小 30–50%）
注意：圖片-題目對齊需半人工，腳本只做粗分，人工確認 manifest
```

</details>

---

<details>
<summary>## 工作拆解與優先順序</summary>

| 優先 | 項目                                         | 估計工作量   | 備注                                                  |
| ---- | -------------------------------------------- | ------------ | ----------------------------------------------------- |
| P0   | 中級題庫 PDF 重新轉換（修正截斷 + 殘留字元） | 半天         | 先確認 PDF 轉換品質再補解析                           |
| P0   | 中級題庫 LLM 批次補 explanation（150 題）    | 1小時（API） | 複用 explain_gen.py；Prompt 加入 `$...$` 數學格式要求 |
| P0   | KaTeX 引入（前端）                           | 半天         | `npm install katex`，改寫 `QuestionCard.tsx`          |
| P0   | 含圖題圖片提取 + manifest 對齊               | 1天          | pymupdf 提取 + 人工確認 images_manifest.json          |
| P1   | QuestionCard 支援 code_block / image_url     | 半天         | `<pre><code>` + `<img>` 區塊，375px RWD 測試          |
| P1   | 初級題庫 PDF 轉換腳本建立                    | 1天          | 新腳本，需測試格式解析                                |
| P1   | 初級題庫 LLM 批次補 explanation（~180 題）   | 1小時（API） | 同上                                                  |
| P2   | 前端接入初級科目（types.ts + 分組）          | 半天         | 主要是設定，UI 邏輯已有                               |
| P3   | 部署並驗證                                   | 1小時        | wrangler deploy                                       |

**建議執行順序**：Phase 4（KaTeX + 圖片基礎建設）→ Phase 1（中級修正上線）→ Phase 2（建立初級）→ Phase 3（前端接入）→ 部署

</details>

---

<details>
<summary>## 驗收標準</summary>

| 項目             | 標準                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 中級題庫完整性   | `ai-planning.json`、`big-data.json`、`machine-learning.json` 共 150 題，**0 題** explanation 為 "PDF 原始試題未附解析" |
| 中級題庫無截斷   | 隨機抽查 20 題，所有選項文字語意完整，無截斷、無殘留字元                                                               |
| 初級題庫存在     | `ai-planning-basic.json`、`gen-ai-basic.json` 存在且含 2 sessions                                                      |
| 初級題庫完整性   | 初級所有題目均有 answer 且非空，explanation 均有實質內容                                                               |
| 前端可選科目     | 首頁「初級 AI 應用規劃師」分組可見，兩科均可進入練習                                                                   |
| 含圖題顯示正常   | 中級 ~15 題含圖題：程式碼類顯示 `<pre>` 區塊，圖表類顯示圖片；手機 375px 寬度下不破版                                  |
| 數學符號正確渲染 | explanation 中的 `$...$` 包裹式正確顯示為排版數學式；不含 `$` 的文字不受影響                                           |
| 舊功能不受影響   | 初業（證券商）題庫、對戰模式正常，無 regression                                                                        |

</details>

---

<details>
<summary>## 系統開發規格</summary>

### 資料層

| 項目         | 內容                                                        |
| ------------ | ----------------------------------------------------------- |
| JSON Schema  | 與既有中級格式一致（`key`, `title`, `total`, `sessions[]`） |
| 中級來源 PDF | `AI應用規劃師試題/中級/*.pdf`（3 份）                       |
| 初級來源 PDF | `AI應用規劃師試題/初級/*.pdf`（4 份）                       |
| 輸出路徑     | `data/subjects/` + `src/web/public/data/subjects/`（雙寫）  |

### 腳本層

| 腳本                                  | 用途                                           | 異動類型 |
| ------------------------------------- | ---------------------------------------------- | -------- |
| `src/scripts/pdf_convert_ai_basic.py` | 新建：初級 PDF → JSON                          | 新增     |
| `src/scripts/explain_gen.py`          | 現有：複用，調整 SUBJECT_KEYS 與 System Prompt | 修改     |
| `src/scripts/pdf_convert_all.py`      | 現有：可選擇性修正中級轉換邏輯                 | 可選修改 |

### 前端層

| 項目         | 內容                                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 框架         | React 18 + Vite + TypeScript + Tailwind CSS（不變）                                                                                                |
| 新增套件     | `katex`（數學符號渲染，~250KB）                                                                                                                    |
| 異動檔案     | `src/web/src/types.ts`（SubjectKey、SUBJECTS、EXAM_GROUPS）、`src/web/src/components/QuestionCard.tsx`（code_block / image_url 支援 + KaTeX 渲染） |
| 新增靜態資源 | `src/web/public/images/questions/<subject>/<no>.webp`（含圖題圖片）                                                                                |
| 權限         | 初級科目建議設為公開（PUBLIC_SUBJECT_KEYS）                                                                                                        |

### JSON Schema 擴充

| 欄位         | 類型             | 說明                                                    |
| ------------ | ---------------- | ------------------------------------------------------- |
| `code_block` | `string \| null` | 程式碼截圖題的程式碼文字，前端用 `<pre><code>` 渲染     |
| `image_url`  | `string \| null` | 純圖表題的圖片路徑（相對 public/），前端用 `<img>` 渲染 |

兩欄位均**可選**（nullable），既有題目補 `null` 即可，完全向下相容。

</details>
