# MyApp

## Overview

[One paragraph describing what this project does.]

## Prerequisites

- .NET 9 SDK
- SQL Server / PostgreSQL (see `appsettings.Development.json`)

## Getting Started

```powershell
# Restore and build
dotnet restore MyApp.sln
dotnet build MyApp.sln

# Run the web app
dotnet run --project src/MyApp.Web

# Run all tests
dotnet test MyApp.sln
```

## Project Structure

```
MyApp.sln
specs/              AI-readable specifications (API contracts, behavior, schemas)
src/
  MyApp.Web/        ASP.NET Core MVC application
tests/
  MyApp.UnitTests/  Unit tests (xUnit + NSubstitute)
  MyApp.IntTests/   Integration tests (WebApplicationFactory)
  MyApp.E2ETests/   End-to-end tests (Playwright)
docs/               ADRs and architecture decisions
```

## Rename Checklist

When copying this template, replace all occurrences of `MyApp` with the actual project name:

1. Rename `MyApp.sln` and all `.csproj` files
2. Update project GUIDs in `.sln` (use `[guid]::NewGuid()` in PowerShell)
3. Update `RootNamespace` and `UserSecretsId` in `MyApp.Web.csproj`
4. Update `global.json` SDK version if needed
