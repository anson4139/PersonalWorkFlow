# MyApp — Development Rules

> These rules are self-contained. They apply whether this project is opened standalone or as part of the PersonalWorkFlow workspace.

## Mandatory First Steps

Before any task in this project:
1. Read all relevant files under `specs/`
2. Check `docs/` for existing ADRs that may affect the task
3. Do NOT read files from other projects under `projects/`

## AI Change Verification Protocol

After completing any implementation task, output a Change Summary:
- **Spec reference**: which `specs/` file(s) the task implements
- **Scope**: what was implemented
- **Self-verification**: `[PASS/FAIL] tests/<layer>/<name> — N/N passed`
- **Gaps**: `[WARNING] specs/<file> L<n> — reason`

## .NET-Specific Conventions

- Controllers go in `src/MyApp.Web/Controllers/`
- ViewModels / DTOs go in `src/MyApp.Web/Models/`
- Service interfaces go in `src/MyApp.Web/Services/`
- Unit tests mirror `src/` paths under `tests/MyApp.UnitTests/`
- Integration tests use `WebApplicationFactory<Program>` from `MyApp.IntTests`
- E2E tests use Playwright from `MyApp.E2ETests`

## Engineering Standards

### File Encodings & Style
- Encoding: STRICTLY UTF-8.
- No emojis in filenames, code comments, or terminal output.

### Security & Credentials
- NEVER hardcode connection strings, API keys, or secrets in code.
- Use `.env` or User Secrets (`dotnet user-secrets`) for local secrets.
- Maintain `.env.example` with placeholder values.
- Production secrets go in Azure Key Vault / AWS Secrets Manager — never in `appsettings.Production.json`.

### Markdown Document Structure
- ALL `.md` documents with multiple chapters MUST wrap each `##` section in `<details>` collapsible blocks.

## Project-Specific Overrides

<!-- Add project-specific rules here. -->
