# 新專案 SOP — 從 Template 到真實專案

> 目標讀者：要開始一個新專案的開發者。
> 完成後你將擁有一個符合框架規範、可立即開發的專案骨架。

---

## 總覽流程

```
選 template → 複製 → 重命名 → 設定 DB / env → 設定 CI → 第一個 commit
```

---

<details>
<summary>## 1. 選擇 Template</summary>

| 你的系統 | Template | 核心技術 |
|---|---|---|
| Python 腳本 / 爬蟲 / 工具 | `_template` | Python 3.12, ruff |
| ASP.NET Core 網站 / API | `_template-dotnet` | .NET 9, EF Core, MVC, Swagger |
| React SPA + .NET API | `_template-dotnet-spa` | .NET 9 API, React 19, Vite, TypeScript |
| WinForms 桌面應用 | `_template-winforms` | .NET 9 WinForms |
| 維護舊 ASP.NET WebForms | `_template-webforms` | .NET Framework 4.8 |
| AI Agent / LLM 整合 | `_template-ai` | Python, OpenAI SDK, evals |

**舊專案接入（不用 template）**：直接跳到[第 5 節](#5-舊專案接入框架)。

</details>

<details>
<summary>## 2. 複製 Template</summary>

```powershell
cd D:\MyWorkflow

# 以 dotnet 為例，替換 my-project 為你的專案名
Copy-Item -Recurse projects\_template-dotnet projects\my-project
```

複製後結構：
```
projects\my-project\
├── .github\copilot-instructions.md   ← AI 規則（已自給自足）
├── .gitignore
├── .env.example
├── global.json                        ← .NET SDK 版本鎖定
├── CHANGELOG.md
├── MyApp.sln
├── specs\                             ← 先在這裡寫規格
├── src\
│   ├── MyApp.Web\                     ← ASP.NET Core MVC
│   └── MyApp.Infrastructure\          ← EF Core + AppDbContext
├── tests\
└── infra\                             ← Azure Bicep 骨架
```

</details>

<details>
<summary>## 3. 重命名 Namespace</summary>

將 `MyApp` 替換為你的實際專案名稱（例如 `OrderSystem`）。

**需要修改的位置：**

```powershell
# 在 projects\my-project 目錄下操作

# 1. 重新命名 .sln
Rename-Item MyApp.sln OrderSystem.sln

# 2. 重新命名 csproj 目錄和檔案
Rename-Item src\MyApp.Web               src\OrderSystem.Web
Rename-Item src\MyApp.Web\MyApp.Web.csproj          OrderSystem.Web.csproj
Rename-Item src\MyApp.Infrastructure    src\OrderSystem.Infrastructure
Rename-Item src\MyApp.Infrastructure\MyApp.Infrastructure.csproj  OrderSystem.Infrastructure.csproj
```

**需要修改的檔案內容（全文搜尋取代 `MyApp` → `OrderSystem`）：**

| 檔案 | 修改欄位 |
|---|---|
| `OrderSystem.sln` | 所有 `MyApp` 路徑和 namespace |
| `*.csproj` | `<RootNamespace>` |
| `src/*/Program.cs` | `using MyApp.*` |
| `src/*/AppDbContext.cs` | namespace |

VS Code 快捷：`Ctrl+Shift+H` 全工作區取代。

**記得更換 GUID**（避免多個專案 ID 衝突）：

```powershell
# 產生新 GUID
[System.Guid]::NewGuid().ToString()
```

在 `.sln` 和 `MyApp.Web.csproj` 的 `<UserSecretsId>` 欄位貼上新 GUID。

</details>

<details>
<summary>## 4. 設定環境與資料庫</summary>

### 4.1 環境變數

```powershell
Copy-Item .env.example .env
```

編輯 `.env`：

```ini
# 資料庫（SQL Server 範例）
ConnectionStrings__Default=Server=localhost;Database=OrderSystem;User Id=sa;Password=YourPassword;

# JWT
Jwt__Secret=your-32-char-minimum-secret-key
Jwt__Issuer=OrderSystem
Jwt__Audience=OrderSystem
```

### 4.2 EF Core 資料庫初始化

```powershell
# 在專案根目錄執行
dotnet tool install --global dotnet-ef

# 建立第一個 Migration
dotnet ef migrations add InitialCreate `
  --project src\OrderSystem.Infrastructure `
  --startup-project src\OrderSystem.Web

# 套用到資料庫
dotnet ef database update `
  --project src\OrderSystem.Infrastructure `
  --startup-project src\OrderSystem.Web
```

### 4.3 新增 Entity（DbSet）

1. 在 `src/OrderSystem.Infrastructure/` 建立 Entity 類別
2. 在 `AppDbContext.cs` 加入 `DbSet<YourEntity>`
3. 執行 `dotnet ef migrations add AddYourEntity ...`

</details>

<details>
<summary>## 5. 設定 CI/CD（選用）</summary>

複製 CI 範本到你的 GitHub repo 的 workflows：

```powershell
# dotnet 專案
Copy-Item .github\workflows\_template-dotnet-ci.yml `
          projects\my-project\.github\workflows\ci.yml

# 編輯 ci.yml，確認路徑與你的 .sln 名稱一致
```

**必要修正**（在 `ci.yml` 中）：

```yaml
# 改為你的 .sln 名稱
run: dotnet build OrderSystem.sln
```

</details>

<details>
<summary>## 5. 舊專案接入框架</summary>

**最小侵入方式**：只加 AI 規則，不動 `.sln` 或 `.csproj`。

```powershell
# 在舊專案根目錄建立 .github 資料夾
New-Item -ItemType Directory -Path your-old-project\.github -Force

# 複製最接近的 template 規則
Copy-Item projects\_template-dotnet\.github\copilot-instructions.md `
          your-old-project\.github\copilot-instructions.md
```

然後編輯 `copilot-instructions.md`，在開頭加上專案特有資訊：

```markdown
# 注意：此為 .NET Framework 4.7 舊系統
# 不可使用 async/await Stream API（.NET 4.6 以下不支援）
# 使用 Web.config 而非 appsettings.json
```

**多 .NET 版本並存**：用 `<TargetFramework>` 管理，不需改框架。

| 情境 | csproj 設定 |
|---|---|
| .NET 9 | `<TargetFramework>net9.0</TargetFramework>` |
| .NET Framework 4.8 | `<TargetFramework>net48</TargetFramework>` |
| 多目標（函式庫） | `<TargetFrameworks>net9.0;net48</TargetFrameworks>` |

</details>

<details>
<summary>## 6. 第一個 Commit</summary>

```powershell
cd projects\my-project
git init
git add .
git commit -m "chore(init): bootstrap from _template-dotnet"
```

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat(order): add order creation API
fix(auth): handle expired JWT token
chore(deps): update EF Core to 9.0.1
docs(adr): record decision to use SQL Server
```

</details>

<details>
<summary>## 7. 開始用 AI 開發</summary>

確認 VS Code 是從 **框架根目錄**（`D:\MyWorkflow`）開啟，不是從子專案開啟。

**第一個 AI 指令範例**：

> 「我在 `projects/my-project`，要實作訂單新增功能。請先讀 specs/ 和 copilot-instructions，告訴我需要建立哪些檔案和類別。」

**AI 的標準行為**：
1. 讀 `.github/copilot-instructions.md`（自動）
2. 讀 `specs/` 底下相關規格
3. 說明要建立的檔案清單，確認後才動工
4. 完工輸出 Change Summary（含 `[PASS/FAIL]` 和 CHANGELOG 更新）

**常用 Skill 觸發語**：

| 需求 | 說法 |
|---|---|
| 設計 API 規格 | 「幫我設計訂單 API 的 spec，存在 specs/api/order.yaml」|
| Review PR | 「review 這段程式碼，特別注意安全性」（觸發 `code-reviewer`）|
| 設計資料庫 | 「設計訂單的 Entity 和 DB Schema」（觸發 `dba`）|
| 部署到 Azure | 「設置 Bicep 把 API 部署到 Azure App Service」（觸發 `cloud-devops`）|
| 記錄決策 | 「把這個架構決策整理成 ADR」|

</details>
