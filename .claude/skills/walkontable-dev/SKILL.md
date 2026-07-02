---
name: walkontable-dev
path: handsontable/src/3rdparty/walkontable/**
description: Use when modifying the Walkontable rendering engine in src/3rdparty/walkontable/ - overlay system, viewport calculations, scroll handling, DOM management, or the TableView bridge between core Handsontable and Walkontable
---

# Walkontable Development Guide

## What is Walkontable

Walkontable is the low-level rendering engine embedded in Handsontable. It handles viewport calculation, DOM rendering, scroll synchronization, and the overlay system. It is labeled "3rd party" for historical reasons but is maintained in the same repository as the rest of Handsontable.

## Architecture boundary

Walkontable source lives entirely within `src/3rdparty/walkontable/src/` and is **TypeScript** (`.ts` files). It is excluded from the main `tsconfig.json` and has its own separate build/test pipeline. The bridge between core Handsontable and Walkontable is the `TableView` class in `src/tableView.ts`. Plugins must never access Walkontable internals directly — always go through TableView.

## Dependency injection & DOM geometry reads (mandatory)

Two rules here are enforced, not stylistic. They exist so the engine can be optimized later without rewriting call sites — most of the rendering cost is JS, and the planned wins (a per-draw geometry cache, translate/diff scroll) need clean seams to slot into.

### Dependency injection — how modules are wired

The DAO layer is gone. Every module is built by a single composition root, `wire.ts`: `buildContext(wot)` returns an `EngineContext` holding the stable references plus every late-bound/cyclic dependency as a thunk (defined once). Each module has a **co-located factory** `create<Module>Deps(ctx)` and its type is **inferred**, never hand-written:

```ts
// scroll.ts — the ONLY place Scroll's deps are declared
export function createScrollDeps(ctx: EngineContext) {
  return { wtSettings: ctx.wtSettings, geometryReader: ctx.geometryReader, getWtTable: ctx.getWtTable /* … */ };
}
export type ScrollDeps = ReturnType<typeof createScrollDeps>;   // inferred — no hand-written interface

class Scroll {
  #deps: ScrollDeps;
  constructor(deps: ScrollDeps) { this.#deps = deps; }          // single `deps` arg
}
```

Rules when adding or changing a module:
- Store deps in a **private `#deps`**; take a **single `deps` constructor argument** (plus at most one per-instance identity arg — a table `name`, an overlay `type`, an event `parent`, corner-overlay sibling refs).
- **Never hand-write a `*Deps` interface** — infer it with `ReturnType<typeof createXDeps>`, so there is one source of truth and a one-line edit adds a dependency.
- Add a **read-only `get deps()` getter over `#deps` only** where JS forces external reach: a base class whose subclasses need it (`Overlay`), a class with runtime mixins (`Table`), or a helper read by a collaborator (`RowUtils`, `ColumnUtils`). Everywhere else, `#deps` stays private.
- Inject the **stable owner** (`getWtViewport()`), never a volatile per-draw object (a calculator or filter is recreated each draw and goes stale). Read volatile ranges fresh off the owner (that's what the `calculatedRows`/`calculatedColumns` mixins do).
- The fastest way to add a module correctly is to **copy an existing one** — `scroll.ts` is the simplest template.

### DOM geometry reads MUST go through the `GeometryReader` proxy

Any **layout-forcing** DOM read goes through the injected reader — **never read the DOM element directly**. This is the seam a `CachingGeometryReader` will replace to memoize measurements per draw; a single raw read silently escapes the cache and defeats the optimization.

Reads that must be proxied (they force a reflow): `getBoundingClientRect`, `getClientRects`, `getComputedStyle`, `offsetWidth`/`offsetHeight`/`offsetTop`/`offsetLeft`/`offsetParent`, `clientWidth`/`clientHeight`, `scrollWidth`/`scrollHeight` (content size), and the `helpers/dom/element` measurement helpers (`offset`, `outerWidth`/`outerHeight`, element `innerWidth`/`innerHeight`, `getMaximumScrollTop`/`getMaximumScrollLeft`, `getScrollbarWidth`, `getStyle`).

**Scroll-position and window-viewport reads are NOT proxied — read them directly.** `scrollX`/`scrollY`/`pageXOffset`/`pageYOffset`, element `scrollTop`/`scrollLeft`, and window `innerWidth`/`innerHeight` don't force a reflow, so they cost nothing and gain nothing from the cache. Read them straight off the element/window; for a polymorphic element-or-window scroll position use the raw `getScrollLeft`/`getScrollTop` helper. (Bonus: the direct read also survives an iframe realm boundary, where the `instanceof Window`-gated helper returns `undefined`.)

```ts
// ✗ Bad — raw layout-forcing read escapes the proxy (and the future per-draw cache)
const rect = el.getBoundingClientRect();
const w = el.offsetWidth;

// ✓ Good — layout-forcing reads through the injected reader
const rect = this.#deps.geometryReader.getBoundingClientRect(el);
const w = this.#deps.geometryReader.offsetWidth(el);

// ✓ Good — scroll/viewport reads are cheap, read them directly
const top = rootWindow.scrollY;
const left = scrollEl.scrollLeft;
const vw = rootWindow.innerWidth;
```

Access the reader by whichever handle the module has: `this.#deps.geometryReader` (most modules), `this.deps.geometryReader` (via the getter, e.g. overlays/table), or `wotInstance.domBindings.geometryReader` when only the instance is in hand (e.g. `utils/cellCoords.ts`, `selection/border/border.ts`).

**Writes are fine** (`el.scrollTop = n`, `el.style.x = …`) — they don't force layout. So is `this.<field>` even when the field is named `clientHeight`/`scrollTop` (it's stored state, not a DOM read).

**If the proxy has no method for a layout-forcing read you need, add it** — to both `geometry/geometryReader.ts` (the interface) and `geometry/liveGeometryReader.ts` (the live adapter) — then use it. Never fall back to a direct read for a layout-forcing measurement.

**Enforced by ESLint.** The rule `handsontable/no-direct-dom-geometry-read` (`error`) flags any direct read across all of `src/3rdparty/walkontable/src` (only `geometry/**`, the adapter itself, is exempt). It allows access on a `geometryReader`, writes, and `this.<field>`, and its message points you at the fix. The rule lives in `handsontable/.config/plugin/eslint/rules/` and is a pnpm `file:` dependency that is **copied, not symlinked** — after editing the rule (or on a checkout that predates it) run `pnpm install`, or eslint fails with "definition not found".

## Key subsystems

- **Overlay system** (6 types): Manages frozen rows and columns and their scroll synchronization. This subsystem is fragile and well-documented in `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md`. Proceed with extreme caution when modifying overlay positioning or synchronization logic.
- **Viewport calculation**: Determines which rows and columns are visible based on scroll position and container size.
- **Renderer**: DOM element management, row and column painting, cell element reuse.
- **Scroll handling**: Coordinates scroll between overlays and the main table. Uses `requestAnimationFrame` batching.

## Known technical debt

These issues are documented in `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md`:

- **DAO layer (resolved)**: The Data Access Object layer has been replaced by constructor injection + the `wire.ts` composition root (see "Dependency injection & DOM geometry reads" above). Do not reintroduce DAO getters or pass the whole `wot` god-object into a module.
- **Deep `wot` decoupling (deferred)**: Overlays still reach the master through `this.wot.wtTable`/`.wtViewport`/`.wtOverlays` in their hot-path methods. The `Clone` is a second Walkontable instance holding a handle to the master — intentionally left until a later stage; don't pull it forward piecemeal.
- **Filter object recreation**: Walkontable filter objects are recreated on every render pass instead of being updated in place. This is a known performance concern.
- **Overlay complexity**: 6 overlay types with complex positioning logic. Changes here frequently cause regressions in frozen row/column scenarios.

## Performance rules

- Batch scroll events with `requestAnimationFrame`.
- Never use `arr.push(...largeArray)` with 10k+ elements - use a `forEach` loop instead.
- Reuse DOM elements instead of creating new ones.
- Minimize layout thrashing by batching DOM reads before DOM writes.

## Testing

Walkontable has its own dedicated test runner. Do NOT mix Walkontable tests with the main E2E test pipeline.

- **Run tests**: `npm run test:walkontable --prefix handsontable`
- **Test location**: `src/3rdparty/walkontable/test/`
- Always test with frozen rows and columns enabled to cover overlay edge cases.

## Key source files

| Path | Purpose |
|---|---|
| `src/3rdparty/walkontable/src/` | All Walkontable source code |
| `src/tableView.ts` | Bridge to core Handsontable (the safe boundary for plugins) |
| `src/3rdparty/walkontable/src/overlay/` | Overlay system |
| `src/3rdparty/walkontable/src/renderer/` | DOM rendering |

## DOM abstraction rule

**No code in `handsontable/src/` (plugins, core, etc.) should manipulate Walkontable DOM elements directly.** Go through TableView or the public Core API.

Even within Walkontable itself, prefer wrapping DOM logic in abstract modules rather than manipulating elements inline. Direct DOM manipulation makes the code hard to change and maintain. The goal is to keep DOM access behind well-defined abstractions so the rendering strategy can evolve independently.

For **layout-forcing DOM reads** this is not a preference but a hard, lint-enforced rule: they must go through the `GeometryReader` proxy. See "Dependency injection & DOM geometry reads (mandatory)" above.

## Common mistakes

- Accessing or modifying Walkontable DOM elements from plugins or core code instead of going through TableView.
- Reading layout-forcing DOM geometry directly (`el.getBoundingClientRect()`, `.offsetWidth`, `getComputedStyle`, `.scrollWidth`, …) instead of through the injected `GeometryReader` proxy — this is lint-enforced and breaks the future per-draw cache. (Scroll-position and window-viewport reads like `rootWindow.scrollY` or `el.scrollLeft` are the exception — read those directly; they don't force layout.)
- Hand-writing a `*Deps` interface instead of inferring it with `ReturnType<typeof createXDeps>`, or passing the whole `wot` into a module instead of a narrow `deps` object.
- Manipulating DOM directly inside Walkontable instead of wrapping it in an abstraction module.
- Running Walkontable tests through the main E2E pipeline instead of the dedicated runner.
- Not testing with frozen rows and columns, which misses overlay edge cases.
- Forgetting `requestAnimationFrame` for scroll-related changes, causing layout thrashing.

For deeper context, see `handsontable/src/3rdparty/walkontable/.ai/ARCHITECTURE.md` and `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md` (DAO layer, overlay fragility).

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
import { isHTMLElement } from '../../../../helpers/dom/element';
if (isHTMLElement(node.nextSibling)) {
  // node.nextSibling is HTMLElement here
}
```

`isHTMLElement` is exported from `src/helpers/dom/element.ts` and is equivalent to `instanceof HTMLElement`. Use it wherever you'd write `x as HTMLElement`, `x instanceof HTMLElement`, or a manual `nodeType === Node.ELEMENT_NODE` guard.

Walkontable source lives in `src/3rdparty/walkontable/src/`, so the relative import path is `../../../../helpers/dom/element`. Adjust the number of `../` segments based on your file's depth within that directory.

### 2. Don't hand-write mirror `.d.ts` files

Declarations are generated from source. Never edit anything under `handsontable/tmp/`. If a type isn't appearing in the public API, fix the JSDoc/export in the `.ts` source and rerun `npm run build:types`.

### 3. Always `import type` for types

```ts
import type { ViewportColumnsCalculator } from './calculator/viewportColumns';
import type { OverlayType } from './overlay/type';
```

Mixing value and type imports defeats tree-shaking and creates accidental runtime dependencies on type-only modules.

### 4. Find shared types in `core/` — don't re-declare them inline

Shared core types live where they belong:

| Type | Location |
|---|---|
| `GridSettings`, `Events`, `HookKey` | `src/core/settings.ts` |
| `HotInstance` | `src/core/types.ts` |

Always reach for them via `import type`. Don't paste a partial mirror of these interfaces into the file you're editing — that's how drift starts.

### 5. Private fields use `#`, callbacks are arrow-function class fields

```ts
class Overlay {
  #cachedWidth: number | null = null;
  #onScroll = (): void => { /* `this` is bound, no .bind() needed */ };
}
```

`@private` JSDoc tags and `.bind(this)` are forbidden. The arrow-field form also makes listeners easy to add/remove by reference.

### 6. Keep cognitive complexity ≤ 15 per function

ESLint will fail the build if a function gets too branchy. The fix is almost always to extract a helper — not to silence the rule.
