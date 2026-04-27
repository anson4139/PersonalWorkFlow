<#
.SYNOPSIS
    PersonalWorkFlow framework health check.
    Verifies all critical files are present across templates and skill libraries.
.USAGE
    cd D:\Anson\PersonalWorkFlow
    .\.github\scripts\health-check.ps1
#>

$root = $PSScriptRoot | Split-Path | Split-Path   # two levels up from .github/scripts/

$checks = @(
    # === Root framework ===
    @{ g = "Framework"; p = ".editorconfig" },
    @{ g = "Framework"; p = ".gitignore" },
    @{ g = "Framework"; p = ".github\copilot-instructions.md" },
    @{ g = "Framework"; p = ".github\pull_request_template.md" },
    @{ g = "Framework"; p = "docs\decisions\adr-template.md" },
    @{ g = "Framework"; p = ".github\scripts\health-check.ps1" },
    @{ g = "Framework"; p = ".vscode\extensions.json" },
    @{ g = "Framework"; p = "environment.yml" },
    @{ g = "Framework"; p = "setup.ps1" },
    @{ g = "Framework"; p = "CHANGELOG.md" },

    # === CI/CD Workflows ===
    @{ g = "CI/CD"; p = ".github\workflows\_template-dotnet-ci.yml" },
    @{ g = "CI/CD"; p = ".github\workflows\_template-spa-ci.yml" },
    @{ g = "CI/CD"; p = ".github\workflows\_template-python-ci.yml" },

    # === Template: _template (Python) ===
    @{ g = "_template"; p = "projects\_template\.github\copilot-instructions.md" },
    @{ g = "_template"; p = "projects\_template\ruff.toml" },
    @{ g = "_template"; p = "projects\_template\CHANGELOG.md" },

    # === Template: _template-dotnet ===
    @{ g = "dotnet"; p = "projects\_template-dotnet\.github\copilot-instructions.md" },
    @{ g = "dotnet"; p = "projects\_template-dotnet\global.json" },
    @{ g = "dotnet"; p = "projects\_template-dotnet\CHANGELOG.md" },
    @{ g = "dotnet"; p = "projects\_template-dotnet\infra\main.bicep" },
    @{ g = "dotnet"; p = "projects\_template-dotnet\src\MyApp.Web\Program.cs" },
    @{ g = "dotnet"; p = "projects\_template-dotnet\src\MyApp.Web\Views\Shared\_Layout.cshtml" },
    @{ g = "dotnet"; p = "projects\_template-dotnet\src\MyApp.Infrastructure\MyApp.Infrastructure.csproj" },
    @{ g = "dotnet"; p = "projects\_template-dotnet\src\MyApp.Infrastructure\AppDbContext.cs" },
    @{ g = "dotnet"; p = "projects\_template-dotnet\src\MyApp.Infrastructure\Migrations\.gitkeep" },

    # === Template: _template-dotnet-spa ===
    @{ g = "spa"; p = "projects\_template-dotnet-spa\.github\copilot-instructions.md" },
    @{ g = "spa"; p = "projects\_template-dotnet-spa\global.json" },
    @{ g = "spa"; p = "projects\_template-dotnet-spa\CHANGELOG.md" },
    @{ g = "spa"; p = "projects\_template-dotnet-spa\infra\main.bicep" },
    @{ g = "spa"; p = "projects\_template-dotnet-spa\src\MyApp.Client\eslint.config.js" },

    # === Template: _template-winforms ===
    @{ g = "winforms"; p = "projects\_template-winforms\.github\copilot-instructions.md" },
    @{ g = "winforms"; p = "projects\_template-winforms\global.json" },
    @{ g = "winforms"; p = "projects\_template-winforms\CHANGELOG.md" },

    # === Template: _template-webforms ===
    @{ g = "webforms"; p = "projects\_template-webforms\.github\copilot-instructions.md" },
    @{ g = "webforms"; p = "projects\_template-webforms\src\MyApp\Site.Master" },
    @{ g = "webforms"; p = "projects\_template-webforms\CHANGELOG.md" },

    # === Template: _template-ai ===
    @{ g = "ai"; p = "projects\_template-ai\.github\copilot-instructions.md" },
    @{ g = "ai"; p = "projects\_template-ai\ruff.toml" },
    @{ g = "ai"; p = "projects\_template-ai\CHANGELOG.md" },
    @{ g = "ai"; p = "projects\_template-ai\specs\ai\model-config.yaml" },
    @{ g = "ai"; p = "projects\_template-ai\specs\ai\eval-criteria.yaml" },
    @{ g = "ai"; p = "projects\_template-ai\evals\run_evals.py" },

    # === Skills: .github (Copilot) ===
    @{ g = "skill/gh"; p = ".github\skills\memory-capture\SKILL.md" },
    @{ g = "skill/gh"; p = ".github\skills\memory-recall\SKILL.md" },
    @{ g = "skill/gh"; p = ".github\skills\webapp-testing\SKILL.md" },
    @{ g = "skill/gh"; p = ".github\skills\frontend-design\SKILL.md" },

    # === Skills: .agent (Claude for Work) ===
    @{ g = "skill/ag"; p = ".agent\skills\ai-engineer\SKILL.md" },
    @{ g = "skill/ag"; p = ".agent\skills\security\SKILL.md" },
    @{ g = "skill/ag"; p = ".agent\skills\cloud-devops\SKILL.md" },
    @{ g = "skill/ag"; p = ".agent\skills\code-reviewer\SKILL.md" },

    # === Skills: .claude (Claude Code) ===
    @{ g = "skill/cl"; p = ".claude\skills\memory-capture\SKILL.md" },
    @{ g = "skill/cl"; p = ".claude\skills\webapp-testing\SKILL.md" }
)

$ok = 0; $fail = 0; $lastGroup = ""

foreach ($c in $checks) {
    if ($c.g -ne $lastGroup) {
        Write-Host ""
        Write-Host "  [$($c.g)]" -ForegroundColor Cyan
        $lastGroup = $c.g
    }
    $full = Join-Path $root $c.p
    if (Test-Path $full) {
        Write-Host "    [OK]   $($c.p)" -ForegroundColor Green
        $ok++
    }
    else {
        Write-Host "    [MISS] $($c.p)" -ForegroundColor Red
        $fail++
    }
}

Write-Host ""
Write-Host "  ----------------------------------------" -ForegroundColor DarkGray
if ($fail -eq 0) {
    Write-Host "  All $ok checks passed." -ForegroundColor Green
}
else {
    Write-Host "  $ok passed, $fail MISSING." -ForegroundColor Yellow
}
Write-Host ""
