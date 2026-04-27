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

## Architecture

- **Backend**: `src/MyApp.Api/` — REST API only, no Views, no static files served
- **Frontend**: `src/MyApp.Client/` — React + Vite SPA, talks to backend via `/api` proxy
- **Auth**: JWT Bearer — tokens issued by the API, stored in the client (httpOnly cookie recommended for production)

## .NET-Specific Conventions

- Controllers go in `src/MyApp.Api/Controllers/` — thin, delegate to Services
- DTOs / request models go in `src/MyApp.Api/Models/`
- Business logic goes in `src/MyApp.Api/Services/`
- Unit tests mirror `src/` paths under `tests/MyApp.UnitTests/`
- Integration tests use `WebApplicationFactory<Program>` from `MyApp.IntTests/`
- `public partial class Program {}` at the bottom of `Program.cs` is required for `WebApplicationFactory`

## Frontend Conventions

- Components go in `src/MyApp.Client/src/components/`
- API calls go in `src/MyApp.Client/src/api/` (typed fetch wrappers)
- State management: start with React Context; add Zustand/Jotai only if needed

## Engineering Standards

### File Encodings & Style
- Encoding: STRICTLY UTF-8 (both .NET and Node).
- No emojis in filenames, code comments, or terminal output.

### Security & Credentials
- NEVER hardcode connection strings, JWT secrets, or API keys.
- Use `.env` or User Secrets for local development.
- Production secrets go in Azure Key Vault / AWS Secrets Manager.
- JWT secret must be at least 32 characters.

### Markdown Document Structure
- ALL `.md` documents with multiple chapters MUST wrap each `##` section in `<details>` collapsible blocks.

## Project-Specific Overrides

<!-- Add project-specific rules here. -->
