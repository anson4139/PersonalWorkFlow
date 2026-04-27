# PersonalWorkFlow

一套可攜式 AI 協作工作流框架，統一 GitHub Copilot、Claude Code、Claude for Work 三個平台的 Skill 庫與開發規範，讓任何專案都能在同一套標準下高效運作。

> **版本**：v2.0 | **更新**：2026-04-27

---

## 快速開始

```powershell
# 取得框架
git clone https://github.com/anson4139/PersonalWorkFlow.git D:\MyWorkflow
cd D:\MyWorkflow

# 一鍵初始化：建 conda 環境 + 複製 .env + 健康檢查 + 開啟 VS Code
.\setup.ps1
```

建立第一個專案：

```powershell
# 選一個 template 複製過去
Copy-Item -Recurse projects\_template-dotnet projects\my-project
code projects\my-project
```

完整步驟見 [quickstart.md](docs/guides/quickstart.md)　｜　新增專案 SOP 見 [new-project-sop.md](docs/guides/new-project-sop.md)

---

## 框架結構

```
PersonalWorkFlow/
├── setup.ps1                     一鍵初始化腳本（移植新機器用）
├── environment.yml               Python conda 環境定義（可重現）
├── .env.example                  憑證模板（複製為 .env 填入）
├── CHANGELOG.md                  框架版本記錄
├── .editorconfig                 縮排 / 換行 / 編碼（全語言）
├── .gitignore
├── .github/
│   ├── copilot-instructions.md   AI 規則，自動注入 GitHub Copilot
│   ├── pull_request_template.md
│   ├── scripts/health-check.ps1  框架健康檢查（52 項）
│   ├── skills/                   Copilot Skill 庫（19 個）
│   └── workflows/                CI/CD 範本（dotnet / spa / python）
├── .agent/skills/                Claude for Work Skill 庫（29 個）
├── .claude/skills/               Claude Code Skill 庫（19 個）
├── .vscode/
│   ├── settings.json             formatOnSave / formatter 設定
│   └── extensions.json           建議擴充套件（clone 後自動提示）
├── docs/
│   ├── index.md                  文件總索引
│   ├── guides/                   quickstart / new-project-sop / skills-reference
│   ├── architecture/             framework-overview / skill-sync-design
│   ├── decisions/                ADR 架構決策紀錄
│   └── knowledge/memory/         長期記憶 facts.yaml
└── projects/
    ├── _template/                Python / 通用腳本
    ├── _template-dotnet/         ASP.NET Core MVC（含 EF Core）
    ├── _template-dotnet-spa/     .NET API + React/Vite
    ├── _template-winforms/       WinForms 桌面（.NET 9）
    ├── _template-webforms/       WebForms 傳統（.NET Framework 4.8）
    └── _template-ai/             Python AI Agent（含 evals/）
```

---

## 專案 Template

| Template | 適用場景 | 技術 |
|---|---|---|
| [`_template`](projects/_template/) | Python 腳本 / 爬蟲 / 工具 | Python 3.12, ruff |
| [`_template-dotnet`](projects/_template-dotnet/) | 網站後端 / MVC / REST API | .NET 9, EF Core, Swagger |
| [`_template-dotnet-spa`](projects/_template-dotnet-spa/) | 全端 Web 應用 | .NET 9 API + React 19/Vite |
| [`_template-winforms`](projects/_template-winforms/) | Windows 桌面應用 | .NET 9 WinForms |
| [`_template-webforms`](projects/_template-webforms/) | 傳統 ASP.NET 維護 | .NET Framework 4.8 |
| [`_template-ai`](projects/_template-ai/) | AI Agent / LLM 整合 | Python, OpenAI, evals |

各 template 均含：`specs/` 規格目錄、CI/CD workflow、`CHANGELOG.md`、AI 規則注入。

---

## AI Skills

### 通用 Skill（Copilot / Claude Code / Claude for Work 三平台同步）

| Skill | 觸發時機 |
|---|---|
| `doc-coauthoring` | 寫文件 / 提案 / 規格書 |
| `docx` / `pptx` / `pdf` / `xlsx` | 操作 Office / PDF 檔案 |
| `frontend-design` | 設計 Web UI / 元件 |
| `canvas-design` / `algorithmic-art` | 視覺設計 / 生成藝術 |
| `theme-factory` | 套用 UI 主題 |
| `web-artifacts-builder` | 多元件 HTML artifact |
| `webapp-testing` | Playwright 網頁測試 |
| `mcp-builder` | 建立 MCP Server |
| `memory-capture` / `memory-recall` | 長期記憶寫入 / 讀取 |
| `grounded-answer` | 嚴格引用格式回答 |
| `internal-comms` | 內部溝通文件 |
| `brand-guidelines` | 品牌視覺規範 |
| `skill-creator` | 建立新 Skill |
| `slack-gif-creator` | Slack 動畫 GIF |

### 工程 Agent（Claude for Work 專屬）

| Skill | 角色 |
|---|---|
| `ai-engineer` | AI/ML 整合、RAG、MLOps |
| `cloud-devops` | IaC、CI/CD、容器、SLO |
| `code-reviewer` | PR review、安全/效能 |
| `dba` | Schema 設計、慢查詢優化 |
| `fullstack-dev` | 前後端全端開發 |
| `pm` | 產品週期、PRD、路線圖 |
| `sa` | 系統架構、DDD、ADR |
| `security` | OWASP、威脅建模 |

### 決策思維框架（Claude for Work — `decision-advisor`）

面對重要決策時，呼叫三位思想家的心智模型：

| 觸發詞 | 思想家 | 核心工具 |
|---|---|---|
| `芒格` / `逆向思考` / `認知偏誤` | Charlie Munger | 逆向推演、激勵結構分析、能力圈邊界 |
| `創業視角` / `PG view` | Paul Graham | 第一性原則、先做不可擴展的事、Default alive/dead |
| `產品直覺` / `Jobs view` | Steve Jobs | 從使用者體驗反推技術、極致聚焦、砍掉什麼 |
| （不加觸發詞）| 三者合璧 | 自動掃描三個視角、找交集訊號、給出建議 |

```
「我在考慮要不要加這個功能，給我逆向思考」
「這個架構決策，Jobs view 怎麼看？」
「我該選 A 還是 B？」  ← 自動三視角合璧
```

> 所有 Skill 完整說明與範例提示詞見 [skills-reference.md](docs/guides/skills-reference.md)

---

## 框架規範

定義於 [.github/copilot-instructions.md](.github/copilot-instructions.md)，對所有專案自動生效：

| 規範 | 說明 |
|---|---|
| **SDLC 目錄** | `specs/` → `src/` → `tests/` → `docs/` |
| **AI 先讀規格** | 動工前必讀 `specs/` 與 `copilot-instructions.md` |
| **Change Summary** | 每次完工輸出 `[PASS/FAIL] tests/...` 驗證結果 |
| **Documentation Sync** | feat/fix → 更新 CHANGELOG；架構決策 → 建 ADR |
| **Conventional Commits** | `feat(scope): description` |
| **UTF-8** | 所有檔案強制 UTF-8 |
| **No secrets** | 禁止 hardcode，統一走 `.env` + `dotenv` |

---

## 文件索引

| 類型 | 文件 |
|---|---|
| 快速入門 | [quickstart.md](docs/guides/quickstart.md) |
| 新增專案 SOP | [new-project-sop.md](docs/guides/new-project-sop.md) |
| Skill 完整參考 | [skills-reference.md](docs/guides/skills-reference.md) |
| 架構總覽 | [framework-overview.md](docs/architecture/framework-overview.md) |
| Skill 同步設計 | [skill-sync-design.md](docs/architecture/skill-sync-design.md) |
| 所有文件導覽 | [docs/index.md](docs/index.md) |


---

## 框架結構

```
PersonalWorkFlow/
├── .editorconfig                 縮排 / 換行 / 編碼規則（全語言）
├── .gitignore                    Python / .NET / Node / OS 忽略規則
├── .env.example                  憑證模板（複製為 .env 填入後使用）
├── environment.yml               Python conda 環境定義（可重現）
├── setup.ps1                     一鍵初始化腳本（移植新機器用）
├── CHANGELOG.md                  框架版本記錄
├── .github/
│   ├── copilot-instructions.md   通用規則，自動注入 GitHub Copilot
│   ├── pull_request_template.md  PR 開啟時自動填入
│   ├── scripts/
│   │   └── health-check.ps1      框架健康檢查（52 項）
│   ├── skills/                   GitHub Copilot Skill 庫（19 個）
│   └── workflows/                CI/CD 範本（dotnet / spa / python）
├── .agent/
│   └── skills/                   Claude for Work Skill 庫（29 個）
├── .claude/
│   └── skills/                   Claude Code Skill 庫（19 個）
├── .vscode/
│   ├── settings.json             formatOnSave / formatter / ruler 設定
│   └── extensions.json           建議擴充套件清單（clone 後自動提示）
├── docs/
│   ├── index.md                  文件總索引
│   ├── guides/                   操作指南
│   ├── architecture/             系統設計文件
│   ├── decisions/                ADR 架構決策紀錄
│   └── knowledge/memory/         長期記憶 facts.yaml
└── projects/
    ├── _template/                Python / 通用腳本
    ├── _template-dotnet/         ASP.NET Core MVC（含 EF Core）
    ├── _template-dotnet-spa/     .NET API + React/Vite
    ├── _template-winforms/       WinForms 桌面（.NET 9）
    ├── _template-webforms/       WebForms 傳統（.NET Framework 4.8）
    └── _template-ai/             Python AI Agent（含 evals/）
```

---

## 專案 Template 一覽

| Template | 適用場景 | 技術 |
|---|---|---|
| [`_template`](projects/_template/) | Python 腳本 / 爬蟲 / 工具 | Python 3.12, ruff |
| [`_template-dotnet`](projects/_template-dotnet/) | 網站後端 / MVC / REST API | .NET 9, EF Core, Swagger |
| [`_template-dotnet-spa`](projects/_template-dotnet-spa/) | 全端 Web 應用 | .NET 9 API + React 19/Vite |
| [`_template-winforms`](projects/_template-winforms/) | Windows 桌面應用 | .NET 9 WinForms |
| [`_template-webforms`](projects/_template-webforms/) | 傳統 ASP.NET 維護 | .NET Framework 4.8 |
| [`_template-ai`](projects/_template-ai/) | AI Agent / LLM 整合 | Python, OpenAI, evals |

---

## Skill 一覽

### 通用 Skill（三平台同步）

| Skill | 觸發時機 |
|---|---|
| `doc-coauthoring` | 寫文件 / 提案 / 規格書 |
| `docx` / `pptx` / `pdf` / `xlsx` | 操作 Office / PDF 檔案 |
| `frontend-design` | 設計 Web UI / 元件 |
| `canvas-design` / `algorithmic-art` | 視覺設計 / 生成藝術 |
| `theme-factory` | 套用 UI 主題 |
| `web-artifacts-builder` | 多元件 HTML artifact |
| `webapp-testing` | Playwright 網頁測試 |
| `mcp-builder` | 建立 MCP Server |
| `memory-capture` | 將事實寫入長期記憶 |
| `memory-recall` | 任務前先讀取記憶 |
| `grounded-answer` | 嚴格引用格式回答 |
| `internal-comms` | 內部溝通文件 |
| `brand-guidelines` | 品牌視覺規範 |
| `skill-creator` | 建立新 Skill |
| `slack-gif-creator` | Slack 動畫 GIF |

### Claude for Work 專屬 Agent（`.agent/skills/`）

| Skill | 角色 |
|---|---|
| `ai-engineer` | AI/ML 整合、RAG、MLOps |
| `cloud-devops` | IaC、CI/CD、容器、SLO |
| `code-reviewer` | PR review、安全/效能 |
| `dba` | Schema 設計、慢查詢優化 |
| `decision-advisor` | **決策思維框架**（見下方） |
| `fullstack-dev` | 前後端全端開發 |
| `pm` | 產品週期、PRD、路線圖 |
| `sa` | 系統架構、DDD、ADR |
| `security` | OWASP、威脅建模 |

#### `decision-advisor` — 三位思想家決策框架

面對重要決策時，呼叫三種截然不同的心智模型：

| 觸發詞 | 思想家 | 核心工具 |
|---|---|---|
| `芒格` / `逆向思考` / `認知偏誤` | Charlie Munger | 逆向推演、激勵結構分析、能力圈邊界 |
| `創業視角` / `PG view` | Paul Graham | 第一性原則、先做不可擴展的事、Default alive/dead |
| `產品直覺` / `Jobs view` | Steve Jobs | 從使用者體驗反推技術、極致聚焦、砍掉什麼 |
| （不加觸發詞）| 三者合璧 | 自動掃描三個視角、找交集訊號、說明分歧、給建議 |

使用範例：
```
「我在考慮要不要加這個功能，給我逆向思考」
「這個架構決策，Jobs view 怎麼看？」
「我該選 A 還是 B？」  ← 自動三視角合璧
```

> 完整說明見 [skills-reference.md](docs/guides/skills-reference.md)

---

## 快速開始

```powershell
# 取得框架
git clone <repo-url> D:\MyWorkflow
cd D:\MyWorkflow

# 一鍵完成：環境建立 + health-check + 開啟 VS Code
.\setup.ps1
```

> `setup.ps1` 會自動：建立 conda 環境、複製 `.env.example`、跑 52 項健康檢查、開啟 VS Code。

完成後建立第一個專案：

```powershell
Copy-Item -Recurse projects\_template-dotnet projects\my-project
```

詳細步驟見 [quickstart.md](docs/guides/quickstart.md)

---

## 框架規範

框架強制執行的開發規範（定義於 [.github/copilot-instructions.md](.github/copilot-instructions.md)）：

- **SDLC 目錄結構**：`specs/` → `src/` → `tests/` → `docs/`
- **AI 先讀規格**：動工前必讀 `specs/` 和 `copilot-instructions.md`
- **Change Summary**：每次完工輸出 `[PASS/FAIL] tests/...` 格式
- **Documentation Sync**：feat/fix 自動提示更新 CHANGELOG；架構決策建 ADR
- **Conventional Commits**：`feat(scope): description` 格式
- **UTF-8**：所有檔案強制 UTF-8
- **No secrets**：禁止 hardcode，走 `.env` + `dotenv`

