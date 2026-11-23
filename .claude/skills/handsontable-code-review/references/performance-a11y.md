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
conformance per criterion. The rule text lives once, in the `handsontable-a11y` skill: check the diff
against its build rules (`.claude/skills/handsontable-a11y/SKILL.md`, each tagged with its defect
class) and its class table (`references/classes.md`), which names the check that proves each rule and
where it runs. A change to rendering, selection, headers or frozen areas meets the rule that the grid
keeps its own ARIA (`role`, `aria-rowcount`, `aria-colcount`, `aria-rowindex`, `aria-colindex`,
`aria-selected`). The short suite of the checks beyond axe reports on the pull request, but the
forced-colors, docs, website and screen reader checks run only in the weekly audit, so for a rule
they enforce this review is the only gate before it. On top of that, what only a reviewer can judge:

1. **Keyboard navigation, both modes:** spreadsheet mode (`navigableHeaders: false`, `tabNavigation: true`) and data grid mode (`navigableHeaders: true`, `tabNavigation: false`). A new interactive element is reachable and operable by keyboard alone in both.
2. **A name that means something:** the scan sees that a name exists, not what it says. Read each new name as a screen reader user hears it, out of context, and in another language file.
3. **A focus order that makes sense:** where focus lands on open, where it returns on close, and the order Tab walks fit the task, not only exist.
4. **The plan and the proof:** the pull request carries the skill's accessibility plan and the proofs it names (`references/proving.md`): a keyboard-only Playwright flow for what a user operates, the axe scan in all three themes for a color or size, and, for a class whose check runs weekly only, that check run on the branch. The `A11y / axe report` check shows no new or grown finding and the `A11y / <check> report` check runs no regression or new finding the change caused; such a finding is fixed, not added to `tests/a11y/axe-baseline.json`.

## References

- `handsontable/.ai/CONCERNS.md` for known performance bottlenecks and a11y gaps.
- `browser-targets.js` for the supported browser list.
- `src/plugins/base/base.ts` for plugin lifecycle and cleanup patterns.
