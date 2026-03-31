# AGENTS.md

## Overview

Handsontable is a JavaScript data grid monorepo (pnpm workspace). It contains the core library plus React, Angular, and Vue 3 wrappers. It operates entirely in the browser (frontend-only, no server-side logic) and cannot access the internet unless explicitly configured (air-gapped environment support). There is no built-in telemetry.

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
| Confusing physical, visual, and renderable coordinates | See [Three coordinate systems](#three-coordinate-systems). |
| Creating `.ts` files in `handsontable/src/` | Core is JavaScript. TypeScript definitions live in `handsontable/types/` as `.d.ts` files. |
| Forgetting `super.enablePlugin()` / `super.disablePlugin()` in plugins | See [Plugin lifecycle](#plugin-lifecycle). |
| Hardcoding user-visible text in source code | Add language constants in `src/i18n/constants.js` and update all language files in `src/i18n/languages/`. |
| Using `.bind(this)` for hook/event callbacks | Use arrow-function class fields (`#onAfterX = () => { ... }`) instead. |
| Direct cross-plugin imports | Use hooks for inter-plugin communication or `hot.getPlugin('{Name}')` if API access is required. |

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
| `handsontable-documentation` | `docs/` | VuePress docs site (requires Node 20) |

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
- **Walkontable tests**: `pnpm --filter handsontable run test:walkontable` (separate pipeline)
- **Wrapper tests**: `pnpm --filter @handsontable/react-wrapper run test`, `pnpm --filter @handsontable/vue3 run test`, `pnpm --filter @handsontable/angular-wrapper run test`

Inside individual packages (e.g., `cd handsontable`), use `npm run ...` directly.

### Build outputs

| Output | Path |
|---|---|
| UMD / minified bundles | `handsontable/dist/` |
| ES and CJS modules (used by wrappers) | `handsontable/tmp/` |
| Compiled CSS | `handsontable/styles/` |

Two build variants: `handsontable.js` (base, external deps) and `handsontable.full.js` (includes HyperFormula).

---

## Breaking changes policy

**Agents must try to avoid introducing breaking changes.** This is the single most important constraint.

| Change | Why it breaks | What to do instead |
|---|---|---|
| Renaming a CSS class | Breaks custom stylesheets | Keep the legacy class name in the DOM. Test old name still works. |
| Renaming APIs (methods, options, hooks) | Breaks customer integrations | Keep the legacy API working. No console warnings for legacy APIs. |
| Changing API signatures or behavior | Breaks customer integrations | Deprecated API works until next stable release. One-time console warning. |
| Removing hooks or options | May go undetected by customers | Add to removed hooks list so an error is shown. |
| Changing a default setting value | **Strictly forbidden** | Never change defaults. |

### Legacy vs deprecated

- **Legacy**: Old API kept working forever. No console warnings. Tests must verify old name works.
- **Deprecated**: Old API works until next stable release, then removed. One-time console warning. Tests must verify old name works until removal.

### What is NOT considered breaking

Changes to JavaScript APIs that are **not listed in the public API reference** (e.g., internal Walkontable code changes that don't affect the DOM or CSS). Such changes should still be noted in release notes.

---

## Mandatory checklist for every change

1. **Tests are required.** Include both **unit tests** (`*.unit.js`) and **E2E tests** (`*.spec.js`).
2. **Documentation must be updated.** If a change affects public API, hooks, behavior, or UX, update JSDoc/Typedoc comments and guides.
3. **Update AGENTS.md.** If a change introduces new conventions, constraints, or gotchas.
4. **Use red-green TDD.** Write a failing test first, then implement the fix.

---

## Code style and conventions

### Formatting (enforced by ESLint)

- **Style base**: Modified Airbnb JavaScript style
- **Indentation**: 2 spaces
- **Quotes**: Single quotes only
- **Max line length**: 120 characters (ignores comments and long `it()` test names)
- **JSDoc**: `jsdoc/require-jsdoc` is set to `error` for all exported functions

### Custom ESLint rules

| Rule | What it enforces |
|---|---|
| `handsontable/no-native-error-throw` | Must use `throwWithCause()`, not `throw new Error()` |
| `handsontable/restricted-module-imports` | No imports from barrel index files |
| `handsontable/require-async-in-it` | All `it()` in `*.spec.js` must be `async` |
| `handsontable/require-await` | Specific HOT API calls must be `await`-ed |
| `no-restricted-globals` | `window`, `document`, `console`, `Handsontable` are banned |
| `compat/compat` | Browser API compatibility against `browser-targets.js` |

### General conventions

- **Separate CSS and JS**: Never mix CSS into JavaScript files.
- **DRY**: Reuse existing helpers and mixins. Extract duplicated code into shared methods.
- **Method ordering**: Public methods first, then private listeners.
- **Destructors**: Remove all variables in destructors (after `hot.destroy()`).
- **Browser compatibility**: Ensure CSS and JS APIs are supported in all browsers listed in `browser-targets.js`.
- **Bundle size**: Prefer grammar that produces smaller output in compressed bundles (e.g., `===` over verbose helpers, short-circuit evaluation over full `if` blocks).
- **Silent `catch` blocks**: Must include a comment explaining why the error is swallowed.
- **Optional chaining (`?.`)**: Use only when a value is genuinely optional by design, not as a blanket safety net. If a value is guaranteed by the data contract, access it directly without `?.`.

### Private fields and methods

- Use the `#` prefix for private class fields/methods instead of `@private` JSDoc tags.
- Exception: when `#` is avoided for performance reasons, `@private` JSDoc tag is acceptable.

### Naming conventions

- Always use `Handsontable` in text, never `HOT`. Exception: instances are usually called `hot`.
- Use full names: `row` and `columns` (not `cols`).
- **Public API names** (options, hooks, methods) must be generic and self-explanatory. Avoid internal jargon or abbreviations. Check for collisions with existing API names before approving.

### JSDoc / Typedoc

- All public and private APIs must have JSDoc comments.
- New hooks and configuration options must include a `@since` tag.
- Allowed custom tags: `@plugin`, `@util`, `@experimental`, `@deprecated`, `@preserve`, `@core`, `@TODO`, `@category`.
- No HTML tags in descriptions -- use Markdown. Line breaks use empty lines, never `<br>`.
- Links: `[[MY_LINK]]` syntax, not `{@link MY_LINK}`. End every sentence with a full stop.

### TypeScript definitions (`handsontable/types/`)

- Avoid bare `object` in `.d.ts` files -- use or import specific types.
- Do not duplicate type definitions across plugins. Import from their source.

---

## Plugin architecture

All plugins extend `BasePlugin` from `src/plugins/base/base.js`.

### Required static properties

```js
class MyPlugin extends BasePlugin {
  static get PLUGIN_KEY() { return 'myPlugin'; }
  static get PLUGIN_PRIORITY() { return 150; }
  static get SETTING_KEYS() { return ['myPlugin']; }
  static get PLUGIN_DEPS() { return ['plugin:AutoRowSize']; }
}
```

### Method lifecycle (in order)

1. `constructor(hotInstance)` -- receives HOT instance as `this.hot`
2. `isEnabled()` -- return truthy/falsy based on `this.hot.getSettings()[PLUGIN_KEY]`
3. `enablePlugin()` -- set up hooks via `this.addHook()`, register IndexMapper maps. **Call `super.enablePlugin()` at the end.**
4. `updatePlugin()` -- typical: `this.disablePlugin(); this.enablePlugin(); super.updatePlugin();`
5. `disablePlugin()` -- **Call `super.disablePlugin()` (clears EventManager and hooks).** Then clean up.
6. `destroy()` -- final teardown. **Call `super.destroy()` at the end.**

### Hook registration

Plugins that introduce new hooks register them at module level, outside the class:

```js
import Hooks from '../../core/hooks';
Hooks.getSingleton().register('beforeMyAction');
Hooks.getSingleton().register('afterMyAction');
```

**Important:** `this.addHook()` (BasePlugin method) auto-cleans hooks on `disablePlugin()`. `this.hot.addHook()` does not.

### Plugin registration

New plugins must be wired through `src/plugins/index.js` and exported from their own `index.js`:

```js
export { PLUGIN_KEY, PLUGIN_PRIORITY, MyPlugin } from './myPlugin';
```

### Plugin decoupling rules

- Plugins must **not** directly import or check for the presence of other plugins. Use hooks (event-driven communication) instead.
- If access to another plugin's API is required, use `hot.getPlugin('{Name}')`.
- No circular dependencies between plugins.
- Do not re-implement another plugin's methods. Listen to hooks and react.

### Conflict ownership

When a plugin is incompatible with another, the plugin that introduces the conflict owns the disabling/blocking logic. Other plugins should not contain awareness checks.

### Configuration rules

- New options should be **disabled by default** in `src/dataMap/metaManager/metaSchema.js`.
- New options should support the cascading configuration model (`cell` -> `column` -> `global`) when applicable. If table-level only, document this in JSDoc.

---

## Three coordinate systems

| Coordinate type | Description | Example |
|---|---|---|
| **Physical** | Position in the source data array | Row 5 in the original dataset |
| **Visual** | Position in the DataMap (after trimming) | Row 3 if rows 0-1 were trimmed |
| **Renderable** | Position in the DOM (after hiding) | Row 2 if one visual row is hidden |

Plugins must translate between these systems using `IndexMapper` (`hot.rowIndexMapper` / `hot.columnIndexMapper`).

| Map type | Effect |
|---|---|
| `HidingMap` | Index stays in DataMap but is **not rendered** in the DOM |
| `TrimmingMap` | Index is **removed from DataMap** entirely |

---

## Testing requirements

Three test pipelines: **Jest** (unit), **Jasmine/Puppeteer** (E2E), **Walkontable** (separate).

| Type | Pattern | Framework | Location |
|---|---|---|---|
| Unit test | `*.unit.js` | Jest (jsdom) | `src/**/__tests__/` |
| E2E test | `*.spec.js` | Jasmine (Puppeteer) | `test/e2e/` and `src/plugins/**/__tests__/` |
| Type test | `*.types.ts` | `tsc` only | `test/types/` |

### Standard E2E test boilerplate

```js
describe('MyPlugin', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should do something', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      myPlugin: true,
    });

    await selectCell(0, 0);
    expect(getDataAtCell(0, 0)).toBe('A1');
  });
});
```

### Global test helpers

`test/helpers/common.js` exposes all HOT API methods as globals -- **no imports needed** in spec files: `handsontable()`, `createSpreadsheetData()`, `selectCell()`, `getCell()`, `getDataAtCell()`, `getData()`, `getPlugin()`, `render()`, `destroy()`, `updateSettings()`, `spec()`.

Additional helpers: `mouseEvents.js`, `keyboardEvents.js`, `asciiTable.js`.

### What to test

- 100% coverage of new or modified code.
- Test all possible states including edge cases.
- Plugins must be tested against: `updateSettings()`, programmatic `enablePlugin()`/`disablePlugin()`.
- Add unit tests with **50k+ rows** when handling data arrays.
- Test non-consecutive selections and header selections when modifying selection code.

---

## Documentation rules

### When documentation is required

- Any change to public API, options, hooks, or user-facing behavior **must** update JSDoc/Typedoc comments and guides.
- Any breaking change **must** include a migration guide step.
- New documentation pages should be included in the changelog.

### Writing style

1. Short sentences. Active voice. American English spelling.
2. Use "you" not "we". Oxford comma.
3. No evaluative adjectives ("easy", "simple", "obvious").
4. Use en dashes (-) to separate clauses, not hyphens.
5. Consistent naming: `Node.js`, `webpack`, `TypeScript`.

### Trademark rules

- Pages mentioning "Excel" must include the Microsoft/Excel trademark disclaimer.
- Pages also mentioning "Google Sheets" use the expanded disclaimer.

---

## Architecture constraints

- **Frontend-only**: No server-side logic. No network requests unless user-configured.
- **Microkernel plugin system**: All extensions hook into the core through the plugin API.
- **Cascading configuration**: `cell` -> `column` -> `global`.
- **Design system theming**: CSS variables are the public API for theme customization.
- **Framework wrapper parity**: React, Angular, Vue wrappers must be idiomatic and maintain feature parity.
- **XSS prevention**: Strict input sanitization on user-facing cell content.
- **Internationalization**: RTL layouts, Unicode input (IME), translations. All user-facing strings go through `src/i18n/`.
- **No global namespace pollution**.
- **Minimal dependencies**: Discuss with the team before adding any third-party dependency. Must have permissive licenses (MIT, BSD, Apache). Applies transitively.

---

## Performance rules

- **No spread with large arrays**: Never `arr.push(...largeArray)` with 10k+ elements. Use `forEach`.
- **Batch rendering**: Use `batch()` / `batchRender()` / `suspendRender()` / `resumeRender()` for multiple operations.
- **Batch scroll events**: Use `requestAnimationFrame`.
- **No degradation**: Library size, rendering performance, and memory consumption must not degrade.

---

## Git and branching

- Feature branches: `feature/issue-xxxx`
- Documentation branches: `docs/issue-xxxx`
- Release branches: `release/x.y.z`
- **Never force-push** to `master`, `develop`, or PR-bound branches.
- **SemVer**: Even-numbered majors (16, 18, 20) become LTS.

---

## Pull requests and changelog

- Every PR must be connected to a GitHub issue.
- Every PR that changes source code must include a changelog entry (`bin/changelog entry`).
- Use `[skip changelog]` only for non-source-code changes.
- PRs are merged using **"Squash and merge"**.

---

## Accessibility (a11y)

- Preserve WCAG 2.1 AA conformance.
- Do not regress keyboard navigation. Both modes must work:
  - Spreadsheet mode: `navigableHeaders: false`, `tabNavigation: true`.
  - Data grid mode: `navigableHeaders: true`, `tabNavigation: false`.
- Verify ARIA semantics after changes to rendering, selection, headers, frozen areas, or merged cells.
- New UI elements must use semantic HTML with sufficient color contrast.

---

## React wrapper specifics

When calling `updateSettings()` in the React wrapper, **preserve and restore selection state** using `selection.exportSelection()` and `selection.importSelection()`.

---

## Column stretching

- Always respect defined column widths as **minimum values**.
- If a column would shrink below its base width, disable stretching entirely.

---

## File locations reference

| Area | Path |
|---|---|
| Core class | `handsontable/src/core.js` |
| Full entry point | `handsontable/src/index.js` |
| Base (tree-shakeable) entry | `handsontable/src/base.js` |
| Module registry | `handsontable/src/registry.js` |
| TableView (Core-Walkontable bridge) | `handsontable/src/tableView.js` |
| Plugin base class | `handsontable/src/plugins/base/base.js` |
| Plugin registry | `handsontable/src/plugins/registry.js` |
| Meta schema (defaults) | `handsontable/src/dataMap/metaManager/metaSchema.js` |
| Index translations | `handsontable/src/translations/` |
| Selection logic | `handsontable/src/selection/` |
| Walkontable engine | `handsontable/src/3rdparty/walkontable/src/` |
| Hooks system | `handsontable/src/core/hooks/` |
| Error helpers | `handsontable/src/helpers/errors.js` |
| Console helpers | `handsontable/src/helpers/console.js` |
| i18n constants | `handsontable/src/i18n/constants.js` |
| i18n language files | `handsontable/src/i18n/languages/` |
| TypeScript definitions | `handsontable/types/` |
| E2E tests | `handsontable/test/e2e/` |
| Test helpers | `handsontable/test/helpers/` |
| Visual regression tests | `visual-tests/` |
| Changelog entries | `.changelogs/` |
| Changelog CLI | `bin/changelog` |
| Guides and examples | `docs/content/` |
| Migration guides | `docs/content/guides/upgrade-and-migration/` |
| Browser targets | `browser-targets.js` (root) |
| ESLint config | `.eslintrc.js` (root) and `handsontable/.eslintrc.js` |

---

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
| Changing a default setting value | Strictly forbidden — this is considered a "really bad" breaking change. | Never change defaults. |

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

- Wrappers consume `handsontable/tmp/` (not `dist/`). Build core before running wrapper tests.
- Two builds: `handsontable.js` (base) and `handsontable.full.js` (includes HyperFormula). Test both.
- Angular wrapper tests use `NODE_OPTIONS=--openssl-legacy-provider` (already in the `test` script).
- The docs site (`docs/`) uses Node 20 and is not needed for core development.
- Walkontable has its **own test runner** -- do not mix with main E2E tests.
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

### Testing preference

- For bug fixes in `handsontable/`, add both a focused unit test and a focused E2E regression test when practical.
