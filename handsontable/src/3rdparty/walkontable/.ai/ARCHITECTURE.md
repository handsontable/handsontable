# Walkontable Rendering Engine — Architecture

Deep reference for the Walkontable rendering engine. This is the rendering-engine-scoped subset of the core architecture doc (`handsontable/.ai/ARCHITECTURE.md`). The lean operational summary lives next to this file in `AGENTS.md`; this document is the DEEP version.

## Architecture Boundary

Walkontable is a self-contained, low-level table rendering engine embedded as a "3rd party" module inside the core package.

- **Location:** `handsontable/src/3rdparty/walkontable/src/` — TypeScript.
- **Excluded from the main tsconfig.** Walkontable has its own separate build and test pipeline (`npm run test:walkontable`, tests in `handsontable/src/3rdparty/walkontable/test/`).
- **The only bridge to core Handsontable is `handsontable/src/tableView.ts` (the `TableView` class).** Core reaches Walkontable through `this.view`; Walkontable receives a settings object from `TableView`.
- **Plugins must NEVER reach into Walkontable internals directly.** All access goes through `TableView`. The public surface is the Facade (see below).
- **Do not import core Handsontable modules from Walkontable code.** The dependency points one way: core depends on Walkontable, not the reverse.

**Purpose:** Low-level table rendering, viewport calculation, scroll synchronization, and overlays for frozen rows/columns. Walkontable knows about DOM, settings, and coordinates — it does not know about plugins, the DataMap, or the MetaManager.

## Facade Pattern

`TableView` does not talk to the Walkontable core directly. It talks to `WalkontableFacade` (`handsontable/src/3rdparty/walkontable/src/facade/core.ts`), which wraps the internal `Walkontable` core instance (`this._wot`) and exposes a curated, stable surface (`exportSettingsAsClassNames()`, draw triggers, sizing, scroll, etc.). This keeps the internal core free to change without breaking the bridge.

## Key Submodules

| Submodule | Path | Responsibility |
|---|---|---|
| Composition root | `wire.ts` | `buildContext()` assembles the single `EngineContext` (stable refs + late-bound/cyclic thunks). Per-slice `createXxxDeps(ctx)` factories build each module's narrow deps; every module stores them in a private `#deps`. |
| Walkontable base | `core/_base.ts` | Shared base for core and clone instances. |
| Walkontable core | `core/core.ts` | The master Walkontable instance; orchestrates draw, owns the master table, scroll, viewport, overlays. |
| Clone | `core/clone.ts` | A lightweight Walkontable instance per overlay. Each overlay table is rendered by a clone synchronized with the master. |
| Facade | `facade/core.ts` | `WalkontableFacade` — the public surface TableView uses. |
| Ports | `ports.ts` | Cross-cutting port interfaces (`SettingsPort`, `HooksPort`). Slice-owned ports live in their slice. |
| Master table | `table/regions/masterTable.ts` | The main (scrollable) table. Overlay tables (`table/regions/{top,bottom,inlineStart,topInlineStartCorner,bottomInlineStartCorner}Table.ts`) extend the shared `Table` class in `table/baseTable.ts`. |
| Table base | `table/baseTable.ts` | Thin shared `Table` class: constructor, `draw()` entry, DOM scaffold, cell-meta, `destroy`. Most behavior is composed in as runtime mixins (see Module composition): DOM construction (`table/domScaffold.ts`), per-draw orchestration (`table/drawCycle.ts`), coords→DOM access (`table/cellAccess.ts`), rendered/visible range-query + viewport predicates (`table/rangeQuery/`), size getters (`axisSizing/sizeGetters.ts`), post-render measurement (`axisSizing/oversizedRows.ts`), plus range-query/sticky adapters. |
| Overlays manager | `overlay/overlays.ts` | Thin coordinator: creates overlays, brackets the draw, refreshes clones. It delegates the stateful concerns to collaborator classes it owns (see Module composition) — `overlay/resizeMonitor.ts` (ResizeObserver loop-guard), `overlay/spreaderSize.ts` (hider/spreader sizing), `overlay/scroll/scrollSync.ts` (shared scroll state + master↔clone sync) and `overlay/scroll/nativeScrollInput.ts` (native scroll/wheel/key/resize input, `requestAnimationFrame` batching). Overlay-extending strategies live in `overlay/strategies/` (e.g. `stickyScrollStrategy.ts`). |
| Overlay types | `overlay/regions/` | `_base.ts` (abstract `Overlay` + `createOverlayDeps`) plus 5 concrete overlay subclasses `*Overlay.ts` (see Overlay System). |
| Viewport calculators | `calculator/` | `viewportRows.ts`, `viewportColumns.ts`, `viewportBase.ts`, `axisCalculation.ts`, `calculationType/` — compute the visible row/column ranges. |
| Renderers | `render/` | Low-level DOM construction and reuse (see Renderer). Orchestrated by `render/tableRenderer.ts`. |
| Scroll | `scroll/scroll.ts` | Scroll position management — translates a target cell into scroll offsets and the resulting viewport position. |
| Viewport | `viewport/viewport.ts` | Viewport state — visible row/column ranges, render boundaries, buffer. |
| Layout solver | `viewport/boxLayout/` | Pure single-pass layout resolution: `resolveLayout()` solves the whole-table box + scrollbar fix-point from numbers (`layoutSnapshot.ts`); `gatherLayoutInput.ts` is the one impure input adapter. Gated by the `singlePassLayout` setting (off for `mergeCells`). |
| DOM measurement | `domMeasure/` | The `GeometryReader` port (+ `LiveGeometryReader`): the single seam for layout-forcing DOM reads. |
| Axis sizing | `axisSizing/` | Per-row/column size supply: `AxisSizeSource` ports + `DefaultSizeSource`, prefix-sum caches (`rowUtils`/`columnUtils`/`positionCache`), border-box (`boxModel.ts`). |
| Settings | `settings/` | `defaults.ts` (config data) + `accessor.ts` (the `getSetting` engine, implements `SettingsPort`) + `index.ts` barrel. |
| Cell primitives | `cell/coords.ts`, `cell/range.ts` | `CellCoords` and `CellRange` value objects (see Key Primitives). |
| Selection rendering | `selection/` | Renders selection highlights / borders inside the engine. |

## Module composition (collaborators & mixins)

The two former god-objects — `Table` and `Overlays` — are thin shells; their behavior is split into focused units by two patterns. Both keep the public method surface on the owning class, so external callers (core, plugins, TableView, the draw cycle) are unchanged.

- **Collaborator class** — for **stateful** concerns. The owner constructs the collaborator, which holds its own `#`-private state and is wired through a co-located `createXxxDeps(ctx[, owner])` factory (inferred `XxxDeps` type, `#deps` field) — the same shape as `stickyScrollStrategy.ts`. The collaborator reaches back into the owner only through **callbacks in its deps** and **type-only** imports (never a runtime import of the owner → no cycle). `Overlays` owns `ResizeMonitor`, `SpreaderSize`, `ScrollSync`, `NativeScrollInput` this way and keeps thin public delegates for the methods that are public API (`adjustElementsSize`, `registerListeners`, `syncScrollPositions`, `scrollVertically`, …) plus get/set accessors for the state the draw cycle and whitebox tests touch (`scrollableElement`, `verticalScrolling`, …). A collaborator that runs during the owner's constructor must resolve the owner's own fields (e.g. `overlays.topOverlay`), not `wot.wtOverlays`, which is assigned only after the constructor returns.
- **Runtime mixin** — for **stateless** method groups (pure reads of public fields / other methods / the `deps` getter, no `#`-private access — a mixin function cannot see another class's `#` fields). Applied once with `mixin(Owner, group)` + a declaration-merge `interface Owner extends Group`, so the methods land on the owner's type. `Table` composes `cellAccess`, `domScaffold`, `rowRangeQuery`/`columnRangeQuery` + `viewportPredicates`, `sizeGetters`, and `oversizedRows` this way; sticky and range-query groups are applied per subclass. `#`-private deps are reached through the base class's read-only `get deps()` getter.

## The 6-Overlay System

Walkontable renders frozen (fixed) rows and columns as separate **overlay clone tables** layered over the master table and kept scroll-synchronized. The system is framed as 6 overlays = **5 concrete overlay subclasses plus a shared base class** (`overlay/regions/_base.ts`):

| Overlay | File | Frozen region |
|---|---|---|
| Top | `overlay/regions/topOverlay.ts` | `fixedRowsTop` |
| Bottom | `overlay/regions/bottomOverlay.ts` | `fixedRowsBottom` |
| Inline start | `overlay/regions/inlineStartOverlay.ts` | `fixedColumnsStart` (left in LTR, right in RTL) |
| Top inline-start corner | `overlay/regions/topInlineStartCornerOverlay.ts` | Intersection of top + inline-start |
| Bottom inline-start corner | `overlay/regions/bottomInlineStartCornerOverlay.ts` | Intersection of bottom + inline-start |

Each overlay is backed by a Walkontable clone (`core/clone.ts`) rendering the matching table subclass under `table/regions/`. Corner overlays are created lazily. `overlay/overlays.ts` coordinates them and keeps their scroll positions aligned with the master. The overlay class family mirrors the table family: `overlay/regions/*Overlay.ts` (positioning half) pairs with `table/regions/*Table.ts` (DOM half).

This is a **fragile area** — positioning logic is intricate, RTL adds mirroring, and overlay boundaries are prone to visual artifacts. See `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md`.

## Viewport Calculation

On every render Walkontable recomputes which rows and columns are visible, based on the current scroll position, container size, and a small render buffer.

- `calculator/viewportRows.ts` and `calculator/viewportColumns.ts` compute the start/end renderable indexes for each axis.
- `calculator/viewportBase.ts` and `calculator/axisCalculation.ts` hold the shared per-axis math.
- `calculator/calculationType/` defines the calculation modes (for example, fully-visible vs. partially-visible boundaries).
- The result feeds `viewport/viewport.ts`, which holds the resolved visible ranges used during the draw.
- `viewport/calculatorFactory.ts` (a `Viewport` mixin) builds the calculators and post-processes the rendered bands on scroll-driven draws: **directional overscan** (the `viewport*RenderingOffset: 'auto'` mode extends the band up to 8 columns / 4 rows toward the scroll direction; uniform-size axes only) followed by **band stabilization** (each band keeps its previous size, so scrolling never adds or removes TR/TD/TH/COL nodes — the stationary-DOM invariant). See RENDERING-LIFECYCLE §4.

Only the visible cells plus the buffer are rendered. The buffer per axis is the offset option's static resolution (1 track per side under `'auto'`, or the explicit number) plus, during scrolling, the directional overscan above. Hidden rows/columns are excluded from renderable indexes and contribute zero size to layout.

## Renderer and DOM/Cell Reuse

The `render/` submodule builds and updates the DOM for one table at a time (master or an overlay clone).

- `render/tableRenderer.ts` orchestrates the per-axis renderers: `rows.ts`, `cells.ts`, `colGroup.ts`, `columnHeaders.ts`, `columnHeaderRows.ts`, `rowHeaders.ts` (shared base in `render/_base.ts`).
- **DOM nodes are reused in place via a fixed, viewport-sized grid.** `OrderView` (`utils/orderView/view.ts`) keeps exactly `viewSize` children in the root node, growing or shrinking that count to match the viewport. On each render the existing `<tr>`/`<td>`/`<th>` children are kept in position and their content is overwritten by the cell renderer — scrolled-away rows/columns are refilled with the new content, not torn down or moved. Nodes are **not** cached by source coordinate, so memory is bounded to the viewport regardless of dataset size. (A previous diffing renderer — `ViewDiffer` plus a renderer-adapter strategy — and a coordinate-keyed `NodesPool` cache were removed in favor of this direct-DOM approach; the cache grew O(rows × cols) and could exhaust memory on large datasets. `NodesPool` remains only as a thin element factory.)
- Walkontable calls the cell renderer functions supplied via settings (core's renderer registry) for each visible cell; it does not own renderer logic.

## Scroll Handling

- `scroll/scroll.ts` manages scroll position: it maps a target cell to scroll offsets and computes the resulting viewport position. It is the "where should we be" logic.
- `overlay/overlays.ts` owns the **`requestAnimationFrame` batching** of scroll and wheel events, coalescing rapid input into a single synchronized redraw per frame and keeping overlay clones aligned with the master. This is the "do it efficiently" logic.

Batching through `requestAnimationFrame` is required to hold a smooth frame rate with large datasets. Never trigger a full redraw synchronously per scroll event.

## Key Primitives

**CellCoords / CellRange** — coordinate and range value objects used throughout both Walkontable and core.

- `cell/coords.ts` — a single `(row, col)` coordinate with methods like `isEqual()`, `isSouthEastOf()`, corner helpers, and normalization.
- `cell/range.ts` — a rectangular range built from `CellCoords`, with methods like `includes()`, `getTopStartCorner()`, `expand()`, and overlap checks.

These are the shared vocabulary for selection, viewport, and overlay logic.

## Render Flow

> For the phase-by-phase draw cycle (entry points, fast-draw vs full-draw downgrades, forced DOM reads,
> public-hook firing semantics, and which phases are invariant on a pure scroll), see the deep reference
> **`RENDERING-LIFECYCLE.md`** next to this file. The summary below is the high-level version.

1. Core calls `this.view.render()` (directly, or a plugin triggers a render through hooks).
2. `TableView` delegates to the Walkontable Facade, which calls the core instance's `draw()`.
3. Walkontable recalculates the visible viewport using `ViewportRowsCalculator` and `ViewportColumnsCalculator`.
4. Visual indexes are mapped to renderable indexes; hidden rows/columns are excluded.
5. The renderers iterate the visible rows/columns, reusing DOM nodes, and call the cell renderer functions for each cell.
6. Each overlay clone (top, bottom, inline-start, and the two corners) renders its own table, scroll-synchronized with the master.
7. Selection highlights are rendered via the engine's `selection/` system.

### Rendering Pipeline (block diagram)

```
┌─────────────────────────────────────────────────────────┐
│ User Input / Data Change / Settings Update              │
└─────────────┬───────────────────────────────────────────┘
              │
              ├─ Validate input
              │
              ├─ Update DataSource
              │
              ├─ Trigger beforeRender hook
              │
    ┌─────────▼──────────────────────────────┐
    │ TableView Coordinator                   │
    ├─────────────────────────────────────────┤
    │ 1. Calculate viewport (scroll position) │
    │ 2. Map visual → renderable indexes      │
    │ 3. Fetch visible cell data              │
    │ 4. Get cell metadata/config             │
    └─────────┬──────────────────────────────┘
              │
    ┌─────────▼──────────────────────────────┐
    │ Walkontable Rendering Engine            │
    ├─────────────────────────────────────────┤
    │ Master Table (main cells)               │
    │ ├─ Row headers overlay                  │
    │ ├─ Column headers overlay               │
    │ ├─ Top-left corner overlay              │
    │ └─ Grid cells (virtualized)             │
    │                                         │
    │ For each visible cell:                  │
    │ ├─ Fire beforeRenderer hook             │
    │ ├─ Apply renderer function              │
    │ ├─ Create/reuse DOM node                │
    │ └─ Fire afterRenderer hook              │
    └─────────┬──────────────────────────────┘
              │
              ├─ Render overlay cells
              │
              ├─ Trigger afterRender hook
              │
              └─ Display complete grid
```

## Virtualization Behavior

| Behavior | Description |
|---|---|
| Rendered cells | Only visible cells plus a small buffer. |
| Hidden rows/columns | Not rendered; contribute zero size in layout. |
| Hooks fired | Only for renderable cells (`beforeRenderer`, `afterRenderer`). |
| `getColWidth()` for hidden | Returns zero. |
| Render triggers | Scroll, data update, settings change, manual render. |
| Index tier | Uses renderable indexes (visual → renderable → physical, coordinated by core's `IndexMapper`). |

## Known Tech Debt (summary)

The engine carries documented debt: the recreation of `rowFilter` / `columnFilter` objects on every render pass (`table/drawCycle.ts`), and the overlay clones still reaching the master through `this.wot.wtTable`/`.wtViewport`/`.wtOverlays` in hot-path methods (the deep `wot` decoupling is deferred). The overlay system is the most fragile area. See `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md` for the full, file-referenced list. (The DAO layer that used to stand in for dependency injection is gone — modules are wired through the `wire.ts` composition root; see Key Submodules.)
