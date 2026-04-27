# Changelog

All notable changes to PersonalWorkFlow framework will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

## [2.0.0] — 2026-04-27

### Added
- Six project templates: `_template`, `_template-dotnet`, `_template-dotnet-spa`, `_template-winforms`, `_template-ai`, `_template-webforms`
- Three-platform AI Skill system: `.github/skills/` (Copilot), `.agent/skills/` (Claude for Work), `.claude/skills/` (Claude Code)
- `docs/` documentation suite: guides (quickstart, new-project-sop, skills-reference), architecture (framework-overview, skill-sync-design), decisions (ADR-001, ADR-002, adr-template)
- `.github/copilot-instructions.md` with 6 Engineering Standards (including Conventional Commits and Documentation Sync rules)
- `.github/scripts/health-check.ps1` — 48-item framework integrity check
- `.github/pull_request_template.md`
- `.editorconfig` — UTF-8, cross-platform line endings
- `.vscode/settings.json` — formatOnSave, per-language formatters
- `.vscode/extensions.json` — recommended extension list for new machines
- `environment.yml` — reproducible conda environment definition
- EF Core Infrastructure layer in `_template-dotnet` (`AppDbContext`, migrations scaffold)
- ESLint v9 flat config in `_template-dotnet-spa`
- `ruff.toml` in `_template` and `_template-ai`
- `docs/knowledge/memory/facts.yaml` — Memory Schema v2 with category, project scope, expires, deprecated fields

### Changed
- `.env.example` updated to framework-level placeholders (removed thesis-specific variables)
- `.gitignore` updated to allow `.vscode/settings.json` and `.vscode/extensions.json` to be committed
