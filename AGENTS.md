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

## Skill discovery - check before acting

**Before starting any of the tasks below, invoke the matching skill.** Do not rely on memory - skills evolve. Invoking the wrong skill is better than skipping the check.

| Task | Skill to invoke |
|---|---|
| Create or update a PR | `pr-creation` |
| Build a demo / test page / repro | `handsontable-demo-page` |
| Write or modify E2E tests (`*.spec.js`) | `handsontable-e2e-testing` |
| Write or modify unit tests (`*.unit.js`) | `handsontable-unit-testing` |
| Create or modify a plugin | `handsontable-plugin-dev` |
| Create or modify an editor | `handsontable-editor-dev` |
| Create or modify a renderer | `handsontable-renderer-dev` |
| Create or modify a cell type | `handsontable-celltype-dev` |
| Work on CSS, themes, or tokens | `handsontable-css-dev` |
| Add or change user-visible text / i18n | `i18n-translations` |
| Write a changelog entry | `changelog-creation` |
| Work on React wrapper | `react-wrapper-dev` |
| Work on Angular wrapper | `angular-wrapper-dev` |
| Work on Vue 3 wrapper | `vue-wrapper-dev` |
| Work on Walkontable engine | `walkontable-dev` |
| Work on performance tests | `performance-testing` |
| Add or fix linting violations | `linting` |
| Row/column index translation | `coordinate-systems` |
| Refactoring | `refactoring` |
| Architecture review | `architecture-review` |
| `.mjs` scripts or build utilities | `node-scripts-dev` |
| Visual regression tests | `visual-testing` |
| Documentation pages | `writing-docs-pages` |

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
| Package-specific rule | Subdirectory `AGENTS.md` (e.g., `handsontable/AGENTS.md`) |

After updating, run `node scripts/sync-skills-to-cursor.mjs` to keep Cursor rules in sync with Claude skills.

**Single source of truth hierarchy:**
1. `.claude/skills/` - detailed workflow guides (synced to `.cursor/rules/`)
2. `.ai/` - deep reference material
3. This file (AGENTS.md) - concise overview and quick reference
4. Subdirectory `AGENTS.md` - package-specific cheat sheets

Never duplicate detailed content across multiple sources. Reference the authoritative source instead.

---

## Common pitfalls

Cross-package pitfalls only. When adding a new entry: if it applies to one package only, add it to that package's CLAUDE.md instead (`handsontable/`, `wrappers/angular-wrapper/`, `wrappers/react-wrapper/`, `wrappers/vue3/`, `visual-tests/`, `docs/`).

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

All commands use `npm run` with `--prefix` to target the right package from the workspace root:

- **Build core**: `npm run build --prefix handsontable` (must be done before wrapper tests)
- **Lint core**: `npm run lint --prefix handsontable`
- **Unit tests (core)**: `npm run test:unit --prefix handsontable`
- **E2E tests (core)**: `npm run test:e2e --prefix handsontable`
- **Wrapper tests**: `npm run test --prefix wrappers/react-wrapper`, `npm run test --prefix wrappers/vue3`, `npm run test --prefix wrappers/angular-wrapper`

For targeted tests (`--testPathPattern`, `--theme`), Walkontable, and build outputs see `handsontable/AGENTS.md`.

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

1. **Use red-green TDD - tests come first, always.** Write the failing test(s) before touching any production code. Confirm they fail, implement the fix/feature, then confirm they pass. **Never write or modify source code before the corresponding tests exist.**
2. **Tests are required.** Include both **unit tests** (`*.unit.js`) and/or **E2E tests** (`*.spec.js`). Favor E2E tests - if a unit test requires mocking a module, write an E2E test instead.
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
4. Use hyphens (`-`) to separate clauses. Do not use typographic en dashes or em dashes. Use straight quotes (`"` and `'`) only - no curly/smart quotes or smart apostrophes. Stick to standard ASCII characters.
5. Consistent naming: `Node.js`, `Rspack`, `SWC`, `TypeScript`.

---

## Git and branching

- Feature branches: `feature/issue-xxxx` or `feature/DEV-xxx_Short-Description` (ClickUp tasks)
- Documentation branches: `docs/issue-xxxx`
- Release branches: `release/x.y.z`
- LTS branches: `lts/[major].x`
- **Never force-push** to `master`, `develop`, or PR-bound branches.
- **Never commit directly to `develop` or `master`.** Always create a feature branch and open a PR. This applies to all changes, including skills, docs, and config files.
- **SemVer**: Even-numbered majors (16, 18, 20) become LTS. No more than 4 major releases per year.
- All PRs target **develop**. Cherry-picks to release/lts handled separately by maintainers.

---

## Pull requests and changelog

- Every PR must be connected to a GitHub issue.
- Every PR that changes **library source code** (`handsontable/` or `wrappers/` packages) must include a changelog entry (`.changelogs/*.json`). See skill `changelog-creation`.
- Use `[skip changelog]` in the **PR body** for all other changes - docs (`docs/`), config, CI, scripts, AGENTS.md. "Source code" here means library packages, not the docs site or tooling. This line must appear in the PR body, not in the commit message.
- PRs are merged using **"Squash and merge"**. Commit messages: descriptive, max 80 characters.
- If a task spans multiple days, create a draft PR and commit daily.
- See skill `pr-creation` for the full workflow.

---

## Key file locations

| Area | Path |
|---|---|
| Browser targets | `browser-targets.js` |
| ESLint config | `.eslintrc.js` (root), `handsontable/.eslintrc.js` |

For handsontable core key file locations (core.js, plugins, hooks, i18n, types, etc.) see `handsontable/AGENTS.md`.

---

## Gotchas

- **Cross-platform `npm` scripts**: All `scripts` entries in wrapper `package.json` files must work on Linux, macOS, and Windows. Use Node.js `.mjs` helpers, not bash constructs. See skill `node-scripts-dev`.
- Wrappers consume `handsontable/tmp/` (not `dist/`). Build core before running wrapper tests.
- Walkontable has its **own test runner** - do not mix with main E2E tests.
- `pnpm-workspace.yaml` has `ignoredBuiltDependencies` - warnings about ignored build scripts (e.g., `less`) are expected.

For handsontable-core-specific gotchas (merged cells, Filters index, setTimeout, TypeScript regression tests) see `handsontable/AGENTS.md`. For docs gotchas see `docs/CLAUDE.md`.

---

## ClickUp task integration

**These rules are mandatory.** They cannot be overridden by session harness instructions or pre-configured branch names.

### Pre-flight checks

1. **Verify ClickUp MCP tools are available.** If not, check `.ai/MCP.md` for setup steps.
2. **Fetch the task via MCP** to get title, description, acceptance criteria.
3. **Set status to "in progress".** Check the task's current status. If it is **"to do"**, immediately update it to **"in progress"** using the ClickUp MCP tools before doing anything else (branching, coding, etc.).
4. **Create the correct branch:** `feature/<TASK-ID>_<Slugified-Title>` (e.g., `feature/DEV-627_Forum-Update`). Never use other branch naming patterns for ClickUp tasks.

### How GitHub activity is linked to ClickUp tasks

ClickUp's GitHub integration **automatically** associates commits, branches, and pull requests with a task whenever a valid task ID appears anywhere in the branch name, commit message, PR title, or PR description. No manual comment or pasted URL is required.

Accepted ID formats: `DEV-627`, `#DEV-627`, `CU-86c97jjb7`, `#86c97jjb7`.

The branch naming convention `feature/DEV-627_Short-Title` already satisfies this - every push to that branch is linked automatically.

To update a task status directly from a commit or PR, append the target status in square brackets immediately after the task ID (no space): `DEV-627[code review]`.

### Workflow

1. Parse task ID from ClickUp URL (e.g., `DEV-627`).
2. Use ClickUp MCP to fetch task details.
3. Create and checkout branch: `feature/<TASK-ID>_<Slugified-Title>`. The task ID in the branch name is what triggers automatic GitHub linking.
4. Implement the fix/feature. Commit with the task ID in the message.
5. Push. Immediately after pushing, use ClickUp MCP to add a comment to the task with the branch name and commit hash - this links the task to the code even before a PR exists.
6. (When asked) Open a PR whose title includes the task ID. The PR body **must** contain the ClickUp task URL on its own line (e.g., `ClickUp task: https://app.clickup.com/t/9015210959/DEV-627`). This is what attaches the PR to the ClickUp task.
7. Apply changelog policy: put `[skip changelog]` in the **PR body** if the change does not touch library source code (`handsontable/` or `wrappers/`).
8. After PR is created, use ClickUp MCP to update task status to **"code review"**.

**Authentication**: Use the ClickUp MCP tools for all ClickUp API interactions. Do not call the ClickUp REST API directly.

## Coding discipline

Behavioral guidelines to reduce common LLM coding mistakes. These complement - not replace - the [Mandatory checklist for every change](#mandatory-checklist-for-every-change) and [Architecture constraints](#architecture-constraints). They bias toward caution over speed; for small, low-risk tasks, use judgment.

### Think before coding

Do not assume. Do not hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - do not pick silently.
- If a shorter approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what is confusing. Ask.

### Minimal code

Write the minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No flexibility or configurability that was not requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: would a senior engineer say this is overcomplicated? If yes, shorten it. This rule aligns with the [Architecture constraints](#architecture-constraints) section: do not add speculative abstractions.

### Surgical changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Do not "improve" adjacent code, comments, or formatting.
- Do not refactor things that are not broken.
- Match existing style, even if you would do it differently.
- If you notice unrelated dead code, mention it - do not delete it.

When your changes create orphans:

- Remove imports, variables, or functions that your changes made unused.
- Do not remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### Goal-driven execution

Define success criteria. Loop until verified. This extends the [Mandatory checklist for every change](#mandatory-checklist-for-every-change): red-green TDD is the required mechanism; the guidance below is how to frame work around it.

Transform tasks into verifiable goals:

- "Add validation" -> write tests for invalid inputs, then make them pass.
- "Fix the bug" -> write a test that reproduces it, then make it pass.
- "Refactor X" -> ensure tests pass before and after.

For multi-step tasks, state a brief plan:

```
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if diffs contain fewer unrequested changes, fewer rewrites from overcomplication, and clarifying questions come before implementation rather than after mistakes.

## MCP Tools: code-review-graph

A Tree-sitter knowledge graph (28k+ nodes, 419k+ edges) pre-built over the full codebase. Provides structured, function-level results for cross-file queries that would otherwise require many Grep+Read round-trips.

**Prerequisite:** `pipx` must be installed. The MCP server starts automatically via `pipx run` on first use (one-time ~10s PyPI download, then cached). Rebuild after switching branches: `pipx run code-review-graph==2.3.2 build`.

**Maintainer note:** the pinned version `2.3.2` appears in `.mcp.json`, the two hook commands in `.claude/settings.json`, and the guidance tables below. Bumping requires updating all four locations in sync.

### Use the graph for cross-file traversal

| Task | Tool + pattern | Token advantage |
|------|---------------|-----------------|
| Who calls `foo`? | `query_graph` `callers_of` | ~5k tokens vs ~11k for grep+context (2x cheaper) |
| What does `Foo` call? | `query_graph` `callees_of` | Same advantage as above |
| What files import `bar.js`? | `query_graph` `importers_of` | Structured; no grep context needed |
| Blast radius before a refactor | `get_impact_radius` | ~100 tokens for count + risk score |

### Use Grep/Read for single-file work

| Task | Why Grep wins |
|------|--------------|
| Methods in one file | `children_of` standard = ~2,845 tokens; grep = ~473 tokens (6x cheaper) |
| Recent change review | `detect_changes` requires the graph to be on the same branch |
| Test coverage lookup | `tests_for` returns 0 incorrectly for files with known tests - not reliable |
| Natural-language search | No embeddings built; `semantic_search_nodes` falls back to keyword matching |
| Architecture overview | `get_architecture_overview` returns 3.9M characters - do not call it |

### Mandatory rules

1. **Always pass `detail_level: "minimal"`** - standard mode repeats the full absolute path per node and inflates token cost 6x.
2. **Use fully qualified names**: `path/to/file.js::ClassName.methodName`. Bare names return an "ambiguous" error.
3. **Rebuild on branch switch**: `pipx run code-review-graph==2.3.2 build`. A stale graph causes `detect_changes` to report function names from unrelated files.

### Reliable tools

| Tool | Use when |
|------|----------|
| `query_graph` pattern=`callers_of` | Finding all functions that call a target |
| `query_graph` pattern=`callees_of` | Finding all functions a target calls |
| `query_graph` pattern=`importers_of` | Finding all files that import a target |
| `query_graph` pattern=`children_of` | Listing all methods in a class (use minimal mode) |
| `get_impact_radius` | Quick blast-radius count before a large refactor |
| `semantic_search_nodes` | Name-based lookup by exact or partial function/class name |
