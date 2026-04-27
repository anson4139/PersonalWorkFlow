# Framework Overview — PersonalWorkFlow 架構全覽

> 版本：v2.0 | 更新：2026-04-27
> 適合：想了解框架整體設計的開發者或維護者。

---

## 設計目標

讓同一套規範、Skill 庫、和 Template 能在三個 AI 平台上無縫運作，不論用哪個 AI 工具，行為都一致：

1. **統一規則**：所有 AI 都遵守相同的 SDLC 流程與 Engineering Standards
2. **可攜性**：整個框架只是一個資料夾，複製到任何機器都能立即使用
3. **漸進式導入**：舊專案只需加一個 `.github/copilot-instructions.md`，不需改動原有程式碼

---

<details>
<summary>## 三平台架構圖</summary>

```
┌─────────────────────────────────────────────────────────────┐
│                    PersonalWorkFlow/                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  共用核心（三平台皆讀）                               │   │
│  │                                                     │   │
│  │  .github/copilot-instructions.md  ← 主規則檔        │   │
│  │  .editorconfig                    ← 格式規範         │   │
│  │  docs/knowledge/memory/facts.yaml ← 長期記憶         │   │
│  │  projects/<name>/specs/           ← 各專案規格       │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│            ┌──────────────┼──────────────┐                  │
│            ▼              ▼              ▼                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ .github/     │ │ .agent/      │ │ .claude/     │        │
│  │ skills/      │ │ skills/      │ │ skills/      │        │
│  │              │ │              │ │              │        │
│  │ GitHub       │ │ Claude for   │ │ Claude Code  │        │
│  │ Copilot      │ │ Work         │ │              │        │
│  │ 21 Skills    │ │ 29 Skills    │ │ 19 Skills    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 平台差異

| 功能 | GitHub Copilot | Claude for Work | Claude Code |
|---|:---:|:---:|:---:|
| 自動讀 copilot-instructions | ✅ | 手動注入 | 透過 CLAUDE.md |
| 通用 Skill（21 個） | ✅ | ✅ | ✅ |
| 工程 Agent 角色（10 個） | — | ✅ | — |
| 即時 IDE 整合 | ✅ | — | ✅ |
| 長對話記憶 | — | ✅ | — |

</details>

<details>
<summary>## SDLC 流程（每個專案）</summary>

每個 `projects/<name>/` 都遵循相同的四段 SDLC：

```
DEFINE          IMPLEMENT        VERIFY           RELEASE
   │                │               │                │
specs/          src/            tests/           docs/
   │                │               │                │
API contract    程式碼          unit tests       ADR
Data schema     資料庫          integration      架構圖
行為規格         UI              e2e              CHANGELOG
```

**AI 的強制流程**（由 copilot-instructions 定義）：

```
1. 讀 copilot-instructions.md
2. 讀 specs/ 相關規格
3. 動工實作
4. 輸出 Change Summary：
   - Spec reference
   - [PASS/FAIL] tests/...
   - [DOCS] CHANGELOG / ADR 更新
```

</details>

<details>
<summary>## Skill 架構</summary>

### 三層設計

```
.github/skills/   (21)  ← 通用 Skill，Copilot 在 VS Code 中可直接觸發
.agent/skills/    (29)  ← 通用 + 10 個工程 Agent 角色
.claude/skills/   (19)  ← 通用 Skill（目前不含 Agent 角色）
```

### 通用 Skill 分類

```
開發工具       frontend-design, webapp-testing, mcp-builder, web-artifacts-builder
文件與報告     doc-coauthoring, docx, pptx, pdf, xlsx, internal-comms
視覺設計       canvas-design, algorithmic-art, theme-factory, brand-guidelines
記憶系統       memory-capture, memory-recall
知識回答       grounded-answer
維護中         skill-creator, slack-gif-creator
```

### 工程 Agent（.agent 專屬）

```
ai-engineer      AI/ML 整合、RAG、evals
cloud-devops     IaC、CI/CD、SLO
code-reviewer    PR review、安全/效能
dba              Schema、慢查詢、migration
decision-advisor Munger/Graham/Jobs 決策視角
fullstack-dev    前後端全端
pm               產品、PRD、路線圖
project-rules    強制 SDLC 規範
sa               系統架構、DDD、ADR
security         OWASP、威脅建模
```

</details>

<details>
<summary>## 專案 Template 架構</summary>

```
projects/
├── _template/                ← Python 基礎
│   ├── specs/{api,behavior,schema}/
│   ├── src/
│   ├── tests/{unit,int,e2e}/
│   ├── docs/
│   ├── ruff.toml
│   └── CHANGELOG.md
│
├── _template-dotnet/         ← ASP.NET Core MVC + EF Core
│   ├── src/
│   │   ├── MyApp.Web/        ← Controller, View, wwwroot
│   │   └── MyApp.Infrastructure/  ← AppDbContext, Migrations/
│   ├── tests/
│   ├── infra/main.bicep      ← Azure Bicep
│   ├── global.json           ← .NET SDK 版本鎖
│   └── MyApp.sln
│
├── _template-dotnet-spa/     ← .NET API + React/Vite
│   ├── src/
│   │   ├── MyApp.Api/        ← REST API
│   │   └── MyApp.Client/     ← React + TypeScript + ESLint
│   └── infra/
│
├── _template-winforms/       ← .NET 9 WinForms
├── _template-webforms/       ← .NET Framework 4.8
│   └── src/MyApp/Site.Master ← Bootstrap 基礎 Layout
│
└── _template-ai/             ← Python AI Agent
    ├── specs/ai/
    │   ├── model-config.yaml ← 鎖定 provider/model/temperature
    │   ├── prompts.yaml      ← 版本化 prompt 模板
    │   └── eval-criteria.yaml ← 能力門檻（正確率/幻覺率/延遲）
    ├── src/
    │   ├── agent.py
    │   ├── config.py
    │   └── main.py
    └── evals/
        ├── run_evals.py
        └── dataset.jsonl
```

**每個 template 都內建**：
- `.github/copilot-instructions.md`（自給自足，不依賴父目錄）
- `.gitignore`
- `.env.example`
- `CHANGELOG.md`
- `CLAUDE.md`（Claude Code 入口）

</details>

<details>
<summary>## 記憶系統架構</summary>

```
docs/knowledge/memory/facts.yaml   ← 主記憶庫
        │
        │  由 memory-capture skill 寫入
        │  由 memory-recall skill 讀取
        │
        ├── Schema v2 欄位
        │   ├── id          FACT-YYYYMMDD-SEQ
        │   ├── category    architecture/decision/pattern/constraint/workflow/env
        │   ├── project     _global 或 projects/<name>（作用域隔離）
        │   ├── claim       一句話的確認事實
        │   ├── confidence  low/medium/high
        │   ├── created     建立日期
        │   ├── expires     TTL（null = 永不過期）
        │   └── deprecated  廢棄標記（不刪除，設 true）
        │
        └── 讀取過濾規則
            project IN (_global, projects/<current>)
            AND deprecated == false
            AND (expires == null OR expires > today)
```

</details>

<details>
<summary>## Engineering Standards 摘要</summary>

完整規則定義於 [.github/copilot-instructions.md](../.github/copilot-instructions.md)。

| 標準 | 規則 |
|---|---|
| 編碼 | 強制 UTF-8，Python 必加 `sys.stdout.reconfigure(encoding='utf-8')` |
| 縮排 | `.editorconfig` 定義：C#/Python = 4 空格，JS/TS/JSON/YAML = 2 空格 |
| 格式 | `format on save`，VS Code 各語言指定 formatter |
| Secrets | 禁止 hardcode，走 `.env` + `dotenv` |
| Commit | Conventional Commits：`feat(scope): desc` |
| Markdown | 多章節用 `<details>` 折疊 |
| Documentation | feat/fix 更新 CHANGELOG；架構決策建 ADR |
| 安全 | OWASP Top 10 合規，`security` skill 輔助審核 |

</details>
