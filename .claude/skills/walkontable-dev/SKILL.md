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

## Key subsystems

- **Overlay system** (6 types): Manages frozen rows and columns and their scroll synchronization. This subsystem is fragile and well-documented in `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md`. Proceed with extreme caution when modifying overlay positioning or synchronization logic.
- **Viewport calculation**: Determines which rows and columns are visible based on scroll position and container size.
- **Renderer**: DOM element management, row and column painting, cell element reuse.
- **Scroll handling**: Coordinates scroll between overlays and the main table. Uses `requestAnimationFrame` batching.

## Known technical debt

These issues are documented in `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md`:

- **DAO layer**: Uses Data Access Objects instead of dependency injection. Over 20 TODO comments exist around this pattern. The DAO layer is not unit tested.
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

## Common mistakes

- Accessing or modifying Walkontable DOM elements from plugins or core code instead of going through TableView.
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
