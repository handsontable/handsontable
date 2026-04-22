# Dialog Plugin - Test Verification Summary

## Summary of Discrepancies

| # | Test Plan Claim | Actual Behavior |
|---|---|---|
| 1.3 | `closable: true` — close button (×) appears | **[Design Decision]** No × button exists in either template. `closable` only enables Escape key. `showAlert` and `showConfirm` both hardcode `closable: false`. |
| 1.6 | `type: 'alert'` template renders correct layout | **[Design Decision]** No `'alert'` template type exists. Only `'confirm'` is valid. Calling `show({ template: { type: 'alert' } })` throws `"Invalid template: alert. Valid templates are: confirm."` |
| 2.3 | Closing with "×" calls `onCancel` | **[Design Decision]** Not applicable — no × button exists in the `confirm` template. `showConfirm` can only be dismissed by OK, Cancel, or programmatic `hide()`. |
| 2.4 | `document.activeElement` returns to cell after `hide()` | **[Missing Test]** Selection state is restored (tested in `hide.spec.js`), but no test asserts `document.activeElement` points to a cell rather than `document.body`. |
| 2.7 | `document.activeElement` after OK/Cancel click is not `body` | **[Missing Test]** `showConfirm.spec.js` verifies callbacks fire but never asserts `document.activeElement` after the click. |
| 2.8 | Rapid show/hide (bug #11925) — overlay does not block table | **[Missing Test]** `show()`/`hide()` have `isVisible()` guards that prevent broken state, but no automated stress test exists covering this scenario. |
| 3.2 | `aria-modal="true"` is present on dialog | **[Missing Test]** Attribute is correctly set in `ui.js:138` via `A11Y_MODAL()`, but no test in `a11y.spec.js` asserts its presence. |
