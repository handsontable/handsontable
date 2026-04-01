# AGENTS.md

## Overview

Handsontable is a JavaScript data grid monorepo (pnpm workspace). It contains the core library plus React, Angular, and Vue 3 wrappers. It operates entirely in the browser (frontend-only, no server-side logic) and cannot access the internet unless explicitly configured (air-gapped environment support). There is no built-in telemetry.

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

- **Cognitive complexity**: Keep each function at **15 or below** on the Sonar cognitive-complexity metric (nested conditionals, loops, and boolean operators accumulate). Extract helpers or early-return guards when a function exceeds the limit.
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

### `SETTING_KEYS` and `updateSettings`

- **Array** (usual case): list every top-level Handsontable option name that should trigger `updatePlugin()` when passed to `updateSettings()` (for example other global keys the plugin reacts to, not only `PLUGIN_KEY`).
- **`true`**: the plugin always runs `updatePlugin()` after `updateSettings()`, even when the config object is empty.
- **`false`**: the plugin never auto-updates from `updateSettings()` (you handle changes yourself).

### Plugin class layout (method ordering)

Structure the class so lifecycle and public API stay easy to follow:

1. **Static getters** -- `PLUGIN_KEY`, `PLUGIN_PRIORITY`, `SETTING_KEYS`, `PLUGIN_DEPS`, and when needed `DEFAULT_SETTINGS` and `SETTINGS_VALIDATORS` (see below).
2. **Lifecycle and public instance methods** -- `isEnabled()`, `enablePlugin()`, `updatePlugin()`, `disablePlugin()`, `destroy()`, plus any other **public** methods exposed via `hot.getPlugin(...)`.
3. **Private hook and DOM listeners** -- private arrow-function class fields (`#onAfterX = () => { ... }`) after those methods, matching the global convention: public methods first, then private listeners.

### Settings defaults and validation

**`DEFAULT_SETTINGS`** (static object, default `{}`) -- Default values merged when reading options through `this.getSetting(name)` or `this.getSetting()` for the whole object. Use it so runtime reads do not duplicate fallback logic. Table-level defaults for new options still belong in `metaSchema.js` ([Configuration rules](#configuration-rules)); keep plugin defaults and schema defaults aligned.

**`SETTINGS_VALIDATORS`** (default `null`) -- Optional validation when settings are applied (`init` / `updateSettings`). Invalid values emit a console warning and are ignored; the previous stored value stays.

- **Object map** -- For the usual `myPlugin: { ... }` shape. Keys are option names. Each value is `(newValue) => boolean`; return `false` to reject. Only keys **present** on the incoming settings object are validated and copied; keys omitted from that object are left unchanged (validators do not run for absent keys).
- **Single function** -- For a non-object plugin setting (for example a string or boolean at `myPlugin: 'foo'`). The function is `(newSettings) => boolean` and runs when `typeof newSettings !== 'object'`. If it returns `false`, the whole update is skipped.

**Reading settings** -- Prefer `this.getSetting('key')` inside the plugin. Dot notation is supported for nested keys (for example `this.getSetting('ui.width')`). If a stored setting is a **function** and `SETTINGS_VALIDATORS` is an object with a validator for that key, `getSetting` may wrap the function so the **return value** of user callbacks is validated; invalid returns are warned and treated as no return value.

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

For **hard** conflicts (a plugin must not enable while another top-level setting is truthy), the feature that introduces the incompatibility calls `registerConflict(blockedTargetKeyOrKeys, incompatibleSettingKeys)` from `src/plugins/base/conflictRegistry.js` at module load. The first parameter is the blocked key or keys (usually `PLUGIN_KEY` values). The second parameter, `incompatibleSettingKeys`, is one top-level setting key or an array of keys; the conflict applies when `!!settings[key]` is true for any registered key. DataProvider and Pagination pass one blocked plugin key and an array of incompatible setting keys. The blocked plugin calls `BasePlugin#isHardConflictBlocked()` at the start of `enablePlugin()` (and may clear its setting when blocked, like Pagination). Soft detection of an external data source uses the `hasExternalDataSource` hook (instance handler added by the DataProvider plugin in `enablePlugin()`).

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

## Gotchas

- Wrappers consume `handsontable/tmp/` (not `dist/`). Build core before running wrapper tests.
- Two builds: `handsontable.js` (base) and `handsontable.full.js` (includes HyperFormula). Test both.
- Angular wrapper tests use `NODE_OPTIONS=--openssl-legacy-provider` (already in the `test` script).
- The docs site (`docs/`) uses Node 20 and is not needed for core development.
- Walkontable has its **own test runner** -- do not mix with main E2E tests.
- No Docker, databases, or external services are required.

### Regression checks for resize + CSS scale

- For fixes around `manualColumnResize` and CSS `transform: scale(...)` (e.g. GH #11838), run both:
  - `npm_config_testPathPattern=manualColumnResize/__tests__/utils.unit.js pnpm --filter handsontable run test:unit`
  - `npm_config_testPathPattern=src/plugins/manualColumnResize/__tests__/manualColumnResize.spec.js pnpm --filter handsontable run test:e2e`

### Testing preference

- For bug fixes in `handsontable/`, add both a focused unit test and a focused E2E regression test when practical.
