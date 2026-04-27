# MyApp

## Rules

- Read `specs/` before implementing anything.
- After every implementation task, output a Change Summary (spec reference, scope, self-verification, gaps).
- Do not read files from other projects under `projects/`.

## Build & Test Commands

```powershell
dotnet build MyApp.sln
dotnet test MyApp.sln
dotnet run --project src/MyApp.Web
```

## Project Layout

| Path | Purpose |
|---|---|
| `specs/api/` | API contracts and endpoint definitions |
| `specs/behavior/` | Feature behavior and acceptance criteria |
| `specs/schema/` | Data models and EF migrations |
| `src/MyApp.Web/` | ASP.NET Core MVC application |
| `tests/MyApp.UnitTests/` | xUnit + NSubstitute unit tests |
| `tests/MyApp.IntTests/` | WebApplicationFactory integration tests |
| `tests/MyApp.E2ETests/` | Playwright end-to-end tests |
| `docs/` | ADRs and architecture documentation |
