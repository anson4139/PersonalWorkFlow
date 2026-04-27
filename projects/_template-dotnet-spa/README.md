# MyApp

## Overview

[One paragraph describing the product. Backend = ASP.NET Core Web API. Frontend = React + Vite.]

## Prerequisites

- .NET 9 SDK
- Node.js 22+ / pnpm (or npm)

## Getting Started

```powershell
# Backend
dotnet restore MyApp.sln
dotnet run --project src/MyApp.Api

# Frontend (separate terminal)
cd src/MyApp.Client
npm install
npm run dev
```

Vite proxies `/api` requests to `https://localhost:7000` — no manual CORS changes needed during development.

## Project Structure

```
MyApp.sln                      .NET solution (API + tests only)
global.json                    Lock .NET SDK version
specs/                         AI-readable specifications
  api/                         REST endpoint contracts
  behavior/                    Feature behavior and acceptance criteria
  schema/                      Data models / DB schema
src/
  MyApp.Api/                   ASP.NET Core Web API (JWT, Swagger, CORS)
    Controllers/
    Models/                    DTOs and request/response models
    Services/                  Business logic interfaces + implementations
  MyApp.Client/                React + Vite + TypeScript SPA
    src/
      App.tsx
      main.tsx
tests/
  MyApp.UnitTests/             xUnit + NSubstitute + FluentAssertions
  MyApp.IntTests/              WebApplicationFactory integration tests
docs/                          ADRs and architecture decisions
```

## Key Differences from MVC Template

| | MVC (`_template-dotnet`) | SPA (`_template-dotnet-spa`) |
|---|---|---|
| Views | Razor (server-side) | React (client-side) |
| Auth | Cookie/Session | JWT Bearer |
| CORS | Not needed | Required |
| `.sln` | Web + tests | API + tests (no frontend) |
| E2E tests | .NET Playwright | Run from `MyApp.Client` with Playwright/Vitest |

## Rename Checklist

1. Rename `MyApp.sln` and all `.csproj` / `package.json` name fields
2. Update project GUIDs in `.sln` (`[guid]::NewGuid()` in PowerShell)
3. Update `RootNamespace` and `UserSecretsId` in `MyApp.Api.csproj`
4. Update `vite.config.ts` proxy target port if needed
5. Update `global.json` SDK version if needed
