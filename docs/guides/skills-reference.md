# Skills Reference — 所有 Skill 觸發指南

> 說明何時使用哪個 Skill、如何觸發、範例提示詞。
> AI 讀到相關請求時會自動觸發，或你可以明確說出 Skill 名稱。

---

## 平台對照表

| 平台 | Skill 來源 | 數量 |
|---|---|---|
| GitHub Copilot（VS Code）| `.github/skills/` | 21 個 |
| Claude for Work | `.agent/skills/` | 29 個（含 10 個專屬 Agent）|
| Claude Code | `.claude/skills/` | 19 個 |

---

<details>
<summary>## 開發類</summary>

### `frontend-design`
**平台**：三平台通用
**觸發時機**：設計 Web UI、React 元件、HTML/CSS 介面
**範例提示詞**：
- 「設計一個用戶登入頁面，要有品質感」
- 「幫我建立一個資料表格的 React 元件」
- 「這個表單的 UI 太醜了，幫我改」

---

### `webapp-testing`
**平台**：三平台通用
**觸發時機**：用 Playwright 測試本地網頁功能、截圖、驗證 UI 行為
**範例提示詞**：
- 「幫我測試 localhost:5173 的登入流程」
- 「截一張目前頁面的截圖」
- 「驗證送出表單後是否顯示成功訊息」

---

### `mcp-builder`
**平台**：三平台通用
**觸發時機**：建立 MCP Server 讓 LLM 操作外部服務
**範例提示詞**：
- 「幫我建一個 MCP Server 來查詢 PostgreSQL」
- 「建立 MCP 工具讓 AI 可以讀取 GitHub Issues」

---

### `web-artifacts-builder`
**平台**：三平台通用
**觸發時機**：建立多元件、複雜的 HTML artifact（React + Tailwind + shadcn）
**範例提示詞**：
- 「建一個有側欄導覽和主內容的 Dashboard artifact」
- 「用 shadcn/ui 建一個完整的設定頁面」

</details>

<details>
<summary>## 文件與簡報類</summary>

### `doc-coauthoring`
**平台**：三平台通用
**觸發時機**：撰寫任何結構化文件（規格書、提案、設計文件、決策文件）
**範例提示詞**：
- 「幫我寫這個功能的技術規格書」
- 「一起撰寫系統架構設計提案」
- 「幫我起草 API 設計文件」

---

### `docx`
**平台**：三平台通用
**觸發時機**：建立 / 編輯 Word 文件（.docx）
**範例提示詞**：
- 「把這份規格輸出成 Word 文件」
- 「讀取這個 .docx 並摘要重點」

---

### `pptx`
**平台**：三平台通用
**觸發時機**：建立 / 編輯 PowerPoint 簡報
**範例提示詞**：
- 「把這份架構說明做成 5 頁簡報」
- 「修改這個 .pptx 的第三頁內容」

---

### `pdf`
**平台**：三平台通用
**觸發時機**：萃取 PDF 文字、合併/拆分、填表單
**範例提示詞**：
- 「讀這份 PDF 合約，列出重要條款」
- 「把多份報告合併成一個 PDF」

---

### `xlsx`
**平台**：三平台通用
**觸發時機**：建立 / 分析 Excel 試算表
**範例提示詞**：
- 「用這份資料建一個有圖表的 Excel 報告」
- 「分析這個 .csv，找出異常資料」

---

### `internal-comms`
**平台**：三平台通用
**觸發時機**：撰寫內部溝通文件（週報、事故報告、公告）
**範例提示詞**：
- 「幫我寫本週的專案進度週報」
- 「撰寫系統停機的事後分析報告」

</details>

<details>
<summary>## 設計類</summary>

### `canvas-design`
**平台**：三平台通用
**觸發時機**：建立海報、視覺設計圖（輸出 PNG / PDF）
**範例提示詞**：
- 「設計一張專案啟動海報」
- 「建立一個系統架構的視覺示意圖」

---

### `theme-factory`
**平台**：三平台通用
**觸發時機**：為 artifact / 投影片 / 網頁套用視覺主題
**範例提示詞**：
- 「幫這個 Dashboard 套一個現代深色主題」
- 「用科技感主題重新設計這個網頁」

---

### `brand-guidelines`
**平台**：三平台通用
**觸發時機**：套用品牌色彩與排版規範
**範例提示詞**：
- 「用公司品牌顏色重新排版這份文件」

---

### `algorithmic-art`
**平台**：三平台通用
**觸發時機**：用 p5.js 生成藝術 / 生成式視覺
**範例提示詞**：
- 「用 p5.js 生成一個流場動畫」
- 「建立一個互動式粒子系統」

---

### `slack-gif-creator`
**平台**：三平台通用
**觸發時機**：建立 Slack 用動畫 GIF
**範例提示詞**：
- 「幫我做一個部署成功的慶祝 GIF」

</details>

<details>
<summary>## 記憶類</summary>

### `memory-capture`
**平台**：三平台通用
**觸發時機**：把確認的事實 / 決策 / 模式寫入長期記憶
**範例提示詞**：
- 「把這個決策記到 memory」
- 「這個環境設定是確認的，幫我存進記憶」
- 「記住：這個專案的 DB host 是 192.168.1.10」

**輸出位置**：`docs/knowledge/memory/facts.yaml`

---

### `memory-recall`
**平台**：三平台通用
**觸發時機**：複雜任務開始前，先從記憶取回相關知識
**範例提示詞**：
- 「回想一下這個框架有哪些已知約束」
- 「開始這個任務前先回顧記憶」

**讀取來源**：`docs/knowledge/memory/facts.yaml`，過濾 deprecated 和 expired 項目。

</details>

<details>
<summary>## 知識與回答類</summary>

### `grounded-answer`
**平台**：三平台通用
**觸發時機**：需要嚴格引用格式的技術說明或解答
**範例提示詞**：
- 「解釋 EF Core 的 Change Tracking，要附引用」
- 「回答這個問題，每個主張都要有依據」

---

### `decision-advisor`（`.agent` 專屬）
**觸發時機**：評估策略決策、找盲點、挑戰假設
**三種視角**：
- Munger（認知偏誤、逆向思考）
- Graham（第一原則、簡單性）
- Jobs（產品願景、使用者執念）

**範例提示詞**：
- 「用 Munger 的角度評估這個架構決策」
- 「Jobs 會怎麼看這個功能的使用者體驗？」
- 「幫我找這個計畫的盲點和假設」

</details>

<details>
<summary>## 工程 Agent 類（`.agent` 專屬）</summary>

這些 Skill 只在 Claude for Work（`.agent/skills/`）平台可用，代表專業工程師角色。

### `ai-engineer`
**角色**：AI/ML 工程師
**觸發時機**：AI 功能開發、RAG 系統、MLOps、模型整合
**範例提示詞**：
- 「幫我設計 RAG 管線的架構」
- 「整合 OpenAI Embeddings 到這個搜尋功能」
- 「建立模型評估（evals）的流程」

---

### `cloud-devops`
**角色**：Cloud / DevOps 工程師
**觸發時機**：CI/CD、容器化、IaC、監控、SLO
**範例提示詞**：
- 「幫我設置 Azure App Service 的 Bicep 部署」
- 「設計 GitHub Actions CI/CD pipeline」
- 「建立 Prometheus 監控設定」

---

### `code-reviewer`
**角色**：Code Reviewer
**觸發時機**：PR review、程式碼品質審核
**範例提示詞**：
- 「review 這段 C# 程式碼，重點是安全性和效能」
- 「這個 PR 有沒有問題？」

---

### `dba`
**角色**：資料庫管理師
**觸發時機**：Schema 設計、慢查詢優化、Migration 安全性
**範例提示詞**：
- 「設計這個功能的 DB Schema，考慮索引策略」
- 「這個查詢為什麼慢？幫我優化」
- 「這個 migration 安全嗎？有沒有 lock table 風險？」

---

### `fullstack-dev`
**角色**：全端工程師
**觸發時機**：跨前後端的功能開發
**範例提示詞**：
- 「實作訂單清單：API + React 頁面一起做」
- 「幫我設計 API contract 然後前後端同步實作」

---

### `pm`
**角色**：產品經理
**觸發時機**：需求分析、PRD 撰寫、功能優先排序
**範例提示詞**：
- 「幫我寫這個功能的 PRD」
- 「這個 backlog 怎麼排優先順序？」
- 「定義這個功能的成功指標」

---

### `sa`
**角色**：系統架構師
**觸發時機**：高階架構設計、服務拆分、ADR
**範例提示詞**：
- 「這個系統該用 monolith 還是 microservices？幫我分析」
- 「幫我把這個決策寫成 ADR」
- 「設計支援 10 萬 DAU 的系統架構」

---

### `security`
**角色**：資安工程師
**觸發時機**：威脅建模、OWASP 審核、安全設計
**範例提示詞**：
- 「review 這個 auth 模組的 OWASP Top 10 合規」
- 「幫我做這個系統的威脅建模」
- 「這個 API 有沒有 injection 風險？」

</details>

<details>
<summary>## 框架維護類</summary>

### `skill-creator`
**平台**：三平台通用
**觸發時機**：建立新 Skill 或更新現有 Skill
**範例提示詞**：
- 「幫我建立一個 data-pipeline Skill」
- 「更新 memory-capture 的觸發條件」

> 建立後記得執行 Skill Synchronization（同步到三平台）。

</details>
