# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Handsontable is a JavaScript/TypeScript data grid monorepo (pnpm workspace). It contains the core library plus React, Angular, and Vue 3 wrappers. It operates entirely in the browser (frontend-only, no server-side logic) and cannot access the internet unless explicitly configured (air-gapped environment support). There is no built-in telemetry.

### Workspace packages

| Package | Directory | Purpose |
|---|---|---|
| `handsontable` | `handsontable/` | Core data grid (vanilla JS) |
| `@handsontable/react-wrapper` | `wrappers/react-wrapper/` | React wrapper |
| `@handsontable/angular-wrapper` | `wrappers/angular-wrapper/` | Angular wrapper |
| `@handsontable/vue3` | `wrappers/vue3/` | Vue 3 wrapper |
| `handsontable-visual-tests` | `visual-tests/` | Playwright visual regression tests |
| `handsontable-examples-internal` | `examples/` | Code examples |
| `handsontable-documentation` | `docs/` | VuePress docs site (requires Node 20) |

### Prerequisites

- **Node.js 22** (see `.nvmrc`)
- **pnpm 10.30.2** (see `packageManager` in root `package.json`); activate via `corepack enable && corepack prepare pnpm@10.30.2 --activate`

### Build, lint, test

All commands below run from the workspace root (`/workspace`).

- **Build core**: `pnpm --filter handsontable run build` (must be done before wrapper tests, since wrappers depend on the built `tmp/` output)
- **Lint core**: `pnpm --filter handsontable run eslint` and `pnpm --filter handsontable run stylelint`
- **Unit tests (core)**: `pnpm --filter handsontable run test:unit` (Jest, ~2200 tests)
- **E2E tests (core)**: `pnpm --filter handsontable run test:e2e` (Puppeteer/Jasmine, headless Chrome)
- **React tests**: `pnpm --filter @handsontable/react-wrapper run test`
- **Vue3 tests**: `pnpm --filter @handsontable/vue3 run test`
- **Angular tests**: `pnpm --filter @handsontable/angular-wrapper run test` (requires `--openssl-legacy-provider`; already handled via `cross-env` in `package.json` scripts)

### Output formats

The library outputs ES Modules and UMD bundles (UMD as legacy support).

---

## Breaking changes policy

**Agents must try to avoid introducing breaking changes.** This is the single most important constraint. Existing customers depend on API stability. When a solution requires a Breaking Change, it must be stated in **bold**.

### What counts as a breaking change

| Change | Why it breaks | What to do instead |
|---|---|---|
| Renaming a CSS class produced by Handsontable | Breaks custom stylesheets | Keep the legacy class name in the DOM. Add tests verifying the old name still works. |
| Renaming APIs (methods, configuration options, hooks) | Breaks customer integrations | Keep the legacy API working and translate it to the new API internally. Legacy APIs do not produce console warnings. |
| Changing API signatures or behavior | Breaks customer integrations | Keep the deprecated API working until the next stable release. Deprecated APIs produce a console warning (fired only once). |
| Removing hooks or configuration options | May go completely undetected by customers | Add the hook/option to the list of removed hooks so an error is shown when someone uses it in configuration. |
| Changing a default setting value | 🚫 **Strictly forbidden** — this is considered a "really bad" breaking change. | Never change defaults. |

### Legacy vs deprecated

- **Legacy**: Old API is kept working forever alongside the new API. No console warnings. Feature set of the legacy API may be frozen. Tests must verify the old name continues to work.
- **Deprecated**: Old API works until the next stable release, then is removed. Produces a one-time console warning. Tests must verify the old name continues to work until removal.

### What is NOT considered breaking

Changes to JavaScript APIs that are **not listed in the public API reference** (e.g., internal Walkontable code changes that don't affect the DOM or CSS). Such changes should still be noted in release notes.

---

## Mandatory checklist for every change

Every code change produced by an agent **must** satisfy all of the following:

1. **Tests are required.** Every change must include both **unit tests** (Jest) and **E2E tests** (Jasmine/Puppeteer). No change is considered complete without test coverage for the new or modified behavior.
2. **Documentation must be updated.** If a change affects the public API, configuration options, hooks, behavior, or user-facing experience, the corresponding documentation (guides, API reference via JSDoc/Typedoc, migration guide) **must** be updated as part of the same change.
3. **Update AGENTS.md.** If a change introduces new conventions, patterns, constraints, file locations, or gotchas that future agents should know about, this `AGENTS.md` file **must** be updated to reflect them.

---

## Code style and conventions

- **Coding style**: Modified [Airbnb JavaScript style](https://github.com/airbnb/javascript), enforced by the ESLint configuration in the monorepo.
- **Formatting**: Rely on the project's ESLint config. Do not override formatting rules.
- **Separate CSS and JS**: Do not mix CSS into JavaScript files (this may change after Theme API introduction).
- **DRY**: Reuse existing helpers and mixins. Do not duplicate code. If a piece of code repeats, create a new helper. Write generic code that can be reused across modules and plugins.
- **Method ordering**: Public methods first, then `@private` listeners.
- **Destructors**: Remove all variables in destructors (after `hot.destroy()`).
- **Browser compatibility**: Ensure chosen CSS and JS APIs are supported in all supported browsers (Chrome, Firefox, Safari — two latest major versions, Edge). Check `https://handsontable.com/docs/supported-browsers/`.

### Naming conventions

- Always use `Handsontable` in text, never `HOT`. Exception: instances of the Handsontable class are usually called `hot`.
- Use full names: `row` and `columns` (not `cols`).

### JSDoc / Typedoc

Both public and private APIs must be documented with JSDoc/Typedoc comments. The public API reference is generated automatically from these comments.

---

## Architecture constraints

These constraints must be respected in all code changes:

- **Frontend-only**: No server-side logic. Everything runs in the browser.
- **No network access**: The library must not make network requests unless explicitly configured by the user.
- **Microkernel plugin system**: All extensions hook into the core through the plugin API. When building or modifying plugins, respect the plugin lifecycle (initialization, enable/disable).
- **Cascading configuration**: All feature configuration must work with Handsontable's cascading configuration model (`cell` → `column` → `global`).
- **Design system theming**: CSS variables are the public API for theme customization. The design system uses a token hierarchy declared in Figma and exported as CSS variables.
- **Framework wrapper parity**: Official wrappers (React, Angular, Vue) must be idiomatic for each framework and maintain feature parity.
- **XSS prevention**: Strict input sanitization on user-facing cell content, custom formulas, and cell scripts.
- **Internationalization**: Must handle RTL layouts, Unicode input (IME), and translations.
- **No global namespace pollution**: Integration via NPM/CDN must not pollute the global namespace.
- **Minimal dependencies**: Avoid adding third-party libraries. If you must, discuss with the team first. All dependencies must have permissive open-source licenses (MIT, BSD, Apache, etc.) and be actively maintained. This applies transitively to sub-dependencies.
- **Functional continuity**: Each release must include no less functionality than its predecessor.

---

## Testing requirements

Handsontable uses two testing frameworks:
- **Jest** for unit tests (`__tests__/` or `test/spec/` directories next to source files)
- **Jasmine** (with Puppeteer, headless Chrome) for browser E2E tests (`handsontable/test/e2e/`)

### What to test

- Aim for 100% code coverage of new or modified code.
- Test all possible states including edge cases.
- Plugins, renderers, and editors must be tested against:
  - `hot.updateSettings()`
  - `hot.getPlugin('{PluginName}').enablePlugin(); hot.render();`
  - `hot.getPlugin('{PluginName}').disablePlugin(); hot.render();`
- Verify no regressions in related functionality.
- Check that no exceptions are displayed in the console.

### Large dataset testing

- When fixing bugs or adding features that handle data arrays, add unit tests with **50k+ rows** to catch stack overflow and performance issues.

### Selection testing

- Test non-consecutive selections (Ctrl/Cmd+click), row/column header selections, and active selection layers when modifying selection-related code.

### Visual regression tests

- Playwright visual regression tests are in `visual-tests/`.

---

## Performance rules

- **Avoid spread operator with large arrays**: When working with potentially large arrays (10k+ elements), never use `arr.push(...largeArray)`. This causes stack overflow. Use `forEach` loops instead.
- **Batch scroll events**: Use `requestAnimationFrame` to batch scroll event updates and prevent excessive redraws. Target smooth 60fps with 100k+ row datasets.
- **Performance must not degrade**: Measured in library size, rendering performance, and memory consumption. Performance should gradually improve over time.

---

## Git and branching

### Branch naming

- Feature branches: `feature/issue-xxxx` (e.g., `feature/issue-9024`)
- Documentation branches: `docs/issue-xxxx` (e.g., `docs/issue-9024`)
- Release branches: `release/x.y.z`
- LTS branches: `lts/[major].x`

### Git rules

- **Never force-push** to `master`, `develop`, or feature branches bound to Pull Requests. Force-pushing diverges history in other people's clones and makes PR review history incomprehensible.
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
- Every PR that changes package source code must include a changelog entry as explained in `.changelogs/README.md`.
- To skip changelog (for non-source-code changes only), write `[skip changelog]` in the PR description.
- PRs are merged using **"Squash and merge"** in the GitHub UI by the PR author after full approval.
- The PR author is responsible for addressing reviewer comments. The reviewer confirms resolution by clicking **Resolve conversation**.

### Changelog format

- Follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

### Visibility of work

- If a task spans multiple days, create a draft PR and commit daily.
- All work must be tracked as a GitHub issue. If no issue exists, create one.

---

## API design guidelines

- Make all necessary methods available in the public API.
- APIs must be discoverable, documented in guides, and usable in real-world applications.
- All configuration options must fit into the cascading configuration model.
- TypeScript typings must be maintained and accurate.
- The public API must provide good code completion in IDEs and AI coding assistants.

---

## React wrapper specifics

- When calling `updateSettings()` in the React wrapper, **preserve and restore selection state** using `selection.exportSelection()` and `selection.importSelection()` to maintain non-consecutive selections, active layers, and focus positions across React re-renders.

---

## Column stretching

- Always respect defined column widths as **minimum values**.
- If a column would shrink below its base width, disable stretching entirely.
- Different stretching strategies (`'all'`, `'last'`) must behave consistently regarding minimum width handling.

---

## Plugin development

- Use the Handsontable plugin skeleton template.
- Respect plugin initialization and enable/disable lifecycle.
- `this.addHook()` in plugin context is different from `this.addHook()` in `hot` instance context.
- Safe plugin architecture to minimize attack surfaces.

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

## Gotchas

- The core build outputs to `handsontable/tmp/` (not `dist/` for wrappers' consumption). The UMD/minified builds go to `handsontable/dist/` and CSS to `handsontable/styles/`. Wrapper packages reference the `tmp/` build via workspace linking.
- The Angular wrapper tests use `NODE_OPTIONS=--openssl-legacy-provider`; this is already wired into the `test` script.
- The `pnpm-workspace.yaml` has `ignoredBuiltDependencies` and `onlyBuiltDependencies` lists. If pnpm warns about ignored build scripts (e.g., `less`), this is expected.
- Root-level `npm run lint` and `npm run test` scripts use a custom `translate-to-native-npm.mjs` script to fan out across all workspace packages.
- The docs site (`docs/`) uses Node 20 (its own `.nvmrc`) and is not needed for core library development.
- No Docker, databases, or external services are required.

---

## File locations reference

| Area | Path |
|---|---|
| HTML parsing | `handsontable/src/utils/parseTable.js` |
| Scroll handling | `handsontable/src/3rdparty/walkontable/src/overlays.js` |
| Column stretching | `handsontable/src/plugins/stretchColumns/strategies/` |
| Selection logic | `handsontable/src/selection/` |
| React wrapper core | `wrappers/react-wrapper/src/hotTableInner.tsx` |
| Unit tests | `__tests__/` or `test/spec/` directories next to source files |
| E2E tests | `handsontable/test/e2e/` |
| Visual regression tests | `visual-tests/` |
| Changelog entries | `.changelogs/` |
| ESLint config | Root monorepo config |
| Build config | `handsontable/hot.config.js` and `handsontable/.config/` |
