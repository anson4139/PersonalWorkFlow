# MyApp (WebForms)

## IMPORTANT: Legacy Technology

> WebForms runs on **.NET Framework 4.8 only**.
> It does NOT support .NET Core, .NET 5, 6, 7, 8, or 9.
> The project format is **old-style XML** (not SDK-style).
> Must be opened with **Visual Studio 2019/2022** on Windows.
> VS Code does NOT support the WebForms `.aspx` designer.

## Prerequisites

- Visual Studio 2022 (Community or higher)
- .NET Framework 4.8 Developer Pack
- IIS Express (bundled with Visual Studio)
- SQL Server or LocalDB

## Getting Started

Open `MyApp.sln` in Visual Studio, then press F5.

```powershell
# CLI build (requires msbuild in PATH — use Developer PowerShell)
msbuild MyApp.sln /p:Configuration=Debug
```

## Project Structure

```
MyApp.sln
specs/
  api/                         HTTP endpoint contracts (if any Web API mixed in)
  behavior/                    Page behavior and acceptance criteria
  schema/                      Data models / DB schema
src/
  MyApp/
    MyApp.csproj               Old-style .csproj (non-SDK)
    Global.asax                Application lifecycle events
    Global.asax.cs
    Web.config                 XML configuration (replaces appsettings.json)
    Web.Debug.config           Debug transform
    Web.Release.config         Release transform (connection strings, customErrors)
    Pages/
      Default.aspx             Page markup
      Default.aspx.cs          Code-behind
    App_Code/                  Shared utility classes (WebForms convention)
    Content/                   Static files (CSS, JS, images)
tests/
  MyApp.Tests/                 MSTest + .NET Framework 4.8 (old-style .csproj)
docs/                          ADRs and architecture decisions
```

## Configuration Pattern

WebForms uses `Web.config` transforms instead of `appsettings.*.json`:

| Environment | How |
|---|---|
| Debug | `Web.Debug.config` transform |
| Release | `Web.Release.config` transform |
| Secrets | Connection string in `Web.config` — do NOT commit real credentials |

## Rename Checklist

1. Rename `MyApp.sln`, `src/MyApp/`, `MyApp.csproj`
2. Replace all `{A1B2...}` GUIDs with new ones (`[guid]::NewGuid()`)
3. Update `RootNamespace` and `AssemblyName` in `.csproj`
4. Update `ProjectReference` GUID in `MyApp.Tests.csproj`
5. Update namespace in `Global.asax.cs` and all code-behind files
