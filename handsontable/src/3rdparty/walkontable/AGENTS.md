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

## The master table must remain a stacking context below overlay clones

`.ht_master` is `position: relative` with `z-index: 0`. The explicit zero is load-bearing: it traps
the scroll holder and every browser-promoted scrolling layer below the overlay clone divs
(`inline_start` 120, `bottom` 130, `bottom_inline_start_corner` 150, `top` 160,
`top_inline_start_corner` 180). Removing the stacking context lets the holder compete directly with
the clones. Under a transformed ancestor, mobile browsers can then composite the scrolling master
above the frozen panes.

The window 101–119 remains reserved for these: the `moveCells` bands (100, inlined by `createMoveZone`),
the autofill fill handle (`.wtBorder.corner`, 110) and the desktop resize handles
(`.wtSelectionHandle`, 115). Do not raise any of them to clear something else — every frozen overlay
draws its own copy of each affordance, so none of them needs to outrank a clone to appear inside a
pane. `.ht_clone_master: 100` in the z-index map does **not** apply to the master overlay; that class
is stamped on the editor container by `src/editors/factory.ts`.

Two related mechanisms that look like counter-examples and are not: the mobile selection handles take
an inline `zIndex = '9999'` inside their table's stacking context (`border.ts`, legacy #9850), and the
fill handle is *repositioned* rather than re-layered at the `fixedRowsBottom` line
(`isCornerLiftedAtBlockEnd`). Since the master became a stacking context, that 9999 can no longer
clear a clone, so the master's mobile handles are repositioned instead: the top handle is inset by
`isTopHandleOccludedByClone` and the bottom handle is lifted by `isBottomHandleOccludedByClone`.

**The trigger for those two is clone presence, not the fixed-pane count, and the difference is not
cosmetic.** `shouldRenderTopOverlay` is true for `colHeaders` alone, so with `fixedRowsTop: 0` a
row-0 selection sits flush against the `top` clone exactly as row `fixedRowsTop` does with a frozen
pane, and an outward-hanging handle dies under it either way. `isFrozenBoundaryEdge` answers the
narrower "is this a freeze line" question and is the right helper for the fill handle and the
boundary edges; routing the handle *position* through it silently drops the header case (and, on the
other axis, `rowHeaders` plus `shouldRenderInlineStartOverlay`). Both helpers also return `false` off
the master on purpose. Handles drawn by a frozen overlay itself need no treatment: they
already land flush against the `.wtHolder` edge that clips them, which `border.spec.js` pins to the
pixel on both axes. Note `.wtHolder` is the clipping box (`overflow: hidden`), while the clone element
is `overflow: visible` and ends a few pixels earlier — measure the holder, not the clone.

One case is *not* covered and is not a regression: with both headers off and no frozen panes, a row-0
top handle is drawn at a negative offset and the master's `.wtHolder` clips it. It was invisible
before the stacking context too, so it keeps the outer-corner placement
(`mobile-selection-handles.spec.ts` pins that branch).

The declarations live in `src/styles/base/_z-index-map.scss`, `css/walkontable.scss` (master and
clone values, duplicated — keep in sync) and `src/styles/components/core/_selection.scss` (the
affordances).

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
- **The 1px boundary flip is a DOM-sync problem, not a cache problem, and the two must stay separate.** On a table that renders no head row of its own, the band's first `<tr>` gains a 1px border-top, so a row's total height changes by 1px purely by scrolling onto the boundary, and the measured value then alternates between the two across draws. `markOversizedRows` keeps a `> 1` tolerance before invalidating the row-height cache — **do not tighten it**: counting 1px as a change invalidates on every single draw for as long as the row sits at the boundary. But the DOM side still has to be reconciled, because a table whose content genuinely needs the larger total (the frozen overlay holding the tall cell) cannot render it one pixel shorter, while the master honours whatever it was given. Re-applying the current record to every table is what closes that gap. Since the row axis settled (below), a table that DOES render a column header no longer flips: the header owns that gridline at every offset, so its first row's height does not depend on where the band starts. The predicate is per table (`table.THEAD.hasChildNodes()`), not per grid — the bottom clones never hold a head row and keep the flip — so the tolerance stays for all of them.
- **`adjustElementsSize` is gated on a real height change.** It walks every column (`sumCellSizes` must stay a live walk) and resizes three overlays; calling it on every draw taxes wide grids for nothing. But it *must* run when the heights did change, including a shrink where there is nothing left to re-apply — `wtOverlays.refresh()` sized the elements earlier in the draw, so the scrollbar would keep the old length.
- **Steady state must cost zero row-height cache invalidations.** Each one drops the per-draw layout snapshot as well, and with a non-uniform row-size source (`rowHeights`/`minRowHeights` as an array or function, or any non-AutoRowSize `modifyRowHeight` hook) `PositionCache` has no sparse path, so a rebuild is a full prefix-sum walk over every row. Verified by counting: 0 invalidations/draw and an unchanged `createVisibleCalculators` count in every configuration. Two specs in `tests/e2e/walkontable/frozen-column-row-heights.spec.ts` pin the invalidation count at 0 through the fixture's `countRowCacheInvalidations` — the only way to see this class of bug, since the rows stay aligned and every visual assertion passes while it happens.

When you add a new content-driven measurement, ask which tables actually render the content — measuring the master alone is the trap both of these exist to work around.

## The hider height is fractional below 100% zoom, and two coordinate spaces meet there

`SpreaderSize#adjustElementsSize` writes the master hider's height, and below 100% browser zoom or
display scaling it writes a **fractional** value (`"1210.45px"`). That element is what decides
whether the grid shows a scrollbar: with `height: 'auto'` the holder keeps `style.height = 'auto'`
and simply resolves to the hider, so a hider a fraction shorter than the table inside it is a
vertical scrollbar on a grid that must never scroll — and, because `stretchH` already sized the
columns against the full width, a horizontal one behind it (DEV-2525).

Four rules come out of that, and each of them was a defect first.

- **Never `parseInt` a value read back off `hider.style.height`.** It truncates the fraction and
  hands back the shortfall. The one method that read it back, `expandHiderVerticallyBy`, used
  `parseFloat` for that reason; it is gone since DEV-2786 removed its only caller, so nothing reads
  the written height back today - keep it that way. (`topOverlay.ts`'s
  `parseInt(holderParent.style.height, 10)` reads the *clone's* holder parent, a different element,
  and is not this.)
- **The sum's fixed terms must carry their fraction too.** `getHiderHeightCompensation`
  (`axisSizing/hiderCompensation.ts`) adds the amount by which the browser *inflated* the cells'
  bottom border past the whole pixel the row heights were summed with — a browser cannot paint a
  border thinner than one device pixel, so a declared `1px` resolves to 1.11111px at 90% and
  1.49254px at 67% — and `Viewport#getColumnHeaderHeightFraction()` supplies what
  `getColumnHeaderHeight()`'s integer `offsetHeight` rounded away. Both are 0 at 100%.
- **Add the inflation to the historical `1`; never return the border itself.** The menu grids and
  the Filters by-value list drop all four borders on `td:first-child`
  (`.handsontable.htDropdownMenu table tbody tr td:first-child` and its two siblings), and
  `StylesHandler`'s probe cell IS a `td:first-child` inside them, so the border reads `0px` there —
  at 100% zoom, on every platform. Returning it would have resized those grids by a whole pixel at
  the default zoom. The same trap runs the other way at 50% (`2px`) and above 100% (`0.8px`), where
  the row sum already accounts for the whole pixel. The `> Math.round(…)` gate is deliberately the
  one `StylesHandler#calculateRowHeight` uses, because the two have to agree about which borders the
  rows already carry.
- **`getBoundingClientRect()` and `offsetHeight` are NOT in the same coordinate space.** A rect is
  scaled by an ancestor's CSS `zoom`; `offsetHeight`, `clientHeight` and the computed style are not.
  Subtracting one from the other to get a fraction looks right under
  `--force-device-scale-factor` (where they agree) and yields a large **negative** number under CSS
  `zoom`, shrinking the hider instead of growing it. Take the fractional height from
  `getComputedStyle(el).height`, which matches `offsetHeight`'s space at any zoom. The same trap
  ruins measurements in tests — never compare a rect against a `clientHeight`.
- **`gatherLayoutInput` re-derives the same total independently**, so both sites fold in the same two
  terms and the same device-pixel rounding. A prediction built on whole pixels while the DOM carries
  fractional ones disagrees exactly at the knife edge, which is a scrollbar the solver said would not
  be there.

`addContentHeightSlack()` adds a fixed 0.05px to a *fractional* total, because summing the rows
reproduces the browser's own sub-pixel snapping only to about 0.024px and that is enough to summon a
full-size bar on a small grid at 67%. Two things about it are load-bearing and were both learned the
hard way.

**Do not round up to the device-pixel grid instead.** It reads as the principled choice — one device
pixel is the smallest distance a screen can show, so the added height is invisible — but this total
is also what the browser weighs against a fixed `height` setting. A 264px box holding 264.22px of
rows at 80% zoom shows no scrollbar, because the browser rounds that deficit away; inflating the
content by most of a device pixel pushes it over and produces a full 15px bar. That trades one
unwanted scrollbar for another. Deciding the rounding from the holder's own height does not rescue
it either: with `height: 'auto'` the holder resolves FROM the hider being written, so the test would
read the previous draw's height.

**A whole-pixel total is returned untouched**, which is every total at 100% zoom — there is no
sub-pixel residue to cover when nothing was measured in fractions.

**Only the hider write gets the slack; `gatherLayoutInput` deliberately does not.** The two ask
different questions. The slack stops the hider ELEMENT falling a hair short of the table inside it,
a comparison the browser makes and rounds to device pixels. The solver asks whether the content
overflows the workspace, and both of its tests are an exact `>` — element mode against
`workspaceHeight`, window mode against `documentClientHeight` after subtracting the hider's INTEGER
`offsetHeight`. A deliberate 0.05px overshoot fed into an exact comparison models nothing the browser
can see and can only flip the verdict the wrong way: the solver reserves a vertical bar, `stretchH`
shrinks the columns to make room, and no bar is ever painted. The two shared sub-pixel terms (the
border inflation and the header fraction) still go into both, because those describe real height.

**`stylesHandler` is a user-supplied setting that defaults to `null`, and a standalone Walkontable
host may implement only part of it** — the engine's own Puppeteer harness (`test/helpers/common.js`)
does. `getStyleForTD` is therefore declared optional on the `StylesHandler` interface in `types.ts`,
and calling it unguarded threw inside the draw and took out 695 of 816 specs. Guard every method you
add a dependency on, and teach the harness stub the same method.

## Border ownership: the header owns its gridline, on both axes

Both axes are settled, and they are now symmetric. On the column axis a row header `th` carries its
own `border-inline-end` at **every** scroll position, and no `td` standing behind a row header
carries a `border-inline-start`. So one declared `colWidths` produces one content width in every
column, and `col.rowHeader` is written verbatim from the `rowHeaderWidth` setting whatever the scroll
offset (`render/colGroup.ts`). The row axis is the same shape, one section down.

It used to work the other way round, and that was issue #6673. `td:first-of-type` was given an
inline-start border on top of the inline-end border every cell has, and `box-sizing: border-box` took
both out of the same `col` width — so column 0's content box was 1px narrower than everybody else's.
The row header then dropped its own inline-end border at offset 0 to keep the seam from doubling, and
a `correctHeaderWidth` flag widened the row header by 1px the moment the grid scrolled, with matching
compensations in `inlineStartOverlay#scrollTo`, the hider width (`spreaderSize`) and the two column
calculators (`viewportWidth + 1`). The table therefore changed width by being scrolled. All of that is
gone; do not reintroduce a scroll-dependent header width or a per-axis `+ 1` in a column calculator —
`getViewportWidth()` is exact at every offset now.

Consequences worth knowing:

- **`innerBorderInlineStart`, `innerBorderLeft` and `emptyColumns` still get stamped on `.ht_master`**
  (`overlay/regions/inlineStartOverlay.ts`) and are kept for backward compatibility, but no stylesheet
  reads them any more. `innerBorderInlineStart` also only toggles when the grid has row headers and NO
  frozen columns, so it is not a usable "has scrolled" signal in a test — poll the holder's
  `scrollLeft` instead.
- **`InlineStartOverlay#resetFixedPosition` reports `false` unconditionally**, and `ctx.positionChanged`
  no longer exists at all — the top and bottom overlays were the last contributors and the row axis
  took the same treatment, so the flag, the reconciliation branch and `prepareHeaderBorders` are gone.
  The class shifts no layout, so the flag's one job (reconciling a 1px shift) had nothing to do, yet
  every scroll crossing horizontal offset 0 ran `refreshAll()`: a nested `wot.draw(true)` over the
  master and every clone. Grids on the single-pass path did not pay it, because `prepareHeaderBorders`
  applies the class before the cells render and the post-render toggle then finds it already in place.
  Those two gates line up exactly, which is worth knowing before you assume a window-scrolled grid slips
  between them: `usesLayoutSnapshotForCalculators()` requires `!isHorizontallyScrollableByWindow()`,
  that predicate IS `inlineStartOverlay.trimmingContainer === rootWindow`, and `prepareHeaderBorders`
  bails on the same test against the same overlay — so anything passing the single-pass gate is
  element-scrolled and never bails. `preventOverflow` does not enter into it; it changes how
  `resetFixedPosition` uses the trimming container, not what the container is. The cost therefore
  landed on the grids that drop off that path, and there are TWO ways to do that, both of which paid:
  breaking the uniform-size requirement (`colWidths` as an array, or an active `manualColumnResize`),
  and breaking the element-mode requirement (a window-scrolled grid, i.e. no `width`/`height`). The
  window shape is the harsher one, since `prepareHeaderBorders` bails on it outright and so could
  never have pre-applied the class whatever the other settings said. Both have a leg in
  `tests/e2e/walkontable/inline-start-border-refresh.spec.ts`.
- **Counting `refreshAll` cannot measure a reconciliation draw on its own.** `ScrollSync` calls
  `refreshAll` once per scroll event as the normal response to a scroll (`overlay/scroll/scrollSync.ts`),
  so a per-crossing count is at least 1 whether or not anything reconciled, and that baseline hides the
  difference. The reconciliation was the **re-entrant** call: the scroll-driven one runs `wot.draw(true)`,
  and a draw that saw `positionChanged` called `refreshAll` again from inside it. Nothing sets that flag
  any more, so the re-entrant count is 0 on both axes — which is the assertion, not a reason to stop
  counting: a reintroduced report shows up here and nowhere else. Count by nesting depth
  **on `refreshAll` itself**, which is reachable: `ScrollSync` holds it as a late-bound closure
  (`refreshAll: () => overlays.refreshAll()`), so replacing the method is observed through that call too.
  Do **not** try to get the depth by patching `draw` on the instance `hot.view._wt` hands you:
  `wtOverlays.wot !== hot.view._wt`, so a patched `_wt.draw` counts **zero** calls even for a
  `refreshAll()` invoked directly, which definitely runs `this.wot.draw(true)`.
  `tests/e2e/walkontable/inline-start-border-refresh.spec.ts` measures it this way.
- **The row axis is the same shape, and the gate is PER TABLE.** A column header `th` carries its own
  `border-bottom` at every scroll position, and no body row abutting a head row draws a `border-top`.
  The CSS says `thead:not(:empty) + tbody > tr:first-child`, and that per-table form is load-bearing:
  every overlay clone has its own `thead`, empty unless that clone renders the head row, so the rule
  matches the master and the inline-start clone (no frozen top rows), and the top clone and top corner
  (frozen top rows). The bottom clones' `thead` is always empty, so their first row keeps its
  `border-top` — there the pixel is the bottom-freeze seam, not a header seam, and a grid-wide gate on
  the root's `htColumnHeaders` class would have taken it away. A grid with no column headers keeps the
  border everywhere for the same reason: it is the grid's own top frame, deliberately left as-is, the
  mirror of column 0 staying 1px narrower on a grid with no row headers.
- **The `+ 1` that goes with it is asked as a question, not answered per call site.** It used to be
  reimplemented independently in `StylesHandler#getDefaultRowHeight`, `AutoRowSize` and
  `ManualRowMove`'s drop guideline; they all now route through
  `StylesHandler#firstRenderedRowDrawsTopBorder()`. In the engine the same question is
  `getHiderHeightCompensation(wtSettings)` in `axisSizing/hiderCompensation.ts`, which reads the
  `externalRowCalculator` and `columnHeaders` settings itself. It is read by
  `SpreaderSize#adjustElementsSize` (which writes the hider height) and by `gatherLayoutInput`
  (which predicts the scrollbars from the same total before the DOM is written). Those two must agree
  to the pixel or a grid predicts a scrollbar it does not get — that is how a StretchColumns spec
  failed on a layout snapshot describing a scrollbar the DOM never grew. Do not add a fifth copy.
- **`getColumnHeaderHeight()` no longer changes with the scroll offset**, and neither does the hider
  height or `getViewportHeight()`. `calculatorFactory` still resets the cached value to `NaN` on every
  draw, so it is re-measured each time — it just measures the same number now. Anything that was
  compensating for the flip is gone: `columnHeaderBorderCompensation`, `expandHiderVerticallyBy`,
  `isScrolledBeyondHiderHeight` and the `scrollTo` bottom-edge term. Do not reintroduce a
  scroll-dependent header height.
- **Anything positioning an element over a cell must read the cell's border, not its index.** Which
  cells own an inline-start border is no longer "column 0": with row headers none of them do, and
  `htFirstDatasetColumnNotRendered` takes it off the first rendered column too. `BaseEditor#getEditedCellRect`
  keys both the editor's width and its inline-start offset off the same computed border for exactly
  that reason — key them off different things and the editor is a pixel wider than where it starts,
  overhanging the next column.
- **Reading the border is not enough for anything the overlays paint over.** The shared pixel in front
  of column 0 belongs to the inline-start overlay, which is z-index 120 against the selection border
  layer's 10, so an affordance centred on that gridline is *geometrically* right and *invisible*.
  `Border#appear` therefore shifts the edge onto the cell's own boundary when the cell either owns an
  inline-start border **or** has a row-header `th` as its previous sibling. That second test is what
  keeps a selection on column 0 visible; without it the edge lands at `rowHeaderWidth - 1` and
  disappears behind the row header. The `customBorders` specs cannot catch it — they count visible
  elements, and the element is there, just covered.

  The row axis has the same branch and a wider z-gap: `.ht_clone_top` is 160 (the corner 180) against
  the same border layer's 10. `standsBelowColumnHeader(cellElement)` in `selection/border/utils.ts` is
  the twin of `standsBehindRowHeader` — the cell is the first `<tr>` of a `tbody` whose previous
  sibling is a NON-empty `thead` — and `Border#appear` moves the top edge onto the cell's own boundary
  for it. Same blind spot: the edge is present, just painted over.
- **The active-header accent on the first rendered row moves to the CORNER.** `-row-seam-bottom` /
  `-row-seam-top` colour the row *above* an active one, and row 0 has none — the accent used to come
  from the row's own `border-top`, which is now 0px wide. `SelectionManager` therefore tags the last
  head row's first `rowHeadersCount` `th`s in the top-inline-start corner with
  `${activeHeaderClassName}-row-seam-top`, reusing the rule that already matches a `thead`'s
  `tr:last-child`. It is gated on the corner clone and on the selection actually starting at the first
  rendered row, so it cannot widen into every row-header selection. A colour assertion cannot police
  that gate: `--ht-header-active-border-color` resolves to the plain border colour in `classic`, so the
  negative control has to assert the CLASS.
- **Ownership covers the seam's COLOR, not only which element draws it.** In the overlay that renders
  nothing but the row-header column, the row header `th` is also `:last-child`, and the header rule
  keyed on that paints the grid's OUTER frame color. So the same gridline came out
  `--ht-border-color` with plain `rowHeaders` and `--ht-cell-horizontal-border-color` with
  `fixedColumnsStart` — invisible in `horizon`, where the cell-border token is transparent, and
  visible in the other shape. `_base.scss` pins the seam owner to the cell-border color under
  `.htRowHeaders`, with three carve-outs: `.emptyColumns`, where the row header really is the grid's
  inline-end edge; `ht__active_highlight-prev`, which is how an active column-0 header gets its
  inline-start accent (that pixel moved to the corner); and `ht__active_highlight`, because the seam
  is the active row header's own inline-end and the accent has to win there. The grid managed that
  last one only when scrolled before, since the border was 0px at horizontal offset 0.
- **A grid can carry more than one row header column**, and then the seam to column 0 is the LAST
  one's `border-inline-end`. `afterGetRowHeaderRenderers` is a documented hook that appends
  renderers, and `autoRowHeaderSize` measures each of them, so this is a supported shape rather than
  a curiosity. The body selector therefore matches every `th` in a body row - all of them are row
  headers - rather than `th:first-child`; the inner ones need no override because they are never
  `:last-child`. The HEAD row cannot be keyed the same way, because CSS cannot count how many corner
  cells precede the first column header - a corner is a `th` like the column headers beside it. It
  keys on **`htLastRowHeaderColumn`** instead, a marker the engine stamps in `render/columnHeaders.ts`
  on the last CORNER cell of each head row. **Head rows only** - a body row needs no marker, since
  every `th` there is a row header and the rule matches them all, so stamping one in
  `render/rowHeaders.ts` would put a class no stylesheet reads on every row header of every rendered
  row (and it broke a dozen exact-markup specs when it was tried). That renderer runs once per
  `Table`, so the marker lands in every clone with no extra wiring, exactly as `htLastVisibleHeader`
  does. It is stamped AFTER the header renderer runs - `TH.className` is reset first and a renderer
  may assign to it. No clearing pass is needed, and the invariant behind that is `orderView.start()`:
  it sizes the root to exactly the nodes the view owns and the loop then visits every one of them,
  resetting `className` before deciding, so nothing can keep a marker from a previous draw. Gating
  that reset the way `render/cells.ts` gates its own behind `shouldPaintCell()` would break it, and
  would have to bring a clearing pass along. (`htLastVisibleHeader` needs its backward walk for a
  different reason: `hiddenHeader` moves between draws.)
  Before the marker this half keyed on `:first-child`, which picks the same cell with one row header
  and the WRONG one with more: the first corner, whose inline-end is an inner seam, while the real
  seam fell through to the `th:last-child` frame rule. Only `horizon` could see it, since `main` and
  `classic` map the cell-border token to the frame token.
- Without row headers, column 0 is the first cell of its row and still draws the grid's own
  inline-start frame inside its declared width. It stays 1px narrower than the rest — deliberately out
  of scope for #6673, and pinned as a control case in
  `tests/e2e/row-header-border-ownership.spec.ts`.

## Exact row heights

A provided row height has two possible meanings, chosen per row by the `rowHeightMode` setting (`'min'` by default; the `RowSizeSource#getMode` port, resolved once in `RowUtils#isExact`): a **floor** the content may grow past (the historical behavior, every path above), or an **exact** height the row renders at, with taller content clipped. A row is exact only when the mode says so AND it has a positive provided height — `0` and `undefined` are "no height", so a hidden row's `0` never becomes a 0px exact row, and `rowHeights: 0` falls through to the default like `colWidths: 0`. **`isExact` reads the mode before the size, and the order is load-bearing**: the size read is the host's whole row-height funnel (every `modifyRowHeight` hook in Handsontable), while the mode is a literal `'min'` until a host supplies a function, so a default grid must never reach the size read from there. **Every loop over rows asks `RowUtils#mayHaveExactRows()` once and skips the per-row probe when it is `false`** — the render loop, the measurement walk and the re-apply pass all do. Without it a grid that never sets the mode paid one settings read per rendered row per table per draw (measured: 61 per draw on a 30-row band, against 3 with it). The render loop also resolves exactness once per row and hands it to `getHeightByOverlayName`, so the funnel runs no extra time in either mode; measured on the fixture, a draw costs 3 `modifyRowHeight` calls per rendered row in `min` mode (the same as before the mode existed) and 5 in `exact` mode. Measured against the pre-change bundle on a 100k-row grid with a 570-cell viewport, a default grid's draw time is unchanged (2.2ms full draw, 10ms scroll step on both), and the exact mode matches it.

Four things hold a row up, and exactness has to defeat each of them:

1. **The DOM read-back.** `markOversizedRows` skips exact rows (before the geometry read, so they cost nothing), `RowUtils` returns the provided height without the `Math.max` against `oversizedRows`, and a record an exact row may still hold from before it became exact stays wiped so the shrink detection reports the change. The frozen sync inherits the skip because it calls `markOversizedRows`. A **uniform exact band skips the walk outright**: the uniform early-out compares the TBODY against `rowCount * defaultRowHeight`, which an exact band never matches, so without the shortcut the most common exact configuration (`rowHeights: <number>`) would walk every rendered row on every draw. The shortcut needs the sizes AND the mode to be uniform (`RowSizeSource#isModeUniform`: the setting is a literal — neither a function nor an array, both of which `getSetting` resolves per row) — `isUniform()` describes the size source alone, and one row's mode cannot stand for the band's otherwise, so a host that wants the shortcut passes a literal mode when it applies to every row. On an exact row, `getHeightByOverlayName` falls back to the row's own height when an overlay listener answers nothing, so no overlay can drop to the floor shape while the row-height cache carries the exact value.
2. **The cells the height is not written to.** The floor shape writes the height to `TR.firstChild` only. That is enough for a floor, and it is why the stylesheet's default `height` on every `td`/`th` holds an exact row up even when the cells are empty. The exact shape (`render/exactRowHeight.ts`, used by both the render loop and `applyRowHeightsToRenderedRows`) marks the **row** with `htExactRow`, and the stylesheet releases the cells' minimum height through that class (`tr.htExactRow > td { height: auto }`), so the height still goes on one cell only — the first that spans a single row and is rendered; a cell spanning several rows (a merged cell) never carries it, the span sizes it, and a cell MergeCells covers is `display: none` with its `rowspan` removed, so a height on it would hold nothing up. When no cell can carry it at all (every cell covered or spanning) the height goes on the `tr` instead, or the row would collapse to its borders now that the stylesheet released the cells' minimum. **The marker must stay on the row, not the cells.** The cell renderers reset every cell's class and inline style on each draw, and a per-cell marker was measured at +2.2 ms of style recalculation per draw on 462 cells (the browser recomputed the whole band); the row renderer leaves the row's class alone, so re-asserting the row marker each draw costs nothing (adding a present class is a no-op) and heals a hook that rewrote `className`. The release clears every cell's inline height, because the carrier need not be the first cell and the out-of-render path has no renderer to reset it.
3. **CSS table layout.** A table cell's `height` is a minimum, full stop: `overflow: hidden` on the cell does not shrink it, and a `height: 100%` child resolves to the content height (measured, not guessed). The only thing that works is taking the content out of flow: each data cell's content is moved into `div.htCellClip`, which the stylesheet positions absolutely over the cell's padding box and clips; the cell drops its own padding through the row class (a border-box cell cannot be shorter than its padding plus border — 17px in `horizon`), while the wrapper's insets carry the same padding so the text does not move. Row headers keep their `.relative` wrapper (taken out of flow the same way; it must stay `TH.firstChild` or `appendRowHeader` rebuilds it every draw) and the header's own `span.rowHeader` clips — never `.relative` and never the `th`: the active-row accent bar is a `.relative::after` inset by -1px on three sides to meet the gridlines, and a clip on either box cuts it off (a body-row `th` has `padding: 0`, so its padding box is its content box). A custom row-header renderer that builds no `.rowHeader` is simply unclipped; it can never grow the row, because `.relative` is out of flow. Vertical alignment (`htMiddle`/`htBottom`) maps onto the wrapper through `align-content` on the block box, never `display: flex` — the indicator renderers float their arrows, and a flex container ignores floats.
4. **The renderers.** The cell renderer resets a painted cell's class and inline style, so the one inline height is re-applied on every draw (the reason the height pass must stay after `cells.render()`). The pass runs for every rendered row whatever the cell painter decided, which is what keeps it correct under `renderMode: 'onChange'`: a cell the diffing pass skips keeps its wrapper and its height, and re-applying them is idempotent. The painter reads its own stamps and never inspects cell DOM, so the wrapper is invisible to it. The wrapper is the expensive part: `fastInnerText`'s fast lane needs `firstChild` to be a text node, and `empty(TD)`/`innerHTML` wipe it. Every built-in renderer therefore writes through `getCellContentRoot(TD)` (`helpers/dom/element.ts`), which returns the wrapper when it is the cell's only child, and `fastInnerText`/`fastInnerHTML` do the same — so the wrapper survives a redraw and the row-height pass sees "already wrapped" and does nothing. A custom renderer that wipes the cell costs one re-wrap per draw, on exact rows only; that is the accepted cost, and it is the exception to the "no structural DOM mutation per draw" rule in `tableRenderer.ts`. A renderer that inserts a node **next to** the wrapper (the old `TD.insertBefore(ARROW, TD.firstChild)` shape) grows the row back — in-flow content outside the wrapper counts — which is why the arrow renderers went through the content root too.

Switching a row back to the floor shape unwraps it once (a `WeakSet` of exact rows, so floor rows are never inspected). Column headers are out of scope on purpose: `adjustColumnHeaderHeights` writes a minimum by design.

Pinned by `test/unit/axisSizing/rowHeightMode.unit.ts`, `test/unit/renderer/exactRowHeight.unit.ts`, and `tests/e2e/walkontable/exact-row-heights.spec.ts` (the fixture flips the mode on the engine directly; the `min`-mode case there is the precondition that a short provided height alone does not shrink a row).

## Per-axis trimming containers

Each scroll axis has its own **owner**: the nearest ancestor of `.ht_master` whose `overflow-x` (or
`overflow-y`) is `scroll`, `hidden`, `auto`, or `clip`, else the window. The two answers can differ.
A root with `overflow-x: clip` and nothing on the vertical axis — what core writes for a definite
`width` with no sized `height` — owns the horizontal axis while the window owns the vertical one:
the holder scrolls the columns inside the root's box, and the page scrolls the rows. Resolved by
`resolveAxisOwner()` (`overlay/axisOwner.ts`) over the per-axis form of `getTrimmingContainer()`.

The owners live on the overlays: the top and bottom overlays carry the vertical owner in
`trimmingContainer`, the inline-start overlay the horizontal one, and
`isVerticallyScrollableByWindow()` / `isHorizontallyScrollableByWindow()` read exactly those two
fields. Three rules follow.

- **A decision about the other axis goes through the viewport predicate, never `this.trimmingContainer`.**
  The width of the top and bottom clones is a horizontal question and the height of the inline-start
  clone a vertical one (`rootSized`); a scrollbar is subtracted from a clone only when the holder owns
  the axis that scrollbar belongs to (`hasVerticalScroll() && !isVerticallyScrollableByWindow()`);
  the scrollbar clearance strips read the owner of the axis the strip lies on. Reading the overlay's
  own owner for any of those sized the frozen-column clone to the full hider height, or shrank the
  top clone by a page scrollbar the holder does not have. An overlay that spans BOTH edges needs two
  predicates, not one: `BottomOverlay`'s inline-end strip clears the vertical scrollbar and asks its
  own (vertical) owner, while its bottom strip clears the horizontal one and asks the inline-start
  overlay's. One predicate for both published 0 in split mode, and the frozen bottom rows painted over
  the holder's horizontal scrollbar at the grid's end. A bottom strip also needs the clone to actually
  REST on the holder's bottom edge — `hasVerticalScroll()` is not that question on a window-owned
  vertical axis, where it stays true while the clone floats mid-page and `repositionOverlay` (which
  lifts the clone clear in element mode) never runs; `BottomOverlay#restsOnHolderBottomEdge` answers
  it per axis owner. **Compute that answer on every read, never cache it in the positioning pass:**
  the sizing pass that consumes it (`adjustRootElementSize`, and the band `Overlays` derives from the
  strip it publishes) runs from `Overlays#refresh` BEFORE `resetFixedPosition` in the same draw, so a
  cached value is one draw behind exactly when the clone arrives on the edge or leaves it — and the
  band would then disagree with the clip. **The bottom-inline-start corner reads that overlay's finished strip
  through `getBottomClearance()` and never recomputes it** — it is drawn over the same edge, so two
  gates that disagree leave a notch where the frozen columns stop and the frozen rows carry on
  (#10370). The draw cycle positions the bottom overlay before the corner, which is what makes the
  read safe.
- **`preventOverflow` is an alias, not a mode.** `'horizontal'` forces the horizontal owner to the
  root's parent and `'vertical'` the vertical one; everything the option used to switch by string
  comparison now follows from the owners. Its only remaining reads are the window-mode overflow
  reset in `MasterTable` (`true` still suppresses it), `InlineStartOverlay#getTableParentOffset`, and
  the two header-border suppressions, which are visual rules pinned by
  `src/__tests__/settings/preventOverflow.spec.js`. The option stays forever, without a warning.
- **Never ask `instanceof HTMLElement` whether an axis owner is an element — use `isHTMLElement()`.**
  `resolveAxisOwner` takes its realm from `ownerDocument`, so it correctly hands back an iframe's
  element to a parent-realm caller; `instanceof` then fails to recognize it against the parent's
  constructor, and the axis silently reads as window-owned. The two halves of the engine then
  disagree about the same axis: `isHorizontallyScrollableByWindow()` answers `false` while the master
  lays the holder out in window mode, so it is left `overflow: visible` and never sized, and the
  columns past the width are unreachable — the exact defect this section exists to remove, one realm
  over. Scroll offsets have the mirror of it: read them with `isHTMLElement(el) ? el.scrollLeft :
  rootWindow.scrollX`, off the INJECTED `rootWindow`, because `instanceof Window` misses a
  cross-realm window just as surely and a fall-through to `0` reports a motionless axis on every
  frame — the scroll hooks then never fire. The shared helpers `getScrollTop` / `getScrollLeft`
  (`helpers/dom/element.ts`) had the same shape and are what `Overlay#getScrollPosition` reads, so
  the row calculators built the band from `undefined` and put it on the LAST rows of the grid at
  page top; and the key-press guards in `NativeScrollInput` (`#onTableScroll`, `#onCloneWheel`) told
  the holder from the window the same way, so an arrow-key scroll skipped `syncScrollPositions`
  for the whole key press and the clones kept the old band. Pinned by
  `tests/e2e/iframe-cross-realm-scroll.spec.ts`, which builds a grid in an iframe from the parent
  page's constructor; nothing else in the suite crosses a realm, so an `instanceof` reintroduced
  here stays green everywhere else. jsdom is a second such realm: its `window` fails
  `instanceof Window` too, which is why `getScrollTop(window)` returned `undefined` in every unit
  test and kept the window-scroll strategies' `scrollIntoView` call unreachable there — the
  `Element.prototype.scrollIntoView` stub in `test/bootstrap.js` exists because the fix made it
  reachable.
- **Scroll offsets are read and written per axis, off each overlay's `mainTableScrollableElement`,
  never off one shared element.** The inline-start overlay's element scrolls the horizontal axis
  and the top overlay's the vertical one, and in split mode they are different things (the holder
  and the window). Three paths follow that rule: `ScrollSync#syncScrollPositions` (the per-frame
  direction flags), `ScrollSync#syncScrollWithMaster` (the offset handed to a clone whose render
  state just changed) and `Overlays#scrollVertically` / `scrollHorizontally` (the wheel
  translation). Each one used to read both axes off ONE element and reached three different dead
  ends in split mode: the direction flags missed the window's vertical scroll, the clone sync read
  the top overlay's element — the window — and gave up, so a `fixedRowsBottom` enabled after a
  holder scroll came up a whole scroll away from the master, and the wheel translation consumed
  the horizontal part on the holder and then cancelled the event, taking the window-owned vertical
  part with it: a diagonal trackpad swipe moved the columns and not the page. A window-owned axis
  is scrolled from the wheel path with `rootWindow.scrollBy({ behavior: 'instant' })`, so the event
  is consumed on both axes and the offset is readable at once whatever `scroll-behavior` the page
  sets; the clone sync skips it instead, because a clone holder must not accumulate the page offset.
- **`ScrollSync#setRenderingStateChanged` latches until `syncScrollWithMaster` consumes it.** A
  draw nests: the master `beforeDraw` hook can run a full draw of its own, and that draw's
  `beforeDraw` fires before the outer `afterDraw`. The outer `beforeDraw` has already advanced the
  overlays' render state, so the nested one sees no change — and an overwriting setter then wiped
  the flag the outer one raised, so no `afterDraw` in the whole sequence synced the clone. The trace
  reads `beforeDraw, beforeDraw, afterDraw(false), afterDraw(true)`; if you see that shape, the flag
  was raised in the first call and must still be set in the last.
- **The public, no-axis `getTrimmingContainer()` keeps the single-axis-clip exemption and must not be
  used inside the engine.** It has to name one container for both axes, so it ignores an
  `overflow-x: clip` next to a `visible` vertical axis (DEV-1025). Ask per axis instead.

`MasterTable#alignOverlaysWithTrimmingContainer` lays the holder out from the same two owners: one
element on both axes is the element mode, the window on both the window mode, and anything else the
split mode — an element-owned axis gets the owner's box, a window-owned one is left to the DOM
(`height: auto`, block-fill width), and the holder's inline overflow is cleared so the stylesheet's
`overflow: auto` scrolls the element-owned axis. **Every mode must undo what the others wrote.** The
window mode sizes nothing, because the page sizes it, so it has to CLEAR the pixel `width` and
`height` split mode left on the holder — otherwise a grid that leaves split mode (a clip removed from
an ancestor, `preventOverflow` switched off) stays pinned to the box it had there, and the stale box
feeds the column calculators as well as the layout. Split mode caches nothing and is a **measured**
mode: the broad and strict single-pass gates both fall back to DOM measurement when either axis is
window-owned. A fourth rule applies there: **a vertical owner with no intrinsic height gets
`height: auto`, never its own pixel height.** A parent with `overflow-y: hidden` and no `height` is
sized by its content, which is the grids inside it, so a holder sized to that height in pixels
feeds it back – with two grids in the parent each holder takes the sum of both and the parent grows
to the CSS height limit (issue #3119, the same loop the element mode's clone probe guards
against). `alignHolderWithSplitOwners` runs that probe (`measureIntrinsicHeight`) on every full
draw whenever the vertical owner is an element; the common split layout (vertical owner = window)
never probes. `ScrollSync#scrollableElement` stays the holder
whenever any axis is element-owned, so the wheel translation, the sticky scroll and the scrollbar
bands keep treating the grid as one that scrolls inside its box; the per-axis scroll positions are
read off each overlay's own `mainTableScrollableElement`.

An owner can move without a settings change (a page rule that clips the root, a `width` that
becomes definite). `Overlays#beforeDraw` re-resolves the three region overlays' owners on every
full draw – `adjustElementsSize` re-resolves them too, but only on a draw that moved the overlays or
resized the spreader, and a removed clip changes neither, so an overlay kept the element while the
master resolved the window for the same draw – and
`ScrollSync#resyncScrollableElementsWithOwners` (run from `Overlays#beforeDraw` right after the
owners are refreshed, AND from `Overlays#afterDraw` after the provisional-layout pass) re-picks the
scrolling elements once when an owner's identity changed since the listeners were bound. Both call
sites earn their place: only the `afterDraw` one can settle a provisional layout, and only the
`beforeDraw` one is early enough for THIS draw's calculators — bound solely in `afterDraw`, the
rebind is one draw late, the calculators read the offset off the element the owner moved away from,
and the band the old scroller was scrolled to stays on screen until something else redraws. The call
is idempotent, so running it twice costs a comparison — by identity, never by re-deriving the answer, because a cross-realm owner
can disagree with the scrolling element for the instance's life (next section).

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
so the two can disagree for good. (An iframe driven from the parent realm used to be the second one:
`MasterTable#alignOverlaysWithTrimmingContainer` judged the owner with a realm-bound `instanceof` and
left the holder `overflow: visible`. That is fixed — see the realm rule in the per-axis section
above.) Retrying such a table forever rebinds every listener on every draw, which also drops
whichever scroll event is in flight. Re-arming the flag (through the
public `updateMainScrollableElements`, which `updateSettings` calls whenever `height` moves to or from
`''`, and which the owner resync above calls when an axis owner moved) forgets the answer the
previous series gave up on — otherwise the first retry of the new series matches its own stale
answer and gives up at once, spending the retry the design counts on. The owner resync runs after
the provisional pass and skips a provisional answer, so it never settles a layout in the provisional
pass's place and never spends its retry.

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

## Dual-listener devices: touch AND mouse events reach the grid

`isMobileBrowser()` reads the user agent, `isTouchSupported()` reads `'ontouchstart' in window`. iPad Safari/Chrome (desktop UA since iPadOS 13) and Windows touchscreens are **desktop UA + touch**, so `event.ts` registers both listener sets and the browser's synthesized `mousedown`/`mouseup`/`click` sequence after every `touchend` reaches the mouse listeners. Rules:

- **Drop only the first synthesized pair after a tap, gated veto → pending pair → ceiling.** `#isTouchSynthesizedMouseEvent()` gates both `mousedown` and `mouseup` in that order: an engine that reports the origin and says "not touch" wins first (Blink's `sourceCapabilities.firesTouchEvents === false` means a real mouse or pen click, always processed, even right after a tap); otherwise the event is synthesized only if a touch-driven `onMouseUp` just armed `#synthesizedPairPending` AND the `TOUCH_SYNTHESIZED_MOUSE_WINDOW` (500 ms) ceiling since `#lastTouchMouseUpAt` has not passed — a tap that drifted past the move threshold is classified as a scroll by the touch path (no `onMouseDown`/`onMouseUp`, no stamp, pair never armed) — a drift ending over the already-selected cell gets its compatibility pair processed on every engine alike (DEV-2687); a drift over an unselected cell is `preventDefault`-ed and synthesizes nothing — provided no tap armed the pair inside the ceiling; a scroll-classified gesture clears the flag at its `touchend`, before its own compatibility pair arrives. The `mouseup` half consumes the pair (`#synthesizedPairPending = false`), so any later real mouse event inside the ceiling is treated as real — a fill-handle grab, a drag-selection, or a right-click started with a mouse right after a tap works on engines that do not report the input origin (WebKit, Firefox), where the residual gap is only the FIRST synthesized pair itself. Dropping only `mouseup` (the original #12804 fix) fired `onCellMouseDown` twice per tap and re-armed the pairing slot and made iPad double-tap-to-edit nondeterministic. `TOUCH_SYNTHESIZED_MOUSE_WINDOW` lives in `helpers/dom/inputOrigin.ts`, alongside `getMouseEventTouchOrigin()`, and is shared with `tableView.ts` (its `#recentTouchEndTimeout` uses the same constant), so both layers use the same fallback window. `tableView.ts`'s own gate (`#isSyntheticMouseEvent()`) deliberately keeps its older `reported ?? #recentTouchEnd` policy instead of adopting `event.ts`'s consume-once order: a Blink-flagged pair (`firesTouchEvents === true`) must never be allowed to close the editor through the outside-click handler, so the two gates are not to be "harmonized".
- **Touch double-taps are paired independently of the mouse double-click slots.** `#handleTouchTap()` tracks `#lastTapCoords`/`#lastTapAt` and fires the double-click callbacks when a second tap lands on the same coordinates within `TOUCH_DBLTAP_TIMEOUT` (1000 ms); a long-press, a tap outside the cells, or a tap on different coordinates resets the detector. Coordinates, not the resolved TD, because Walkontable recycles TD elements across scrolls and re-renders (DEV-2687 review). Touch taps never arm `#dblClickOrigin` — only a mouse `mousedown` with `button === 0` does — so a real mouse click right after a tap cannot complete a double-click by pairing with it. Mouse double-click timing (`DBLCLICK_MOUSEDOWN_TIMEOUT` 1000 ms / `DBLCLICK_MOUSEUP_TIMEOUT` 500 ms) is unchanged. `touchcancel` resets the per-gesture state (`onTouchCancel`) — `touchApplied`, the mouse-down flag, the long-press timer, and the pending synthesized pair — so a cancelled gesture cannot leave `touchApplied` stuck and route real mouse events into the tap detector, leave drag-selection armed with no `mouseup` coming, or leave an earlier tap's pending flag dropping the next real mouse pair inside the ceiling.
- **Before 18.1, a tap on an already-selected cell opened the editor** on these devices (the unsuppressed synthesized pair completed a second double-click match; a first tap on an unselected cell is `preventDefault`-ed and synthesizes nothing). That was a side effect, not a feature; do not "restore" it.
- Test it in Playwright with `test.use({ ...devices['Desktop Chrome'], hasTouch: true, browserName: 'chromium' })` (`tests/e2e/touch-tap-to-edit.spec.ts`); Chromium synthesizes the same mouse sequence after `locator.tap()`. Use `page.clock` to drive the pairing timers. Script-dispatched `MouseEvent`s have `sourceCapabilities === null` and exercise the WebKit fallback.

## The ResizeObserver loop guard counts frames, not milliseconds

`overlay/resizeMonitor.ts` guards against a parent sized in dynamic units (`dvh`) whose size the grid's
own dimensions refresh feeds back into — a callback that re-triggers itself forever. Two properties of
that guard are load-bearing, and both were defects until DEV-2740.

**Never reset the succession on a wall-clock timer.** A `ResizeObserver` delivers at most once per
rendering frame, so a self-sustaining loop occupies every frame whatever the machine is doing, while the
frame *interval* stretches without bound under CPU contention. The original guard counted 300 consecutive
deliveries and zeroed the count after 100 ms of wall-clock quiet, which made the trip a function of CPU
speed: on a loaded machine every frame outlasted the reset, so the count never reached the threshold and
the loop ran forever — the guard was disabled in exactly the state it exists for. The count is now reset
only when a whole frame passes with **no** delivery, which a loop cannot produce.

**Record the delivery synchronously in the observer callback.** Within one frame the browser runs the
animation-frame callbacks, then style and layout, then delivers the `ResizeObserver` callbacks, then
paints; and a callback registered during a frame's animation-frame phase lands in the *next* frame's
list, in registration order. So the quiet-frame watchdog — itself an animation-frame callback — runs
BEFORE a callback registered by that same frame's observer delivery. Setting the "delivered" flag from
inside the deferred (rAF) part of the observer callback therefore lets the watchdog read it one frame too
early and call a busy frame quiet. Only the setting fire may be deferred.

**The disconnect is a cooldown, not a kill.** The guard cannot tell a feedback loop from a gap-free
legitimate stream — dragging a splitter around the grid for a few seconds also occupies every frame — so
a permanent disconnect silently ended container-resize reactivity for the instance's lifetime. The
observer is observed again after a delay that doubles on every trip no quiet frame separated from the
last one, capped at `RESIZE_LOOP_GUARD_RECONNECT_MAX_DELAY`, and returns to base on the first quiet
frame. Consequences: the public `observe()` must cancel a pending reconnect (`NativeScrollInput`
re-registers its listeners whenever the scrollable element changes, so an explicit re-observe can land
mid-cooldown); a reconnect that finds the wrapper DETACHED must schedule another one rather than give
up, or a host that parks the grid's subtree outside the document (a framework re-render, a
`keep-alive` cache, a tab that caches its panel) can land its detach on the timer and restore the
permanent disconnect through DOM timing alone; and `destroy()` must cancel **three** handles, not
two - the reconnect timeout, the watchdog frame, and the deferred `onContainerElementResize` fire. All three outlive a task boundary,
and the third is the easy one to miss: `getSetting()` on a function-valued key invokes the setting
synchronously, so a delivery that landed one frame before the teardown refreshes the dimensions of a
torn-down grid. Core's own handler happens to guard `isDestroyed`, which is what keeps that from
throwing today - do not rely on it. An `#isDestroyed` flag backs the cancels up, because an observer
entry carries the state from its own snapshot and can be dispatched after the disconnect.

Everything the guard uses comes off the injected `rootWindow` - the timers, the animation frames AND
the `ResizeObserver` itself. That last one is not cosmetic: for a grid whose document is an iframe's,
the page-global constructor belongs to another window and delivers observations on that window's
rendering, which decouples the deliveries from the frames this guard counts and breaks the
one-delivery-per-frame invariant the whole design rests on. It is built in the constructor rather than
as a class field, because a field initializer runs before `#deps` is assigned.

The warning text is printed once per instance and pinned verbatim by two specs -
`tests/e2e/refresh-dimensions.spec.ts` and `test/unit/overlay/resizeMonitor.unit.ts`. Reword it and
both specs together, never alone. It ends "disconnected and reconnected after a short delay" because
the original "will be disconnected" described the permanent kill and stopped being true when the
cooldown replaced it.

## The selection pass is a diff, and every wipe must clear the applied record

`selection/manager.ts` no longer resets selection classes by querying the table. It collects, per
element, the classes and attributes every layer wants, then applies that as a **diff** against the
signature each element carried after the previous pass (`selection/appliedSelection.ts`, a
`WeakMap` keyed by element). An unchanged element is not touched, which is what keeps a full draw
from toggling the classes of every selected cell — on 40000 selected cells that toggle cost ~800 ms
of style recalculation, not JavaScript. Three consequences:

- **A renderer that resets an element's classes MUST call `clearAppliedSelection(element)`** right
  after (`render/cells.ts`, `render/rowHeaders.ts`, `render/columnHeaders.ts` do). Without it
  the record says "applied" while the DOM is blank, and the element stays unselected until the
  selection changes.
- **The cell-range scan is cached** per layer and overlay (`selection/scanCache.ts`) under the
  layer's corners, the rendered band (offsets, counts, header counts), and the host's `renderEpoch`
  setting. Header scans are not cached: the `onBeforeHighlightingRowHeader`/`ColumnHeader` settings
  run inside them and plugins redirect headers through those. Anything that changes which cell an
  element holds without moving the band must advance the epoch — core does it on every index-mapper
  cache update, data reload, settings update, and `markAllCellsChanged()`.
- The `onAfterDrawSelection` extra class (MergeCells) is **asked on every draw, for every source
  coordinate that resolved to an element** — the cached scan keeps the coordinates per element for
  exactly this. The answer depends on plugin state (MergeCells answers only for a block's first
  renderable coordinate, and only when every layer covers the block), so it can never be cached,
  and a merged block reached from several coordinates must be asked for each of them. The class
  then joins the diff like any other. The query reset survives only for
  `onBeforeRemoveCellClassNames`, a public hook that predates the diff, and runs only when a
  plugin returns class names from it.

## `shouldPaintCell`: the host may keep a cell element untouched

`render/cells.ts` asks the `shouldPaintCell` setting before it resets and paints a cell element.
`false` skips the reset, the `cellRenderer` call, and the ARIA re-stamp for that element. The
engine keeps no per-cell state of its own here; the host (`TableView` through `CellPainter`) owns
the stamps and answers from the cell's `renderMode`. The default answers `true`, so a Walkontable
built without the setting behaves as before. A renderer spec's `TableRendererMock` must provide it.

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

New engine coverage is Playwright: `tests/e2e/walkontable/*.spec.ts`, page objects in
`tests/fixtures/pages/walkontable/`. The Jasmine specs here may be edited, not added to.

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
