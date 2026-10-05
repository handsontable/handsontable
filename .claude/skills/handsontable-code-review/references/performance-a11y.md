# Performance and accessibility dimension

## Performance checks

1. **Large array safety:** use a `forEach` loop in place of `arr.push(...largeArray)` when the array may exceed 10k elements (stack overflow).
2. **Batch rendering:** wrap multiple DOM-affecting operations in `batch()`, `batchRender()`, or `suspendRender()` / `resumeRender()`. Look for sequences of `setDataAtCell`, `alter`, or similar calls without batching.
3. **Scroll event batching:** scroll handlers use `requestAnimationFrame`.
4. **Library size:** new code does not significantly increase bundle size; imports pull in no unused modules.
5. **Unnecessary re-renders:** look for redundant `render()` calls or state changes that cascade into multiple redraws.
6. **Large dataset scenarios:** code handling data arrays is tested with 50k+ rows, and its unit tests include large-dataset cases.
7. **Memory management:** plugins clean up in `disablePlugin()` and `destroy()`; no event listeners, maps, or references leak across enable/disable cycles.

## Accessibility (WCAG 2.1 AA)

1. **Keyboard navigation, both modes:**
   - Spreadsheet mode: `navigableHeaders: false`, `tabNavigation: true`.
   - Data grid mode: `navigableHeaders: true`, `tabNavigation: false`.
   - New interactive elements are reachable and operable by keyboard alone.
2. **ARIA semantics:** changes to rendering, selection, headers, frozen areas, or merged cells preserve correct roles and attributes: `role`, `aria-rowcount`, `aria-colcount`, `aria-rowindex`, `aria-colindex`, `aria-selected`, `aria-label`.
3. **Semantic HTML:** `<button>` for actions, not `<div>` with click handlers.
4. **Color contrast:** 4.5:1 for normal text, 3:1 for large text.
5. **Focus management:** after cell editing, menu open/close, and dialog dismiss, focus returns to a logical position.

## References

- `handsontable/.ai/CONCERNS.md` for known performance bottlenecks and a11y gaps.
- `browser-targets.js` for the supported browser list.
- `src/plugins/base/base.ts` for plugin lifecycle and cleanup patterns.
