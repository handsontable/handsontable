# RELEASE-682 — App: Rendering & Performance — Test Report

- **Task:** [RELEASE-682](https://app.clickup.com/t/9015210959/RELEASE-682) — *App – Rendering & Performance*
- **Release / list:** Handsontable `18.0`
- **Core version under test:** `handsontable@18.0.0`
- **Branch tested:** `claude/release-682-testing-brbpww` (based on `develop`, contains all five merged PRs)
- **Date:** 2026-06-30
- **Environment:** Node 22.22.2, pnpm 10.30.2, headless Chromium 148 (Puppeteer 24.43.1), theme `main`

## Scope

Four rendering/performance scenarios, covered by five merged PRs:

| Scenario | PR(s) | Key change verified |
|---|---|---|
| 1. Fast scrolling (10k+ rows) | [#12235](https://github.com/handsontable/handsontable/pull/12235), [#12189](https://github.com/handsontable/handsontable/pull/12189) | `StickyScrollStrategy` for native scrollbar drag; `PositionCache` (prefix-sum + binary search) viewport calculators |
| 2. Large HTML paste (1000+ rows) | [#12121](https://github.com/handsontable/handsontable/pull/12121) | `parseTable` stack-overflow fix (`forEach` push instead of spread) |
| 3. Column resize with `transform: scale()` | [#12118](https://github.com/handsontable/handsontable/pull/12118) | Scale-normalization utils in `manualResize/utils` |
| 4. Ghost table / collapsible nested headers | [#12275](https://github.com/handsontable/handsontable/pull/12275) | HTML-string ghost table; collapsible/dropdown indicator width handling |

Code presence was confirmed on the test branch for every PR (`stickyScrollStrategy.ts`, `utils/positionCache.ts`, the `parseTable.ts` `forEach` fix, `manualResize/utils.ts`, `nestedHeaders/utils/ghostTable.ts`).

---

## Result summary

| Layer | Result |
|---|---|
| Unit tests (Jest) | ✅ 65 / 65 passed (4 suites) |
| E2E tests (Jasmine/Puppeteer, core) | ✅ 114 specs, 0 failures |
| Walkontable tests (scroll + viewport) | ✅ 163 specs, 0 failures |
| Manual / system tests (4 scenarios) | ✅ All 4 pass; 0 console/page errors |

**Overall verdict: PASS.** All four ClickUp scenarios and their checklist items are satisfied. No regressions or errors observed.

---

## 1. Automated tests

### 1.1 Unit tests (`npm run test:unit`)

| Suite | Tests | Result |
|---|---|---|
| `src/utils/__tests__/parseTable.unit.ts` | 25 | ✅ pass |
| `src/plugins/manualColumnResize/__tests__/utils.unit.js` (scale normalization) | 13 | ✅ pass |
| `src/3rdparty/walkontable/test/unit/utils/positionCache.unit.js` | 24 | ✅ pass |
| `src/plugins/nestedHeaders/utils/__tests__/ghostTable.unit.js` | 3 | ✅ pass |
| **Total** | **65** | **✅ 0 failures** |

`positionCache` coverage includes the uniform-size fast path, prefix-sum build, binary-search `findIndexAtOffset`, and invalidation/rebuild. `manualColumnResize/utils` covers `getElementScaleFactor`, `normalizeVisualDelta`, and the 1-pixel paint-box tolerance.

### 1.2 E2E tests — core (`test:e2e.dump` + `test:e2e.puppeteer`)

Filtered to the specs added/touched by the PRs:
`manualColumnResize.spec`, `copyPaste/paste.spec`, `utils/parseTable.spec`, `nestedHeaders/ghostTable.spec`.

```
114 specs, 0 failures   (Chrome 148, theme: main)
```

### 1.3 Walkontable tests (`test:walkontable.dump` + `test:walkontable.puppeteer`)

Filtered to scroll/viewport specs exercising the sticky-scroll and viewport-calculator changes:
`scroll/byDragging.spec`, `scroll/byDraggingWindow.spec`, `scroll/scrollbar.spec`, `scroll/scroll.spec`, `viewport.spec`.

```
163 specs, 0 failures   (Chrome 148, theme: main)
```

---

## 2. Manual / system tests

A live environment was built from the production bundle (`dist/handsontable.full.min.js` + `styles/ht-theme-main.min.css`) and driven in headless Chromium. Each scenario was scripted to reproduce the user interaction, assert on real DOM/grid state, capture a screenshot, and collect console + page errors. **All scenarios produced zero errors.**

### Scenario 1 — Fast scrolling (`scenario1-fast-scroll.html`)

Grid of **12,000 rows × 30 cols**.

| Check | Observation |
|---|---|
| Grid loads 10,000+ rows | ✅ 12,000 rows rendered |
| Smooth rendering on fast scroll | ✅ avg frame 17.2 ms (~58 FPS) across a top→bottom sweep; 1 slow frame (63 ms) on the full-height jump, 59/60 within budget |
| No jank / freeze / crash | ✅ no errors; content renders during scroll |
| Correct content after fast scroll to bottom | ✅ last row renders correct value `R11999C0` |
| Sticky-scroll engages on scrollbar drag | ✅ spreader switches `relative → sticky` during a scrollbar-target mousedown + scroll sequence |
| Sticky-scroll restores on release | ✅ spreader returns to `relative` on `mouseup` (verified against the strategy's `rootDocument` listener) |

*Note:* the initial driver run showed `after: sticky` only because the synthetic `mouseup` was dispatched on `window` (which never reaches the strategy's `document`-level listener). Dispatching on `document` confirmed correct restore — a test-harness detail, not a product issue. The Walkontable `scroll/byDragging` specs cover this path with full simulation.

### Scenario 2 — Large HTML paste (`scenario2-large-paste.html`)

Generated HTML tables pasted through the `CopyPaste` plugin's `paste()` path.

| Dataset | Result | Time | Data integrity |
|---|---|---|---|
| 1,000 × 5 | ✅ no crash | 171 ms | `r0c0` … `r999c4` correct, 1000 rows |
| 50,000 × 5 (regression case for #11784) | ✅ **no `RangeError: Maximum call stack size exceeded`** | ~96.9 s | `r0c0` … `r49999c4` correct, 50,000 rows |

The pre-fix crash (stack overflow from spreading hundreds of thousands of rows) is gone; the 50k paste completes and imports all data. The ~97 s for 50k rows is the full live-grid paste pipeline (data population + render) on an extreme dataset — outside the bug-fix scope (which was specifically the crash) and not part of the scenario's stated "1000+ rows" target, where paste is sub-second.

### Scenario 3 — Column resize under `transform: scale(0.8)` (`scenario3-scale-resize.html`)

Container wrapped in `transform: scale(0.8)`; column B resized by dragging the handle.

| Check | Observation |
|---|---|
| Resize handle appears at correct (scaled) border position | ✅ handle located at the scaled column border |
| Drag resizes with correct alignment (no offset) | ✅ |
| Column width changes correctly accounting for scale | ✅ 80 screen-px drag at scale 0.8 → **exactly +100 logical px** (50 → 150), matching `expected = round(80 / 0.8) = 100` |

This directly validates `normalizeVisualDelta` / `getElementScaleFactor`: the pointer delta is divided by the element scale factor so the width change matches the logical drag distance.

### Scenario 4 — Ghost table / collapsible nested headers (`scenario4-ghost-collapsible.html`)

Two-level nested headers with `collapsibleColumns`, `dropdownMenu`, and `filters`; wide group label "There is a header".

| Check | Observation |
|---|---|
| Ghost table builds; column widths calculated | ✅ widths `[54,66,50,65,50,66,50,66,50,50]` |
| Wide header not clipped on first render (regression #2) | ✅ "There is a header" `scrollWidth == clientWidth (194px)`, no ellipsis |
| Collapse works | ✅ groups collapse to "+" indicators, inner columns hide |
| Widths stable: initial == after expand | ✅ identical |
| No width jumping across repeated collapse/expand cycles (regression #1) | ✅ widths identical across two full cycles |

*Note:* a first measurement taken immediately after init briefly differed because `CollapsibleColumns` (priority 290) finishes its indicator setup just after `NestedHeaders` (priority 280); after the deferred init settles, initial widths equal post-expand widths. This is consistent with the timing the PR documents, and the final state is stable.

---

## 3. ClickUp checklist mapping

| Scenario / item | Status |
|---|---|
| **Fast scrolling** — 10k+ rows, fast drag, smooth, no jank, content loads, ~60 FPS | ✅ all |
| **Large HTML paste** — 1000+ rows, completes without crash, data correct, responsive after | ✅ all |
| **Column resizing with CSS transform** — `scale(0.8)`, cursor position, drag alignment, width correct, no offset | ✅ all |
| **Ghost table** — collapsible columns, structure correct, widths correct, collapse/expand, widths stable, no layout regression | ✅ all |

---

## 4. How to reproduce

Unit tests:
```bash
npm --prefix handsontable run test:unit -- --testPathPattern='parseTable.unit'
npm --prefix handsontable run test:unit -- --testPathPattern='manualColumnResize/__tests__/utils.unit'
npm --prefix handsontable run test:unit -- --testPathPattern='positionCache.unit'
npm --prefix handsontable run test:unit -- --testPathPattern='nestedHeaders/utils/__tests__/ghostTable.unit'
```

E2E (core) — set the pattern in the env so both dump and puppeteer share the run id:
```bash
cd handsontable
export npm_config_testpathpattern='manualColumnResize/__tests__/manualColumnResize.spec|copyPaste/__tests__/paste.spec|utils/__tests__/parseTable.spec|nestedHeaders/__tests__/ghostTable.spec'
npm run test:e2e.dump && npm run test:e2e.puppeteer
```

Walkontable:
```bash
cd handsontable
export npm_config_testpathpattern='scroll/byDragging.spec|scroll/byDraggingWindow.spec|scroll/scrollbar.spec|scroll/scroll.spec|viewport.spec'
npm run build:walkontable && npm run test:walkontable.dump && npm run test:walkontable.puppeteer
```

Manual scenarios: demo pages and the Puppeteer driver used for this report are archived in the session scratchpad (`manual/scenario*.html`, `manual/driver.mjs`, `manual/driver2.mjs`, with screenshots `shot1`–`shot4c`).
