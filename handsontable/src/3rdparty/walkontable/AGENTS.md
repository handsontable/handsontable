# Walkontable Rendering Engine

Self-contained rendering engine for viewport calculation, DOM rendering, scroll synchronization, and the overlay system.

## Architecture Boundary

- Walkontable lives in `src/3rdparty/walkontable/src/` (TypeScript, included in the main tsconfig for type-checking — separate build/test pipeline)
- The bridge to core Handsontable is `src/tableView.ts` (TableView class)
- Plugins must NEVER access Walkontable internals directly - always go through TableView
- Do not import core Handsontable modules from Walkontable code

## Dependency injection & DOM reads (mandatory)

- **Wiring:** every module is built through the single composition root `wire.ts` (`buildContext(wot)` → `EngineContext`). Each module has a co-located `create<Module>Deps(ctx)` factory whose type is **inferred** (`export type XDeps = ReturnType<typeof createXDeps>`) — do **not** hand-write dep interfaces. Modules store deps in a private `#deps` and take a single `deps` constructor argument (plus at most one per-instance identity arg like a table `name` or overlay `type`). A read-only `get deps()` getter is used only where a subclass/mixin/collaborator must reach the deps (Table, Overlay, RowUtils, ColumnUtils). Copy any existing module (`scroll.ts` is the simplest) when adding a new one.
- **Layout-forcing DOM reads MUST go through the `GeometryReader` proxy — never read the DOM directly.** These are the reads that force a reflow: `getBoundingClientRect`, `getComputedStyle`, `offset{Width,Height,Top,Left,Parent}`, `client{Width,Height}`, `scroll{Width,Height}` (content size), the `helpers/dom/element` measurement helpers (`offset`, `outer{Width,Height}`, element `inner{Width,Height}`, `getMaximumScroll{Top,Left}`, `getScrollbarWidth`, `getStyle`). Route them through the injected reader: `this.#deps.geometryReader.X(el)` / `this.deps.geometryReader.X(el)`, or `wotInstance.domBindings.geometryReader.X(el)` where only the instance is available. This is the seam a `CachingGeometryReader` will slot into for per-draw memoization — a single raw read defeats it.
- **Scroll-position and window-viewport reads do NOT go through the proxy — read them directly.** `scrollX`/`scrollY`/`pageXOffset`/`pageYOffset`, element `scrollTop`/`scrollLeft`, and window `innerWidth`/`innerHeight` do not force a layout recalculation, so they are cheap to read at any point in a draw and gain nothing from memoization. Read them straight off the element/window (e.g. `rootWindow.scrollX`, `scrollEl.scrollLeft`); for the polymorphic element-or-window scroll position use the raw `getScroll{Left,Top}(el, rootWindow)` helper. Routing them through an `instanceof Window`-gated helper also breaks across an iframe realm boundary (returns `undefined`), so the direct read is both cheaper and more correct.
- **If the proxy lacks a method for a layout-forcing read, add it** to both `domMeasure/geometryReader.ts` (interface) and `domMeasure/liveGeometryReader.ts` (adapter), then use it. Never fall back to a direct read for a layout-forcing measurement.
- **Enforced by ESLint:** `handsontable/no-direct-dom-geometry-read` (`error`) flags any direct layout-forcing read across all of `src/3rdparty/walkontable/src` (only `domMeasure/**`, the adapter itself, is exempt). It allows access on a `geometryReader`, writes (`el.scrollTop = n`), `this.<field>`, and the scroll/viewport reads listed above. The rule lives in `handsontable/.config/plugin/eslint/rules/`; it is a pnpm `file:` dep that is **copied**, so after editing the rule run `pnpm install` or eslint errors "definition not found".

## Key Subsystems

- **Overlay system** (6 types): Frozen rows/columns and scroll sync. Fragile - proceed with caution.
- **Viewport calculation**: Determines visible rows/columns based on scroll position
- **Renderer**: DOM element management, cell reuse
- **Scroll handling**: requestAnimationFrame batching required
- **Draw cycle** (`table/drawCycle.ts`): `Table.draw()` is a two-line delegate to the class-free `runDrawCycle(table, fastDraw)`, which dispatches by role into `runMasterDrawCycle` and `runCloneDrawCycle` over shared phase helpers (`buildRenderFilters`, `renderCellBand`, `renderActiveSelections`, `placeFixedOverlays`). The clone cycle is the strict subset (no begin-layout, no view hooks, no fixed-position pass). Phase functions use the public surface + `get deps()` only — the same free-function-over-instance pattern as the `cellAccess`/`domScaffold` mixins. A per-draw `DrawContext` captures the header renderers **pre-`beforeDraw`-hook** — the cell render must use those captured values. See `.ai/RENDERING-LIFECYCLE.md` §2.

## Naming gotcha: two "selectionHandles" in border.ts

`Border` in `src/selection/border/border.ts` has TWO distinct handle systems: `selectionHandles` (mobile touch handles, created by `createMultipleSelectorHandles()`, CSS classes `topSelectionHandle`/`bottomSelectionHandle`) and `adjustHandles` (desktop drag-to-resize handles added in 18.0.0, CSS class `.wtSelectionHandle`, controlled by the `selectionHandles` grid option). Do not conflate them.

## Selection affordances must stay under the overlay clones (z-index < 120)

`.ht_master` is `position: relative` with no z-index, so it opens **no stacking context** and every
element inside it competes directly with the overlay clone divs (`inline_start` 120, `bottom` 130,
`bottom_inline_start_corner` 150, `top` 160, `top_inline_start_corner` 180). An affordance drawn
inside the master at 120 or above therefore paints on top of a frozen pane once its cell scrolls
under one, and wins hit-testing there — the crosshair and the drag are stolen from the frozen cells.

The window 101–119 is reserved for these: the `moveCells` bands (100, inlined by `createMoveZone`),
the autofill fill handle (`.wtBorder.corner`, 110) and the desktop resize handles
(`.wtSelectionHandle`, 115). Do not raise any of them to clear something else — every frozen overlay
draws its own copy of each affordance, so none of them needs to outrank a clone to appear inside a
pane. `.ht_clone_master: 100` in the z-index map does **not** apply to the master overlay; that class
is stamped on the editor container by `src/editors/factory.ts`.

Two related mechanisms that look like counter-examples and are not: the mobile selection handles take
an inline `zIndex = '9999'` when a selection edge lands on a freeze line (`border.ts`, legacy #9850),
and the fill handle is *repositioned* rather than re-layered at the `fixedRowsBottom` line
(`isCornerLiftedAtBlockEnd`). Handles drawn by a frozen overlay itself need no such treatment: they
already land flush against the `.wtHolder` edge that clips them, which `border.spec.js` pins to the
pixel on both axes. Note `.wtHolder` is the clipping box (`overflow: hidden`), while the clone element
is `overflow: visible` and ends a few pixels earlier — measure the holder, not the clone.

The declarations live in `src/styles/base/_z-index-map.scss`, `css/walkontable.scss` (clone values,
duplicated — keep in sync) and `src/styles/components/core/_selection.scss` (the affordances).

## Naming gotcha: `moveCells` grid option vs. HyperFormula engine method

The Handsontable `moveCells` grid option (added 18.0.0) enables drag-to-move for selections. HyperFormula exposes an identically named `engine.moveCells()` method that the `Formulas` plugin calls internally to relocate formula references. They are unrelated -- do not confuse the user-facing option with the HyperFormula engine API.

## Content-driven sizes the master never renders

The master renders a **contiguous** column band starting at the column under the horizontal scroll offset, so as soon as that band starts past column 0 it does not render the frozen (inline-start) columns at all — the inline-start overlays are the only tables holding that content. Any size measured from the master's rendered DOM therefore misses it. Two syncs in `axisSizing/oversizedRows.ts` close that gap, both called from `runMasterDrawCycle` **after** `wtOverlays.refresh(false)`:

- `syncOversizedColumnHeadersWithFrozenOverlays` — header heights. Reads the corner clone's natural height and writes it onto the master/top THEAD. Deliberately does **not** cache (caching would re-inflate the corner it measured).
- `syncOversizedRowsWithFrozenOverlays` — body row heights (DEV-2193). Measures all three tables that render frozen columns (the inline-start clone, which mirrors the master's row band, plus the two corners, which hold the frozen top/bottom rows the clone does not), then re-applies the heights to the tables that render those rows without the frozen columns. It **does** record into `wtViewport.oversizedRows`, because the hider height comes from the summed row heights (`spreaderSize`), not from the DOM — a DOM-only patch would leave the scrollbar short.

### Frozen-derived records survive the wipe

The record cannot be re-created by the master, so it must not be destroyed before the consumers that need it. `resetOversizedRows` skips any key in `wtViewport.frozenOversizedRows`; `resetFrozenOversizedRows` clears those keys instead, in the seam between the master's render and `wtOverlays.refresh(false)`. That single ordering choice is what makes the rest correct:

| Consumer | Sees the record because |
|---|---|
| The master's own render | It rendered before the clear |
| The row-height cache + viewport calculators | They are built before the clear |
| The master's `markOversizedRows` | The record was never in its wiped map, so it cannot mistake it for a shrunk row |
| The bottom clone's `markOversizedRows` | Same — it cannot wipe a record only the sync can create |
| The inline-start clone / corners | They render *after* the clear, so at their natural height — re-measurable, no ratchet |

Everything else follows from that table, and each row of it was a separate bug before the records were made to survive.

**Only rows the frozen pass actually measured may be marked frozen-derived.** `markOversizedRows` reports what it recorded; the sync registers exactly that. Registering every oversized row in the band instead looks equivalent and is not: a row that is tall because of a SCROLLABLE column would be adopted, and the frozen overlays can never re-detect a height they never saw — so the next draw reads it as shrunk and drops it, the master rediscovers it on the one after, and the row oscillates every other draw. That is the common case (any wrapped row in a grid with frozen columns), not an edge case.

**Ownership moves back when the master out-measures the frozen side.** A row can be tall in a frozen column and taller still in a scrollable one. When the master's re-measure records a height above the frozen one, that row is the master's again and must be dropped from `frozenOversizedRows` — the sync does this with the same `recordedRows` out-param, applied in reverse. Leaving the mark on is invisible and never settles: the next draw clears a height only the master can recreate, the frozen pass re-records its own shorter one, the master out-measures it again, and both invalidate the row-height cache on every draw for as long as both cells stay oversized.

**On a draw where a height changed, release and re-measure the master before matching the others.** A row can be tall in a frozen column *and* in a scrollable one. While the frozen height dominates, the master's own pass measures the forced value and records nothing — so when the frozen part goes away there is no record of the height the master still legitimately has. The change-draw path therefore re-applies to the master (dropping the height that went away), re-measures it, and only then brings the frozen overlays into line.

**The clear opens a window, and three things can fall into it.** Between `resetFrozenOversizedRows` and the sync putting the records back, `oversizedRows` is missing every frozen-derived height. Anything reading it in that window gets an incomplete answer, and because the records return *unchanged*, nothing invalidates afterwards to correct it:

- **A row-height cache built in the window** is short by all of them — a scrollbar that cannot reach the end of the grid, with every rendered row still correct. The bottom clone reaches this: it renders and measures inside `wtOverlays.refresh()`. `PositionCache#buildSeq` is snapshotted at the clear and compared after; a changed counter means drop the build and re-size the elements. (`isCurrent()` cannot answer this — invalidate-then-rebuild leaves it `true` at both ends.)
- **Only overlays that actually rendered this draw may be measured.** `Overlay#refresh` is a no-op when `needFullRender` is false, and a skipped clone still owns its previous draw's DOM. The master's own pass gets this guarantee structurally; the frozen list has to filter for it.
- **The viewport calculators are built before the frozen overlays render**, so a frozen-derived height cannot be in them. An ordinary oversized row never has this problem — the master invalidates inside `renderCellBand`, which is earlier. The sync reports whether it changed anything so the draw cycle can rebuild them; otherwise the frame answers `getLastVisibleRow` against the previous heights and silently corrects on the next draw.

Two neighbours worth knowing about:

- **`RenderSizeProbe` must measure every table that can hold a recorded row.** It is the intended replacement for the engine's measurement, and its characterization spec pins equality with `oversizedRows` — so a height sourced from a table it does not measure leaves it mirroring a subset while the spec stays green. The master's band plus the top and bottom clones cover every recordable row; the inline-start clone mirrors the master's band and adds none.
- **MergeCells inflates row heights per overlay** (`modifyRowHeightByOverlayName`), so a frozen clone can render a row at the whole merged block's height while the overlay-agnostic `getRowHeight` that `markOversizedRows` compares against reports one row. That does not currently produce a bogus record — the inflated height is written on a TD whose `rowspan` covers exactly the rows it accounts for, so no single TR measures tall — but the two sides of that comparison do disagree, and a spec pins the outcome.

Three more things that pass every functional test and only show up in a profile or a screenshot:

- **Every table gets `applyRowHeightsToRenderedRows` on any draw that has a frozen record** — the top and bottom clones and the frozen overlays because they rendered *after* the clear, at their natural height, and the master because at the band boundary that natural height is 1px more than it rendered with. See the pixel below; an earlier version skipped the master here to save the DOM writes and that is exactly what left the panes 1px apart.
- **The 1px boundary flip is a DOM-sync problem, not a cache problem, and the two must stay separate.** The band's first `<tr>` gains a 1px border-top, so a row's total height changes by 1px purely by scrolling onto the boundary, and the measured value then alternates between the two across draws. `markOversizedRows` keeps a `> 1` tolerance before invalidating the row-height cache — **do not tighten it**: counting 1px as a change invalidates on every single draw for as long as the row sits at the boundary. But the DOM side still has to be reconciled, because a table whose content genuinely needs the larger total (the frozen overlay holding the tall cell) cannot render it one pixel shorter, while the master honours whatever it was given. Re-applying the current record to every table is what closes that gap.
- **`adjustElementsSize` is gated on a real height change.** It walks every column (`sumCellSizes` must stay a live walk) and resizes three overlays; calling it on every draw taxes wide grids for nothing. But it *must* run when the heights did change, including a shrink where there is nothing left to re-apply — `wtOverlays.refresh()` sized the elements earlier in the draw, so the scrollbar would keep the old length.
- **Steady state must cost zero row-height cache invalidations.** Each one drops the per-draw layout snapshot as well, and with a non-uniform row-size source (`rowHeights`/`minRowHeights` as an array or function, or any non-AutoRowSize `modifyRowHeight` hook) `PositionCache` has no sparse path, so a rebuild is a full prefix-sum walk over every row. Verified by counting: 0 invalidations/draw and an unchanged `createVisibleCalculators` count in every configuration. Two specs in `tests/e2e/walkontable/frozen-column-row-heights.spec.ts` pin the invalidation count at 0 through the fixture's `countRowCacheInvalidations` — the only way to see this class of bug, since the rows stay aligned and every visual assertion passes while it happens.

When you add a new content-driven measurement, ask which tables actually render the content — measuring the master alone is the trap both of these exist to work around.

## Rendered row band is refilled, bounded, when the measured rows shrink

The rendered band is computed BEFORE the cells render, from `rowHeightCache` — provided heights merged with `wtViewport.oversizedRows`, i.e. heights **measured on a previous render**. Content that shrinks between draws (column autosize widening a wrapped column, `setDataAtCell` replacing long text, `colWidths` changes) therefore yields a band that is too short for the new heights: `markOversizedRows` records the shrink and invalidates the cache, but nothing re-renders — the classic "blank area under the last row until you scroll" (#6452, DEV-406). `runMasterDrawCycle` calls `refillRenderedRowsBandIfShrunk` (`table/drawCycle.ts`) only when `renderCellBand` reports a height change AND `externalRowCalculator` is off. The helper **proposes** a fresh rendered band with `createRowsCalculator(['rendered'], …)` (no assignment), and runs `createCalculators(false)` + `buildRenderFilters` + `renderCellBand` again only if the proposal grows the BOTTOM edge (a later `endRow`). #6452 is exclusively an under-filled bottom, and an earlier proposed `startRow` on its own is **not** a refill trigger: that is the virtualized merged-cell signature — per-band `modifyRowHeightByOverlayName` heights plus rowspan-inflated `oversizedRows` records make every scroll draw of such a grid propose a band that starts one row earlier and ends far short of the rendered one, and the band it rendered is already correct (`src/plugins/mergeCells/__tests__/selection.spec.js` catches a refill there). When a pass does run, the band that gets applied is the UNION of the previous band and the proposal (`Viewport#extendRenderedRowsBandTo`), never the proposal alone: a proposal built from re-measured heights can still move the START edge inwards while `endRow` grows, and applying it wholesale would drop rows the DOM already shows from under the viewport. One pass is often not enough: a stale record for a row just *outside* the first band (never rendered on the shrink draw, so never re-measured) caps the proposal, and only rendering it reveals it shrank too — so the helper loops, bounded by `MAX_ROWS_BAND_REFILL_PASSES`, and exits as soon as a pass reports no height change or the proposal stops growing the bottom edge. **Passes scale roughly one-per-stale-out-of-band tall record** (each pass's proposal is capped at the first row below the band with a stale record, and `resetOversizedRows` wipes only in-band records, so every stale record below survives to cap the next proposal), and the overscan cannot shortcut it — but only because `applyRenderedRowsBandOverscan` runs solely under `stationaryBands`, which the refill's `createCalculators(false)` never sets. Do not reason from `rowHeightsUniform` here: it is settings-only (`rowHeights`/`minRowHeights`/`modifyRowHeight`, `tableView.ts`) and stays `true` in the #6452 fixture — measured `oversizedRows` never enter it. On a SCROLL-driven shrink draw, pass 1's overscan genuinely can fire (`allowsStationaryBands` drops the uniformity requirement) and can pull a stale out-of-band record into the band. Rules that keep it safe: (1) `MAX_ROWS_BAND_REFILL_PASSES` bounds the loop; never turn this into a "loop until stable". The practical limit follows from the growth rate: a shrink that leaves MORE stale out-of-band tall records between the pre-shrink band and the settled one than the cap keeps the blank strip — the viewport stays under-filled until the next scroll or resize, exactly the pre-fix #6452 behavior (the #6452 fixture itself, rows 1-7 tall over a ~5-row band, already consumes all three passes); (2) the union keeps every row the DOM already showed inside the band, so each pass strictly grows it and the loop is bounded by monotonic growth as well as by the cap — the rows the proposal dropped stay rendered as plain overscan; never widen the trigger back to "grows at least one edge", which makes every virtualized merged-cell scroll draw refill and render rows above the viewport that the pre-fix engine never rendered; applying a grown band is safe only because `renderCellBand` runs immediately afterward and brings the TBODY into agreement with it — never insert a `getCell` call or a band-gated range query between `createCalculators` and that `renderCellBand`, and never leave a reassigned band without the re-render; (3) `stationaryBands` stays off for the re-passes — it is a content change, not a scroll step, so the overscan/stabilizer logic must not pad it; (4) zero extra passes on a steady-state redraw (`markOversizedRows` reports no change). Three more declines keep a pass cheap or safe: `renderAllRows` and a band already at the dataset end skip the proposal walk (no bottom edge can grow); a proposal that does not overlap or touch the previous band is declined, or the union would span the whole gap and one `renderCellBand` would build it (a whole-dataset shrink while scrolled deep reaches this) — this no-overlap guard is also what bounds the union's start-edge growth to the two bands' combined span; and a pass whose recomputed column band disagrees with the captured `ctx.syncFrozenRows` decision is declined (`refillDisagreesWithFrozenColumnSync` — pass 1's column band can carry the columns overscan down to column 0 while the refill's recompute, with no `stationaryBands`, starts past it, and rendering after `releaseFrozenOversizedRows()` already ran would wipe frozen-tall records the master can never re-measure). Rows that *grew* need no refill: the band then overflows the viewport, which is harmless, and the scrollbar height is already taken from the rebuilt cache. A propose-only calculator build passes `{ proposeOnly: true }` to `createRowsCalculator`/`createColumnsCalculator`, which skips the build's one side effect — the `rowHeaderWidth`/`columnHeaderHeight` memo reset — so a declined refill costs no header re-measure. (Do not hoist those resets out of the create methods instead: the memos re-measure lazily on the next read, so WHERE the reset happens relative to the surrounding `getViewportWidth`/`getViewportHeight` reads is load-bearing — moving them to the assigning call sites changed measurement timing and broke AutoRowSize.)

Two consequences worth stating out loud. **Renderer-level callbacks fire once per pass.** Each pass calls `renderCellBand`, so on a refilled draw the cell renderer runs again for every cell in the new band, and with it the core `beforeRenderer` / `afterRenderer` hooks (`tableView.ts` fires both from inside the cell renderer). The draw-level hooks do not repeat: the `beforeDraw` setting (core's `beforeViewRender`) fires once before the first pass, and the `onDraw` setting (core's `afterViewRender`) fires once after the last one — both sit outside the loop in `runMasterDrawCycle`. `renderCycleSeq` does advance once per pass, but its only consumer is the `skipRender` rollback guard (`restoreRenderedStateIfSafe`). **Every pass rebuilds both size caches**, so the post-render second-calculator-pass skip right after the call site cannot ask `rowHeightCache.isCurrent()` alone — it also asks `!rowHeightsChanged`. Nothing placed between `renderCellBand` and that predicate may call `ensureBuilt()` without feeding the predicate too, or a draw whose rows changed height silently keeps pre-render visible calculators.

## A table built outside the layout cannot read its own styles

A container that generates no boxes — detached from the document, or a light-DOM child of a shadow
host that no `<slot>` accepts yet — resolves `getComputedStyle()` to an **empty declaration** for
itself and every ancestor, per the CSSOM specification (Chromium since 151; Firefox and Safari
always). Every style-driven layout decision taken in that state therefore reads "no ancestor clips
or scrolls", and the ones that pick a scroll container (`getTrimmingContainer`,
`getScrollableElement`, `ScrollSync#computeScrollableElement`,
`Overlay#updateMainScrollableElement`) hand the whole grid to the **window**.

The same is true of every size such a table measures: the row heights and column widths it records
describe a layout it never had, and a window-scrolled table records them for a different column band
at a different width.

The trimming container is re-resolved on every `adjustElementsSize`, so it heals by itself. Nothing
else does. `ScrollSync` marks its state provisional when `geometryReader.isRendered()` was false at
construction, and `Overlays#afterDraw` calls `resolveProvisionalLayout()` — after the overlays
refreshed their trimming containers and the holder got its final overflow, which is why it cannot run
in `beforeDraw` (the scrollable element would settle on the window again and clear the flag). While
the answer is still the window although an element trims the table, the layout has not settled and
the pass is retried on the next draw — but only while the resolved element keeps changing. It is
checked before anything is rebound, so a pass that cannot settle costs one style read. Two rules make
that necessary: `getTrimmingContainer` counts `overflow: hidden` and `getScrollableElement` does not,
so the two can disagree for good, and a table in an iframe driven from the parent realm does exactly
that — `MasterTable#alignOverlaysWithTrimmingContainer` misses it through a realm-bound `instanceof`
and leaves the holder `overflow: visible`. Retrying such a table forever rebinds every listener on
every draw, which also drops whichever scroll event is in flight. Re-arming the flag (through the
public `updateMainScrollableElements`, which `updateSettings` calls whenever `height` moves to or from
`''`) forgets the answer the previous series gave up on — otherwise the first retry of the new series
matches its own stale answer and gives up at once, spending the retry the design counts on.

Only a **full** draw resolves it. A fast draw has aligned nothing, so it must not judge a table
nothing has laid out; no such draw can currently precede the first full one (`refreshAll()` returns
while `drawn` is false, and a table built outside the layout stays undrawn until it joins it), so the
gate in `Overlays#afterDraw` guards a state the settle test never has to answer for.

Once it settles, the pass does **not** drop the sizes itself. It marks them, and
`Overlays#beforeDraw` drops them on the way into the next draw that renders cells
(`resetSizesMeasuredBeforeLayoutSettled`), so reset, re-measure and resize run in the order this
cycle documents. Dropping them after a draw and asking for a redraw leaves them dropped: the request
is a fast draw, and a draw that re-renders nothing never re-runs `markOversizedRows`. For the same
reason a scroll-driven draw must not consume the mark — it stays pending for the next full draw, and
so does a draw that got as far as the `beforeDraw` hook and had its render cancelled by `skipRender`
(NestedRows does this; any user hook can). The mark is spent in `Overlays#afterDraw`, and only when
the draw cycle reports that the band actually rendered (`confirmSizesRemeasured`); the drop itself is
idempotent, so retaking it on the next draw costs one invalidation, and the two gates read the same
fast/full question at different moments (the reset at draw entry, the render after
`createCalculators` could downgrade it), so `ScrollSync` also refuses to spend a mark it never
dropped — an escalated scroll draw satisfies the second gate without ever passing the first.

What the drop covers is the engine's own record: the oversized-row heights and the column-width
prefix sum. A rebuilt width cache re-asks `modifyColWidth`, so `AutoColumnSize` answers from its own
map and a width it measured against no layout survives the settle — the narrow-container
`AutoColumnSize` follow-up, filed separately. And
no redraw is requested from the settle frame at all: forcing one measures a DOM whose column widths
have not settled, which records heights for rows that leave the band on the next draw, and those
records survive (DEV-2515).

The theme measurements have their own copy of the problem, on the core side: `StylesHandler` caches
`getComputedStyle(rootElement)` once, so a grid built outside the flat tree has no theme variables and
its default row height reads `null` — which makes every rendered row look oversized. The handler
records whether its own caching pass ran against unresolved styles, and `TableView#render` asks it
(`recacheValuesMeasuredWithoutStyles`) rather than reading the `null` — **before** `_wt.draw()`, not
from the engine's `beforeDraw` setting, which fires after `createCalculators()` and would leave that
draw's row band built from the heights being dropped (the grid renders short for a frame and nothing
schedules another draw). The drop stays pending until a draw has rendered the cells and re-measured
them, which `afterRender` reports — the engine fires `onDraw` from no other kind of draw — so a
`beforeViewRender` listener setting `skipRender` cannot spend it either. Keying off the row
height instead wipes the caches on **every** draw of any page that loads no grid stylesheet, where
that value never resolves. Note the two questions are deliberately different: the engine asks about
geometry (`isRendered`, no boxes), the styles handler asks whether `getComputedStyle` resolves at all
— `display: none` reads its styles fine. The engine versions are stated once, above.

Never guess a container from an empty style read, and never cache a layout decision taken while
`isRendered()` is false without a way to retake it.

## Known Tech Debt

- The DAO layer has been replaced by constructor injection + the `wire.ts` composition root (see the DI section above) — do not reintroduce DAO getters or `wot`-god-object passing.
- Filter objects are recreated instead of updated
- Overlays still reach the master through `this.wot.wtTable`/`.wtViewport`/`.wtOverlays` in their hot-path methods (the deep `wot` decoupling is deferred; the `Clone` is a second Walkontable instance holding a handle to the master)
- See `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md` for full list

## Performance

- Batch scroll events with requestAnimationFrame
- Never `arr.push(...largeArray)` with 10k+ elements
- Reuse DOM elements, minimize layout thrashing
- **Row-height sums go through `Viewport#sumRowHeights`** (prefix-sum `PositionCache`, O(1)) — never add a new per-row summation loop. Two constraints it encodes: (1) the first rendered visible row reports a +1px border-top compensation (`StylesHandler#getDefaultRowHeight`, AutoRowSize), so `sumRowHeights` re-reads the build-time and current first-rendered rows live (`PositionCache#onBuildFn` records the build-time row) — bypassing this breaks totals by exactly 1px (AutoRowSize/Pagination specs catch it). (2) **Column-width sums must stay live walks** (`sumCellSizes` in `inlineStartOverlay`, `sumColumnWidths` in `workspaceSize`): stretched widths (`stretchH`) derive from the workspace width, which derives from the column sum — caching freezes that cycle and nothing invalidates the column cache on stretch (Core_init display-none and StretchColumns window-mode specs catch it).

## Testing

Separate test runner - do NOT mix with main E2E tests:
`npm run test:walkontable --prefix handsontable`

Tests in: `src/3rdparty/walkontable/test/`

For detailed guidance: use skills `walkontable-dev`, `walkontable-testing`

## MCP Tools: code-review-graph

A Tree-sitter knowledge graph (28k+ nodes, 419k+ edges) pre-built over the full codebase. Provides structured, function-level results for cross-file queries that would otherwise require many Grep+Read round-trips.

**Prerequisite:** `pipx` must be installed. The MCP server starts automatically via `pipx run` on first use (one-time ~10s PyPI download, then cached). Rebuild after switching branches: `pipx run code-review-graph==2.3.6 build`.

**Maintainer note:** the pinned version `2.3.6` appears in `.mcp.json`, `.cursor/mcp.json`, the two hook commands in `.claude/settings.json`, `.ai/MCP.md`, `.claude/skills/code-graph/SKILL.md`, and the guidance below. Bumping requires updating all locations in sync.

### First-call protocol - load schema before grep

In Claude Code, graph MCP tools are **deferred** at session start; their schemas are not loaded. Calling them directly fails with `InputValidationError`. The sequence is always:

1. `ToolSearch` with `query: "select:mcp__code-review-graph__query_graph_tool"` to load the schema (comma-separate names to load several in one call).
2. Call `mcp__code-review-graph__query_graph_tool` with `pattern` and `detail_level: "minimal"`.

Agents without deferred tool loading (e.g. Cursor) skip step 1 — the graph tools are callable directly.

If you reach for `grep -r "from.*foo"`, `grep -rn` for a symbol, or repeated `Read` calls to answer a cross-file question, **stop and load the graph tool first.** Grep produces 2-6x more tokens, lacks structural context, and misses dynamic dispatch.

### Trigger phrases - these mean "use the graph"

The first tool call should be `ToolSearch` for the graph schema whenever the user asks any of: "dependency chain", "who calls X", "callers of X", "callees of X", "where is X used", "find references", "what imports Y", "blast radius", "impact of changing X", "methods on class Z", "find dead code", "trace this bug". The matching `code-graph-*` skill is helpful but not required - a single `ToolSearch` -> `query_graph_tool` round trip is fine.

### Use the graph for cross-file traversal

| Task | Tool + pattern | Token advantage |
|------|---------------|-----------------|
| Who calls `foo`? | `query_graph` `callers_of` | ~5k tokens vs ~11k for grep+context (2x cheaper) |
| What does `Foo` call? | `query_graph` `callees_of` | Same advantage as above |
| What files import `bar.ts`? | `query_graph` `importers_of` | Structured; no grep context needed |
| Blast radius before a refactor | `get_impact_radius` | ~100 tokens for count + risk score |

### Use Grep/Read for single-file work

| Task | Why Grep wins |
|------|--------------|
| Methods in one file | `children_of` standard = ~2,845 tokens; grep = ~473 tokens (6x cheaper) |
| Recent change review | `detect_changes` requires the graph to be on the same branch |
| Test coverage lookup | `tests_for` returns 0 incorrectly for files with known tests - not reliable |
| Natural-language search | No embeddings built; `semantic_search_nodes` falls back to keyword matching |
| Architecture overview | `get_architecture_overview` returns 3.9M characters - do not call it |

### Mandatory rules

1. **Always pass `detail_level: "minimal"`** - standard mode repeats the full absolute path per node and inflates token cost 6x.
2. **Use fully qualified names**: `path/to/file.ts::ClassName.methodName`. Bare names return an "ambiguous" error.
3. **Rebuild on branch switch**: `pipx run code-review-graph==2.3.6 build`. A stale graph causes `detect_changes` to report function names from unrelated files.

### Reliable tools

| Tool | Use when |
|------|----------|
| `query_graph` pattern=`callers_of` | Finding all functions that call a target |
| `query_graph` pattern=`callees_of` | Finding all functions a target calls |
| `query_graph` pattern=`importers_of` | Finding all files that import a target |
| `query_graph` pattern=`children_of` | Listing all methods in a class (use minimal mode) |
| `get_impact_radius` | Quick blast-radius count before a large refactor |
| `semantic_search_nodes` | Name-based lookup by exact or partial function/class name |
