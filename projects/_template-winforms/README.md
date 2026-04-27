# MyApp (WinForms)

## Overview

[One paragraph describing the desktop application.]

## Prerequisites

- .NET 9 SDK
- Windows OS (WinForms is Windows-only)

## Getting Started

```powershell
dotnet restore MyApp.sln
dotnet run --project src/MyApp
dotnet test MyApp.sln
```

## Project Structure

```
MyApp.sln
global.json                    Lock .NET 9 SDK
specs/
  behavior/                    UI behavior and acceptance criteria
  schema/                      Domain models and data schema
src/
  MyApp/
    Program.cs                 DI container setup + Application.Run()
    Forms/
      MainForm.cs              Form code-behind
      MainForm.Designer.cs     Auto-generated layout (edit via designer only)
    Services/                  Business logic — testable, no UI dependency
    Models/                    Domain models
    appsettings.json
    appsettings.Development.json
tests/
  MyApp.UnitTests/             xUnit — tests Services and Models ONLY (not Forms)
docs/                          ADRs and design decisions
```

## Testing Strategy

- Unit test `Services/` and `Models/` — keep business logic out of Forms
- WinForms UI automation (clicking buttons in forms) requires separate tools:
  - **WinAppDriver** (Microsoft, free): full UI automation
  - **FlaUI**: open-source alternative
  - Not included in this template by default

## Key Differences from MVC/SPA Templates

| | WinForms | MVC | SPA |
|---|---|---|---|
| Runtime | .NET 9 Windows | .NET 9 | .NET 9 API + Node |
| Project format | SDK-style | SDK-style | SDK-style + npm |
| Entry point | `Program.cs` + `Application.Run()` | `Program.cs` + Kestrel | Same |
| Config | `appsettings.json` (copied to output) | `appsettings.json` | `appsettings.json` |
| Views | `*.cs` + `*.Designer.cs` | Razor `.cshtml` | React `.tsx` |
| No `global.json` needed | No (but included for SDK lock) | No | No |

## Rename Checklist

1. Rename `MyApp.sln`, `src/MyApp/`, `.csproj`, `tests/MyApp.UnitTests/`
2. Update project GUIDs in `.sln`
3. Update `RootNamespace` in `.csproj`
4. Rename `MainForm` to the actual main window name
