---
name: handsontable-renderer-dev
path: handsontable/src/renderers/**
description: Use when creating or modifying a Handsontable cell renderer function that controls how cell content is displayed in the DOM - pure functions that take cell data and modify TD element
---

# Handsontable Renderer Development

## Function signature

Renderers are **pure functions** with no class or state:

```js
function myRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  baseRenderer.apply(this, arguments);
  // Modify TD element here
}
```

Always call `baseRenderer` first. It applies common properties: readonly CSS class, invalid CSS class, ARIA attributes, and other standard cell setup.

## Key rules

- **Stateless and read-only.** Renderers only modify the TD element's DOM content and attributes. Never store state, attach event listeners, or mutate data.
- **Use `fastInnerText(TD, value)`** from `src/helpers/dom/element.ts` for setting cell text content. It is XSS-safe and cross-browser optimized.
- **Append or clear through `getCellContentRoot(TD)`**, never `TD` itself, when a renderer manages the cell's children (`empty(...)`, `appendChild(...)`, `insertBefore(x, root.firstChild)`). A row rendered at an exact height keeps the content in a `div.htCellClip` wrapper (a table cell cannot be shorter than its in-flow content); the helper returns that wrapper when present and the cell otherwise. `fastInnerText`/`fastInnerHTML` do this on their own. Models: `checkboxRenderer`, `autocompleteRenderer`, `multiSelectRenderer`.
- **Never use `innerHTML`** without sanitization. All user-provided content must be escaped to prevent XSS.
- **No event listeners.** If you need interactivity, that belongs in an editor or a plugin, not a renderer.
- **ARIA attributes.** `baseRenderer` handles standard ARIA. If your renderer changes the cell's role or state, update ARIA attributes accordingly.

## File structure

```
src/renderers/{rendererName}/
  {rendererName}.ts    # Renderer function
  index.ts             # Re-exports
```

Registry: `src/renderers/registry.ts`.

## Registration

```js
import { registerRenderer } from '../../renderers/registry';
registerRenderer('myRenderer', myRenderer);
```

## Reference implementations

- `src/renderers/baseRenderer/baseRenderer.ts` - Must be called by every renderer.
- `src/renderers/textRenderer/textRenderer.ts` - Simplest renderer, good starting template.
- `src/renderers/htmlRenderer/htmlRenderer.ts` - Renders raw HTML (use with caution).
- `src/renderers/numericRenderer/numericRenderer.ts` - Formatting with numeral.js.

## Performance

Renderers are called **for every cell in the viewport on every render cycle** (both fast and slow renders). They must be highly optimized:
- Keep logic minimal - avoid DOM-heavy operations
- Never read layout properties inside a renderer (`getBoundingClientRect`, `offsetWidth`) - causes layout thrashing
- Avoid object allocations and complex string concatenations in the hot path
- The simpler the renderer, the better

## Common mistakes

- Forgetting to call `baseRenderer` first, which skips readonly/invalid CSS and ARIA setup.
- Adding event listeners in a renderer (use editors or plugins instead).
- Using `innerHTML` with unsanitized user input.
- Writing children straight into `TD` (`TD.appendChild`, `TD.insertBefore(x, TD.firstChild)`, `empty(TD)`) instead of `getCellContentRoot(TD)` — on an exact-height row the clipping wrapper is then rebuilt every draw, and a node left outside it grows the row back.
- Mutating `cellProperties` or source data inside a renderer.
- Not handling `null` or `undefined` values gracefully.
