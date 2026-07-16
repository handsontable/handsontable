# Design: `moveCells` — grab & drag to move a selection

**Date:** 2026-07-16
**Status:** Approved (design phase)
**Scope:** Core `handsontable/` package (selection) + Walkontable rendering + Formulas plugin integration + docs

## Summary

Add an off-by-default `moveCells: boolean` grid option. When enabled, hovering the
edge (border) of a selected cell range shows a `grab` cursor. Pressing the border
and dragging moves the selected block: the source shows as a dashed outline, a ghost
preview follows the cursor to show where the block will land, and on drop the cell
data (values + formatting + formula references) is relocated to the new position —
like moving a selection in Excel or Google Sheets. Holding **Ctrl** during the drag
copies instead of moving (source kept).

Reference behavior: Excel / Google Sheets "drag the selection border to move".

## Confirmed decisions

- **Purpose:** general, public grid feature, documented in the API.
- **Option:** boolean `moveCells`, default `false`. (Named `moveCells` per the user's
  explicit choice, despite the collision with HyperFormula's `moveCells` engine
  method — internal code disambiguates; see Naming note.)
- **Semantics:** move by default (source cleared); **Ctrl** during drag = copy
  (source kept).
- **What transfers:** values + cell formatting (cell meta) + **formula-reference
  adjustment** (Excel-style) when the Formulas plugin is active.
- **Overwrite:** when the destination is not empty, overwrite silently but fire a
  cancelable `beforeMoveCells` hook (return `false` to veto). No dialog.
- **Interaction with `selectionHandles`:** independent option. Hovering a resize pill
  → resize; hovering the border edge elsewhere → move. Pills take priority in their
  areas.
- **Architecture:** built into core selection + Walkontable `Border` (Approach B),
  consistent with `selectionHandles`. No separate plugin. Ships in the bundle,
  gated at runtime by the setting.
- **v1 scope:** a single contiguous cell range (or a single cell) only.
- **readOnly:** if the target range overlaps any read-only cell, the move is vetoed
  (cannot write). Documented.

## Non-goals (v1 limitations)

- Full-row / full-column / select-all selections → move disabled (that overlaps
  `manualRowMove`/`manualColumnMove`).
- Multiple (non-contiguous) selection ranges → move disabled.
- Header selections → move disabled.
- Touch / mobile → out of scope for v1 (pointer/mouse only).
- Target overlapping read-only cells → vetoed.
- Moving a range that partially intersects a merged cell such that the target would
  split a merge → vetoed (merged blocks move whole or not at all).

## Naming note

The public option is `moveCells`. HyperFormula's engine method is also named
`moveCells`. These live in different namespaces (a Handsontable grid option vs. an HF
engine method) so there is no technical conflict, but to avoid reader confusion the
internal code uses distinct names: internal drag state `#moveDrag`, the core routine
that performs the relocation is `moveCellRange(...)` (not `moveCells`), and calls to
the engine are always written `engine.moveCells(...)`. The `beforeMoveCells` /
`afterMoveCells` hooks belong to the Handsontable option.

## Public API

### New option

- **`moveCells: boolean`**, default `false`, grid-level only (no effect in `columns`,
  `cells`, `cell`). Declared in `metaSchema.ts` with multiline JSDoc; typed on
  `SelectionSettings` (`src/selection/types.ts`) and `GridSettings`
  (`src/core/settings.ts`).
- Never changes an existing default (brand-new option, defaults `false`) — no
  breaking change.

### New hooks

- **`beforeMoveCells(sourceRange: CellRange, targetTopLeft: CellCoords, isCopy: boolean)`**
  — fired before the relocation commits. Returning `false` cancels the move.
- **`afterMoveCells(sourceRange: CellRange, targetRange: CellRange, isCopy: boolean)`**
  — fired after a successful relocation.
- Both registered in `REGISTERED_HOOKS` (`src/core/hooks/constants.ts`) and typed on
  `GridSettings`.

## Components and data flow

### 1. Edge hit detection + cursor (Walkontable `Border`)

Files: `src/3rdparty/walkontable/src/selection/border/border.ts`, `border/types.ts`,
`_selection.scss`.

- The four border edge `<div>`s are currently visual-only. Add a **move hit-zone**: a
  few-pixel-wide transparent band along the selection perimeter, enabled only when the
  move feature flag is set on the border settings (a new `moveEdgeVisible`/
  `moveEnabled` flag, resolved like `adjustHandlesVisible`). The band carries
  `cursor: grab`.
- The resize pills (`.wtSelectionHandle`) sit above the band (higher z-index) so
  hovering a pill yields the resize cursor; hovering the band elsewhere yields grab.
- `mousedown` on the band emits through a new Walkontable setting callback
  `onSelectionEdgeMouseDown(event)` (mirroring `onSelectionHandleMouseDown`),
  attached via the border's `eventManager` and calling `stopImmediatePropagation` /
  `preventDefault` so it does not start a normal cell selection.
- The interior of the selection still starts a normal new selection on mousedown
  (Excel behavior).

### 2. Bridge + drag state (core `tableView.ts` + `selection.ts`)

- `tableView.ts` registers the `onSelectionEdgeMouseDown` Walkontable setting; its
  handler starts a move drag: records `#moveDrag = { sourceRange, grabOffset }` where
  `grabOffset` is the cell within the range that was grabbed (so the block stays
  aligned under the pointer).
- Document-level `mousemove`/`mouseup` listeners (mirroring the handle-drag and
  autofill patterns; via `eventManager`, no raw `setTimeout`).

### 3. Drag preview + move loop

- On `mousemove`: resolve the cell under the pointer (`getCellCoordsFromMousePosition`),
  compute `targetTopLeft = cellUnderPointer - grabOffset`, clamp so the whole block
  stays within the grid. Update the ghost preview position.
- **Dashed source:** toggle a class on the source selection border (`_selection.scss`
  dashed style) during the move.
- **Ghost preview:** a positioned overlay `<div>` marking the target rectangle,
  following the cursor (reuse the manualRowMove backlight/guideline overlay pattern).
- `cursor: grabbing` during the drag.
- **Esc** cancels the move (restore, no data change; remove listeners).
- `mouseup`: commit (see next).

### 4. Commit — data + formatting + formulas

Core routine `moveCellRange(sourceRange, targetTopLeft, isCopy)`:

1. Compute the `targetRange` (same dimensions as source).
2. Fire `beforeMoveCells(sourceRange, targetTopLeft, isCopy)`; if any handler returns
   `false`, abort.
3. Veto guards: target within grid; target does not overlap read-only cells; no merge
   split (see Non-goals).
4. **Formulas plugin active** → delegate the value/formula move to HyperFormula:
   - MOVE: `engine.isItPossibleToMoveCells(source, dest)` then
     `engine.moveCells(source, dest)` (adjusts dependent references and rewrites the
     moved formulas' relative references, Excel-style).
   - COPY: HF copy/paste (`engine.copy` + `engine.paste`) which also adjusts
     references.
   - Coordinates converted from visual to HF addresses via the Formulas plugin's
     axis syncers (`getHfIndexFromVisualIndex`); the plugin listens to the
     `beforeMoveCells`/`afterMoveCells` hooks (precedent: the row/column-move
     delegation at `formulas.ts` ~L399-419). The grid syncs back through the existing
     `valuesUpdated` → `afterFormulasValuesUpdate` path.
5. **No Formulas plugin** → raw values: read the source block (`getData`), for MOVE
   clear the source then `populateFromArray` at the target; for COPY only
   `populateFromArray` at the target.
6. **Cell meta / formatting:** a helper copies cell meta (physical-indexed) from each
   source cell to its target cell; for MOVE it also clears the source cell's meta.
7. Update the selection to the `targetRange`.
8. Fire `afterMoveCells(sourceRange, targetRange, isCopy)`.

### 5. Undo / redo

A single `moveCells` undo action (new action under `src/plugins/undoRedo/actions/`)
snapshots: the source data + meta, the target cells' prior data + meta (overwritten
content), the source/target ranges, and `isCopy`. `undo()` restores both the source
and the previously-overwritten target; `redo()` re-applies. For the Formulas path,
the action restores by writing back the snapshots (the deterministic reverse), rather
than relying on HF's internal undo, so overwritten dependents are restored correctly.

### 6. Enable / disable guards

- Off by default; desktop/pointer only.
- Only a single contiguous cell range; disabled for full-row/full-column/select-all,
  multiple ranges, and header selections.
- Target must be fully within the grid (clamped) and must not overlap read-only cells.
- `disableVisualSelection` → off.

## Testing

- **Unit (`*.unit.js`):** pure helpers — target top-left clamp given grab offset +
  grid bounds; the enable/veto predicates (single-range, read-only-target,
  merge-split); the meta-move helper.
- **E2E (`*.spec.js`, async, awaited):**
  - Grab the border, drag → data relocated, source cleared, selection at target.
  - Ctrl during drag → copy (source kept).
  - `beforeMoveCells` returning `false` vetoes the move.
  - Overwrite: non-empty target is overwritten (and restorable via undo).
  - Clamp at grid edge (block cannot leave the grid).
  - Formulas plugin active: moving a formula cell adjusts its references and updates
    dependents; moving a referenced cell updates dependents.
  - readOnly target → vetoed.
  - Disabled cases: full-row/column, select-all, multiple ranges, header selection.
  - Undo/redo restores source and overwritten target.
  - RTL.
- **Walkontable tests:** dashed source border, ghost preview overlay, edge hit-zone
  presence + `grab` cursor, coexistence with resize pills.
- **Visual regression:** mid-move state (dashed source + ghost preview).

## Documentation

- Selection guide: new "Move a selection by dragging" section + runnable demo.
- JSDoc for the `moveCells` option and both hooks.
- Changelog `added` entry.
- Update AGENTS.md where warranted (e.g. the `moveCells` option vs HF `moveCells`
  naming note in the walkontable/border area).

## Key file references

- Config: `src/dataMap/metaManager/metaSchema.ts`; types `src/selection/types.ts`,
  `src/core/settings.ts`.
- Hooks: `src/core/hooks/constants.ts`.
- Border edge hit-zone + dashed + ghost: `src/3rdparty/walkontable/src/selection/border/border.ts`, `border/types.ts`, `src/styles/components/core/_selection.scss`.
- Drag wiring + move routine: `src/tableView.ts`, `src/selection/selection.ts`,
  new pure helpers in `src/selection/` (e.g. `moveCells.ts`).
- Data primitives: `core.ts` `populateFromArray`, `getData`, `setCellMeta`/`getCellMeta`.
- Formulas delegation: `src/plugins/formulas/formulas.ts` (engine access + axis
  syncers; row/col-move precedent ~L399-419), HyperFormula
  `moveCells`/`isItPossibleToMoveCells`.
- Undo action: `src/plugins/undoRedo/actions/` (precedent `rowMove.ts`).
- Drag-preview UI precedent: `src/plugins/manualRowMove/ui/` (backlight/guideline).
