# StretchColumns plugin — minimum-width rules

The `stretchColumns` plugin grows columns to fill available width. Read this before touching `stretchColumns.ts` or a strategy under `strategies/`.

## Width contract (the landmines)

- **Always respect defined column widths as minimum values.** Stretching may only ever grow a column past its base width, never below it.
- **If a column would shrink below its base width, disable stretching entirely** for that case rather than producing a sub-minimum width.
- **The `'all'` and `'last'` strategies must behave consistently** regarding minimum-width handling — do not let one strategy honor the minimum while the other ignores it.

## Engine cache contract (DEV-2902)

- **A changed stretched width must drop `Viewport#columnWidthCache`.** `StretchCalculator#applyWidths` writes the widths map with ONE `setValues()` and calls `hot.view.invalidateColumnWidthCache()` in the same step — the same contract `ManualColumnResize` and `AutoColumnSize` fulfil through `observeMapChange` — here it is bound to the single write path, so a second writer of the map must call it too. The engine cache tests only the item COUNT (`PositionCache#isCurrent()`), so a width that moves without a column being added or removed is invisible to it. Left stale, `gatherLayoutInput` summed the previous widths, the solver predicted a horizontal scrollbar (and, on an auto-height grid, a vertical one behind it), and the top overlay clipped the last header by the scrollbar's width while the root carried `htHasScrollX`/`htHasScrollY` for bars never painted.
- **Steady state must cost zero writes and zero invalidations.** A full render with unchanged widths must not touch the map (its `change` hook rebuilds consumer caches) and must not drop the engine cache (a rebuild is a full walk over every column). `calculator.unit.ts` pins both counts; `tests/e2e/stretch-columns-container-resize.spec.ts` pins the invalidation count at 0 through the fixture's `htInvalidationCount()` (read by the page object's `renderWithoutChange()`), which counts drops at `Viewport#columnWidthCache.invalidate` so engine-side paths (`invalidateIndexSizesCache()`, `invalidateAllCaches()`, the scroll-sync remeasure) are counted too.
- **Measure the viewport with the stretched widths hidden.** `StretchCalculator#measureViewportWidth` sets `#isMeasuringViewport`, and `getStretchedWidth()` answers `null` while it is set. When the window owns the horizontal axis, `Viewport#measureWorkspaceWidth` sums the columns live through `modifyColWidth` to choose between the holder's width and the document's client width; with the previous stretched widths in that sum a shrink reads the OLD viewport back, falls through to the document width, and the columns overshoot the root by the page margins for good (review finding on #13493). The old `clear()` before measuring hid this by accident. The flag is safe because `getViewportWidth()` never resolves the layout snapshot (and so never builds the width cache) while this plugin's hook makes the column widths non-uniform.
- **Do not reintroduce `clear()` + per-column `setValueAtIndex()`.** Each of those calls fires `change`; the single `setValues()` is what keeps "one real change → one notification" true.

## Where to look next

- Strategy implementations: `strategies/`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
