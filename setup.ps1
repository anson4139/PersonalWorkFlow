#Requires -Version 7
<#
.SYNOPSIS
    PersonalWorkFlow -- 一鍵初始化腳本

.DESCRIPTION
    移植到新機器時執行此腳本，完成所有前置步驟：
      [1] 前置需求驗證（conda / git / dotnet / node）
      [2] .env 設定檔初始化
      [3] Python conda 環境建立 / 更新
      [4] Framework 完整性驗證（health-check.ps1）
      [5] 開啟 VS Code（可用 -SkipVSCode 跳過）

.USAGE
    cd D:\<path>\PersonalWorkFlow
    .\setup.ps1
    .\setup.ps1 -SkipVSCode

.NOTES
    完成後請讀 docs/guides/quickstart.md 了解框架架構。
    新增專案請讀 docs/guides/new-project-sop.md。
#>

param(
    [switch]$SkipVSCode
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Write-Step([int]$n, [string]$msg) {
    Write-Host ""
    Write-Host "  [$n] $msg" -ForegroundColor Cyan
}
function Write-OK([string]$msg) { Write-Host "      OK   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "      WARN $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) {
    Write-Host "      FAIL $msg" -ForegroundColor Red
    exit 1
}

# ─── 標題 ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ================================================" -ForegroundColor DarkGray
Write-Host "   PersonalWorkFlow -- Setup" -ForegroundColor White
Write-Host "  ================================================" -ForegroundColor DarkGray

# ─── [1] 前置需求 ─────────────────────────────────────────────────────────────
Write-Step 1 "前置需求驗證"

# conda（搜尋 PATH 或 miniconda 預設路徑）
$condaExe = (Get-Command conda -ErrorAction SilentlyContinue)?.Source
if (-not $condaExe) {
    $condaExe = "C:\Users\$env:USERNAME\miniconda3\Scripts\conda.exe"
}
if (Test-Path $condaExe) {
    Write-OK "conda found: $condaExe"
}
else {
    Write-Fail "conda not found. Install Miniconda: https://docs.conda.io/en/latest/miniconda.html"
}

# git（非必要但強烈建議）
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-OK "git $(git --version)"
}
else {
    Write-Warn "git not found -- version control disabled"
}

# dotnet（.NET template 用）
if (Get-Command dotnet -ErrorAction SilentlyContinue) {
    Write-OK ".NET SDK $(dotnet --version)"
}
else {
    Write-Warn ".NET SDK not found -- _template-dotnet / -spa / -winforms will not build"
}

# node（SPA template 用）
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-OK "Node.js $(node --version)"
}
else {
    Write-Warn "Node.js not found -- _template-dotnet-spa frontend will not build"
}

# ─── [2] .env 初始化 ──────────────────────────────────────────────────────────
Write-Step 2 ".env 設定檔初始化"

$envFile = Join-Path $root ".env"
$envExample = Join-Path $root ".env.example"

if (Test-Path $envFile) {
    Write-OK ".env 已存在，跳過（不覆蓋）"
}
else {
    Copy-Item $envExample $envFile
    Write-OK ".env 已由 .env.example 建立"
    Write-Warn "請開啟 .env 填入你的 API Key（OPENAI_API_KEY、ANTHROPIC_API_KEY 等）"
}

# ─── [3] Python 環境 ──────────────────────────────────────────────────────────
Write-Step 3 "Python conda 環境建立 / 更新"

$condaPrefix = Join-Path $root ".conda"
$envYml = Join-Path $root "environment.yml"

if (-not (Test-Path $envYml)) {
    Write-Fail "environment.yml not found at $envYml"
}

if (Test-Path (Join-Path $condaPrefix "python.exe")) {
    Write-Host "      .conda 已存在，執行 update --prune ..." -ForegroundColor DarkGray
    & $condaExe env update -f $envYml -p $condaPrefix --prune --quiet
    Write-OK "conda env updated"
}
else {
    Write-Host "      .conda 不存在，執行 create ..." -ForegroundColor DarkGray
    & $condaExe env create -f $envYml -p $condaPrefix --quiet
    Write-OK "conda env created at $condaPrefix"
}

# ─── [4] 健康檢查 ─────────────────────────────────────────────────────────────
Write-Step 4 "Framework 完整性驗證"

& (Join-Path $root ".github\scripts\health-check.ps1")

# ─── [5] VS Code ──────────────────────────────────────────────────────────────
if (-not $SkipVSCode) {
    Write-Step 5 "開啟 VS Code"
    if (Get-Command code -ErrorAction SilentlyContinue) {
        code $root
        Write-OK "VS Code 已啟動（首次開啟請按「安裝所有建議擴充套件」）"
    }
    else {
        Write-Warn "code 指令未找到，請手動開啟 VS Code"
    }
}

# ─── 完成 ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ================================================" -ForegroundColor DarkGray
Write-Host "   Setup 完成！" -ForegroundColor Green
Write-Host "  ================================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  下一步：" -ForegroundColor White
Write-Host "    1. 開啟 .env，填入你的 API Key"
Write-Host "    2. 讀 docs/guides/quickstart.md        -- 框架架構與 AI 使用方式"
Write-Host "    3. 讀 docs/guides/new-project-sop.md   -- 如何在框架中新增專案"
Write-Host ""
Write-Host "  快速新增專案（範例）：" -ForegroundColor White
Write-Host "    Copy-Item projects\_template-dotnet projects\MyNewProject -Recurse"
Write-Host "    # 然後在 new-project-sop.md 照步驟重新命名 namespace"
Write-Host ""
