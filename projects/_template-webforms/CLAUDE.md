# MyApp (WebForms)

## Rules

- Read `specs/` before implementing anything.
- After every implementation task, output a Change Summary.
- Do NOT read files from other projects under `projects/`.
- Keep `*.aspx.cs` thin — business logic belongs in `App_Code/` services.
- Configuration = `Web.config` (XML), NOT `appsettings.json`.

## Build

```powershell
# Use Developer PowerShell in Visual Studio
msbuild MyApp.sln /p:Configuration=Debug
```

## Project Layout

| Path | Purpose |
|---|---|
| `specs/api/` | HTTP endpoint contracts |
| `specs/behavior/` | Page behavior and acceptance criteria |
| `specs/schema/` | Data models and DB schema |
| `src/MyApp/Pages/` | ASPX pages + code-behind |
| `src/MyApp/App_Code/` | Shared service classes (no System.Web dependency) |
| `src/MyApp/Content/` | Static CSS / JS / images |
| `src/MyApp/Web.config` | XML configuration |
| `tests/MyApp.Tests/` | MSTest — tests App_Code services |
| `docs/` | ADRs and architecture documentation |
