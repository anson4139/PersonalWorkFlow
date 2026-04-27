# MyApp

## Rules

- Read `specs/` before implementing anything.
- After every implementation task, output a Change Summary (spec reference, scope, self-verification, gaps).
- Do NOT read files from other projects under `projects/`.

## Build & Run

```powershell
# API
dotnet build MyApp.sln
dotnet run --project src/MyApp.Api

# Frontend
cd src/MyApp.Client && npm install && npm run dev

# Tests (.NET only)
dotnet test MyApp.sln
```

## Project Layout

| Path | Purpose |
|---|---|
| `specs/api/` | REST endpoint contracts |
| `specs/behavior/` | Feature behavior and acceptance criteria |
| `specs/schema/` | Data models and DB schema |
| `src/MyApp.Api/` | ASP.NET Core Web API — JWT, Swagger, CORS |
| `src/MyApp.Client/` | React + Vite + TypeScript SPA |
| `tests/MyApp.UnitTests/` | xUnit + NSubstitute unit tests |
| `tests/MyApp.IntTests/` | WebApplicationFactory integration tests |
| `docs/` | ADRs and architecture documentation |
