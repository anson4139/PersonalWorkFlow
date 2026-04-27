# Quickstart — 5 分鐘上手 PersonalWorkFlow

> 目標讀者：初次使用這個框架的開發者。
> 完成後你將能用 AI 輔助開發任何新專案。

---

## 前置需求

| 工具 | 版本 | 用途 |
|---|---|---|
| VS Code | 最新版 | 主要 IDE |
| GitHub Copilot 擴充套件 | 最新版 | AI 自動載入規則 |
| .NET SDK | 9.x | 若要用 .NET template |
| Python | 3.12+ | 若要用 Python template |
| Node.js | 20+ | 若要用 SPA template |
| PowerShell | 7+ | 健康檢查腳本 |

---

<details>
<summary>## 步驟一：取得框架</summary>

```powershell
# Clone 到本機
git clone <repo-url> D:\MyWorkflow
cd D:\MyWorkflow
```

或直接複製整個 `PersonalWorkFlow` 資料夾到你要放的位置。

> **捷徑**：取得後可直接執行 `setup.ps1`，一鍵完成下方步驟二到四：
> ```powershell
> .\setup.ps1
> ```

</details>

<details>
<summary>## 步驟二：設定環境憑證</summary>

```powershell
# 複製模板
Copy-Item .env.example .env
```

用文字編輯器開啟 `.env`，填入你的 API Key（OpenAI、Anthropic 等）：

```ini
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

> `.env` 已在 `.gitignore`，不會被 commit 出去。

</details>

<details>
<summary>## 步驟三：用 VS Code 開啟</summary>

```powershell
code D:\MyWorkflow
```

GitHub Copilot 會**自動**讀取 `.github/copilot-instructions.md`，套用框架規則。
你不需要任何額外設定。

**確認載入**：在 VS Code 對 Copilot 說：
> 「你知道這個專案有哪些 AI 規則嗎？」

Copilot 應該能描述 SDLC 目錄結構和 Engineering Standards。

</details>

<details>
<summary>## 步驟四：驗證框架完整性</summary>

```powershell
cd D:\MyWorkflow
.\.github\scripts\health-check.ps1
```

預期輸出結尾：
```
  All 52 checks passed.
```

若有 `[MISS]`，代表該檔案遺失，需重新補齊。

</details>

<details>
<summary>## 步驟五：建立第一個專案</summary>

**選擇適合的 template：**

| 你要做什麼 | 選用 template |
|---|---|
| Python 腳本 / 工具 | `_template` |
| ASP.NET Core 網站 | `_template-dotnet` |
| React + .NET API | `_template-dotnet-spa` |
| WinForms 桌面應用 | `_template-winforms` |
| 舊 WebForms 系統 | `_template-webforms` |
| AI Agent / LLM 整合 | `_template-ai` |

```powershell
# 以 dotnet 為例
Copy-Item -Recurse projects\_template-dotnet projects\my-project

# 開啟專案
code projects\my-project
```

對 Copilot 下第一個指令：
> 「我要開始開發用戶管理功能，請先讀規格，告訴我需要建立哪些檔案。」

AI 會先讀 `specs/`，列出需要建立的檔案，才開始動工。

詳細步驟見 [new-project-sop.md](new-project-sop.md)。

</details>

---

## 常見問題

**Q：Copilot 沒有套用框架規則？**
確認 VS Code 是從 `PersonalWorkFlow` 根目錄開啟（不是從 `projects/xxx/` 開啟）。
根目錄的 `.github/copilot-instructions.md` 才會被自動讀取。

**Q：想在子專案覆蓋規則？**
在 `projects/<name>/.github/copilot-instructions.md` 建立自己的規則，會覆蓋根目錄規則。

**Q：health-check 有 MISS 怎麼辦？**
看 MISS 的路徑，從對應的 template 複製過來，或重新建立該檔案。
