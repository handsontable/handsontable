# Performance and accessibility dimension

## Performance checks

1. **Large array safety:** use a `forEach` loop in place of `arr.push(...largeArray)` when the array may exceed 10k elements (stack overflow).
2. **Batch rendering:** wrap multiple DOM-affecting operations in `batch()`, `batchRender()`, or `suspendRender()` / `resumeRender()`. Look for sequences of `setDataAtCell`, `alter`, or similar calls without batching.
3. **Scroll event batching:** scroll handlers use `requestAnimationFrame`.
4. **Library size:** new code does not significantly increase bundle size; imports pull in no unused modules.
5. **Unnecessary re-renders:** look for redundant `render()` calls or state changes that cascade into multiple redraws.
6. **Large dataset scenarios:** code handling data arrays is tested with 50k+ rows, and its unit tests include large-dataset cases.
7. **Memory management:** plugins clean up in `disablePlugin()` and `destroy()`; no event listeners, maps, or references leak across enable/disable cycles.

## Accessibility (WCAG 2.2 AA)

The bar is WCAG 2.2 Level A and AA, the target level; the published conformance report states
conformance per criterion. The
`handsontable-a11y` skill holds the patterns and the build rules; check the diff against them.

1. **Keyboard navigation, both modes:**
   - Spreadsheet mode: `navigableHeaders: false`, `tabNavigation: true`.
   - Data grid mode: `navigableHeaders: true`, `tabNavigation: false`.
   - New interactive elements are reachable and operable by keyboard alone, keys register in a shortcut context (never a raw `keydown` listener), and a drag also has a single-pointer alternative that needs no dragging (2.5.7); a keyboard path alone does not meet 2.5.7.
2. **ARIA semantics:** changes to rendering, selection, headers, frozen areas, menus or merged cells preserve correct roles and attributes: `role`, `aria-rowcount`, `aria-colcount`, `aria-rowindex`, `aria-colindex`, `aria-selected`, `aria-label`. Roles and attributes go through `src/helpers/a11y.ts`.
3. **Required structure:** every role has the parents and children it requires (`menuitem` in `menu`, `option` in `listbox`); a widget role drawn with table markup has `role="presentation"` on the table rows in between; no interactive element inside another; `aria-selected` and the other states only on roles that support them.
4. **Names:** every control has an accessible name from an i18n phrase, never hard-coded English, and the visible text is part of the name (2.5.3). Decorative icons are `aria-hidden`.
5. **Semantic HTML:** `<button>` for actions, not `<div>` with click handlers.
6. **Color contrast and size, in all three themes:** 4.5:1 for normal text, 3:1 for large text and for icons, borders and focus rings (1.4.11); pointer targets at least 24 by 24 CSS pixels (2.5.8). Colors and sizes come from theme tokens.
7. **Focus management:** a surface that takes focus registers a focus scope; after cell editing, menu open/close, and dialog dismiss, focus returns to a logical position, stays visible, and is not hidden under a sticky overlay (2.4.11).
8. **Announcements:** a change without a focus move is announced through `announce()`, once per user action. `announce()` defaults to `'assertive'`, so a status message passes `'polite'`; assertive is for errors only.
9. **`ariaTags`:** no behavior reads an `aria-*` attribute or depends on one existing.
10. **Proof:** a change that adds or alters something a user operates (keys, focus, a control, a name, an announcement) ships a keyboard-only Playwright flow asserting focus and accessible names; a color or size change proves itself with the axe scan in all three themes. The `A11y / axe report` check shows no new or grown finding; a new plugin or editor has its entry in `tests/a11y/coverage.mjs` and, with UI, a page in `tests/a11y/pages.mjs`. A finding the change caused is fixed, not added to `tests/a11y/axe-baseline.json`.

## References

- `handsontable/.ai/CONCERNS.md` for known performance bottlenecks and a11y gaps.
- `browser-targets.js` for the supported browser list.
- `src/plugins/base/base.ts` for plugin lifecycle and cleanup patterns.
