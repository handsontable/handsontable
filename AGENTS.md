# AGENTS.md

This is the **monorepo-level** guide. It carries product-wide rules and a navigation map. Package-specific rules live in each package's own `AGENTS.md` (see [Where to look](#where-to-look)).

## Overview

Handsontable is a JavaScript/TypeScript data grid monorepo (pnpm workspace). It contains the core library plus React, Angular, and Vue 3 wrappers. It runs entirely in the browser — frontend-only, no server-side logic. It cannot access the internet unless explicitly configured (air-gapped environment support). There is no built-in telemetry.

The core package (`handsontable/`) is TypeScript. Wrappers are framework-idiomatic and maintain feature parity with the core.

---

## Where to look

Route to the lowest correct scope. `AGENTS.md` answers "what must I never get wrong here, and where do I look next." `.ai/` answers "how does this work and why." Skills answer "how do I do task X."

| You are working on | Read |
|---|---|
| Anything monorepo-wide (build orchestration, release, workspace) | This file; `.ai/` (root) |
| Core grid internals (`handsontable/src/`) | `handsontable/AGENTS.md`; `handsontable/.ai/` |
| Rendering engine (`handsontable/src/3rdparty/walkontable/`) | `handsontable/src/3rdparty/walkontable/AGENTS.md`; `handsontable/src/3rdparty/walkontable/.ai/` |
| Documentation site (`docs/`) | `docs/AGENTS.md` |
| React wrapper | `wrappers/react-wrapper/AGENTS.md` |
| Angular wrapper | `wrappers/angular-wrapper/AGENTS.md` |
| Vue 3 wrapper | `wrappers/vue3/AGENTS.md` |
| Visual regression tests | `visual-tests/AGENTS.md` |
| Step-by-step task workflows | `.claude/skills/` (e.g., `handsontable-dev`, `handsontable-plugin-dev`, `linting`, `pr-creation`) |

`.ai/` reference locations:

| `.ai/` location | Scope |
|---|---|
| `.ai/` (root) | Monorepo — stack, structure, build/release, testing overview, MCP tooling |
| `handsontable/.ai/` | Core — architecture, conventions, concerns, structure, integrations, testing detail |
| `handsontable/src/3rdparty/walkontable/.ai/` | Rendering engine — architecture, concerns |

---

## Workspace packages

| Package | Directory | Purpose |
|---|---|---|
| `handsontable` | `handsontable/` | Core data grid (TypeScript) |
| `@handsontable/react-wrapper` | `wrappers/react-wrapper/` | React wrapper |
| `@handsontable/angular-wrapper` | `wrappers/angular-wrapper/` | Angular wrapper |
| `@handsontable/vue3` | `wrappers/vue3/` | Vue 3 wrapper |
| `handsontable-visual-tests` | `visual-tests/` | Playwright visual regression tests |
| `handsontable-examples-internal` | `examples/` | Code examples |
| `handsontable-documentation` | `docs/` | Documentation site (requires Node 20) |

The authoritative workspace list is `pnpm-workspace.yaml`.

---

## Prerequisites

- **Node.js 22** (see `.nvmrc`). The docs site (`docs/`) uses its own Node 20.
- **pnpm 10.30.2** (see `packageManager` in root `package.json`); activate via `corepack enable && corepack prepare pnpm@10.30.2 --activate`.

---

## Build, lint, test

Run monorepo-level commands with `pnpm` from the workspace root:

- **Build core**: `pnpm --filter handsontable run build` (do this before wrapper tests — wrappers consume the built `handsontable/tmp/` output).
- **Lint core**: `pnpm --filter handsontable run eslint` and `pnpm --filter handsontable run stylelint`.
- **Unit tests (core)**: `pnpm --filter handsontable run test:unit` (Jest, ~2200 tests).
- **E2E tests (core)**: `pnpm --filter handsontable run test:e2e` (Puppeteer/Jasmine, headless Chrome).
- **Walkontable tests**: `pnpm --filter handsontable run test:walkontable` (separate pipeline).
- **React tests**: `pnpm --filter @handsontable/react-wrapper run test`.
- **Vue3 tests**: `pnpm --filter @handsontable/vue3 run test`.
- **Angular tests**: `pnpm --filter @handsontable/angular-wrapper run test` (uses `--openssl-legacy-provider` automatically).

Inside an individual package (e.g., `cd handsontable`), use `npm run ...` directly. For build output paths, variants, and core task details, see `handsontable/AGENTS.md`.

---

## Breaking changes policy

**Agents must try to avoid introducing breaking changes.** This is the single most important constraint. Existing customers depend on API stability. When a solution requires a breaking change, state it in **bold**.

### What counts as a breaking change

| Change | Why it breaks | What to do instead |
|---|---|---|
| Renaming a CSS class produced by Handsontable | Breaks custom stylesheets | Keep the legacy class name in the DOM. Add tests verifying the old name still works. |
| Renaming APIs (methods, configuration options, hooks) | Breaks customer integrations | Keep the legacy API working and translate it to the new API internally. Legacy APIs do not produce console warnings. |
| Changing API signatures or behavior | Breaks customer integrations | Keep the deprecated API working until the next stable release. Deprecated APIs produce a console warning (fired only once). |
| Removing hooks or configuration options | May go undetected by customers | Add the hook or option to the list of removed hooks so an error shows when someone uses it in configuration. |
| Changing a default setting value | 🚫 **Strictly forbidden** — a "really bad" breaking change. | Never change defaults. |

### Legacy vs deprecated

- **Legacy**: Old API kept working forever alongside the new API. No console warnings. The legacy feature set may be frozen. Tests must verify the old name keeps working.
- **Deprecated**: Old API works until the next stable release, then is removed. Produces a one-time console warning. Tests must verify the old name keeps working until removal.

### What is NOT considered breaking

Changes to JavaScript APIs not listed in the public API reference (e.g., internal Walkontable code that does not affect the DOM or CSS). Note such changes in release notes.

---

## Mandatory checklist for every change

Every code change produced by an agent **must** satisfy all of the following:

1. **Tests are required.** Every change must include both **unit tests** (Jest, `*.unit.js`) and **E2E tests** (Jasmine/Puppeteer, `*.spec.js`). No change is complete without test coverage for the new or modified behavior.
2. **Documentation must be updated.** If a change affects the public API, configuration options, hooks, behavior, or user-facing experience, update the corresponding documentation (guides, API reference via JSDoc/Typedoc, migration guide) in the same change. See [Documentation standards](#documentation-standards-all-packages).
3. **Update AGENTS.md.** If a change introduces new conventions, patterns, constraints, file locations, or gotchas that future agents should know, update the `AGENTS.md` at the correct scope.

---

## Architecture constraints

High-level principles. Core-internal detail lives in `handsontable/.ai/ARCHITECTURE.md`.

- **Frontend-only**: No server-side logic. Everything runs in the browser. No network requests unless the user explicitly configures them.
- **Microkernel plugin system**: All extensions hook into the core through the plugin API. Respect the plugin lifecycle (see `handsontable/AGENTS.md`).
- **Cascading configuration**: All feature configuration must work with the cascading model (`cell` → `column` → `global`).
- **Design system theming**: CSS variables are the public API for theme customization. The token hierarchy is declared in Figma and exported as CSS variables.
- **Framework wrapper parity**: Official wrappers (React, Angular, Vue) must be idiomatic for each framework and maintain feature parity.
- **XSS prevention**: Strict input sanitization on user-facing cell content, custom formulas, and cell scripts. Safe plugin architecture to minimize attack surfaces.
- **Internationalization**: Must handle RTL layouts, Unicode input (IME), and translations.
- **No global namespace pollution**: Integration via NPM/CDN must not pollute the global namespace.
- **Minimal dependencies**: Avoid adding third-party libraries (see [Dependency management](#dependency-management)).
- **Functional continuity**: Each release must include no less functionality than its predecessor.

---

## Documentation standards (all packages)

These standards apply to **all** documentation across the monorepo — guides, the API reference (JSDoc/Typedoc inside `handsontable/src`), code comments, changelog entries, release notes, migration guides, and READMEs. An agent editing core JSDoc applies these without opening `docs/AGENTS.md`. The docs *site* has additional mechanics (frontmatter, sidebar, example embedding, and its own voice overrides) in `docs/AGENTS.md`.

### When documentation is required

- Any change to a public API (methods, options, hooks, plugins, typings, errors) **must** update the corresponding JSDoc/Typedoc comments and guides.
- Any change to user-facing behavior or look-and-feel **must** be documented.
- Any breaking change **must** include a migration guide step (see below).
- A PR that adds a new documentation page is included in the changelog (do not use `[skip changelog]`).

### Documentation branch conventions

- Feature docs branches: `docs/issue-xxxx` (e.g., `docs/issue-9024`), branched from the feature branch or `develop`.
- Release docs branches: `release/x.y.z-docs`, branched from `release/x.y.z`.
- Documentation-only PRs use `[skip changelog]` in the PR description, **unless** the PR adds a new documentation page.

### Writing style rules

Apply to all documentation text — guides, JSDoc comments, changelog entries, migration guides, and PR descriptions.

1. **Short sentences.** Split longer sentences in two.
2. **Active voice.** Never passive. ("Configure the parameters" not "The parameters should be configured.")
3. **Simple verb syntax.** ("To ensure performance…" not "In order to ensure that the system will be capable of…")
4. **American English spelling.** (`recognize`, `program`, `behavior`, not `recognise`, `programme`, `behaviour`.)
5. **Commonized forms.** `frontend`, `backend`, `webhook`, `internet` (not `front-end`, `back end`, `web hook`, `Internet`).
6. **Use "you" not "we".** ("In this example, you can see…" not "In this example, we can see…")
7. **Oxford comma.** Use a comma before `and`/`or` in lists of 3 or more items. ("berries, apples, and bacon.")
8. **No evaluative adjectives.** Eliminate "easy", "simple", "obvious", "straightforward" from explanations.
9. **Do not assume user background knowledge.** Bridge the gap between specialists and non-specialists.
10. **Max 3 adjectives before a noun.**
11. **Clause separators.** Use en dashes (–) in non-site text (JSDoc, changelog, migration guides). The docs *site* uses hyphens or double hyphens instead — see `docs/AGENTS.md` 2.2.
12. **Consistent 3rd-party naming.** Use official capitalization: `Node.js`, `webpack`, `GitLab`, `TypeScript`.
13. **PR descriptions**: Use plain, concise language. Avoid literary wording — developers need to parse it quickly.

### Migration guide requirements

A migration guide is required for every major release and some minor releases. Each breaking change needs a separate migration guide step that includes:

1. Who the breaking change affects.
2. A brief reason for the change (what the user gains).
3. A brief description of the change itself.
4. What the user needs to do (step-by-step, with substeps if needed).
5. Code examples (before/after).
6. Links to more detailed information (new pages, PRs).

Follow the structure of previous migration guides for consistency. Migration guides live in `docs/content/guides/upgrade-and-migration/`.

### Trademark rules

- Any documentation page mentioning "Excel" must include the Microsoft/Excel trademark disclaimer.
- If the page also mentions "Google Sheets", use the expanded disclaimer covering both trademarks.
- Avoid third-party trademarks in documentation unless practically necessary (e.g., to describe compatibility or integration).

---

## Git and branching

### Branch naming

- Feature branches: `feature/issue-xxxx` (e.g., `feature/issue-9024`)
- Documentation branches: `docs/issue-xxxx` (e.g., `docs/issue-9024`)
- Release branches: `release/x.y.z`
- LTS branches: `lts/[major].x`

### Git rules

- **Never force-push** to `master`, `develop`, or feature branches bound to Pull Requests. Force-pushing diverges history in other clones and makes PR review history incomprehensible.
- Follow the **Git flow** branching strategy.

### Versioning

- Uses **SemVer**. Patch releases are for critical fixes only.
- Even-numbered major releases (16, 18, 20, 22) become **LTS releases**.
- Odd-numbered major releases (17, 19, 21) are **Current-only** (6-month lifecycle).
- No more than 4 major releases per year (preferably 0). If multiple breaking changes are needed, bulk them into a single major release.

---

## Pull requests and changelog

### PR requirements

- Every PR must be connected to a GitHub issue.
- Every PR that changes package source code must include a changelog entry.
- To create a changelog entry, run: `bin/changelog entry` (interactive CLI).
- To skip changelog (for non-source-code changes only), write `[skip changelog]` in the PR description.
- PRs are merged using **"Squash and merge"** in the GitHub UI by the PR author after full approval.
- The PR author addresses reviewer comments. The reviewer confirms resolution by clicking **Resolve conversation**.

### Changelog format

Follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format. Changelog entries live in `.changelogs/`; see `.changelogs/README.md` for full details. The root changelog is `CHANGELOG.md`.

### Visibility of work

- If a task spans multiple days, create a draft PR and commit daily.
- All work must be tracked as a GitHub issue. If no issue exists, create one.

---

## Dependency management

- **Discuss with the team before adding any third-party dependency.**
- All dependencies must have permissive open-source licenses (MIT, BSD, Apache, etc.).
- All dependencies must be actively maintained.
- These rules apply transitively to all sub-dependencies.
- Adding dependencies under non-permissive licenses requires notifying clients through the Sales team.

---

## Security

- Strict XSS prevention in user-facing cell content.
- Input sanitization on custom formulas and cell scripts.
- Safe plugin architecture to minimize attack surfaces.
- CLA must be signed before merging external contributions.

---

## Monorepo gotchas

- The core build outputs ES/CJS modules to `handsontable/tmp/` for wrappers, UMD/minified bundles to `handsontable/dist/`, and CSS to `handsontable/styles/`. Wrapper packages reference the `tmp/` build via workspace linking.
- Two Handsontable builds exist: `handsontable.js` (base, external deps) and `handsontable.full.js` (includes HyperFormula). When testing build-time behavior, ensure both variants work.
- The Angular wrapper tests use `NODE_OPTIONS=--openssl-legacy-provider`; this is wired into the `test` script.
- `pnpm-workspace.yaml` has `ignoredBuiltDependencies` and `onlyBuiltDependencies` lists. If pnpm warns about ignored build scripts (e.g., `less`), this is expected.
- Root-level `npm run lint` and `npm run test` use a custom `translate-to-native-npm.mjs` script to fan out across all workspace packages.
- The docs site (`docs/`) uses Node 20 (its own `.nvmrc`) and is not needed for core library development.
- Walkontable (the rendering engine) lives inside `handsontable/src/3rdparty/walkontable/` and has its **own test runner** — do not mix Walkontable tests with main E2E tests.
- No Docker, databases, or external services are required.
