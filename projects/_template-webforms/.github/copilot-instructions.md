# MyApp (WebForms) — Development Rules

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

## Architecture Rule: Thin Code-Behind

- `*.aspx.cs` code-behind MUST NOT contain business logic.
- Business logic goes in `App_Code/` service classes — plain C#, no `System.Web` dependency.
- Code-behind only: handle page events, call services, bind data to controls.

## WebForms-Specific Conventions

- Configuration is in `Web.config` (XML) — not `appsettings.json`.
- Environment overrides via `Web.Debug.config` / `Web.Release.config` transforms.
- NEVER store connection strings or secrets in plain `Web.config` in source control.
- Add new pages: create `*.aspx` + `*.aspx.cs`, then add both entries to `MyApp.csproj`.

## Engineering Standards

### File Encodings & Style
- Encoding: STRICTLY UTF-8 (use `<meta charset="utf-8">` in all .aspx pages).
- No emojis in filenames, code comments, or terminal output.

### Security & Credentials
- NEVER hardcode connection strings or passwords in `Web.config`.
- Use `Web.Release.config` transform to inject production values at deploy time.
- Enable `customErrors mode="RemoteOnly"` in Release transform.
- Validate all user inputs — WebForms ViewState does NOT protect against injection.

### Markdown Document Structure
- ALL `.md` documents with multiple chapters MUST wrap each `##` section in `<details>` collapsible blocks.

## Project-Specific Overrides

<!-- Add project-specific rules here. -->
