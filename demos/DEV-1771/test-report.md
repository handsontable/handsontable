# Test Report — DEV-1771

**Task**: Selection when used with CMD key jumps between cells  
**PR**: #12639  
**Fix**: Remove dedup (layer-removal) logic from `mouseUp()` — keep `refresh()` but never remove selection layers  
**Tester**: Claude (claude-sonnet-4-6)  
**Date**: 2026-06-24

---

## Bug Summary

When Ctrl/Cmd+clicking an already-selected cell in a multi-cell selection, the active highlight jumped to a different cell instead of staying on the re-clicked cell.

**Root cause**: `mouseUp()` contained a "second-click dedup" feature that removed all selection layers matching the re-clicked cell. When a cell appeared in multiple layers (e.g., the user re-clicked cell B that existed as layer 1 and then added as layer 3), `removeLayers([1, 3])` removed ALL occurrences, leaving other cells as active.

**Fix**: Remove the `removeLayers()`/`pop()` calls from `mouseUp()`. The `refresh()` call is kept to snap any hover-extended ranges back to their correct bounds after a click. Re-clicking a selected cell now simply adds a duplicate layer, making that cell the active focus without removing any existing selection.

**Previous incomplete fix (PR #12638)**: Only gated dedup behind `disableVisualSelection !== false`. The default case (`disableVisualSelection: false`) still had the jump bug.

---

## E2E Tests

Files updated:
- `handsontable/src/selection/__tests__/mouseInteraction/secondClickDeselects.spec.js`
- `handsontable/src/plugins/mergeCells/__tests__/secondClickDeselects.spec.js`

Tests were rewritten to reflect the new behavior: ctrl+clicking an already-selected cell adds a duplicate layer and makes that cell the active focus, instead of removing it.

### Test run results

```
Runner: test/E2ERunner-e95103d3.html (testPathPattern: secondClickDeselects, theme: main)
29 specs, 0 failures
Finished in 1.2 seconds
```

**All 29 tests pass.**

---

## Repro Steps (user's original report)

1. Select cell A1 (Ctrl+click)
2. Hold Ctrl/Cmd and click A2 — adds 2nd selection
3. Hold Ctrl/Cmd and click A2 again — A2 stays as active highlight ✓

Before fix: step 3 caused the highlight to jump back to A1.

---

## Files Changed (PR #12639)

| File | Change |
|------|--------|
| `handsontable/src/selection/mouseEventHandler.ts` | Remove dedup layer-removal logic from `mouseUp()`, keep `refresh()` |
| `handsontable/src/selection/__tests__/mouseInteraction/secondClickDeselects.spec.js` | Rewrite tests to verify new behavior |
| `handsontable/src/plugins/mergeCells/__tests__/secondClickDeselects.spec.js` | Rewrite tests to verify new behavior |
| `.changelogs/12639.json` | Changelog entry |
| `demos/DEV-1771/` | Updated demo files with rebuilt dist |

---

## Verdict

✅ **PASS** — Bug is fixed. All 29 tests pass. Active highlight stays on the re-clicked cell.
