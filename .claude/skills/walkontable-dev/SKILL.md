---
name: walkontable-dev
path: handsontable/src/3rdparty/walkontable/**
description: Use when modifying the Walkontable rendering engine in src/3rdparty/walkontable/ - overlay system, viewport calculations, scroll handling, DOM management, or the TableView bridge between core Handsontable and Walkontable
---

# Walkontable Development Guide

Walkontable is the rendering engine (viewport calculation, DOM rendering, scroll sync, overlays). Rules and traps live in `handsontable/src/3rdparty/walkontable/AGENTS.md`; architecture in `handsontable/src/3rdparty/walkontable/.ai/ARCHITECTURE.md` and `.ai/CONCERNS.md`.

## Architecture boundary

Source is TypeScript in `src/3rdparty/walkontable/src/`, excluded from the main `tsconfig.json`, with its own build/test pipeline. The bridge to core is `TableView` in `src/tableView.ts`. Plugins and core reach Walkontable only through TableView or the public Core API. Inside Walkontable, wrap DOM logic in abstraction modules.

## Dependency injection and DOM geometry reads (mandatory, lint-enforced)

### Dependency injection

`wire.ts` is the single composition root: `buildContext(wot)` returns an `EngineContext`. Each module has a co-located factory `create<Module>Deps(ctx)`; its type is inferred.

```ts
// scroll/scroll.ts: the only place Scroll's deps are declared
export function createScrollDeps(ctx: EngineContext) {
  return { wtSettings: ctx.wtSettings, geometryReader: ctx.geometryReader, getWtTable: ctx.getWtTable /* … */ };
}
export type ScrollDeps = ReturnType<typeof createScrollDeps>;

class Scroll {
  #deps: ScrollDeps;
  constructor(deps: ScrollDeps) { this.#deps = deps; }
}
```

- Store deps in private `#deps`; take a single `deps` constructor argument (plus at most one per-instance identity arg: table `name`, overlay `type`, event `parent`, corner-overlay sibling refs).
- Infer the `*Deps` type with `ReturnType<typeof createXDeps>`.
- Add a read-only `get deps()` over `#deps` only where JS forces external reach: a base class whose subclasses need it (`Overlay`), runtime mixins (`Table`), or a helper read by a collaborator (`RowUtils`, `ColumnUtils`).
- Inject the stable owner (`getWtViewport()`). Volatile per-draw objects (calculator, filter) go stale; read volatile ranges fresh off the owner (see the `rowRangeQuery`/`columnRangeQuery` mixins in `table/rangeQuery/virtualRange.ts`).
- Copy an existing module to add one; `scroll/scroll.ts` is the simplest template.

### DOM geometry reads go through the `GeometryReader` proxy

Layout-forcing reads go through the injected reader: `getBoundingClientRect`, `getClientRects`, `getComputedStyle`, `offsetWidth`/`offsetHeight`/`offsetTop`/`offsetLeft`/`offsetParent`, `clientWidth`/`clientHeight`, `scrollWidth`/`scrollHeight`, and the `helpers/dom/element` measurement helpers (`offset`, `outerWidth`/`outerHeight`, element `innerWidth`/`innerHeight`, `getMaximumScrollTop`/`getMaximumScrollLeft`, `getScrollbarWidth`, `getStyle`). The reader is the seam a future per-draw `CachingGeometryReader` replaces.

Scroll-position and window-viewport reads are read directly: `scrollX`/`scrollY`/`pageXOffset`/`pageYOffset`, element `scrollTop`/`scrollLeft`, window `innerWidth`/`innerHeight`. For a polymorphic element-or-window scroll position use the raw `getScrollLeft`/`getScrollTop` helper (it also survives an iframe realm boundary, where the `instanceof Window`-gated helper returns `undefined`).

```ts
const rect = this.#deps.geometryReader.getBoundingClientRect(el);
const w = this.#deps.geometryReader.offsetWidth(el);
const top = rootWindow.scrollY;       // direct
```

Reader handles: `this.#deps.geometryReader` (most modules), `this.deps.geometryReader` (overlays/table), `wotInstance.domBindings.geometryReader` when only the instance is in hand (`utils/pointerToCoords.ts`, `selection/border/border.ts`).

Writes (`el.scrollTop = n`, `el.style.x = …`) and `this.<field>` (stored state, even when named `clientHeight`/`scrollTop`) are direct.

When the proxy lacks a method for a layout-forcing read, add it to both `domMeasure/geometryReader.ts` (interface) and `domMeasure/liveGeometryReader.ts` (live adapter), then use it.

ESLint rule `handsontable/no-direct-dom-geometry-read` (`error`) covers all of `src/3rdparty/walkontable/src` except `domMeasure/**`. The rule lives in `handsontable/.config/plugin/eslint/rules/` and is a pnpm `file:` dependency that is copied, not symlinked: after editing the rule (or on a checkout that predates it) run `pnpm install`, or eslint fails with "definition not found".

## Key subsystems

- **Overlay system** (6 types): frozen rows/columns and scroll sync. Fragile; read `.ai/CONCERNS.md` before touching overlay positioning or synchronization.
- **Viewport calculation**, **Renderer** (DOM element reuse, painting), **Scroll handling** (`requestAnimationFrame` batching).

## Single-pass layout and sizing

The engine predicts scrollbars from numbers instead of render, measure, re-render:

- `viewport/boxLayout/`: `resolveLayout()` is a pure function solving the workspace / inner / viewport / hider box decomposition and the two-variable scrollbar fix-point into an immutable `LayoutSnapshot`. `gatherLayoutInput.ts` is the one impure adapter. `Viewport.beginDrawLayout()` resolves the snapshot once per master draw, after the size caches are built and before the calculators run.
- `axisSizing/`: intended size of one row/column: `AxisSizeSource` port (`axisSizeSource.ts`, `defaultSizeSource.ts`), prefix-sum caches (`positionCache.ts`), border-box conversion (`boxModel.ts`), size getters and oversized-content measurement (`sizeGetters.ts`, `oversizedRows.ts`).

**`singlePassLayout` escape hatch.** The prediction is used only in element mode with uniform sizes and the `singlePassLayout` setting on. `TableView` sets it to `false` whenever `mergeCells` is enabled (a virtualized merged cell's height depends on the viewport being computed); window-scrolled tables fall back to measurement too. Any new method that reads `getLayout()` must branch on `singlePassLayout` and window mode and fall back to a direct DOM measure otherwise; without that branch, merged-cell and window-scrolled tables break. `Viewport.usesLayoutSnapshotForCalculators()` is the gate predicate.

Draw orchestration: `table/drawCycle.ts`; `Table.draw()` delegates to the class-free `runDrawCycle(table, fastDraw)`.

## Known technical debt (details in `.ai/CONCERNS.md`)

- DAO layer is replaced by constructor injection + `wire.ts`. Pass narrow `deps` objects, never the whole `wot` god-object.
- Deep `wot` decoupling is deferred: overlays still reach the master via `this.wot.wtTable`/`.wtViewport`/`.wtOverlays`. The `Clone` is a second Walkontable instance holding a handle to the master. Leave both until the planned stage.
- Filter objects are recreated every render pass.
- 6 overlay types with complex positioning; changes frequently regress frozen row/column scenarios.

## Performance rules

- Batch scroll events with `requestAnimationFrame`.
- Use a `forEach` loop instead of `arr.push(...largeArray)` at 10k+ elements.
- Reuse DOM elements; batch DOM reads before DOM writes.

## Testing

Walkontable has its own runner, separate from the main E2E pipeline.

- Run: `npm run test:walkontable --prefix handsontable`
- Location: `src/3rdparty/walkontable/test/`
- Test with frozen rows and columns enabled to cover overlay edge cases.
- A change to viewport calculation, overlay positioning, row/column sizing, or scroll sync gets an engine-tier spec. Existing Jasmine specs under `src/3rdparty/walkontable/test/` may be edited; new coverage goes to `tests/e2e/walkontable/*.spec.ts` with a page object in `tests/fixtures/pages/walkontable/` (tier reference: `frozen-column-row-heights.spec.ts` + `FrozenTallCellPage.ts`). A page-object method that scrolls ends on a render-state probe (first rendered row, a draw counter) instead of `scrollTop`, because the redraw is rAF-batched and lands after the scroll position settles. Copy `OverlaysPage.scrollToEnd()` (ends on the last cell being rendered); `FrozenTallCellPage.scrollVerticallyTo()` ends on `scrollTop`, so its spec polls `masterFirstRenderedRow()` itself after every scroll. Rules: `handsontable-playwright-e2e`, `references/determinism.md`.

## Key source files

| Path | Purpose |
|---|---|
| `src/3rdparty/walkontable/src/` | All Walkontable source |
| `src/tableView.ts` | Bridge to core (the boundary for plugins) |
| `src/3rdparty/walkontable/src/overlay/` | Overlay system |
| `src/3rdparty/walkontable/src/render/` | DOM rendering |
| `src/3rdparty/walkontable/src/viewport/boxLayout/` | Layout snapshot + scrollbar fix-point solver |
| `src/3rdparty/walkontable/src/axisSizing/` | Size sources, prefix-sum caches, box model |
| `src/3rdparty/walkontable/src/domMeasure/` | `GeometryReader` proxy + live adapter |
| `src/3rdparty/walkontable/src/table/drawCycle.ts` | `runDrawCycle` |
| `src/3rdparty/walkontable/src/wire.ts` | Composition root (`buildContext` → `EngineContext`) |

## Common mistakes

- Plugin or core code touching Walkontable DOM elements instead of going through TableView.
- Direct layout-forcing DOM reads instead of the `GeometryReader` proxy.
- Hand-written `*Deps` interface, or passing the whole `wot` into a module.
- Running Walkontable tests through the main E2E pipeline.
- Skipping frozen rows and columns in tests.
- Calling a `#method` of `MasterTable` from a path the base `Table` constructor reaches. `Table`'s constructor calls `alignOverlaysWithTrimmingContainer()` before `MasterTable`'s own fields exist, so a `#method` call there throws `Receiver must be an instance of class MasterTable` (the brand check fails like a `#field` read). Guard field reads with the existing `fieldsInitialized` check (`#trimmingCache in this`), and put logic that must run on that path in a module-level function that takes the table (`alignHolderWithSplitOwners(table, …)` in `table/regions/masterTable.ts` is the pattern).
- Reading `this.trimmingContainer` on an overlay to decide something about the other axis. Each region overlay holds the owner of its own axis only (top/bottom → vertical, inline-start → horizontal), and the two can differ; ask `wtViewport.isVerticallyScrollableByWindow()` / `isHorizontallyScrollableByWindow()`. Rules and split mode: "Per-axis trimming containers" in `handsontable/src/3rdparty/walkontable/AGENTS.md`.

## TypeScript gotchas

### 1. Generalize the signature instead of casting

When a function receives a value whose shape varies, make the signature generic instead of casting with `as SomeType` (or `<SomeType>value`). For `any`, take a type parameter; use `unknown` at boundaries and narrow with a type guard.

```ts
function getFirst<T>(items: T[]): T { return items[0]; }
const row = getFirst(rows); // typed as UserRow
```

### 1a. DOM narrowing

Narrow a `Node | Element | null` with `isHTMLElement` from `src/helpers/dom/element.ts` wherever you would write `x as HTMLElement`, `x instanceof HTMLElement`, or a `nodeType === Node.ELEMENT_NODE` guard. From Walkontable source the import is `../../../../helpers/dom/element` (adjust `../` count to file depth).

```ts
if (isHTMLElement(node.nextSibling)) { /* HTMLElement here */ }
```

### 2. Declarations are generated

Fix the JSDoc/export in the `.ts` source and rerun `npm run build:types`; `handsontable/tmp/` stays generated.

### 3. `import type` for types

```ts
import type { ViewportColumnsCalculator } from './calculator/viewportColumns';
```

### 4. Shared types live in `core/`

| Type | Location |
|---|---|
| `GridSettings`, `Events`, `HookKey` | `src/core/settings.ts` |
| `HotInstance` | `src/core/types.ts` |

Import them with `import type`; never paste a partial copy of `GridSettings`/`HotInstance` into the file you are editing (a local copy drifts from the real signature).

### 5. Private fields use `#`; callbacks are arrow-function class fields

```ts
class Overlay {
  #cachedWidth: number | null = null;
  #onScroll = (): void => { /* `this` is bound */ };
}
```

`@private` JSDoc tags and `.bind(this)` are forbidden.

### 6. Cognitive complexity ≤ 15 per function

ESLint fails the build above it; extract a helper.
