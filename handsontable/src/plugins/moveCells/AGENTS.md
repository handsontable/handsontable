# MoveCells plugin — dragging a selection to another place

The `moveCells` plugin lets the user grab the border of a selection and drag the whole block elsewhere
(hold the copy modifier to copy instead of move). Read this before touching `moveCells.ts` or `helpers.ts`.

`PLUGIN_PRIORITY = 25`, and `isDragActive()` is reachable through `getPlugin` **only** so DragToScroll can
ask whether this plugin accepted a press. It is internal, not public API.

## Four guards before anything is written, and each one earns its place

`moveCellRange()` runs roughly six full passes over the source and target regions before a single value
changes: two read-only scans, two movable-meta collections, the value snapshot, plus UndoRedo's two region
snapshots. The undo stack then retains two whole value matrices. So the guards run **first**, before any
hook fires, so that neither UndoRedo nor Formulas snapshots anything:

1. **A move onto itself is a no-op.** Without the guard, a plain click on the move band — mousedown and
   mouseup in the same cell — runs the whole commit pipeline for zero data change: a HyperFormula mutation,
   a rewrite of the source region, and an undo entry that pushes the user's real edits out of the stack.
2. **`CELLS_LIMIT = 100000`.** The drag path cannot produce a range near that size; the ceiling protects the
   public `moveCellRange` API called with a programmatically built range. An unbounded range freezes the tab.
3. **A read-only cell vetoes the move from *either* end.** The target case is the expected one. The source case
   matters just as much: `populateFromArray` skips read-only cells (`core.ts` exempts only
   `'UndoRedo.undo'`), so without the check the source values survive and the move silently degrades into a
   copy. With Formulas active it is worse — HyperFormula has already relocated the cell, so the engine and
   the data source diverge.
4. **Source bounds are checked too**, for the same public-API reason: a caller-built range past the grid
   edge reads `undefined` off the end of the data source and writes it into the target instead of failing
   cleanly.

## `afterMoveCells` fires BEFORE the target is selected

This ordering is load-bearing. With Formulas active, that hook is where the Handsontable data source is
brought back in line with HyperFormula, which has already relocated the cells — selecting first made
`afterSelection` listeners read the stale pre-move value at the target.

UndoRedo's listener works off the `beforeMoveCells` snapshots rather than the selection, so nothing needs
the target selected while the hook runs. Do not reorder.

## The move band swallows the mousedown, and that has two consequences

The band straddles the selection border and calls `stopImmediatePropagation()` + `preventDefault()`, so
`TableView#onCellMouseDown` never runs. Two things it would have done must be done by hand:

- **Mark the instance listening.** The grid may still be unlistened (an outside click with
  `outsideClickDeselects: false`, or focus parked on another instance). The Escape shortcut that cancels the
  drag lives in the `grid` context, which only dispatches while the instance is listening.
- **Select the cell under the pointer on a same-cell gesture.** A press that starts and ends in one cell is
  a click, not a move — and because the bands straddle the border, that press can resolve to the cell just
  *outside* the range. Committing there would shift the block by one cell on a plain click, and on macOS a
  Ctrl+click would commit a spurious copy the same way.

## Two more input rules

- **A right-press must not start a move.** It opens the context menu; without the guard the release would
  also commit a move.
- **Narrow mouse events cross-realm.** The grid may live in an iframe, where the event's `MouseEvent`
  constructor belongs to the child realm — never `instanceof MouseEvent`. The SelectionHandles plugin
  narrows the same way; keep them matching.

## The drag ghost lives outside the theme scope

`#createGhost` builds the drag preview outside the themed subtree, so theme tokens may not resolve. That is
what `GHOST_BORDER_WIDTH = '1px'` is for — a fallback mirroring the `main` theme's selection border. It is
**only** a fallback; do not promote it to the primary value.

## `clampMoveTarget()` clamps by the grab offset, not the pointer

`helpers.ts` derives the target's top-left from `pointer − grabOffset`, then clamps so the whole block stays
inside the grid (`maxRow = totalRows − rangeHeight`). Clamping the pointer instead would let the block hang
off the edge.

## Where to look next

- Auto-scroll while dragging, and why this plugin's `isDragActive()` gates it: `../dragToScroll/AGENTS.md`.
- Sibling selection gestures: `../selectionHandles/AGENTS.md`, `../autofill/AGENTS.md`.
- Undo entry shape for a move: `../undoRedo/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='moveCells'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='moveCells'`
