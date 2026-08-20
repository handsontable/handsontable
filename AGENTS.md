# AGENTS.md

This is the **monorepo-level** guide. It carries product-wide rules and a navigation map. Package-specific rules live in each package's own `AGENTS.md` (see [Where to look](#where-to-look)).

## Overview

Handsontable is a JavaScript/TypeScript data grid monorepo (pnpm workspace). It contains the core library plus React, Angular, and Vue 3 wrappers. It runs entirely in the browser — frontend-only, no server-side logic. It cannot access the internet unless explicitly configured (air-gapped environment support). There is no built-in telemetry.

The core package (`handsontable/`) is TypeScript. Wrappers are framework-idiomatic and maintain feature parity with the core.

---

## Where to look

Route to the lowest correct scope. `AGENTS.md` answers "what must I never get wrong here, and where do I look next." `.ai/` answers "how does this work and why." Skills answer "how do I do task X." Package `AGENTS.md` files auto-load when you work in their subtree; the `.ai/` references need an explicit read.

| You are working on | Look here |
|---|---|
| Anything monorepo-wide (build orchestration, release, workspace) | This file; `.ai/` (root) |
| Core grid internals (`handsontable/src/`) | `handsontable/AGENTS.md`; `handsontable/.ai/` |
| Rendering engine (`handsontable/src/3rdparty/walkontable/`) | `handsontable/src/3rdparty/walkontable/AGENTS.md`; `handsontable/src/3rdparty/walkontable/.ai/` |
| Documentation site (`docs/`) | `docs/AGENTS.md` |
| React wrapper | `wrappers/react-wrapper/AGENTS.md` |
| Angular wrapper | `wrappers/angular-wrapper/AGENTS.md` |
| Vue 3 wrapper | `wrappers/vue3/AGENTS.md` |
| Visual regression tests | `visual-tests/AGENTS.md` |
| Playwright functional E2E tier (`tests/`) | `tests/AGENTS.md` |
| Test-generation evals (meaningfulness scorer + fixtures) | `evals/README.md` |
| Step-by-step task workflows | `.claude/skills/` (e.g., `handsontable-dev`, `handsontable-plugin-dev`, `handsontable-code-review`, `pr-creation`) |

`.ai/` reference locations:

| `.ai/` location | Scope |
|---|---|
| `.ai/` (root) | Monorepo — stack, structure, build, testing overview, MCP tooling |
| `handsontable/.ai/` | Core — architecture, conventions, concerns, structure, integrations, testing detail |
| `handsontable/src/3rdparty/walkontable/.ai/` | Rendering engine — architecture, concerns |

In every directory, `CLAUDE.md` is a symlink to its sibling `AGENTS.md`. Edit `AGENTS.md` — the symlink keeps Claude Code and Cursor reading the same single source.

### Cross-file code queries: use the code-review-graph MCP

A pre-built Tree-sitter knowledge graph over the whole monorepo answers cross-file questions far more cheaply than walking call chains with Grep+Read. For any of: "who calls X", "what imports Y", "where is X used", rename impact, PR blast radius, or dead-code hunting — query the graph FIRST. In Claude Code, its tools are deferred at session start — load the schemas with one `ToolSearch` call (e.g. `select:mcp__code-review-graph__query_graph_tool,mcp__code-review-graph__get_impact_radius_tool`), then query. In agents without deferred tool loading (e.g. Cursor), skip that step — the graph tools are callable directly. Plain Grep stays the right tool for single-symbol, single-file lookups. Full workflow (modes, staleness, rebuild after branch switches): `.ai/MCP.md`, plus the `code-graph` skill in Claude Code.

---

## Workspace packages

| Package | Directory | Purpose |
|---|---|---|
| `handsontable` | `handsontable/` | Core data grid (TypeScript) |
| `@handsontable/react-wrapper` | `wrappers/react-wrapper/` | React wrapper |
| `@handsontable/angular-wrapper` | `wrappers/angular-wrapper/` | Angular wrapper |
| `@handsontable/vue3` | `wrappers/vue3/` | Vue 3 wrapper |
| `handsontable-visual-tests` | `visual-tests/` | Playwright visual regression tests |
| `handsontable-tests` | `tests/` | Playwright functional E2E suite (theme × bundle matrix) |
| `handsontable-examples-internal` | `examples/` | Code examples |
| `handsontable-documentation` | `docs/` | Documentation site (requires Node 22) |

The authoritative workspace list is `pnpm-workspace.yaml`.

---

## Prerequisites

- **Node.js 22** (see `.nvmrc`). The docs site (`docs/`) uses its own Node 20.
- **pnpm 10.30.2** (see `packageManager` in root `package.json`); activate via `corepack enable && corepack prepare pnpm@10.30.2 --activate`.

---

## Build, lint, test

Run package scripts with `npm --prefix <dir>` from the workspace root:

- **Build core**: `npm --prefix handsontable run build` (do this before wrapper tests — wrappers consume the built `handsontable/tmp/` output).
- **Lint core**: `npm --prefix handsontable run eslint` and `npm --prefix handsontable run stylelint`.
- **Unit tests (core)**: `npm --prefix handsontable run test:unit` (Jest, ~2200 tests).
- **E2E tests (core)**: `npm --prefix handsontable run test:e2e` (Puppeteer/Jasmine, headless Chrome).
- **Walkontable tests**: `npm --prefix handsontable run test:walkontable` (separate pipeline).
- **React tests**: `npm --prefix wrappers/react-wrapper run test`.
- **Vue3 tests**: `npm --prefix wrappers/vue3 run test`.
- **Angular tests**: `npm --prefix wrappers/angular-wrapper run test` (uses `--openssl-legacy-provider` automatically).

Inside an individual package (e.g., `cd handsontable`), use `npm run ...` directly. For build output paths, variants, and core task details, see `handsontable/AGENTS.md`.

---

## Breaking changes policy

**Agents must try to avoid introducing breaking changes** — the single most important constraint; existing customers depend on API stability. When a solution requires one, state it in **bold**.

- **Never change a default setting value** — strictly forbidden.
- Keep renamed CSS classes, APIs, hooks, and options working. **Legacy** = kept forever, no warning. **Deprecated** = works until the next stable release, then removed, with a one-time console warning.
- Tests must verify the old name still works.

Full rules (what counts, the per-change table, legacy vs deprecated, what is NOT breaking): **`.ai/BREAKING-CHANGES.md`**.

---

## Mandatory checklist for every change

Every code change produced by an agent **must** satisfy all of the following:

1. **Tests are required, and machine-enforced.** A change to `handsontable/src/**` or `wrappers/**` must ship a matching test change (the presence gate checks this on every PR). The *kind* follows the change: **unit** (Jest, `*.unit.js`) for logic, **E2E** for anything a user can see or do — and **new E2E is Playwright** (`tests/e2e/*.spec.ts`); the Jasmine/Puppeteer `*.spec.js` suite is frozen (edit existing specs, but do not add new ones — migrate broken ones to Playwright). A pure refactor needs no new test if declared with a `Refactor-only: <reason>` commit trailer. Full decision rules: `handsontable/.ai/TESTING.md`. The local gates that enforce this **before** a commit/PR (pre-commit + pre-push + the Claude Code hooks) and the exact rules for creating tests, enforcement hooks, and skills are in **`.ai/LOCAL-ENFORCEMENT.md`** (run `npx lefthook install` once).
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

These standards apply to **all** documentation across the monorepo — guides, the API reference (JSDoc/Typedoc inside `handsontable/src`), code comments, changelog entries, release notes, migration guides, and READMEs. An agent editing core JSDoc applies them without opening `docs/AGENTS.md`. **Full reference: `.ai/DOC-STANDARDS.md`** (the complete 13 writing-style rules, migration-guide spec, trademark rules, and docs branch conventions). The docs *site* has additional mechanics (frontmatter, sidebar, example embedding, voice overrides) in `docs/AGENTS.md`.

- **When docs are required:** any public-API change updates JSDoc/Typedoc + guides; any user-facing behavior change is documented; any breaking change adds a migration guide step.
- **Writing style (most-violated):** short sentences, active voice, American English (`behavior` not `behaviour`), "you" not "we", Oxford comma, no evaluative adjectives ("easy"/"simple"/"obvious"), en dashes (–) in non-site text. Full list in `.ai/DOC-STANDARDS.md`.
- **Trademarks:** pages mentioning "Excel" (and "Google Sheets") need the trademark disclaimer — see `.ai/DOC-STANDARDS.md`.
- **JSDoc format:** always use the multiline block style — never the single-line form. Every JSDoc comment must be written as:
  ```js
  /**
   * Description here.
   */
  ```
  Never: `/** Description here. */`. Applies to all `.ts`, `.mjs`, and `.js` source files.

---

## Git and branching

### Branch naming

- Feature branches: `feature/issue-xxxx` (e.g., `feature/issue-9024`)
- Documentation branches: `docs/issue-xxxx` (e.g., `docs/issue-9024`)

(Release and LTS branches are maintainer-managed; the `pr-creation` skill has the full convention.)

### Git rules

- **Never force-push** to `master`, `develop`, or feature branches bound to Pull Requests. Force-pushing diverges history in other clones and makes PR review history incomprehensible.
- Follow the **Git flow** branching strategy.

---

## Pull requests and changelog

### PR requirements

- Every PR that changes package source code must include a changelog entry. Use the `changelog-creation` and `pr-creation` skills for the entry format and PR flow.
- The changelog gate is path-aware: docs-, test-, and CI/tooling-only PRs pass it automatically. To skip it on a genuine source change (`handsontable/src/**` or `wrappers/**`), write `[skip changelog]` in the PR description — outside HTML comments; a commented mention (like the PR template's hint) is inert.
- PRs are merged using **"Squash and merge"** in the GitHub UI by the PR author after full approval.
- The PR author addresses reviewer comments. The reviewer confirms resolution by clicking **Resolve conversation**.

### Changelog format

Follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format. Changelog entries live in `.changelogs/`; see `.changelogs/README.md` for full details. The root changelog is `CHANGELOG.md`.

### Visibility of work

- If a task spans multiple days, create a draft PR and commit daily.

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
- CLA must be signed before merging external contributions. This is enforced automatically: a GitHub App sets the required `cla/signed` status check on every PR, so an unsigned PR cannot be merged — never work around a red CLA check. One signature covers both Handsontable and HyperFormula (it is recorded per GitHub account, not per repository). Process and signing page: <https://cla.handsontable.com/>; contributor-facing summary in [`CONTRIBUTING.md`](CONTRIBUTING.md#contributor-license-agreement).

---

## Monorepo gotchas

- Direct `toLocaleLowerCase`/`toLocaleUpperCase` calls are forbidden in core source — use `localeLowerCase()` from `handsontable/src/helpers/string.ts`. Enforced by `no-restricted-syntax` in `handsontable/.eslintrc.js`.
- **JavaScript methods newer than `browser-targets.js` are forbidden in core source.** `browser-targets.js` (Chrome >= 110, Firefox >= 110, Safari >= 14.1) feeds the rspack/swc build configs in `handsontable/.config/` through `BROWSERS_LIST`, and swc lowers **syntax only** — it never injects core-js polyfills. So an instance or static method that a targeted engine lacks throws `X is not a function` on a *supported* browser. Banned via `no-restricted-syntax` in `handsontable/.eslintrc.js`: `toSorted`/`toSpliced`/`toReversed` (Firefox 115+, Safari 16.0+), `with` (Firefox 140+, Safari 16.0+), `at`/`findLast`/`findLastIndex`, `Object.hasOwn` (Safari 15.4+), and `structuredClone` (no `core-js-compat` entry; `compat/compat` reports it unsupported in Safari 14.1). Check any new method's floor against `core-js-compat`'s `data.json` and add it to that rule. `eslint-plugin-compat` is already wired to `BROWSERS_LIST` but only resolves globals and static calls (`Object.hasOwn`, `structuredClone`) — it does **not** see prototype methods on non-literal receivers, which is how `toSorted` and `Array#at` shipped in 18.0.0. Test files are exempt (they run on modern Chrome only).
- **The ES floor is declared in three places, and `browser-targets.js` owns two of them.** `BROWSERS_LIST` is the **compile floor** (which syntax the bundles emit). `ES_TARGET` in the same file is the **API floor** — the ES-year bucket every listed browser fully supports — and it is what `handsontable/tsconfig.json` pins as `lib`, so calling a built-in above the floor is a *type* error, not just a lint error. `handsontable/scripts/swc-transpile.mjs` deliberately does **not** follow either: it hardcodes `jsc.target: 'es2021'` with `useDefineForClassFields: false`, because the npm ESM/CJS artifact must keep class fields lowered for Angular's Zone.js. Both invariants (`tsconfig` `lib` === `ES_TARGET`, and the swc target no newer than `ES_TARGET`) are asserted by `handsontable/test/__tests__/esTarget.unit.js`. The third declaration — the "two latest versions" statement in the supported-browsers guide — is about **which browsers we test on**, not the floor we compile for; the two are not the same number and must not be equalized. Raising the floors is a support drop: major-release boundary, pinned integers, team sign-off.
- The CSS `:has()` relational pseudo-class is forbidden in `handsontable/src/**/*.{css,scss}` — it makes Chrome re-run host-page-scaled style invalidation on every grid DOM mutation (every scroll re-render). Drive the style from a JS-toggled class instead. Enforced by the custom stylelint rule `handsontable/no-has-selector` (in `handsontable/.config/plugin/stylelint/`); reviewed exceptions on non-scroll state use `// stylelint-disable-next-line handsontable/no-has-selector -- <reason>`.
- The core build outputs ES/CJS modules to `handsontable/tmp/` for wrappers, UMD/minified bundles to `handsontable/dist/`, and CSS to `handsontable/styles/`. Wrapper packages reference the `tmp/` build via workspace linking.
- Two Handsontable builds exist: `handsontable.js` (base, external deps) and `handsontable.full.js` (includes HyperFormula). When testing build-time behavior, ensure both variants work.
- The Angular wrapper tests use `NODE_OPTIONS=--openssl-legacy-provider`; this is wired into the `test` script.
- `pnpm-workspace.yaml` has `ignoredBuiltDependencies` and `onlyBuiltDependencies` lists. If pnpm warns about ignored build scripts (e.g., `less`), this is expected.
- Root-level `npm run lint` and `npm run test` use a custom `translate-to-native-npm.mjs` script to fan out across all workspace packages.
- CI orchestrators are per-stage: `test.yml` = PRs (+ master push + the rc/stable `workflow_call`); `develop.yml` = the develop push (same reusable modules + trunk-only stages); `publish.yml` = **every** `npm publish` (experimental via a `workflow_run: ['Develop']` chain or an on-demand `workflow_dispatch` from any non-release branch — the dispatch requires ticking the `publish-experimental` checkbox and pauses for an `approvers`-environment sign-off, since npm trusted publishing trusts the workflow *filename* on any ref; rc/stable directly). npm trusted publishing (OIDC) allows **one workflow file per package** and it is pinned to `publish.yml` — never move a publish job to another workflow, and never rename `publish.yml` or the `Develop` workflow name without updating the chain. Never add explicit `permissions:` to develop.yml's module-caller jobs: nested job-level requests (e.g. integration.yml's preview `pull-requests: write`) are validated against the caller grant **statically at run startup**, PR CI cannot see it, and one miss fails every develop push.
- The docs site (`docs/`) uses Node 22 (its own `.nvmrc`) and is not needed for core library development.
- Walkontable (the rendering engine) lives inside `handsontable/src/3rdparty/walkontable/` and has its **own test runner** — do not mix Walkontable tests with main E2E tests.
- No Docker, databases, or external services are required.
