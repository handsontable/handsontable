---
name: performance-a11y-review
description: Use when reviewing code changes for performance impact and accessibility compliance - covers large array handling, render batching, WCAG 2.1 AA conformance, keyboard navigation modes, and ARIA semantics
---

# Performance and Accessibility Review

## Purpose

Review staged or changed code for performance regressions and accessibility (a11y) violations. Both areas are critical - performance affects large-dataset users and a11y is a compliance requirement.

## Performance Checks

1. **Large array safety:**
   - Never use `arr.push(...largeArray)` when the array may exceed 10k elements. This causes stack overflow. Use a `forEach` loop instead.

2. **Batch rendering:**
   - Multiple DOM-affecting operations must be wrapped in `batch()`, `batchRender()`, `suspendRender()` / `resumeRender()`. Look for sequences of `setDataAtCell`, `alter`, or similar calls without batching.

3. **Scroll event batching:**
   - Scroll event handlers must use `requestAnimationFrame` to avoid layout thrashing.

4. **Library size:**
   - New code must not significantly increase bundle size. Avoid adding new dependencies. Check that imports do not pull in unused modules.

5. **Unnecessary re-renders:**
   - Verify that changes do not trigger extra rendering cycles. Look for redundant `render()` calls or state changes that cascade into multiple redraws.

6. **Large dataset scenarios:**
   - Code handling data arrays should be tested with 50k+ rows. Unit tests for such paths must include large-dataset cases.

7. **Memory management:**
   - Plugins must clean up in `disablePlugin()` and `destroy()`. Verify no event listeners, maps, or references leak across enable/disable cycles.

## Accessibility (WCAG 2.1 AA)

1. **Keyboard navigation - both modes must work:**
   - Spreadsheet mode: `navigableHeaders: false`, `tabNavigation: true`.
   - Data grid mode: `navigableHeaders: true`, `tabNavigation: false`.
   - Verify that new interactive elements are reachable and operable via keyboard alone.

2. **ARIA semantics:**
   - Changes to rendering, selection, headers, frozen areas, or merged cells must preserve correct ARIA roles and attributes.
   - Verify `role`, `aria-rowcount`, `aria-colcount`, `aria-rowindex`, `aria-colindex`, `aria-selected`, and `aria-label` values are accurate.

3. **Semantic HTML:**
   - New UI elements must use appropriate HTML elements (e.g., `<button>` for actions, not `<div>` with click handlers).

4. **Color contrast:**
   - New or changed visual elements must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text).

5. **Focus management:**
   - Focus must not be lost after interactions (cell editing, menu open/close, dialog dismiss). Verify focus returns to a logical position.

## Output Format

Group findings into **Performance** and **Accessibility** sections. Use severity levels: Critical, High, Medium, Low. Include `file:line` references.

If no issues are found, output exactly: `No blocking issues found.`

## References

- `handsontable/.ai/CONCERNS.md` for known performance bottlenecks and a11y gaps.
- `browser-targets.js` for supported browser list.
- `src/plugins/base/base.ts` for plugin lifecycle and cleanup patterns.
