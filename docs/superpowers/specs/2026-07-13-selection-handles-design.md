# Design: `selectionHandles` — draggable selection-edge handles

**Date:** 2026-07-13
**Status:** Approved (design phase)
**Scope:** Core `handsontable/` package + Walkontable rendering engine + docs

## Summary

Add draggable "adjustment handles" to the selection. When the user hovers over a
selected range, a pill-shaped handle appears at the midpoint of each edge
(top, bottom, inline-start, inline-end). Dragging a handle resizes that edge of
the selection, keeping the opposite edge anchored. This is **selection
adjustment**, not autofill: no data is moved, filled, or changed — only the
selected area changes.

Reference design (FormulaBuilder range editing):
`https://www.figma.com/design/N2sIXUQuCZ3nQ1ju2ThqIy/FormulaBuilder?node-id=360-6989`

The feature is a **general, public grid option**, off by default. FormulaBuilder
is the first intended consumer, but the option is universal and documented in the
API.

## Confirmed decisions

- **Purpose:** general public grid feature (documented API), not FormulaBuilder-specific.
- **Config shape:** boolean toggle `selectionHandles: boolean`, default `false`.
- **Multiple ranges:** handles render **per range**, driven by hover — the range
  under the cursor shows its handles (in practice one range's handles visible at a time).
- **Drag semantics:** **clamp, no flip** — the dragged edge stops at the row/column
  adjacent to the opposite edge; minimum selection size is preserved.
- **Architecture:** built into core selection + Walkontable `Border` (Approach B),
  **no separate plugin**. Consequence: code ships in the bundle always, gated at
  runtime by the setting (no tree-shaking). Accepted.

## Non-goals (v1 limitations)

- `selectionMode: 'single'` → handles disabled (no range to adjust).
- Full-row / full-column / select-all selections → handles disabled (header-driven,
  ambiguous to adjust).
- Frozen panes → handles hidden on any edge lying on a freeze line (avoids the
  complex freeze-edge duplication logic in `Border`). Documented limitation.
- Mobile / touch → unchanged; the existing touch `SelectionHandles` mechanism stays
  as-is. This feature is desktop-only.
- No data movement or fill — selection area only.

## Public API

### New option

- **`selectionHandles: boolean`**, default `false`.
- Grid-level only (like `selectionMode`); no effect in `columns`, `cells`, or `cell`.
- Declared in `handsontable/src/dataMap/metaManager/metaSchema.ts` with multiline
  JSDoc/Typedoc, added to `SelectionSettings` (`handsontable/src/selection/types.ts`)
  and `GridSettings` (`handsontable/src/core/settings.ts`).
- **Never change an existing default** — this is a brand-new option defaulting to
  `false`, so no breaking change.

### New hook

- **`afterOnSelectionHandleMouseDown`** — fires when the user presses a selection
  handle, mirroring `afterOnCellCornerMouseDown` used by autofill. Registered in
  `REGISTERED_HOOKS` (`src/core/hooks/constants.ts`) and typed on `GridSettings`
  (`src/core/settings.ts`).
- Selection changes during drag reuse the existing `afterSelection*` hooks (they
  already fire from `setRangeEnd`). No additional drag-lifecycle hooks in v1 (YAGNI).

## Naming note

The internal field `Border.selectionHandles` already exists for **mobile touch
handles** (top/bottom pills, `border/types.ts` `SelectionHandles` interface). To
avoid clobbering it, the new desktop elements use a distinct internal name
(e.g. `adjustHandles`). The **public option** is `selectionHandles` (matches the
Figma naming and the user request); the internal collision is avoided by the
distinct field name.

## Components and data flow

### 1. Rendering — Walkontable `Border`

File: `handsontable/src/3rdparty/walkontable/src/selection/border/border.ts`
(+ `border/types.ts`, `border/utils.ts`).

- Create 4 handle elements + hit areas: `handleTop`, `handleBottom`,
  `handleStart`, `handleEnd` (grouped under a new internal `adjustHandles`
  structure paralleling the mobile `selectionHandles` one).
- Position each pill at the **midpoint of its edge** inside `appear()`, reusing the
  already-computed `top`, `inlineStartPos`, `width`, `height`.
- Visibility gated by a new border setting flag (e.g. `adjustHandlesVisible`,
  analogous to `cornerVisible`) AND desktop-only (`!isMobileBrowser()`).
- **Boundary hide rule** (pure, unit-testable): hide the handle whose edge is flush
  with the grid boundary — `fromRow === 0` hides top, `toRow === lastRow` hides
  bottom, `fromColumn === 0` hides inline-start, `toColumn === lastColumn` hides
  inline-end (RTL-mirrored).
- **Frozen panes (v1):** if an edge lands on a freeze line
  (`isFrozenBoundaryEdge`/`isFrozenBottomBoundaryEdge` are already present), hide
  that edge's handle.
- `disappear()` also hides the new handle elements.

### 2. Theme tokens & CSS

Follow the four-layer theme process (see `handsontable-css-dev` skill): Figma →
token export → `scripts/themes/figma` generator → generated CSS in
`src/themes/static`. New tokens:

- `cell-selection-handle-size`
- `cell-selection-handle-border-width`
- `cell-selection-handle-border-color`
- `cell-selection-handle-background-color`
- `cell-selection-handle-border-radius`

New CSS class(es): `wtSelectionHandle` + per-position modifier classes. Pills are
rounded rectangles (large border-radius). Strict CSS/JS separation; no `:has()`.

### 3. Hover detection & visibility — core selection

Files: `handsontable/src/tableView.ts` (existing `beforeOnCellMouseOver` /
`afterOnCellMouseOver` wiring), `handsontable/src/selection/`.

- When `selectionHandles` is on and the pointer is over a selected range (and no
  drag is in progress), enable the `adjustHandlesVisible` flag for **that range's**
  border and trigger a lightweight border refresh.
- Leaving the selection (hover over a non-selected cell) hides the handles.
- Detection uses cell mouseover (not CSS `:hover`) because handles must appear when
  hovering the selection **area**, not the thin border line.

### 4. Drag interaction — selection adjustment

Files: `handsontable/src/selection/` (+ mouse wiring, mirroring autofill's document
`mousemove`/`mouseup` listeners in `handsontable/src/plugins/autofill/autofill.ts`).

- `mousedown` on a handle → fires `afterOnSelectionHandleMouseDown`; core records
  the dragged edge and the anchored opposite corner(s).
- `document mousemove` → translate pointer to the cell under the cursor (reuse
  `translateFromRenderableToVisualCoords`), compute the new edge, **clamp with no
  flip** (dragged edge cannot cross the opposite edge; min 1 row/col). Update the
  range via `selection.setRangeStart(anchorCorner)` + `selection.setRangeEnd(newCorner)`.
  For an edge drag, only one axis changes; the other axis span is preserved.
- **Merged cells:** the clamped edge expands to include the full merged area (reuse
  the existing merge-aware selection expansion; `mergeCells` reacts through the
  existing selection/transform hooks).
- `document mouseup` → finalize, clear drag state.
- Cursors: `ns-resize` (top/bottom), `ew-resize` (start/end) on hover and during
  drag. Autoscroll near the viewport edge during drag (reuse the existing drag-scroll
  mechanism).

## Testing

Every change ships with unit + E2E coverage (project mandate).

- **Unit (`*.unit.js`, Jest):**
  - `selectionHandles` default resolves to `false`.
  - Boundary-hide logic as pure functions (each edge, RTL variant).
  - Clamp / no-flip math (dragged edge cannot cross opposite; min size).
- **E2E (`*.spec.js`, Jasmine/Puppeteer — all `it()` async, all API calls awaited):**
  - Handles appear on hover over a selection when enabled; absent when disabled (default).
  - Drag each edge grows/shrinks the selection correctly.
  - Clamp: dragging past the opposite edge stops at min size (no flip).
  - Boundary edges hide their handle.
  - RTL mirroring.
  - `selectionMode: 'single'` → no handles.
  - Full-row / full-column / select-all → no handles.
  - Multiple ranges: hovering a range shows that range's handles.
  - Theme-agnostic assertions (pass under classic/main/horizon).
- **Walkontable tests (separate runner):** handle element positions in `Border`.
- **Visual regression:** example in `examples/next/docs/` + Playwright screenshot.

## Documentation

- Selection guide: `docs/content/guides/cell-features/selection/` — new section +
  runnable demo.
- API reference via JSDoc in `metaSchema.ts` (option) and hook JSDoc.
- Changelog entry (`added`) in `.changelogs/` per `changelog-creation`.
- Update `AGENTS.md` at the correct scope if new conventions/gotchas emerge
  (e.g. the `adjustHandles` vs `selectionHandles` naming distinction in `Border`).

## Key file references

- Config: `handsontable/src/dataMap/metaManager/metaSchema.ts` (near `selectionMode`, ~L5556)
- Types: `handsontable/src/selection/types.ts`, `handsontable/src/core/settings.ts`
- Hooks: `handsontable/src/core/hooks/constants.ts` (`REGISTERED_HOOKS`)
- Border rendering: `handsontable/src/3rdparty/walkontable/src/selection/border/border.ts`
  (`appear()` ~L981, `disappear()` ~L1455, mobile `createMultipleSelectorHandles` ~L329)
- Border types/styles: `border/types.ts`, `border/utils.ts`
- Mouse wiring precedent (autofill): `handsontable/src/plugins/autofill/autofill.ts`
- Mouse/selection updates: `handsontable/src/selection/mouseEventHandler.ts`,
  `handsontable/src/selection/selection.ts`
- Cell mouseover wiring: `handsontable/src/tableView.ts` (~L1049–1088)
