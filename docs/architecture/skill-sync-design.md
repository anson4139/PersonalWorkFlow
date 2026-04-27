# Skill Sync Design — 跨平台 Skill 同步機制

> 版本：v2.0 | 更新：2026-04-27
> 適合：要新增或更新 Skill 的維護者。

---

## 為什麼需要同步三個平台？

三個 AI 平台各自有獨立的 Skill 目錄：

| 平台 | Skill 目錄 | 自動讀取方式 |
|---|---|---|
| GitHub Copilot | `.github/skills/` | VS Code 擴充套件自動掃描 |
| Claude for Work | `.agent/skills/` | 對話中手動或 agent 設定觸發 |
| Claude Code | `.claude/skills/` | `CLAUDE.md` 或 slash command 觸發 |

若只在 `.github/skills/` 更新，Claude 就不知道新 Skill 的存在。因此每次新增或修改 Skill，**必須同步到三個目錄**。

---

<details>
<summary>## 三平台 Skill 現況</summary>

### 通用 Skill（19個）— 三平台完全同步

```
algorithmic-art    brand-guidelines   canvas-design      doc-coauthoring
docx               frontend-design    grounded-answer    internal-comms
mcp-builder        memory-capture     memory-recall      pdf
pptx               skill-creator      slack-gif-creator  theme-factory
web-artifacts-builder  webapp-testing  xlsx
```

### 僅存在 .github/skills/（Copilot 專屬）

```
codebase-search-rules   ← Anson thesis 搜尋規則（個人用途）
thesis-dev-execution    ← Anson thesis 執行規則（個人用途）
```

### 僅存在 .agent/skills/（Claude for Work 專屬 Agent）

```
ai-engineer    cloud-devops   code-reviewer  dba
decision-advisor  fullstack-dev  pm          project-rules
sa             security
```

這 10 個 Agent 因為需要長對話上下文，**僅在 Claude for Work 平台使用**，不同步到 Copilot。

</details>

<details>
<summary>## 新增 Skill 的標準流程</summary>

### 步驟一：決定 Skill 類型

**通用 Skill**（功能型）→ 同步到三平台
**Agent 角色**（需長對話）→ 只在 `.agent/skills/` 建立
**平台專屬**（個人用途）→ 只在目標平台建立

### 步驟二：建立 Skill 目錄

```powershell
# 以通用 Skill 為例（名稱：data-pipeline）
$skillName = "data-pipeline"

New-Item -ItemType Directory ".github\skills\$skillName"
New-Item -ItemType Directory ".agent\skills\$skillName"
New-Item -ItemType Directory ".claude\skills\$skillName"
```

### 步驟三：撰寫 SKILL.md

在 `.github/skills/<name>/SKILL.md` 建立主檔，使用標準模板：

```markdown
---
name: <skill-name>
description: |
  一句話說明：何時觸發這個 Skill。
  觸發條件：使用者說什麼關鍵字時載入。
---

# <Skill 標題>

## 觸發條件
...

## 流程步驟
...

## 輸出格式
...
```

> 使用 `skill-creator` Skill 輔助撰寫 SKILL.md 的結構與內容品質。

### 步驟四：同步到其他平台

```powershell
# 同步到 .agent 和 .claude
$src = ".github\skills\$skillName\SKILL.md"
Copy-Item $src ".agent\skills\$skillName\SKILL.md" -Force
Copy-Item $src ".claude\skills\$skillName\SKILL.md" -Force

Write-Host "Synced $skillName to all 3 platforms."
```

### 步驟五：驗證

```powershell
Test-Path ".github\skills\$skillName\SKILL.md"
Test-Path ".agent\skills\$skillName\SKILL.md"
Test-Path ".claude\skills\$skillName\SKILL.md"
```

### 步驟六：更新文件

1. 在 [README.md](../../README.md) 的 Skill 表格加入新 Skill
2. 在 [skills-reference.md](../guides/skills-reference.md) 加入觸發說明和範例提示詞
3. 在 [docs/index.md](../index.md) 不需改動（除非新增獨立說明文件）

</details>

<details>
<summary>## 更新現有 Skill 的流程</summary>

1. 修改 `.github/skills/<name>/SKILL.md`
2. 同步到其他平台：

```powershell
$skillName = "memory-capture"   # 換成要更新的 Skill 名稱
$src = ".github\skills\$skillName\SKILL.md"

Copy-Item $src ".agent\skills\$skillName\SKILL.md" -Force
Copy-Item $src ".claude\skills\$skillName\SKILL.md" -Force
Write-Host "Updated $skillName synced."
```

3. 驗證三平台都是最新版（可比對檔案修改時間）：

```powershell
Get-Item ".github\skills\$skillName\SKILL.md", `
         ".agent\skills\$skillName\SKILL.md", `
         ".claude\skills\$skillName\SKILL.md" |
  Select-Object FullName, LastWriteTime
```

</details>

<details>
<summary>## 批次同步腳本</summary>

若要把 `.github/skills/` 所有通用 Skill 重新同步到另外兩個平台：

```powershell
# 僅同步也存在於 .agent 和 .claude 中的 Skill（通用 Skill）
$commonSkills = Get-ChildItem ".github\skills" -Directory |
  Where-Object { (Test-Path ".agent\skills\$($_.Name)") -and
                 (Test-Path ".claude\skills\$($_.Name)") }

foreach ($skill in $commonSkills) {
    $name = $skill.Name
    $src = ".github\skills\$name\SKILL.md"
    if (Test-Path $src) {
        Copy-Item $src ".agent\skills\$name\SKILL.md" -Force
        Copy-Item $src ".claude\skills\$name\SKILL.md" -Force
        Write-Host "[SYNC] $name"
    }
}
Write-Host "Batch sync complete."
```

</details>

<details>
<summary>## 平台差異注意事項</summary>

| 注意項目 | 說明 |
|---|---|
| `.agent/skills/` 有 10 個 Agent 不存在於其他平台 | 這是刻意設計，不需要補 |
| `.github/skills/` 有 2 個個人專屬 Skill | `codebase-search-rules`、`thesis-dev-execution`，不需同步 |
| SKILL.md 格式必須有 YAML frontmatter | `---` 包圍的 `name` 和 `description` 欄位，各平台都需要 |
| description 是觸發關鍵 | AI 讀 description 決定是否觸發，寫得越精準越好 |

</details>
