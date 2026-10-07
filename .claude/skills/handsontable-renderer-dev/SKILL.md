---
name: handsontable-renderer-dev
path: handsontable/src/renderers/**
description: Use when creating or modifying a Handsontable cell renderer function that controls how cell content is displayed in the DOM - pure functions that take cell data and modify TD element
---

# Handsontable Renderer Development

## Signature

Renderers are pure functions, no class or state:

```js
function myRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  baseRenderer.apply(this, arguments);
  // Modify TD element here
}
```

Call `baseRenderer` first: it applies the readonly and invalid CSS classes, ARIA attributes, and other standard cell setup.

## Rules

- Renderers only modify the TD's DOM content and attributes; state, event listeners, and data mutation belong elsewhere (interactivity goes in an editor or plugin).
- Set cell text with `fastInnerText(TD, value)` from `src/helpers/dom/element.ts` (XSS-safe).
- Escape all user-provided content before any `innerHTML`.
- Append or clear through `getCellContentRoot(TD)` when managing the cell's children (`empty(...)`, `appendChild(...)`, `insertBefore(x, root.firstChild)`). A row at an exact height keeps content in a `div.htCellClip` wrapper; the helper returns it when present and the cell otherwise. Writing straight into `TD` rebuilds the wrapper every draw, and a node left outside it grows the row back. `fastInnerText`/`fastInnerHTML` do this on their own. Models: `checkboxRenderer`, `autocompleteRenderer`, `multiSelectRenderer`.
- If the renderer changes the cell's role or state, update ARIA attributes.
- Handle `null` and `undefined` values.

## Files

```
src/renderers/{rendererName}/
  {rendererName}.ts    # Renderer function
  index.ts             # Re-exports
```

Registry: `src/renderers/registry.ts`.

```js
import { registerRenderer } from '../../renderers/registry';
registerRenderer('myRenderer', myRenderer);
```

## Reference implementations

- `src/renderers/baseRenderer/baseRenderer.ts`
- `src/renderers/textRenderer/textRenderer.ts` - simplest, good template.
- `src/renderers/htmlRenderer/htmlRenderer.ts` - raw HTML.
- `src/renderers/numericRenderer/numericRenderer.ts` - numeral.js formatting.

## Performance

Renderers run for every viewport cell on every render cycle (fast and slow).

- Keep logic minimal; read layout properties (`getBoundingClientRect`, `offsetWidth`) outside the renderer to avoid layout thrashing.
- Keep allocations and string concatenation out of the hot path.
- Cache a slow derived value (chart markup, a parsed document) by the **data record or cell coordinates**. The engine reuses a fixed set of `TD` elements and rewrites them on scroll, so a `TD`-keyed cache (`WeakMap` or a property on it) misses almost every call (issue #13446). Two traps: `getSourceDataAtRow()` returns a **copy** on every call, so it cannot be a `WeakMap` key; read the record from your own data array by `toPhysicalRow(row)` (the cell `value` IS passed by reference). `afterRender` does not fire for scroll draws; count or refresh per-draw state in `afterViewRender`. Worked example: `docs/content/recipes/performance/expensive-cell-renderer/`.
