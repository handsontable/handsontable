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

- **The top and bottom clones render after the clear**, so they need `applyRowHeightsToRenderedRows` on every draw that has a frozen record. The **master must not** — it rendered before the clear and is already right, and re-writing every row's height each draw is pure DOM churn.
- **`adjustElementsSize` is gated on a real height change.** It walks every column (`sumCellSizes` must stay a live walk) and resizes three overlays; calling it on every draw taxes wide grids for nothing. But it *must* run when the heights did change, including a shrink where there is nothing left to re-apply — `wtOverlays.refresh()` sized the elements earlier in the draw, so the scrollbar would keep the old length.
- **Steady state must cost zero row-height cache invalidations.** Each one drops the per-draw layout snapshot as well, and with a non-uniform row-size source (`rowHeights`/`minRowHeights` as an array or function, or any non-AutoRowSize `modifyRowHeight` hook) `PositionCache` has no sparse path, so a rebuild is a full prefix-sum walk over every row. Verified by counting: 0 invalidations/draw and an unchanged `createVisibleCalculators` count in every configuration. Two specs in `tests/e2e/walkontable/frozen-column-row-heights.spec.ts` pin the invalidation count at 0 through the fixture's `countRowCacheInvalidations` — the only way to see this class of bug, since the rows stay aligned and every visual assertion passes while it happens.

When you add a new content-driven measurement, ask which tables actually render the content — measuring the master alone is the trap both of these exist to work around.

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
