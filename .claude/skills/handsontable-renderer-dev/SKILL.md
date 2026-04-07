---
name: handsontable-renderer-dev
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
- **Use `fastInnerText(TD, value)`** from `src/helpers/dom/element.js` for setting cell text content. It is XSS-safe and cross-browser optimized.
- **Never use `innerHTML`** without sanitization. All user-provided content must be escaped to prevent XSS.
- **No event listeners.** If you need interactivity, that belongs in an editor or a plugin, not a renderer.
- **ARIA attributes.** `baseRenderer` handles standard ARIA. If your renderer changes the cell's role or state, update ARIA attributes accordingly.

## File structure

```
src/renderers/{rendererName}/
  {rendererName}.js    # Renderer function
  index.js             # Re-exports
```

Registry: `src/renderers/registry.js`.

## Registration

```js
import { registerRenderer } from '../../renderers/registry';
registerRenderer('myRenderer', myRenderer);
```

## Reference implementations

- `src/renderers/baseRenderer/baseRenderer.js` -- Must be called by every renderer.
- `src/renderers/textRenderer/textRenderer.js` -- Simplest renderer, good starting template.
- `src/renderers/htmlRenderer/htmlRenderer.js` -- Renders raw HTML (use with caution).
- `src/renderers/numericRenderer/numericRenderer.js` -- Formatting with numeral.js.

## Performance

Renderers are called **for every cell in the viewport on every render cycle** (both fast and slow renders). They must be highly optimized:
- Keep logic minimal -- avoid DOM-heavy operations
- Never read layout properties inside a renderer (`getBoundingClientRect`, `offsetWidth`) -- causes layout thrashing
- Avoid object allocations and complex string concatenations in the hot path
- The simpler the renderer, the better

## Common mistakes

- Forgetting to call `baseRenderer` first, which skips readonly/invalid CSS and ARIA setup.
- Adding event listeners in a renderer (use editors or plugins instead).
- Using `innerHTML` with unsanitized user input.
- Mutating `cellProperties` or source data inside a renderer.
- Not handling `null` or `undefined` values gracefully.
