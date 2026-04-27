# ADR-001 採用 SDLC 生命週期資料夾結構

> **Status**: Accepted
> **Date**: 2026-04-27
> **Author**: Anson

---

## 目錄

- [背景](#背景)
- [決策](#決策)
- [後果](#後果)
- [替代方案](#替代方案)

---

<details>
<summary>## 背景</summary>

PersonalWorkFlow 框架同時支援四種不同專案模板：

- `_template-dotnet` — ASP.NET Core + EF Core
- `_template-dotnet-spa` — ASP.NET Core + React SPA
- `_template-winforms` — Windows Forms 桌面應用
- `_template-ai` — Python AI/ML 專案
- `_template-webforms` — ASP.NET WebForms（舊系統維護用）
- `_template` — 通用 Python 腳本

各模板涵蓋的技術棧差異很大（.NET vs Python、前端 vs 純後端、新版 vs 舊系統），但需要統一的資料夾慣例讓 AI 助手（Copilot、Claude）能夠可靠地定位文件。

### 問題

若各模板各自採用框架預設慣例（例如 dotnet 用 `Controllers/Views/Models/`，Python 用 `app/`），AI 在協助跨模板作業時需要重新學習每套規則，且 Spec 文件（API 合約、資料 Schema）與實作程式碼混在一起，造成：

1. AI 不知道去哪裡找規格（先看哪個目錄？）
2. 測試與來源混在同一個命名空間
3. 架構決策散落各地，無從追蹤

</details>

<details>
<summary>## 決策</summary>

**採用四層生命週期資料夾結構，所有模板強制對齊：**

```
<專案根目錄>/
├── specs/    ← DEFINE / DESIGN：API 合約、行為定義、資料 Schema
├── src/      ← IMPLEMENTATION：原始碼與腳本
├── tests/    ← VERIFICATION：單元 / 整合 / E2E 測試
└── docs/     ← RELEASE：ADR、架構圖、設計決策
```

### 對應關係

| SDLC 階段 | 目錄 | 放什麼內容 |
|---|---|---|
| DEFINE | `specs/` | OpenAPI YAML、JSON Schema、功能規格書 |
| DESIGN | `specs/` | 系統設計文件（放 specs，因為設計即規格） |
| IMPLEMENTATION | `src/` | 應用程式本體 |
| VERIFICATION | `tests/` | 所有層次的測試 |
| RELEASE | `docs/` | ADR、架構圖、決策記錄、發布說明 |

### 各模板的 src/ 內部結構

技術棧不同，`src/` 內部可自由調整（如 `MyApp.Web/`, `MyApp.Api/`），但 `specs/tests/docs/` 三個目錄在所有模板中必須存在。

### AI 指令整合

`.github/copilot-instructions.md` 第一節明確說明此結構，讓 Copilot 在執行任務前先載入對應的 `specs/` 文件（Mandatory Spec Loading 規則）。

</details>

<details>
<summary>## 後果</summary>

### 正向影響

- **AI 可靠定位**：AI 助手一律先讀 `specs/`，再看 `src/`，不需逐專案教學
- **跨模板一致性**：新接手成員與 AI 都適用同套心智模型
- **Spec-driven 開發**：規格先於程式碼存在，促成 contract-first 設計習慣
- **Change Summary 可追蹤**：每次實作完成可明確引用 `specs/<file>` 驗證

### 負向影響 / 限制

- **舊版框架預設目錄遷移成本**：WebForms 舊模板若要嚴格對齊，需移動現有測試
- **`specs/` 在小型腳本中常為空目錄**：`_template` 通用腳本類專案 specs 往往只有 README
- **不強制 src/ 內部結構**：各模板的 `src/` 子目錄仍為平台慣例，未統一（trade-off：避免過度規範）

</details>

<details>
<summary>## 替代方案</summary>

### A. 功能導向結構（Feature-Based）

```
features/
├── auth/
│   ├── spec.md
│   ├── src/
│   └── tests/
└── billing/
    └── ...
```

**為何不採用**：適合大型單一儲存庫，但跨 Skill / AI 觸發時難以快速定位「哪裡是規格、哪裡是測試」，不符合 AI-first 快速定位需求。

### B. 平面結構（Flat）

```
api.yaml
main.py
test_main.py
```

**為何不採用**：規模超過 10 個檔案後立刻失控；AI 無法區分規格文件與實作文件。

### C. 框架預設結構（Convention Only）

各用各的（dotnet: `Controllers/Models/Views`，Python: `app/`）

**為何不採用**：喪失跨模板的心智一致性，AI 跨模板作業時需重新學習各套規則。

</details>
