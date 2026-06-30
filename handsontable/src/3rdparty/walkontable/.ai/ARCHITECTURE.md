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
| Walkontable base | `core/_base.ts` | Shared base for core and clone instances. Builds the Data Access Objects (`createScrollDao()`, `getTableDao()`) used across the engine. |
| Walkontable core | `core/core.ts` | The master Walkontable instance; orchestrates draw, owns the master table, scroll, viewport, overlays. |
| Clone | `core/clone.ts` | A lightweight Walkontable instance per overlay. Each overlay table is rendered by a clone synchronized with the master. |
| Facade | `facade/core.ts` | `WalkontableFacade` — the public surface TableView uses. |
| Master table | `table/master.ts` | The main (scrollable) table. Overlay tables (`table/top.ts`, `table/bottom.ts`, `table/inlineStart.ts`, `table/topInlineStartCorner.ts`, `table/bottomInlineStartCorner.ts`) extend the shared `Table` class in `table.ts`. |
| Table base | `table.ts` | Shared `Table` class. Holds `rowFilter` / `columnFilter` and `rowUtils` / `columnUtils`. Subclass behavior is mixed in at runtime (`table/mixin/`). |
| Overlays manager | `overlays.ts` | Creates and coordinates all overlays, synchronizes scroll between them, batches scroll/wheel events with `requestAnimationFrame`. |
| Overlay types | `overlay/` | `_base.ts` plus 5 concrete overlay subclasses (see Overlay System). |
| Viewport calculators | `calculator/` | `viewportRows.ts`, `viewportColumns.ts`, `viewportBase.ts`, `axisCalculation.ts`, `calculationType/` — compute the visible row/column ranges. |
| Renderers | `renderer/` | Low-level DOM construction and reuse (see Renderer). |
| Scroll | `scroll.ts` | Scroll position management — translates a target cell into scroll offsets and the resulting viewport position. |
| Viewport | `viewport.ts` | Viewport state — visible row/column ranges, render boundaries, buffer. |
| Cell primitives | `cell/coords.ts`, `cell/range.ts` | `CellCoords` and `CellRange` value objects (see Key Primitives). |
| Selection rendering | `selection/` | Renders selection highlights / borders inside the engine. |

## The 6-Overlay System

Walkontable renders frozen (fixed) rows and columns as separate **overlay clone tables** layered over the master table and kept scroll-synchronized. The system is framed as 6 overlays = **5 concrete overlay subclasses plus a shared base class** (`overlay/_base.ts`):

| Overlay | File | Frozen region |
|---|---|---|
| Top | `overlay/top.ts` | `fixedRowsTop` |
| Bottom | `overlay/bottom.ts` | `fixedRowsBottom` |
| Inline start | `overlay/inlineStart.ts` | `fixedColumnsStart` (left in LTR, right in RTL) |
| Top inline-start corner | `overlay/topInlineStartCorner.ts` | Intersection of top + inline-start |
| Bottom inline-start corner | `overlay/bottomInlineStartCorner.ts` | Intersection of bottom + inline-start |

Each overlay is backed by a Walkontable clone (`core/clone.ts`) rendering the matching table subclass under `table/`. Corner overlays are created lazily. `overlays.ts` coordinates them and keeps their scroll positions aligned with the master.

This is a **fragile area** — positioning logic is intricate, RTL adds mirroring, and overlay boundaries are prone to visual artifacts. See `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md`.

## Viewport Calculation

On every render Walkontable recomputes which rows and columns are visible, based on the current scroll position, container size, and a small render buffer.

- `calculator/viewportRows.ts` and `calculator/viewportColumns.ts` compute the start/end renderable indexes for each axis.
- `calculator/viewportBase.ts` and `calculator/axisCalculation.ts` hold the shared per-axis math.
- `calculator/calculationType/` defines the calculation modes (for example, fully-visible vs. partially-visible boundaries).
- The result feeds `viewport.ts`, which holds the resolved visible ranges used during the draw.

Only the visible cells plus the buffer are rendered. Hidden rows/columns are excluded from renderable indexes and contribute zero size to layout.

## Renderer and DOM/Cell Reuse

The `renderer/` submodule builds and updates the DOM for one table at a time (master or an overlay clone).

- `renderer/table.ts` orchestrates the per-axis renderers: `rows.ts`, `cells.ts`, `colGroup.ts`, `columnHeaders.ts`, `columnHeaderRows.ts`, `rowHeaders.ts` (shared base in `renderer/_base.ts`).
- **DOM nodes are reused in place via a fixed, viewport-sized grid.** `OrderView` (`utils/orderView/view.ts`) keeps exactly `viewSize` children in the root node, growing or shrinking that count to match the viewport. On each render the existing `<tr>`/`<td>`/`<th>` children are kept in position and their content is overwritten by the cell renderer — scrolled-away rows/columns are refilled with the new content, not torn down or moved. Nodes are **not** cached by source coordinate, so memory is bounded to the viewport regardless of dataset size. (A previous diffing renderer — `ViewDiffer` plus a renderer-adapter strategy — and a coordinate-keyed `NodesPool` cache were removed in favor of this direct-DOM approach; the cache grew O(rows × cols) and could exhaust memory on large datasets. `NodesPool` remains only as a thin element factory.)
- Walkontable calls the cell renderer functions supplied via settings (core's renderer registry) for each visible cell; it does not own renderer logic.

## Scroll Handling

- `scroll.ts` manages scroll position: it maps a target cell to scroll offsets and computes the resulting viewport position. It is the "where should we be" logic.
- `overlays.ts` owns the **`requestAnimationFrame` batching** of scroll and wheel events, coalescing rapid input into a single synchronized redraw per frame and keeping overlay clones aligned with the master. This is the "do it efficiently" logic.

Batching through `requestAnimationFrame` is required to hold a smooth frame rate with large datasets. Never trigger a full redraw synchronously per scroll event.

## Key Primitives

**CellCoords / CellRange** — coordinate and range value objects used throughout both Walkontable and core.

- `cell/coords.ts` — a single `(row, col)` coordinate with methods like `isEqual()`, `isSouthEastOf()`, corner helpers, and normalization.
- `cell/range.ts` — a rectangular range built from `CellCoords`, with methods like `includes()`, `getTopStartCorner()`, `expand()`, and overlap checks.

These are the shared vocabulary for selection, viewport, and overlay logic.

## Render Flow

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

The engine carries documented debt: the DAO (Data Access Object) layer used in place of dependency injection, and the recreation of `rowFilter` / `columnFilter` objects on every render pass. The overlay system is the most fragile area. See `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md` for the full, file-referenced list.
