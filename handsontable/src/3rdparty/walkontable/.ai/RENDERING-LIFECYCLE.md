# Walkontable Rendering Lifecycle

The single source of truth for how one draw of the table runs, from the trigger to the final DOM write.

This document exists to unblock the structural refactor (ports/adapters + dependency injection). It maps
the current flow so we can cut clean seams later. It describes the code **as it is today** — including the
parts that are tangled. It does **not** propose the new structure and it does **not** change behavior.

**Verified against source** on branch `develop` (core package, `handsontable/src/3rdparty/walkontable/src/`
plus the bridge `handsontable/src/tableView.ts`). Line numbers drift as the files change — treat the
**function names** as the stable anchors and the line numbers as hints.

---

## 1. What triggers a draw

There are two ways a draw starts.

| Trigger | Path in |
|---|---|
| **Programmatic render** (data change, settings change, `hot.render()`, plugins) | `TableView.render()` — `tableView.ts:195` |
| **Scroll / mouse wheel** | `Overlays.onTableScroll()` — `overlays.ts:591`, and `Overlays.onCloneWheel()` — `overlays.ts:619` |

Scroll and wheel events do **not** draw synchronously. They are coalesced with `requestAnimationFrame` so
rapid input produces one redraw per frame. The rAF callback ends up in `Overlays.refreshAll()`
(`overlays.ts:479`), which calls `wot.draw(true)` — a **fast draw** (see §3).

`refreshAll()` also runs again *inside* a draw (see Phase H). So a single user action can enter the draw
more than once. This re-entrancy is one of the reasons the flow is hard to follow today.

---

## 2. The call chain

```
TableView.render()                         tableView.ts:195
  runHooks('beforeRender', isFullRender)    tableView.ts:199   ← PUBLIC hook, fires on EVERY render
  this._wt.draw(!isFullRender)              tableView.ts:201
    → WalkontableFacade.draw()              facade/core.ts:297
      → Walkontable(core) _base.draw()      core/_base.ts:230
          drawInterrupted = false
          if table not visible OR parent has zero height → drawInterrupted = true, SKIP
          else → this.wtTable.draw(fastDraw)   core/_base.ts:238
            → Table.draw(fastDraw)          table.ts:574        ← the master orchestration
  runHooks('afterRender', isFullRender)     tableView.ts:210   ← PUBLIC hook, fires on EVERY render
```

`this._wt` is the `WalkontableFacade`. The facade forwards `draw()` to the internal core (`_base.draw()`),
which does a **visibility gate** and then hands off to `Table.draw()`, where the real work happens.

`Table.draw()` runs for the master table **and** for each overlay clone. `this.isMaster` guards the
master-only steps. Clones run a reduced subset.

---

## 3. Fast draw vs full draw

`Table.draw(fastDraw)` takes a hint. `fastDraw = true` means "try to only reposition, do not re-render
cells." The hint is then **downgraded to a full draw** by two checks (master only, `table.ts:585–604`):

- **Downgrade 1 — viewport moved past the rendered band.**
  `runFastDraw = wtViewport.createCalculators(runFastDraw)` (`table.ts:592`). `createCalculators()`
  (`viewport.ts:551`) builds the row/column calculators, then returns `false` if the newly visible rows or
  columns are **not** all inside the band rendered last time (`areAllProposedVisibleRowsAlreadyRendered`).
  So a scroll that reveals a fresh row forces a full draw.
- **Downgrade 2 — frozen-column header width switch.**
  If there are row headers and no `fixedColumnsStart`, and the inline-start scroll position crosses `0`
  (`table.ts:594–603`), force a full draw (the row-header width must be corrected).

**What a fast draw skips:** Phases D, E, and F below (filter recreation, cell/header render, forced
post-render measurement). It runs only Phases B, C, G, H. This is the cheap path — and the seam the future
"translate/diff" work wants to widen so that *more* scrolls can take a cheap path.

---

## 4. The draw phases

All line numbers are in `table.ts` unless noted. "Master only" = guarded by `this.isMaster`.

### Phase A — Entry gate (`core/_base.ts:230`)
- Set `drawInterrupted = false`.
- If the table is not visible or its parent has zero height → set `drawInterrupted = true` and **stop** (no
  draw). Core later reacts to `drawInterrupted` (e.g. `tableView.ts:1392` re-renders when it clears).
- Otherwise call `Table.draw(fastDraw)`.

### Phase B — Master pre-draw setup + fast/full decision (`table.ts:585–604`, master only)
- `wtOverlays.beforeDraw()` (`586` → `overlays.ts:452`): record whether each overlay's rendering state
  changed, mark state `'before'`.
- `this.holderOffset = offset(this.holder)` (`587`) — **DOM read** (forces layout via `getBoundingClientRect`).
- `rowHeightCache.ensureBuilt()` / `columnWidthCache.ensureBuilt()` (`589–590`).
- `createCalculators()` → downgrade 1 (`592`).
- Frozen-column header check → downgrade 2 (`594–603`).

### Phase C — Fast path: reposition only (`table.ts:606–614`, taken when `runFastDraw` survived)
- `wtOverlays.refresh(true)` (`608` → `overlays.ts:954`): reposition the overlay clones without
  re-rendering their cells. During scroll it defers `adjustElementsSize` (debounced, `overlays.ts:277`);
  each overlay's own `refresh(fastDraw)` moves the clone.
- `syncOversizedColumnHeadersWithFrozenOverlays()` (`613`).
- Then jump to Phase G.

### Phase D — Full path: filters + beforeViewRender gate (`table.ts:615–637`)
- `tableOffset`: master reads `offset(this.TABLE)` (`617`, **DOM read**); a clone takes
  `dataAccessObject.parentTableOffset` (`619`).
- `startRow` / `startColumn` from `getFirstRenderedRow()` / `getFirstRenderedColumn()` (`622–623`) — these
  are the range-query methods currently supplied by the `calculatedRows` / `calculatedColumns` mixins.
- **Recreate the filters:** `this.rowFilter = new RowFilter(...)`, `this.columnFilter = new ColumnFilter(...)`
  (`625–626`). New objects **every full draw** — flagged as debt (`table.ts:388–389`).
- Master: `alignOverlaysWithTrimmingContainer()` (`632`; overridden in `MasterTable` — a base method that
  calls into the child, noted as a smell at `table.ts:384`).
- Master: fire the `beforeDraw` setting (`635`). This is wired to the **public `beforeViewRender` hook**
  (see §6). It can set `skipRender`, which gates Phase E.

### Phase E — Full path: cell + header render (`table.ts:639–654`, only if `performRedraw`)
- `tableRenderer.setHeaderContentRenderers(...)` (`640`); bottom/bottom-corner clones do not render column
  headers (`642–646`).
- `resetOversizedRows()` (`648`).
- `tableRenderer.render()` (`650–654` → `renderer/table.ts:322`): renders in a fixed order —
  `columnHeaderRows → columnHeaders → rows → rowHeaders → cells`, then `columnUtils.calculateWidths()` →
  `colGroup` (COL widths), then a per-row height fixup loop. This is the **DirectDom reuse-node** renderer;
  its node lifecycle is settled and out of scope (do not touch — see `PLAN.md` §7/E4).

### Phase F — Full path: forced post-render measurement + overlay sync (`table.ts:656–685`)
These steps read geometry back out of the DOM right after writing it, which forces synchronous layout.
- `markOversizedColumnHeaders()` (`657`, master).
- `adjustColumnHeaderHeights()` (`660`, `table.ts:782`).
- `syncOversizedColumnHeadersWithDOM()` (`663`, master, `table.ts:809`) — **`getBoundingClientRect` reads**.
- `markOversizedRows()` (`667`, master or bottom clone, `table.ts:1187`) — **loops the rendered rows reading
  `innerHeight`**.
- Master (`670–681`): rebuild caches, `createVisibleCalculators()` (`674`), `wtOverlays.refresh(false)`
  (`677` — a **full** overlay re-render), `syncOversizedColumnHeadersWithFrozenOverlays()` (`678`),
  `wtOverlays.applyToDOM()` (`679`), then fire the `onDraw` setting (`681`) → **public `afterViewRender`
  hook**. Note: `afterViewRender` fires here, **before** Phase G, not at the very end of the draw.
- Bottom clone (`683–684`): `dataAccessObject.cloneSource.wtOverlays.adjustElementsSize()` — a 4-level
  reach-through (a Law-of-Demeter example the refactor targets).

### Phase G — Fixed-position finalization (`table.ts:689–707`, master only)
- Call `resetFixedPosition()` on the top (`692`), bottom-if-cloned (`694–696`), inline-start (`698`), and
  corner overlays (`700–706`). Each **forces layout** (reads `getBoundingClientRect` / offsets / scroll on
  the overlay). The calls OR-together into `positionChanged`.

### Phase H — Border refresh vs selection render, then afterDraw (`table.ts:709–727`)
- If `positionChanged` (`709`): `wtOverlays.refreshAll()` (`713`) — **which calls `wot.draw(true)` again**, a
  nested fast draw — plus `adjustElementsSize()` (`714`). The nested draw fixes a 1px border shift.
- Else (`715`): `selectionManager.setActiveOverlay(facade).render(runFastDraw)` (`716–718`).
- Master: `wtOverlays.afterDraw()` (`722` → `overlays.ts:463`): `syncScrollWithMaster()` and, for any overlay
  whose rendering state changed, `overlay.reset()`.
- `dataAccessObject.drawn = true` (`725`).

---

## 5. Which phases are invariant on a pure scroll

On a fast draw (a scroll where the newly visible cells are already inside the rendered band), Phases **D, E,
and F are skipped**. Only B, C, G, H run. So on that path the following are unchanged and are the natural
places a future caching layer can skip work:

- Cell and header content (Phase E) — not re-rendered.
- The filters (Phase D) — not recreated.
- Header/row measurement (Phase F) — not re-measured.

The catch: today a scroll that reveals **any** new row or column is downgraded to a full draw (§3,
downgrade 1), so this cheap path is narrow. Widening it (render only the edge cells, keep the rest) is the
deferred "translate/diff" perf lever — it needs a new seam between Phase D and Phase E. That work is **not**
in the structural refactor; this doc only marks where the seam would go.

---

## 6. Public hooks and firing semantics (breaking-change critical)

There are two layers of render hooks. The refactor's `HooksPort` must preserve both exactly.

| Core hook | Fired from | When |
|---|---|---|
| `beforeRender(isFullRender)` | `TableView.render()` — `tableView.ts:199` | **Every** render call (fast and full) |
| `afterRender(isFullRender)` | `TableView.render()` — `tableView.ts:210` | **Every** render call (fast and full) |
| `beforeViewRender` | WoT `beforeDraw` setting → `TableView.beforeRender()` — `tableView.ts:1136,1482–1484` | **Full draw only**, master only (Phase D) |
| `afterViewRender` | WoT `onDraw` setting → `TableView.afterRender()` — `tableView.ts:1137,1495–1497` | **Full draw only**, master only (Phase F, before Phase G) |
| `beforeRenderer` | `tableView.ts:933` | Per rendered cell |
| `afterRenderer` | `tableView.ts:951` | Per rendered cell |

Key facts to keep:
- `beforeViewRender` / `afterViewRender` fire only on a full draw, only on the master, and `afterViewRender`
  fires mid-draw (before fixed-position finalization), not last.
- `beforeViewRender` receives the `skipRender` object; setting `skipRender.skipRender = true` cancels the
  cell render (Phase E) for that draw.

---

## 7. Forced DOM reads in the draw (informational — Stage 1 builds the full inventory)

The reads below fire synchronously inside the draw and force layout. Stage 1 (the `GeometryReader` port)
routes them through one seam; this list is the starting map, not the exhaustive inventory.

- `offset(this.holder)` (`table.ts:587`) and `offset(this.TABLE)` (`table.ts:617`) — `getBoundingClientRect`.
- `syncOversizedColumnHeadersWithDOM()` (`table.ts:809`) — `getBoundingClientRect().height`.
- `markOversizedRows()` (`table.ts:1187`) — `innerHeight` in a loop over rendered rows.
- Each overlay `resetFixedPosition()` (Phase G) — `getBoundingClientRect` / offsets / scroll positions.
- `Viewport.getWorkspaceHeight()` (`viewport.ts:206`), `getWorkspaceWidth()` (`viewport.ts:258`),
  `hasVerticalScroll()` (`viewport.ts:299`), `hasHorizontalScroll()` (`viewport.ts:322`) — `clientHeight` /
  `clientWidth` / `offsetHeight` / `offsetWidth` / `scrollHeight` / `scrollWidth`. These are read multiple
  times per frame by different callers (the "compute once per draw" floor-cut lever, deferred).

---

## 8. Objects recreated every draw (informs the DI design)

These are rebuilt each draw, so the DAO exposes them through getters to stay fresh. The DI refactor must
inject the **stable owner** and read the current object through it, never hold a direct reference to the
volatile object (it would go stale on the second draw).

- `rowFilter` / `columnFilter` — new objects per full draw (`table.ts:625–626`).
- `rowsRenderCalculator` / `columnsRenderCalculator` and the visible/partially-visible calculators —
  reassigned in `createCalculators()` (`viewport.ts:578–585`) and `createVisibleCalculators()`
  (`viewport.ts:598–601`).

---

## 9. Overlay refresh vs reset

- `Overlays.refresh(fastDraw)` (`overlays.ts:954`): reposition each overlay clone. On a pure vertical scroll
  the bottom overlay and its corner take the fast path even when the master goes full, because their fixed
  rows over the same columns are unchanged (`bottomFastDraw`, `overlays.ts:961`).
- `Overlays.refreshAll()` (`overlays.ts:479`): calls `wot.draw(true)` (nested fast draw) and fires overlay
  `onScroll()` hooks when a scroll position changed.
- `Overlays.applyToDOM()` (`overlays.ts:1080`) / `adjustElementsSize()` (`overlays.ts:1007`): write the
  computed sizes/positions to the clone DOM.
- `Overlays.beforeDraw()` / `afterDraw()` (`overlays.ts:452` / `463`): bracket the draw; `afterDraw` syncs
  clone scroll to the master and resets overlays whose rendering state changed.

---

## 10. Deferred (not part of this document's scope, recorded so the seam is known)

- **Reorganizing this flow** into explicit typed phases (removing the re-entrancy in Phase H, the
  base-calls-child smell at `table.ts:384/632`, the mid-draw hook position) is the final, separate stage of
  the refactor.
- **Compute-once-per-draw geometry** and **translate/diff** are perf levers that sit on top of the seams;
  they change when reads fire and are out of scope for the behavior-preserving refactor.
