---
name: handsontable-dev
description: >
  Use for ANY work touching the `handsontable/` core package: fixing bugs, adding features,
  modifying TypeScript types, removing as-casts, writing or debugging plugins, editors,
  renderers, validators, cell types, hooks, shortcuts, selection, helpers, index translations,
  or i18n. Also use for how-to questions about core internals (plugin lifecycle, coordinate
  systems, hook registration, TypeScript conventions). Triggers on file paths under
  `handsontable/src/` (excluding `3rdparty/walkontable/` which has its own skill), or when
  the user describes a symptom in the core grid without naming a file. This is the primary
  entry point for all core Handsontable development — when in doubt, load it.
---

# Handsontable Core Development

## Dispatch table — always invoke the specialist first

Always invoke `architecture-review` alongside the task-specific specialist — it carries the SOLID / Law-of-Demeter / plugin-decoupling / breaking-changes rules that apply to **every** change, not just reviews. Treat its checks as the design lens; treat the task skill as the implementation guide.

| Task | Skill |
|---|---|
| Any feature / fix in core (design-level rules) | `architecture-review` — load first, regardless of task |
| Create / modify a **plugin** | `handsontable-plugin-dev` |
| Create / modify an **editor** | `handsontable-editor-dev` |
| Create / modify a **renderer** | `handsontable-renderer-dev` |
| Create / modify a **validator** | `handsontable-validator-dev` |
| Create / modify a **cell type** | `handsontable-celltype-dev` |
| Write / modify **E2E tests** (`*.spec.js`) | `handsontable-e2e-testing` |
| Write / modify **unit tests** (`*.unit.js`) | `handsontable-unit-testing` |
| Build a **demo / test page** | `handsontable-demo-page` |
| Work on **CSS / themes** | `handsontable-css-dev` |
| Walkontable rendering engine | `walkontable-dev` / `walkontable-testing` |
| Lint violations | `linting` |
| Coordinate translation (physical/visual/renderable) | `coordinate-systems` |
| i18n / translations | `i18n-translations` |
| Visual regression tests | `visual-testing` |
| Docs pages | `writing-docs-pages` |

The task-specific skills hold the deep how-to. `architecture-review` holds the design constraints. This skill holds the TS conventions that cut across both.

## Design rules from `architecture-review` (apply to every change)

The full rules live in that skill — load it for the complete checklist. The non-negotiables to keep in mind while writing or modifying code:

- **Plugin decoupling.** No direct cross-plugin imports. Talk via hooks; reach for another plugin's API only through `hot.getPlugin('Name')`. No circular plugin dependencies.
- **Conflict ownership.** The plugin that introduces an incompatibility owns the blocking logic. Don't sprinkle `if (otherPluginEnabled) return;` checks across unrelated plugins. For hard conflicts, use `registerConflict()` from `src/plugins/base/conflictRegistry.ts` at module load time.
- **Law of Demeter.** No `this.hot.view.wt.wtTable`-style deep chains. Each layer has a public API — use it. Go through `TableView` or `Core` for Walkontable data.
- **SOLID where it bites.** Single Responsibility per plugin (one purpose, UI separated from logic). Open/Closed via hooks, never patch another plugin's internals. Liskov — honor the full `BasePlugin` contract (lifecycle methods + static properties).
- **Cascading config.** New options should fit the `cell → column → global` model when applicable. If an option is table-level only (like `data`), document that explicitly in JSDoc.
- **Breaking changes are forbidden by default.** Renamed CSS classes must keep the legacy class in the DOM. Renamed APIs must keep the old name working (no warnings for legacy, one-time warning for deprecated). **Never change a default setting value.** Removed hooks/options must go on the removed list so misuse throws.
- **Convention over configuration.** Zero-config for the common case. Red flags: new options whose value is the same in every call site (should be the default), new directories that break the existing taxonomy, explicit wiring where auto-discovery would do.
- **Gold standard.** When in doubt, read `src/plugins/pagination/pagination.ts` — it's the reference implementation for plugin structure, settings validation, conflict registration, and focus management.

---

## File layout

```
src/plugins/{pluginName}/        index.ts, {pluginName}.ts, types.ts?, __tests__/
src/editors/{editorName}/        index.ts, {editorName}.ts
src/renderers/{rendererName}/    index.ts, {rendererName}.ts
src/validators/{validatorName}/  index.ts, {validatorName}.ts
src/cellTypes/{typeName}/        index.ts, {typeName}.ts
```

Test files stay as `.js`: `*.spec.js` (E2E) and `*.unit.js` (unit).

`handsontable/src/` is fully TypeScript. `.d.ts` files are **auto-generated** by `npm run build:types` directly into `handsontable/tmp/`.

---

## TypeScript gotchas — read this before editing types

These are the highest-impact mistakes in this codebase. Most lint passes won't catch them; reviewers will.

### 1. Don't cast — generalize the signature

The wrong reflex is to silence a type error with `as SomeType` (or `<SomeType>value`). Casts are an assertion that you know better than the compiler — and the next refactor breaks silently.

When a function receives a value whose shape varies, **change the signature to be generic** rather than casting at the call site.

```ts
// ✗ Bad — casts hide assumptions
function getFirst(items: unknown[]): SomeRow {
  return items[0] as SomeRow;
}
const row = getFirst(rows) as UserRow;

// ✓ Good — generic preserves the caller's knowledge
function getFirst<T>(items: T[]): T {
  return items[0];
}
const row = getFirst(rows); // typed as UserRow
```

The same applies to `any`. If you need `any` to make something compile, the function should usually take a type parameter instead. Reach for `unknown` at boundaries, then narrow with a type guard.

### 1a. DOM narrowing — prefer `isHTMLElement` over `as HTMLElement`

A common DOM pattern is casting a `Node | Element | null` to `HTMLElement`. Use the existing type guard from `src/helpers/dom/element.ts` instead:

```ts
// ✗ Bad — assertion hides the null/non-HTML case
const el = node.nextSibling as HTMLElement;

// ✓ Good — narrows safely with a runtime check
import { isHTMLElement } from '../helpers/dom/element';
if (isHTMLElement(node.nextSibling)) {
  // node.nextSibling is HTMLElement here
}
```

`isHTMLElement` is exported from `src/helpers/dom/element.ts` and is equivalent to `instanceof HTMLElement`. Use it wherever you'd write `x as HTMLElement`, `x instanceof HTMLElement`, or a manual `nodeType === Node.ELEMENT_NODE` guard.

### 2. Don't hand-write mirror `.d.ts` files

Declarations are generated from source. Never edit anything under `handsontable/tmp/`. If a type isn't appearing in the public API, fix the JSDoc/export in the `.ts` source and rerun `npm run build:types`.

Type declarations live exclusively in `handsontable/tmp/` and are regenerated from source — there is no separate `types/` mirror to keep in sync.

### 3. Always `import type` for types

```ts
import type { HotInstance } from '../../core/types';
import type { CellMeta } from '../../common';
```

Mixing value and type imports defeats tree-shaking and creates accidental runtime dependencies on type-only modules.

### 4. Find shared types in `core/` — don't re-declare them inline

There is **no `src/common.ts`**. Shared core types live where they belong:

| Type | Location |
|---|---|
| `GridSettings`, `Events`, `HookKey` | `src/core/settings.ts` |
| `HotInstance` | `src/core/types.ts` |
| Plugin-local types | the plugin's own `types.ts` |

Always reach for them via `import type`:

```ts
import type { HotInstance } from '../../core/types';
import type { GridSettings, HookKey } from '../../core/settings';
```

Don't paste a partial mirror of these interfaces into the file you're editing. That's how drift starts — a method signature ends up typed against a stale local copy. If the existing type is too wide for your call site, narrow it with a generic parameter or a type guard at the boundary; don't fork the type definition.

Adding a new hook:

1. Add the callback signature to `GridSettings` in `src/core/settings.ts`.
2. Register the hook name in `src/core/hooks/constants.ts` / `src/core/hooks/index.ts`.
3. Call `Hooks.getSingleton().register('myHook')` at module level in the plugin file.

### 5. Private fields use `#`, callbacks are arrow-function class fields

```ts
class MyPlugin extends BasePlugin {
  #map: HidingMap | null = null;
  #onAfterRender = (): void => { /* `this` is bound, no .bind() needed */ };
}
```

`@private` JSDoc tags and `.bind(this)` are forbidden. The arrow-field form is also what makes hooks easy to add/remove by reference.

### 6. Keep cognitive complexity ≤ 15 per function

ESLint will fail the build if a function gets too branchy. The fix is almost always to extract a helper — not to silence the rule.

---

## Cross-cutting rules (enforced by ESLint)

| Rule | What to do |
|---|---|
| No `throw new Error()` | Use `throwWithCause('...', cause)` from `src/helpers/errors.ts` |
| No `window` / `document` / `console` globals | Use `this.hot.rootWindow`, `this.hot.rootDocument`, helpers from `src/helpers/console.ts` |
| No raw `setTimeout` / `setInterval` | Use `this.hot._registerTimeout(fn, delay)` — auto-clears on `hot.destroy()` |
| No barrel imports | Import from the specific submodule path, not `plugins/index`, `editors/index`, `renderers/index`, `validators/index`, `cellTypes/index`, `i18n/index`. Only `src/registry.ts` may use barrels. |
| No direct cross-plugin imports | Communicate via hooks or `this.hot.getPlugin('Name')` — never `import` another plugin's class |
| `it()` in `*.spec.js` must be `async` | All `it()` callbacks calling HOT rendering APIs must be `async` with `await` |

---

## DOM and data gotchas

- **Merged cells: read meta, not DOM.** Always read `colspan`/`rowspan` from `hot.getCellMeta(row, col)`, never from `td.colSpan` / `td.rowSpan`. The MergeCells plugin sets `cellProperties.colspan` via `afterGetCellMeta` — that value is authoritative. The DOM attribute may be missing when the cell is outside the viewport, and it ignores custom `afterGetCellMeta` overrides.
- **Coordinate systems matter.** `physical` ≠ `visual` ≠ `renderable`. Use `hot.rowIndexMapper` / `hot.columnIndexMapper` for translation. See the `coordinate-systems` skill.
- **i18n.** No hardcoded user-visible strings. Add constants to `src/i18n/constants.ts` and translations to every file in `src/i18n/languages/`.

---

## Registration wiring

After creating a new component, wire it into the right index/factory:

| Component | Wire into |
|---|---|
| Plugin | `src/plugins/index.ts` |
| Editor | `src/editors/index.ts` + `src/editors/factory.ts` |
| Renderer | `src/renderers/index.ts` + `src/renderers/factory.ts` |
| Validator | `src/validators/index.ts` |
| Cell type | `src/cellTypes/index.ts` |
| Any new option / hook | `src/dataMap/metaManager/metaSchema.ts` + `src/core/settings.ts` |

---

## Build — type declarations

The type build is a **two-step pipeline**:

```bash
npm run build:types        # step 1 — tsc emits tmp/**/*.d.ts
npm run downlevel:types    # step 2 — rewrites post-TS-5.1 lib types to TS 5.1-compatible equivalents
```

Running the full build executes both automatically:

```bash
npm run build              # includes build:types → downlevel:types in sequence
```

Run this after any change that affects the public type surface (new exported function, changed parameter type, new option in `GridSettings`). Wrapper packages consume `handsontable/tmp/` via workspace linking.

### Why the downlevel step exists

The dev compiler is TS 6. TS 5.6+ infers newer lib types (`ArrayIterator`, `IteratorObject`) on iterator return sites, and TS 5.2+ infers `WeakKey` on bare `WeakMap` key types. These don't exist in TS 5.1, so published declarations must not reference them. `scripts/downlevel-dts.mjs` replaces them with TS 5.1 equivalents (`IterableIterator<T>`, `object`). The CI job `verify-emitted-types` enforces this by running `tsc@5.1.6 --noEmit` against `tmp/` on every PR.

### If a new post-TS-5.1 lib type leaks into emit

Two ways to fix it — pick whichever is cleaner:

1. **Annotate at the source.** Add an explicit return type annotation that uses TS 5.1 types, e.g. `: IterableIterator<T>` instead of letting TS 6 infer `ArrayIterator<T>`, or `WeakMap<object, V>` instead of `WeakMap<WeakKey, V>`.

2. **Extend the replacement table.** Add a row to the `REPLACEMENTS` array in `scripts/downlevel-dts.mjs`.

The CI `verify-emitted-types` job reports the exact leaked identifier with `TS2304: Cannot find name '...'`, so it's always clear what to fix.

---

## Mandatory checklist for every change

- [ ] Source file is `.ts`
- [ ] No `as` / `any` casts introduced — used generics or `unknown` + guards instead
- [ ] No `.d.ts` files hand-edited
- [ ] Unit tests written (`*.unit.js`) — pure logic, no mocks
- [ ] E2E tests written (`*.spec.js`) — DOM / rendering behavior
- [ ] `npm run build` (or `build:types` + `downlevel:types`) run if public types changed
- [ ] Wired into all relevant index / factory files
- [ ] Added to `metaSchema.ts` if a new option was introduced
- [ ] JSDoc on all exported functions and classes
- [ ] No breaking change introduced (or the breaking change is explicitly called out)
- [ ] Changelog entry added (`bin/changelog entry`)
