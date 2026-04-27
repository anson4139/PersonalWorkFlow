# MyApp (WinForms)

## Rules

- Read `specs/` before implementing anything.
- After every implementation task, output a Change Summary.
- Do NOT read files from other projects under `projects/`.
- Keep `Forms/` thin — business logic belongs in `Services/`.

## Build & Run

```powershell
dotnet build MyApp.sln
dotnet run --project src/MyApp
dotnet test MyApp.sln
```

## Project Layout

| Path | Purpose |
|---|---|
| `specs/behavior/` | UI behavior and acceptance criteria |
| `specs/schema/` | Domain models and data schema |
| `src/MyApp/Forms/` | WinForms — code-behind only, no logic |
| `src/MyApp/Services/` | Business logic (injectable, testable) |
| `src/MyApp/Models/` | Domain models |
| `tests/MyApp.UnitTests/` | xUnit — tests Services and Models only |
| `docs/` | ADRs and architecture documentation |
