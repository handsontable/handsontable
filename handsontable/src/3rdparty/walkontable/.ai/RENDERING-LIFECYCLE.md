# Walkontable Rendering Lifecycle

The single source of truth for how one draw of the table runs, from the trigger to the final DOM write.

This document describes the code **as it is today**, after the single-pass layout work (PR #12951,
DEV-1995). Two draw models coexist and are selected per table by an escape hatch (see §3):

- **Single-pass (predicted) layout** — scrollbars are predicted from numbers before rendering, so the
  table renders once. Active for element-mode, non-merge tables.
- **Legacy (measured) layout** — the pre-existing "render, then measure the DOM, then correct" flow.
  Kept for merged cells, window-scrolled tables, and non-uniform sizes.

**Verified against source** on branch `feature/DEV-1995_Walkontable-single-pass-layout`
(`handsontable/src/3rdparty/walkontable/src/` plus the bridge `handsontable/src/tableView.ts`). Line
numbers drift as files change — treat the **function names** as the stable anchors and the line numbers
as hints.

---

## 1. What triggers a draw

There are two ways a draw starts.

| Trigger | Path in |
|---|---|
| **Programmatic render** (data change, settings change, `hot.render()`, plugins) | `TableView.render()` — `tableView.ts:204` |
| **Scroll / mouse wheel** | `Overlays.onTableScroll()` / `Overlays.onCloneWheel()` — `overlay/overlays.ts` |

Scroll and wheel events do **not** draw synchronously. They are coalesced with `requestAnimationFrame`
so rapid input produces one redraw per frame. The rAF callback ends up in `Overlays.refreshAll()`
(`overlays.ts:488`), which calls `wot.draw(true)` — a **fast draw** (see §4).

`refreshAll()` also runs again *inside* a draw on the legacy path (see Phase H). So a single user action
can enter the draw more than once. Removing that re-entrancy for the single-pass path is the deferred
**S16b** step.

---

## 2. The call chain

```
TableView.render()                         tableView.ts:204
  runHooks('beforeRender', isFullRender)    tableView.ts:208   ← PUBLIC hook, fires on EVERY render
  this._wt.draw(!isFullRender)              tableView.ts:~213
    → WalkontableFacade.draw()              facade/core.ts
      → Walkontable(core) _base.draw()      core/_base.ts:230
          drawInterrupted = false
          if table not visible OR parent has zero height → drawInterrupted = true, SKIP
          else → this.wtTable.draw(fastDraw)   core/_base.ts:238
            → Table.draw(fastDraw)          table.ts        ← delegates to runDrawCycle
              → runDrawCycle(table, fastDraw)  table/drawCycle.ts  ← the draw orchestration
  runHooks('afterRender', isFullRender)     tableView.ts:219   ← PUBLIC hook, fires on EVERY render
  renderSizeProbe.measure(...) + reconcile  tableView.ts:1548  ← HOT-side post-draw sizing (see §7)
```

`this._wt` is the `WalkontableFacade`. The facade forwards `draw()` to the internal core (`_base.draw()`),
which does a **visibility gate** and then hands off to `Table.draw()`. `Table.draw()` is a two-line
delegate to **`runDrawCycle(table, fastDraw)`** in `table/drawCycle.ts` — a class-free module where
the real work happens. It reaches the instance only through the public surface + `get deps()` (never
`#deps`), the same pattern as the `cellAccess`/`domScaffold` mixins.

`runDrawCycle` dispatches by role into **two separate cycles** (this is the vertical-slice split; the
master and clone no longer share one branchy method):
- **`runMasterDrawCycle(table, ctx)`** — the master table: begin-layout → fast|full render →
  `placeFixedOverlays` → reconcile-or-selection → finish (Phases B–H below).
- **`runCloneDrawCycle(table, ctx)`** — an overlay clone: the strict subset a clone executes. No
  begin-layout phase (so a clone cannot downgrade `runFastDraw` — it takes the master-resolved value),
  no view hooks, no fixed-position pass (so `positionChanged` stays `false` and it always renders
  selections). A clone's `draw()` is driven from the master's `wtOverlays.refresh(fastDraw)`.

Shared steps are free-function phase helpers referenced by both cycles: `buildRenderFilters` (kept
separate, run before the master `beforeDraw` gate), `renderCellBand` (with the inline
`CLONE_BOTTOM`/bottom-corner header-suppression guards), `renderActiveSelections`. A per-draw
`DrawContext` carries `runFastDraw`/`performRedraw`/`positionChanged` plus the header renderers/counts
captured **pre-hook** (the render must use the values read before `beforeDraw` fires).

The phase descriptions in §5 below still hold; their bodies now live in `table/drawCycle.ts` (master
phases in `runMasterDrawCycle`, the shared render in `renderCellBand`). Anchor on the function names —
the `table.ts` line numbers in §4/§5 predate the extraction. The `Table` methods those phases call are
now composed in as runtime mixins (their public surface is unchanged — see ARCHITECTURE "Module
composition"): the post-render measurement methods (`markOversizedRows`, `resetOversizedRows`,
`adjustColumnHeaderHeights`, `syncOversizedColumnHeadersWithFrozenOverlays`) live in
`axisSizing/oversizedRows.ts`; the size getters in `axisSizing/sizeGetters.ts`; the range/viewport
predicates in `table/rangeQuery/`. Overlay hider sizing (`adjustElementsSize`) lives in the
`overlay/spreaderSize.ts` collaborator.

---

## 3. The layout model: single-pass vs legacy (the escape hatch)

The `singlePassLayout` Walkontable setting (default `true`, `settings.ts`) selects the model. It is wired
in `TableView.initializeWalkontable` as a **per-read function** (`tableView.ts:799`):

```
singlePassLayout: () => !(mergeCells && mergeCells.isEnabled())
```

so it re-evaluates when the plugin toggles via `updateSettings`. **Merged cells always use the legacy
path** — a virtualized merged cell's height depends on the viewport the layout is computing, a
circularity single-pass cannot resolve (see `PLAN_WOT_LIFECYCLE.md` S14).

Two gate levels decide how much of the snapshot a draw consumes:

| Gate | Condition | What reads the snapshot |
|---|---|---|
| **Broad** (scroll detection) | `singlePassLayout && !isVerticallyScrollableByWindow()` | `hasVerticalScroll()` / `hasHorizontalScroll()` — `workspaceSize.ts:241,261` |
| **Strict** (`usesLayoutSnapshotForCalculators`, `calculatorFactory.ts:280`) | broad **+** `!isHorizontallyScrollableByWindow() && rowHeightsUniform && columnWidthsUniform` | the row/column calculators + `getWorkspaceWidth/Height` + skip the second calculator pass |

Window-scrolled tables always measure: the document's scroll depends on other page content, so predicting
it from this table's totals is unreliable (the `ghostTable` regression that scoped prediction to element
mode). Non-uniform sizes fall back for the calculators because the content total is not exact up front.

### The layout snapshot

`layout/resolveLayout.ts` `resolveLayout(input)` is a **pure function** (no DOM imports) that solves the
2-variable scrollbar fixpoint: a vertical scrollbar consumes width, which may force a horizontal one, and
vice versa. Two passes always converge — a scrollbar only shrinks the box, so the predicate is monotone.
`viewport/boxLayout/gatherLayoutInput.ts` `gatherLayoutInput()` builds the numeric `LayoutInput` (workspace box from
`getWorkspaceWidth/Height`, content totals from the prefix-sum caches, scrollbar thickness, overflow
modes, window-mode document metrics). The frozen `LayoutSnapshot` exposes both a scrollbar-**unaware**
render band (`renderViewportWidth/Height`) and a scrollbar-**aware** visible band
(`visibleViewportWidth/Height`) — the render calculator uses the former, the fully/partially-visible
calculators the latter (`resolveLayout.ts:98–101`).

`Viewport` owns the snapshot: `beginDrawLayout()` resolves it once per draw; `getLayout()` returns it
(lazily recomputing for API calls between draws); `invalidateLayout()` drops it (wired to the resize
listener and the size-cache invalidation).

---

## 4. Fast draw vs full draw

`Table.draw(fastDraw)` takes a hint. `fastDraw = true` means "try to only reposition, do not re-render
cells." The hint is **downgraded to a full draw** by two checks (master only, `table.ts:517–528`):

- **Downgrade 1 — viewport moved past the rendered band.** `runFastDraw = wtViewport.createCalculators(runFastDraw)`
  (`table.ts:517`) returns `false` if the newly visible rows/columns are not all inside the previously
  rendered band. A scroll that reveals a fresh row forces a full draw.
- **Downgrade 2 — frozen-column header width switch.** If there are row headers and no
  `fixedColumnsStart`, and the inline-start scroll position crosses `0` (`table.ts:519–528`), force a
  full draw (the row-header width must be corrected).

A fast draw skips the filter recreation, cell/header render, and the post-render steps — it runs only the
prepare step and the fixed-position/selection tail.

### Scroll-driven draws: stationary bands + directional overscan

`runDrawCycle` passes `{ stationaryBands: wtOverlays.isScrollDrivenDraw && wtViewport.allowsStationaryBands() }`
into `createCalculators` (`table/drawCycle.ts`). `allowsStationaryBands()` (`viewport/calculatorFactory.ts`)
= `singlePassLayout` on + not window-scrolled — looser than the strict snapshot gate; it does NOT require
uniform sizes. Under that flag, a full draw post-processes the freshly computed rendered bands in a fixed
order (order is load-bearing — see CONCERNS "Directional overscan invariants"):

1. **Directional overscan** (`applyRenderedColumnsBandOverscan` / `applyRenderedRowsBandOverscan`): extends
   the band by `min(ceil(count / 2), cap)` tracks **toward the scroll direction** (caps:
   `COLUMN_BAND_OVERSCAN_MAX = 8`, `ROW_BAND_OVERSCAN_MAX = 4` — tuned for perceived smoothness, see the
   constants' JSDoc). Consecutive scroll steps then land inside the rendered band and resolve as fast
   draws. Gated per axis to the offset option's `'auto'` mode (`viewport{Row,Column}RenderingOffsetIsAuto`,
   wired from `TableView`; an explicit number = exact manual offset, no overscan) and to uniform track
   sizes (`columnWidthsUniform` / `rowHeightsUniform` — with measured or varying sizes the pixel cost and
   the start-side pixel anchor are not predictable). The scroll direction is the sign of the zero-based
   scroll-offset delta between consecutive full draws (captured on the rendered calculation results in
   `finalize()`); a zero delta (the other axis scrolled) preserves an existing overscan side — proven only
   by a recorded side offset **> 1** — and never invents one. Start-side growth recomputes `startPosition`
   from the axis prefix-sum cache. The applied overscan is recorded in the band's side offsets, so the
   `viewport*RenderingThreshold` containment padding in `areAllProposedVisible*AlreadyRendered` caps
   against the real overscan. Any non-scroll full draw recomputes natural bands, dropping the overscan.
2. **Band stabilization** (`stabilizeRenderedRowsBand` / `stabilizeRenderedColumnsBand`): extends the new
   band to keep the previous draw's band SIZE, so the `OrderView`s never add or remove TR/TD/TH/COL nodes
   while scrolling — a structural DOM mutation would trigger the host page's `:has()` style invalidation,
   whose cost scales with the host document. Both axes stabilize on ANY scroll-driven draw (per-axis
   gating would let each axis shrink the other's band back and re-oscillate it). Works for non-uniform
   sizes too.

Specs: `test/spec/scroll/stationaryColumnsBandOverscan.spec.js`, `stationaryRowsBandOverscan.spec.js`
(directional extension, fast draws inside the overscan, pixel parity vs `draw(false)`, zero-delta rules,
opt-outs, zero structural mutations, RTL); `test/unit/viewport/calculatorFactory.unit.js` (the pure
`directionalBandOverscan` helper).

---

## 5. The draw phases

All line numbers are in `table.ts` unless noted. "Master only" = guarded by `this.isMaster`.

### Phase A — Entry gate (`core/_base.ts:230`)
- Set `drawInterrupted = false`. If the table is not visible or its parent has zero height →
  `drawInterrupted = true` and **stop**. Core re-renders when it clears.
- Otherwise call `Table.draw(fastDraw)`.

### Phase B — Master pre-draw setup + fast/full decision (`table.ts:506–529`, master only)
- `wtOverlays.beforeDraw()` (`507`): record whether each overlay's rendering state changed.
- `this.holderOffset = geometryReader.offset(this.holder)` (`508`) — DOM read.
- `rowHeightCache.ensureBuilt()` / `columnWidthCache.ensureBuilt()` (`510–511`).
- **`wtViewport.beginDrawLayout()` (`515`)** — resolve the single-pass layout snapshot for this draw
  (see §3). On the strict-gate path the calculators below read it; otherwise it is resolved but the
  calculators measure.
- `createCalculators()` → downgrade 1 (`517`). Builds the rendered + fully-visible + partially-visible
  calculators in one pass; on the strict path from the snapshot bands, else from measured sizes.
- Frozen-column header check → downgrade 2 (`519–528`).

### Phase C — Fast path: reposition only (`table.ts:531–539`)
- `wtOverlays.refresh(true)` (`533`): reposition the overlay clones without re-rendering cells.
- `syncOversizedColumnHeadersWithFrozenOverlays()` (`538`): re-sync frozen header heights (a no-op unless
  there are frozen columns with column headers).
- Then jump to Phase G.

### Phase D — Full path: filters + beforeViewRender gate (`table.ts:541–562`)
- `tableOffset`: master reads `geometryReader.offset(this.TABLE)` (`542`); a clone takes
  `getParentTableOffset()` (`544`).
- `startRow` / `startColumn` from `getFirstRenderedRow()` / `getFirstRenderedColumn()` (`547–548`) — the
  range-query methods in `renderedRange.ts` (the former `calculatedRows`/`calculatedColumns` mixins).
- **Recreate the filters:** `new RowFilter(...)` / `new ColumnFilter(...)` (`550–551`). New objects per
  full draw (recorded debt).
- Master: `alignOverlaysWithTrimmingContainer()` (`557`; overridden in `MasterTable`).
- Master: fire the `beforeDraw` setting (`560`) → the **public `beforeViewRender` hook**. It can set
  `skipRender`, which gates Phase E (`performRedraw`, `561`).
- **When that gate cancels the render, the master restores the pre-draw rendered state — when
  provably safe** (`restoreRenderedStateIfSafe` in `table/drawCycle.ts`):
  `wtViewport.rowsRenderCalculator` / `columnsRenderCalculator` and `table.rowFilter` /
  `columnFilter` go back to the values they held before this draw. Rationale: `Table#getCell`
  *gates* on the rendered bands but *resolves* the element through the filters + `TBODY.childNodes`,
  so a band advanced past a DOM that was never re-rendered makes the two disagree and `getCell`
  throws `TR was expected to be rendered but is not` — including from the engine's own selection
  render in Phase G of the very same draw. Guards (a blocked rollback keeps the this-draw state,
  i.e. the pre-rollback engine behavior): (1) `Viewport#renderCycleSeq` — bumped by every
  `renderCellBand` (master or clone; the clones share the master's Viewport) — must not have moved
  since it was read right before the `beforeDraw` hook fired, so a hook that rendered a newer band
  (nested `draw()`, clone draws) is never rolled back under; (2) **per axis**, the captured filter's
  build-time `total` must match the current `totalRows`/`totalColumns`, so a skip right after a
  dataset shrink (NestedRows removes rows, then cancels the follow-up render) keeps the fresh band
  capped at the new totals instead of restoring a band that names removed rows — and a column-count
  change never blocks the row rollback (or vice versa). Asymmetries: the filters are restored only
  when the captured ones are non-null (a skipped FIRST draw keeps the just-built filters — several
  consumers read `rowFilter!` unguarded once the table is drawn; the overlays' `applyToDOM` treats
  the restored `null` calculators as the nothing-rendered spreader offset instead of throwing);
  `correctHeaderWidth` is restored whenever no render happened, regardless of the totals gates (the
  DOM header width did not change, and an advanced flag would suppress the corrective full draw);
  and the fully/partially-**visible** calculators are deliberately NOT restored: they describe the
  scroll position, not the DOM contents — so after a skipped draw the visible band may extend past
  the rendered band (unlike a fast draw), and `getCell` answers those rows with exit codes. A
  skipped render also never runs the Phase F 1px `positionChanged` reconciliation via `refreshAll`
  (the rolled-back band would fail the nested draw's fast-draw check and escalate it to a full
  render); instead it reruns the fixed-position pass against the post-toggle layout (which
  converges), renders the active selections, and still runs the master `adjustElementsSize()` so
  the hider/scrollbar size stays current.

### Phase E — Full path: cell + header render (`table.ts:564–585`, only if `performRedraw`)
- `setHeaderContentRenderers(...)` (`565`); bottom / bottom-corner clones do not render column headers
  (`567–571`).
- `resetOversizedRows()` (`573`) — legacy path only clears the per-row measured overrides.
- `tableRenderer.render()` (`575–579` → `render/tableRenderer.ts`): renders in a fixed order —
  `columnHeaderRows → columnHeaders → rows → rowHeaders → cells`, then `columnUtils.calculateWidths()` →
  `colGroup` (COL widths) → a per-row height fixup loop. The reuse-node renderer is settled and out of
  scope.
- `adjustColumnHeaderHeights()` (`581`) — the **single write path** for column-header row heights, on
  master and every clone. Reads `getColumnHeaderHeight(level)` (→ the `columnHeaderHeight` funnel, which
  merges the render-size probe, §7). Replaces the deleted mid-draw `markOversizedColumnHeaders` /
  `syncOversizedColumnHeadersWithDOM` (S13).
- `markOversizedRows()` (`583–585`, master or `CLONE_BOTTOM`) — **legacy row measurement**, kept by
  design. Measures rendered `<tr>` heights, writes `wtViewport.oversizedRows`, invalidates
  `rowHeightCache` when a row is genuinely taller than its configured size. On the single-pass path this
  is the only thing that can move the visible band post-render (see the second-pass skip below).

### Phase F — Full path: second calculator pass + overlay sync (`table.ts:587–617`, master only)
- **Second calculator pass, conditionally skipped (R4).** `usesLayoutSnapshotForCalculators() &&
  rowHeightCache.isCurrent() && columnWidthCache.isCurrent()` → **skip** `createVisibleCalculators()`
  (`598–606`): pass 1 already holds the correct visible band, so re-running it is redundant. The legacy
  path, and any draw where `markOversizedRows` invalidated the row cache (an oversized row), still
  recompute. `isCurrent()` is read **before** `ensureBuilt()` rebuilds the cache. This whole block is
  itself gated by `!externalRowCalculator` (i.e. skipped when AutoRowSize owns row sizes).
- `wtOverlays.refresh(false)` (`609`) — full overlay re-render — `syncOversizedColumnHeadersWithFrozenOverlays()`
  (`610`), `wtOverlays.applyToDOM()` (`611`).
- Fire the `onDraw` setting (`613`) → the **public `afterViewRender` hook** (mid-draw, before Phase G).
- Bottom clone (`615–616`): `getCloneSource().wtOverlays.adjustElementsSize()`.

### Phase G — Fixed-position finalization (`table.ts:621–639`, master only)
- Call `resetFixedPosition()` on top (`624`), bottom-if-cloned (`626–628`), inline-start (`630`), and
  corner overlays (`632–638`). Each positions its clone and, for top/bottom/inline-start, decides the
  `innerBorderTop` / `innerBorderInlineStart` / `innerBorderBottom` class via `adjustHeaderBordersPosition`.
  Those calls OR-together into `positionChanged`.
- **S16a seam:** the border decision is now a pure `#computeHeaderBordersState(...)` separated from its
  DOM write in `overlay/regions/topOverlay.ts` / `inlineStartOverlay.ts` / `bottomOverlay.ts` — so S16b
  can move the decision pre-render. Behavior today is unchanged (compute + apply still called in
  sequence here).

### Phase H — Border refresh vs selection render, then afterDraw (`table.ts:621–657`)
- If `positionChanged` (`641`): `wtOverlays.refreshAll()` (`645`) — **which calls `wot.draw(true)` again**,
  a nested fast draw — plus `adjustElementsSize()`. The nested draw absorbs the 1px shift from toggling
  an `innerBorder*` class. This is the recursion **S16b** removes for the gated single-pass path (the
  border class will be applied pre-render so no post-render shift occurs); it stays on the legacy path.
- Else (`647`): `selectionManager.setActiveOverlay(facade).render(runFastDraw)`.
- Master: `wtOverlays.afterDraw()` (`654`): `syncScrollWithMaster()` and reset overlays whose rendering
  state changed.
- `setDrawn(true)` (`657`).

---

## 6. Public hooks and firing semantics (breaking-change critical)

| Core hook | Fired from | When |
|---|---|---|
| `beforeRender(isFullRender)` | `TableView.render()` — `tableView.ts:208` | **Every** render call (fast and full) |
| `afterRender(isFullRender)` | `TableView.render()` — `tableView.ts:219` | **Every** render call (fast and full) |
| `beforeViewRender` | WoT `beforeDraw` setting → `TableView.beforeRender()` — `tableView.ts:1154,1535` | **Full draw only**, master only (Phase D) |
| `afterViewRender` | WoT `onDraw` setting → `TableView.afterRender()` — `tableView.ts:1155,1548` | **Full draw only**, master only (Phase F, before Phase G) |
| `beforeRenderer` | `tableView.ts:951` | Per rendered cell |
| `afterRenderer` | `tableView.ts:969` | Per rendered cell |

Key facts to keep:
- `beforeViewRender` / `afterViewRender` fire only on a full draw, only on the master, and
  `afterViewRender` fires mid-draw (before fixed-position finalization), not last.
- `beforeViewRender` receives the `skipRender` object; `skipRender.skipRender = true` cancels the cell
  render for that draw — and the master then rolls the rendered bands + render filters back to their
  pre-draw values when that is provably safe (no render and no totals change since the pre-draw
  capture — see Phase D), so `getCell` keeps describing the DOM that is actually on screen.
- **The render-size probe reconcile (§7) must NOT fire these hooks** — it runs a hook-free WoT-internal
  reconcile, never `hot.render()`, so hook-count expectations hold.

---

## 7. Sizing: where row/column/header sizes come from

Sizes reach the engine through the `AxisSizeSource` ports (`axisSizing/axisSizeSource.ts`); the WoT-internal
`DefaultSizeSource` reads the `rowHeight`/`columnWidth` settings-callbacks, which in the product are the
funnel `TableView.rowHeight`/`columnWidth` → `hot.getRowHeight`/`getColWidth` → `modifyRowHeight` /
`modifyColWidth` hooks. `AutoRowSize` / `AutoColumnSize` answer through those hooks after measuring in an
off-screen ghost table — unchanged. Prefix-sum totals live inside WoT (`axisSizing/positionCache.ts`), so the
layout snapshot's content totals are O(1).

**Render-size probe (HOT side, `renderSizeProbe.ts`, owned by `TableView`).** Runs from
`TableView.afterRender` on full draws only (`tableView.ts:1548–1561`). It measures rendered row and
column-header heights and stores them. For headers, if any exceeds the default it triggers a **hook-free
reconcile** — `Overlays.refreshColumnHeaderHeights()` re-applies header heights to master + clones and
`adjustElementsSize()`, synchronously, without `hot.render()`. The `columnHeaderHeight` funnel merges the
probe per level (`tableView.ts:1376`). This keeps WoT single-pass (it never measures rendered content
mid-draw for headers) while wrapped/multi-line headers still end up correct.

**Legacy row measurement (`markOversizedRows`) is kept** (Phase E). Removing it fully was superseded by
the escape hatch; it still serves the legacy/merge path and is the "is a second calculator pass needed?"
signal on the single-pass path (an oversized row invalidates the row cache → the R4 skip does not fire).

`externalRowCalculator` (`= AutoRowSize enabled`, `tableView.ts:793`) is still load-bearing: it skips
`markOversizedRows` (`axisSizing/oversizedRows.ts`), gates the second-pass block (`table/drawCycle.ts`),
and folds the **1px** hider compensation in the snapshot (`viewport/boxLayout/gatherLayoutInput.ts`) and
in the overlay hider sizing (`overlay/spreaderSize.ts` `adjustElementsSize`). **This 1px is the
internal-calculator compensation: it is added on the internal path and skipped when the external
calculator (AutoRowSize/AutoColumnSize) is active, because those plugins already measure exact sizes.
See CONCERNS "Gotchas".**

---

## 8. Objects recreated every draw

- `rowFilter` / `columnFilter` — new objects per full draw (`table.ts:550–551`).
- The render / fully-visible / partially-visible calculators — reassigned in `createCalculators()` and
  (when not skipped) `createVisibleCalculators()`. Consumers read them through the stable `Viewport`
  owner, never a captured reference (they go stale next draw).
- The `LayoutSnapshot` — resolved once per draw by `beginDrawLayout()`, dropped by `invalidateLayout()`.

---

## 9. Deferred / not done (recorded so the seams are known)

- **S16b** — for the gated path: apply the `innerBorder*` class pre-render, skip the
  `positionChanged → refreshAll → wot.draw(true)` recursion (Phase H), render selection unconditionally.
  Must stay gated (`singlePassLayout && !window-scrollable`); legacy keeps the nested draw. The S16a seam
  (§5 Phase G) is in place. Discriminator to verify first: the nested `draw(true)` refreshes selection
  internally, whereas S16b runs `selectionManager.render()` always.
- **S15 full deletion** of the second calculator pass — only the R4 conditional skip landed; full removal
  is blocked while the legacy measured path exists.
- **Merged-cell single-pass** — permanently excluded via the escape hatch (the height ↔ viewport
  circularity).
- **Compute-once-per-draw geometry / translate-diff scroll** — perf levers on top of these seams; out of
  scope here.
