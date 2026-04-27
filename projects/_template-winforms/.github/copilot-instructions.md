# MyApp (WinForms) — Development Rules

> These rules are self-contained. They apply whether this project is opened standalone or as part of the PersonalWorkFlow workspace.

## Mandatory First Steps

Before any task in this project:
1. Read all relevant files under `specs/`
2. Check `docs/` for existing ADRs
3. Do NOT read files from other projects under `projects/`

## AI Change Verification Protocol

After completing any implementation task, output a Change Summary:
- **Spec reference**: which `specs/` file(s) the task implements
- **Scope**: what was implemented
- **Self-verification**: `[PASS/FAIL] tests/<layer>/<name> — N/N passed`
- **Gaps**: `[WARNING] specs/<file> L<n> — reason`

## Architecture Rule: Thin Forms

- `Forms/` classes MUST NOT contain business logic.
- All business logic goes in `Services/` — injectable, unit-testable.
- Forms only: handle events, call services, update UI controls.

## WinForms-Specific Conventions

- Designer-generated code lives in `*.Designer.cs` — do NOT edit manually.
- Add new controls via Visual Studio designer, not by hand in `Designer.cs`.
- DI-registered forms are resolved via `Program.Services.GetRequiredService<TForm>()`.
- Configuration is read via `IConfiguration` injected into services.

## Engineering Standards

### File Encodings & Style
- Encoding: STRICTLY UTF-8.
- No emojis in filenames, code comments, or terminal output.

### Security & Credentials
- NEVER hardcode connection strings or API keys.
- Use `.env` or User Secrets for local development.
- Connection strings in `appsettings.json` are for dev only — override in deployment.

### Markdown Document Structure
- ALL `.md` documents with multiple chapters MUST wrap each `##` section in `<details>` collapsible blocks.

## Project-Specific Overrides

<!-- Add project-specific rules here. -->
