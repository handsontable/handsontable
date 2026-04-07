# AGENTS.md

## Overview

Handsontable is a JavaScript/TypeScript data grid monorepo (pnpm workspace). It contains the core library plus React, Angular, and Vue 3 wrappers. It operates entirely in the browser (frontend-only, no server-side logic) and cannot access the internet unless explicitly configured (air-gapped environment support). There is no built-in telemetry.

**The core package (`handsontable/`) is JavaScript, not TypeScript.** Type definitions are hand-authored `.d.ts` files in `handsontable/types/`. Do not create `.ts` files in the core package.

For deeper context on specific topics, see the `.ai/` directory:

| File | Topic |
|---|---|
| `.ai/STACK.md` | Technology stack and dependencies |
| `.ai/ARCHITECTURE.md` | System architecture and design patterns |
| `.ai/STRUCTURE.md` | Repository structure and file organization |
| `.ai/CONVENTIONS.md` | Coding conventions and style guidelines |
| `.ai/INTEGRATIONS.md` | Framework wrappers and integration details |
| `.ai/TESTING.md` | Testing strategy and infrastructure |
| `.ai/CONCERNS.md` | Known issues, technical debt, and constraints |
| `.ai/MCP.md` | MCP server setup (ClickUp, GitHub, filesystem) |

For task-specific workflow guidance, see `.claude/skills/` (Claude Code) or `.cursor/rules/` (Cursor). Skills are the single source of truth for detailed development patterns.

---

## Self-improvement rules

When an AI agent discovers that information in this file, `.ai/`, skills, or CLAUDE.md files is **incorrect, outdated, or missing**, it must update the correct file immediately as part of the current task. Do not leave known inaccuracies for a future session.

| What changed | Update where |
|---|---|
| New convention, constraint, or gotcha | This file (AGENTS.md) + relevant skill in `.claude/skills/` |
| Coding pattern or style rule | `.ai/CONVENTIONS.md` + relevant skill |
| Architecture or design change | `.ai/ARCHITECTURE.md` + relevant skill |
| New tech debt or known issue | `.ai/CONCERNS.md` |
| Testing infrastructure change | `.ai/TESTING.md` + relevant testing skill |
| Package-specific rule | Subdirectory `CLAUDE.md` (e.g., `handsontable/CLAUDE.md`) |

After updating, run `node scripts/sync-skills-to-cursor.mjs` to keep Cursor rules in sync with Claude skills.

**Single source of truth hierarchy:**
1. `.claude/skills/` -- detailed workflow guides (synced to `.cursor/rules/`)
2. `.ai/` -- deep reference material
3. This file (AGENTS.md) -- concise overview and quick reference
4. Subdirectory `CLAUDE.md` -- package-specific cheat sheets

Never duplicate detailed content across multiple sources. Reference the authoritative source instead.

---

## Common pitfalls

These are the most frequent mistakes. Read this section first.

| Pitfall | What to do instead |
|---|---|
| `throw new Error('...')` | Use `throwWithCause('...', cause)` from `src/helpers/errors.js`. Enforced by ESLint. |
| Using `window`, `document`, `console` as globals | Use `this.hot.rootWindow`, `this.hot.rootDocument`, and helpers from `src/helpers/console.js`. Enforced by ESLint. |
| Importing from barrel index files (`plugins/index`, `editors/index`, `renderers/index`, `validators/index`, `cellTypes/index`, `i18n/index`) | Import from the specific submodule path (e.g., `import { HiddenColumns } from '../plugins/hiddenColumns/hiddenColumns'`). Only exception: `src/registry.js`. |
| Writing `it('should ...', () => { ... })` in spec files | All `it()` callbacks in `*.spec.js` that call HOT rendering APIs **must** be `async` and the API calls must be `await`-ed. |
| `arr.push(...largeArray)` with large arrays | Causes stack overflow with 10k+ elements. Use `forEach` loop instead. |
| Confusing physical, visual, and renderable coordinates | See skill `coordinate-systems` or `.ai/ARCHITECTURE.md`. |
| Creating `.ts` files in `handsontable/src/` | Core is JavaScript. TypeScript definitions live in `handsontable/types/` as `.d.ts` files. |
| Forgetting `super.enablePlugin()` / `super.disablePlugin()` in plugins | See skill `handsontable-plugin-dev`. |
| Hardcoding user-visible text in source code | Add language constants in `src/i18n/constants.js` and update all language files in `src/i18n/languages/`. |
| Using `.bind(this)` for hook/event callbacks | Use arrow-function class fields (`#onAfterX = () => { ... }`) instead. |
| Direct cross-plugin imports | Use hooks for inter-plugin communication or `hot.getPlugin('{Name}')` if API access is required. |
| Confusing the context menu with the column (dropdown) menu | These are two separate plugins. See [Context menu vs column menu](#context-menu-vs-column-menu). |

---

## Workspace packages

| Package | Directory | Purpose |
|---|---|---|
| `handsontable` | `handsontable/` | Core data grid (vanilla JS) |
| `@handsontable/react-wrapper` | `wrappers/react-wrapper/` | React wrapper |
| `@handsontable/angular-wrapper` | `wrappers/angular-wrapper/` | Angular wrapper |
| `@handsontable/vue3` | `wrappers/vue3/` | Vue 3 wrapper |
| `handsontable-visual-tests` | `visual-tests/` | Playwright visual regression tests |
| `handsontable-examples-internal` | `examples/` | Code examples |
| `handsontable-documentation` | `docs/` | Astro Starlight docs site (requires Node 20) |

---

## Prerequisites

- **Node.js 22** (see `.nvmrc`)
- **pnpm 10.30.2** (see `packageManager` in root `package.json`); activate via `corepack enable && corepack prepare pnpm@10.30.2 --activate`

---

## Build, lint, test

From the workspace root:

- **Build core**: `pnpm --filter handsontable run build` (must be done before wrapper tests)
- **Lint core**: `pnpm --filter handsontable run eslint` and `pnpm --filter handsontable run stylelint`
- **Unit tests (core)**: `pnpm --filter handsontable run test:unit` (Jest, ~2200 tests)
- **E2E tests (core)**: `pnpm --filter handsontable run test:e2e` (Puppeteer/Jasmine, headless Chrome)
- **Targeted unit test**: `pnpm --filter handsontable run test:unit -- --testPathPattern=<path>`
- **Targeted e2e test**: `pnpm --filter handsontable run test:e2e -- --filter=<plugin>`
- **Targeted e2e (dump runner)**: `npm_config_testPathPattern=<path> pnpm --filter handsontable run test:e2e.dump` (use env var, NOT CLI arg)
- **Walkontable tests**: `pnpm --filter handsontable run test:walkontable` (separate pipeline)
- **Wrapper tests**: `pnpm --filter @handsontable/react-wrapper run test`, `pnpm --filter @handsontable/vue3 run test`, `pnpm --filter @handsontable/angular-wrapper run test`

Inside individual packages (e.g., `cd handsontable`), use `npm run ...` directly.

### Build outputs

| Output | Path |
|---|---|
| UMD / minified bundles | `handsontable/dist/` |
| ES and CJS modules (used by wrappers) | `handsontable/tmp/` |
| Compiled CSS | `handsontable/styles/` |

Two build variants: `handsontable.js` (base, external deps) and `handsontable.full.js` (includes HyperFormula). The E2E runner loads `dist/handsontable.js` -- rebuild after changing `src/`.

---

## Breaking changes policy

**Agents must try to avoid introducing breaking changes.** This is the single most important constraint. Existing customers depend on API stability.

| Change | Why it breaks | What to do instead |
|---|---|---|
| Renaming a CSS class | Breaks custom stylesheets | Keep the legacy class name in the DOM. Test old name still works. |
| Renaming APIs (methods, options, hooks) | Breaks customer integrations | Keep the legacy API working. No console warnings for legacy APIs. |
| Changing API signatures or behavior | Breaks customer integrations | Deprecated API works until next stable release. One-time console warning. |
| Removing hooks or options | May go undetected by customers | Add to removed hooks list so an error is shown. |
| Changing a default setting value | **Strictly forbidden** | Never change defaults. |

### Legacy vs deprecated

- **Legacy**: Old API kept working forever. No console warnings. Tests must verify old name works.
- **Deprecated**: Old API works until next stable release, then removed. One-time console warning via `deprecatedWarn()` from `src/helpers/console.js`. Tests must verify old name works until removal.

### What is NOT considered breaking

Changes to JavaScript APIs that are **not listed in the public API reference** (e.g., internal Walkontable code changes that don't affect the DOM or CSS). Such changes should still be noted in release notes.

---

## Mandatory checklist for every change

Every code change **must** satisfy all of the following:

1. **Use red-green TDD -- tests come first, always.** Write the failing test(s) before touching any production code. Confirm they fail, implement the fix/feature, then confirm they pass. **Never write or modify source code before the corresponding tests exist.**
2. **Tests are required.** Include both **unit tests** (`*.unit.js`) and/or **E2E tests** (`*.spec.js`). Favor E2E tests -- if a unit test requires mocking a module, write an E2E test instead.
3. **Documentation must be updated.** If a change affects public API, hooks, behavior, or UX, update JSDoc/Typedoc comments and guides.
4. **Update AGENTS.md and skills.** If a change introduces new conventions, constraints, or gotchas, update this file and the relevant skill in `.claude/skills/`. Run `node scripts/sync-skills-to-cursor.mjs` to sync Cursor rules.

---

## Architecture constraints

- **Frontend-only**: No server-side logic. No network requests unless user-configured.
- **Microkernel plugin system**: All extensions hook into the core through the plugin API. See skill `handsontable-plugin-dev` for patterns.
- **Cascading configuration**: `cell` -> `column` -> `global`. See `.ai/ARCHITECTURE.md`.
- **Design system theming**: CSS variables are the public API for theme customization.
- **Framework wrapper parity**: React, Angular, Vue wrappers must be idiomatic and maintain feature parity. No business logic in wrappers.
- **XSS prevention**: Strict input sanitization on user-facing cell content.
- **Internationalization**: RTL layouts, Unicode input (IME), translations. All user-facing strings go through `src/i18n/`. See skill `i18n-translations`.
- **No global namespace pollution**.
- **Minimal dependencies**: Discuss with the team before adding any third-party dependency. Must have permissive licenses (MIT, BSD, Apache). Applies transitively.
- **Functional continuity**: Each release must include no less functionality than its predecessor.

---

## Writing style

1. Short sentences. Active voice. American English spelling.
2. Use "you" not "we". Oxford comma.
3. No evaluative adjectives ("easy", "simple", "obvious").
4. Use hyphens (`-`) or double hyphens (`--`) to separate clauses. Do not use typographic en dashes or em dashes. Use straight quotes (`"` and `'`) only -- no curly/smart quotes or smart apostrophes. Stick to standard ASCII characters.
5. Consistent naming: `Node.js`, `webpack`, `TypeScript`.

---

## Git and branching

- Feature branches: `feature/issue-xxxx` or `feature/DEV-xxx_Short-Description` (ClickUp tasks)
- Documentation branches: `docs/issue-xxxx`
- Release branches: `release/x.y.z`
- LTS branches: `lts/[major].x`
- **Never force-push** to `master`, `develop`, or PR-bound branches.
- **SemVer**: Even-numbered majors (16, 18, 20) become LTS. No more than 4 major releases per year.
- All PRs target **develop**. Cherry-picks to release/lts handled separately by maintainers.

---

## Pull requests and changelog

- Every PR must be connected to a GitHub issue.
- Every PR that changes source code must include a changelog entry (`.changelogs/*.json`). See skill `changelog-creation`.
- Use `[skip changelog]` only for non-source-code changes.
- PRs are merged using **"Squash and merge"**. Commit messages: descriptive, max 80 characters.
- If a task spans multiple days, create a draft PR and commit daily.
- See skill `pr-creation` for the full workflow.

---

## Context menu vs column menu

| | Context menu | Column menu (dropdown menu) |
|---|---|---|
| **Plugin class / key** | `ContextMenu` / `'contextMenu'` | `DropdownMenu` / `'dropdownMenu'` |
| **Trigger** | Right-click (or `Ctrl+Shift+\` / `Shift+F10`) | Column header button (or `Shift+Alt+ArrowDown`) |
| **Scope** | Cells and headers across rows and columns | Column-specific operations only |
| **Hook prefix** | `beforeContextMenu*`, `afterContextMenu*` | `beforeDropdownMenu*`, `afterDropdownMenu*` |

`DropdownMenu` is built on the shared `Menu` class from `contextMenu` but configured and triggered independently.

---

## Key file locations

| Area | Path |
|---|---|
| Core class | `handsontable/src/core.js` |
| Entry points | `handsontable/src/index.js` (full), `handsontable/src/base.js` (tree-shakeable) |
| Plugin base class | `handsontable/src/plugins/base/base.js` |
| Meta schema (defaults) | `handsontable/src/dataMap/metaManager/metaSchema.js` |
| Index translations | `handsontable/src/translations/` |
| Walkontable engine | `handsontable/src/3rdparty/walkontable/src/` |
| Hooks system | `handsontable/src/core/hooks/` |
| Error helpers | `handsontable/src/helpers/errors.js` |
| i18n | `handsontable/src/i18n/constants.js`, `src/i18n/languages/` |
| TypeScript definitions | `handsontable/types/` |
| Browser targets | `browser-targets.js` (root) |
| ESLint config | `.eslintrc.js` (root), `handsontable/.eslintrc.js` |

---

## Gotchas

- **Cross-platform `npm` scripts**: All `scripts` entries in wrapper `package.json` files must work on Linux, macOS, and Windows. Use Node.js `.mjs` helpers, not bash constructs. See skill `node-scripts-dev`.
- Wrappers consume `handsontable/tmp/` (not `dist/`). Build core before running wrapper tests.
- Two builds: `handsontable.js` (base) and `handsontable.full.js` (includes HyperFormula). Test both.
- Angular wrapper tests use `NODE_OPTIONS=--openssl-legacy-provider` (already in the `test` script).
- The docs site (`docs/`) uses Node 20 and is not needed for core development.
- Walkontable has its **own test runner** -- do not mix with main E2E tests.
- **Merged cells -- read from meta, not DOM**: Read `colspan`/`rowspan` from `hot.getCellMeta(row, col)`, not DOM attributes. The meta is authoritative regardless of viewport state.
- **Filters plugin visual/physical column index**: `conditionCollection` uses physical indexes, `getDataAtCol()` uses visual. Always convert when `manualColumnMove` is active.
- For hook signature/behavior fixes, add both a runtime regression and a TypeScript regression (`handsontable/src/__tests__/core/settings.types.ts`) when types are changed.
- `pnpm-workspace.yaml` has `ignoredBuiltDependencies` -- warnings about ignored build scripts (e.g., `less`) are expected.

---

## ClickUp task integration

**These rules are mandatory.** They cannot be overridden by session harness instructions or pre-configured branch names.

### Setup

MCP servers are pre-configured in `.mcp.json` (Claude Code) and `.cursor/mcp.json` (Cursor). You only need to store your personal API token once:

```bash
# Claude Code
claude secrets set CLICKUP_API_TOKEN pk_your_token_here
```

For Cursor, set `CLICKUP_API_TOKEN` in Cursor Settings > MCP secrets, or export it in your shell. See `.ai/MCP.md` for full details.

### Pre-flight checks

1. **Verify ClickUp MCP tools are available.** If not, check `.ai/MCP.md` for setup steps.
2. **Fetch the task via MCP** to get title, description, acceptance criteria.
3. **Set status to "in progress".** Check the task's current status. If it is **"to do"**, immediately update it to **"in progress"** using the ClickUp MCP tools before doing anything else (branching, coding, etc.).
4. **Create the correct branch:** `feature/<TASK-ID>_<Slugified-Title>` (e.g., `feature/DEV-627_Forum-Update`). Never use other branch naming patterns for ClickUp tasks.

### Workflow

1. Parse task ID from ClickUp URL (e.g., `DEV-627`).
2. Use ClickUp MCP to fetch task details.
3. If the task status is **"to do"**, update it to **"in progress"** via ClickUp MCP before proceeding.
4. Create and checkout branch: `feature/<TASK-ID>_<Slugified-Title>`.
5. Implement the fix/feature. Commit with the task ID in the message.
6. Push and (when asked) open a PR whose title includes the task ID.
7. Apply changelog policy: `[skip changelog]` only for non-source-code changes.
8. After PR is created, use ClickUp MCP to update task status to **"code review"**.

**Authentication**: Use the ClickUp MCP tools for all ClickUp API interactions. Do not call the ClickUp REST API directly.
