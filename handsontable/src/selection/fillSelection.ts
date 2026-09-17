import type { HotInstance } from '../core/types';
import type { default as CellRange } from '../3rdparty/walkontable/src/cell/range';
import { deepClone } from '../helpers/object';

/**
 * One cell to write, as `setDataAtCell()` takes it.
 */
type CellChange = [number, number, unknown];

/**
 * A rectangle of cells, in visual coordinates.
 */
type CellArea = { fromRow: number; fromColumn: number; toRow: number; toColumn: number };

/**
 * The state one fill walk shares across every layer it visits.
 */
type FillWalkContext = {
  visited: Set<number> | null;
  columnCount: number;
  skipArea: CellArea | null;
};

/**
 * Decides whether an edited value may be written over what the cell already holds.
 *
 * This is the one value rule `Core.populateFromArray()` applies on its `'overwrite'` branch that
 * still bites under the `'edit'` source, kept here so a fill that does not go through
 * `populateFromArray()` behaves the same. A cell whose stored value is an object holds a record that
 * a custom renderer displays, not a displayable value, so a plain value must not replace it - a
 * `valueSetter` is the cell's own statement that it knows how to take one.
 *
 * `populateFromArray()`'s other value rules - the `duckSchema` comparison, and the refusal to put an
 * object into a plain cell - are all lifted by `source === 'edit'` (#3234): what a user typed wins
 * over the original cell type. Both fills here are edits, so those rules can never reject anything
 * and are deliberately not restated.
 *
 * @param {*} value The value to write.
 * @param {*} originalValue The cell's current source value.
 * @param {boolean} hasValueSetter Whether the cell declares a `valueSetter`.
 * @returns {boolean}
 */
function canOverwriteValue(value: unknown, originalValue: unknown, hasValueSetter: boolean): boolean {
  if (value !== null && typeof value === 'object') {
    return true;
  }

  return hasValueSetter || originalValue === null || typeof originalValue !== 'object';
}

/**
 * Collects the changes that fill every cell of every selection layer with one value.
 *
 * Both `Ctrl`/`Cmd`+`Enter` paths use this - the grid's own fill, and the one an open editor performs
 * when it saves. They shared nothing before, and answered the same keystroke differently: the editor
 * read only the layer holding the focus, so every other layer was left untouched (DEV-103).
 *
 * The returned list is meant for a single `setDataAtCell()` call. That matters beyond tidiness:
 * `UndoRedo` records one action per `afterChange`, and it has no batching, so committing per layer
 * would cost the user an undo step per layer for one keystroke.
 *
 * Skipped, as on every other populate path: `readOnly` cells, header-only layers, coordinates outside
 * the grid, a cell two layers both cover (written once), and a value the cell's schema refuses.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {*} value The value to write into every selected cell.
 * @param {CellRange[]} selectedRanges The selection layers to fill.
 * @param {number} [skipRow] Visual row of a cell to leave out - the cell the value came from.
 * @param {number} [skipColumn] Visual column of that cell.
 * @returns {Array[]} Changes in the `[row, column, value]` form `setDataAtCell()` takes.
 */
export function collectSelectionFillChanges(
  hot: HotInstance,
  value: unknown,
  selectedRanges: CellRange[],
  skipRow?: number | null,
  skipColumn?: number | null,
): CellChange[] {
  const changes: CellChange[] = [];

  walkSelectionFill(hot, value, selectedRanges, skipRow, skipColumn, changes);

  return changes;
}

/**
 * Walks every selection layer, either collecting the changes or answering whether one exists.
 *
 * `changes` doubles as the mode: an array collects the whole fill, and `null` makes the walk a probe
 * that returns on the first writable cell. The probe is the question the `Ctrl`/`Cmd`+`Enter` gates
 * ask on every keystroke, so it must not pay for cells whose answer it does not need - collecting
 * the whole list only to test it for emptiness made each gate cost a walk of the entire selection.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {*} value The value to write into every selected cell.
 * @param {CellRange[]} selectedRanges The selection layers to fill.
 * @param {number} [skipRow] Visual row of a cell to leave out - the cell the value came from.
 * @param {number} [skipColumn] Visual column of that cell.
 * @param {Array[]|null} changes The list to append to, or `null` to probe.
 * @returns {boolean} Whether a writable cell was found. Only the probe reads this.
 */
function walkSelectionFill(
  hot: HotInstance,
  value: unknown,
  selectedRanges: CellRange[],
  skipRow: number | null | undefined,
  skipColumn: number | null | undefined,
  changes: CellChange[] | null,
): boolean {
  const context: FillWalkContext = {
    // One layer cannot overlap itself, so the bookkeeping is only worth it from the second layer on -
    // a fill over a whole large grid would otherwise allocate a key per cell for nothing.
    visited: selectedRanges.length > 1 ? new Set<number>() : null,
    columnCount: hot.countCols(),
    skipArea: resolveSkipArea(hot, skipRow, skipColumn),
  };

  for (let i = 0; i < selectedRanges.length; i++) {
    const bounds = resolveLayerBounds(hot, selectedRanges[i]);

    if (bounds !== null && walkLayerFill(hot, value, bounds, context, changes)) {
      return true;
    }
  }

  return false;
}

/**
 * Walks one layer's rectangle, appending the change every writable cell contributes.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {*} value The value to write.
 * @param {object} bounds The layer's clamped rectangle.
 * @param {object} context The state shared across the layers of one walk.
 * @param {Array[]|null} changes The list to append to, or `null` to probe.
 * @returns {boolean} `true` once a probe has found its cell, which ends the whole walk.
 */
function walkLayerFill(
  hot: HotInstance,
  value: unknown,
  bounds: CellArea,
  context: FillWalkContext,
  changes: CellChange[] | null,
): boolean {
  for (let row = bounds.fromRow; row <= bounds.toRow; row++) {
    for (let column = bounds.fromColumn; column <= bounds.toColumn; column++) {
      if (isCellAlreadyCovered(context.visited, context.columnCount, row, column) ||
          isInSkipArea(context.skipArea, row, column)) {
        continue;
      }

      if (!canFillCell(hot, value, row, column)) {
        continue;
      }

      // A probe only has to prove that one such cell exists, so it stops here - without building a
      // change, and without cloning an object value that it would immediately throw away.
      if (changes === null) {
        return true;
      }

      // One object spread over many cells must not leave them sharing a reference.
      changes.push([row, column, value !== null && typeof value === 'object' ? deepClone(value) : value]);
    }
  }

  return false;
}

/**
 * Resolves the area the fill must leave alone - the cell the value came from.
 *
 * For a merged cell that is the whole merged area, not one coordinate. A merged area is one cell to
 * the user, and `MergeCells` says so through `afterIsMultipleSelection`, which the layer walk cannot
 * consult. Without this, editing a merged cell and pressing `Ctrl`/`Cmd`+`Enter` read its own covered
 * cells as "other cells to fill": the editor committed a fill instead of inserting a line break, and
 * wrote the value into cells the merge hides.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} [skipRow] Visual row of the cell the value came from.
 * @param {number} [skipColumn] Visual column of that cell.
 * @returns {object|null} The area to skip, or `null` when there is no such cell.
 */
function resolveSkipArea(
  hot: HotInstance, skipRow?: number | null, skipColumn?: number | null
): CellArea | null {
  if (typeof skipRow !== 'number' || typeof skipColumn !== 'number') {
    return null;
  }

  const mergedArea = hot.runHooks('modifyGetCellCoords', skipRow, skipColumn, false, 'meta');

  // The hook returns `[row, column]` or `[row, column, row2, column2]` - a translation without an
  // area, or one with it. Reading the last two off a two-element result leaves the area undefined,
  // every comparison against it is false, and the cell the value came from stops being skipped.
  if (Array.isArray(mergedArea) && mergedArea.length >= 4) {
    const [fromRow, fromColumn, toRow, toColumn] = mergedArea as [number, number, number, number];

    return { fromRow, fromColumn, toRow, toColumn };
  }

  if (Array.isArray(mergedArea) && mergedArea.length >= 2) {
    const [row, column] = mergedArea as [number, number];

    return { fromRow: row, fromColumn: column, toRow: row, toColumn: column };
  }

  return { fromRow: skipRow, fromColumn: skipColumn, toRow: skipRow, toColumn: skipColumn };
}

/**
 * Reports whether a cell falls inside the area the fill must leave alone.
 *
 * @param {object|null} skipArea The area resolved by `resolveSkipArea()`.
 * @param {number} row Visual row index.
 * @param {number} column Visual column index.
 * @returns {boolean}
 */
function isInSkipArea(
  skipArea: CellArea | null,
  row: number,
  column: number,
): boolean {
  if (skipArea === null) {
    return false;
  }

  return row >= skipArea.fromRow && row <= skipArea.toRow &&
    column >= skipArea.fromColumn && column <= skipArea.toColumn;
}

/**
 * Resolves the rectangle of cells one selection layer contributes to a fill.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {CellRange} cellRange The selection layer.
 * @returns {object|null} The clamped bounds, or `null` when the layer contributes no cell.
 */
function resolveLayerBounds(hot: HotInstance, cellRange: CellRange): CellArea | null {
  if (cellRange.isSingleHeader()) {
    return null;
  }

  // `getBottomEndCorner()` normalizes a header index to `0`, so a layer made only of headers - several
  // column headers, say - would report row 0 at both ends and be walked as the first data row. The
  // raw corners still carry the negative index, and a layer whose farthest corner is negative holds
  // no body cell at all. The walk this replaced skipped negative indexes per cell for the same reason.
  // An unset coordinate (`null`) addresses nothing either, so it reads as "no body cell" too.
  const rawLastRow = Math.max(cellRange.from.row ?? -1, cellRange.to.row ?? -1);
  const rawLastColumn = Math.max(cellRange.from.col ?? -1, cellRange.to.col ?? -1);

  if (rawLastRow < 0 || rawLastColumn < 0) {
    return null;
  }

  let fromRow = cellRange.getTopStartCorner().row as number;
  let fromColumn = cellRange.getTopStartCorner().col as number;

  // A merged cell reports its parent's coordinates, so each layer needs its own translation -
  // asking once for the whole call would describe only the layer that happened to be first.
  const modifiedCellCoords = hot.runHooks('modifyGetCellCoords', fromRow, fromColumn, false, 'meta');

  if (Array.isArray(modifiedCellCoords)) {
    [fromRow, fromColumn] = modifiedCellCoords as [number, number];
  }

  // A layer selected through a header starts at a negative index, and the grid may have shrunk
  // since the selection was laid, so clamp both ends before walking them.
  return {
    fromRow: Math.max(fromRow, 0),
    fromColumn: Math.max(fromColumn, 0),
    toRow: Math.min(cellRange.getBottomEndCorner().row as number, hot.countRows() - 1),
    toColumn: Math.min(cellRange.getBottomEndCorner().col as number, hot.countCols() - 1),
  };
}

/**
 * Records a cell as seen, and reports whether an earlier layer already covered it.
 *
 * @param {Set|null} visited The seen-cell set, or `null` when only one layer is being walked.
 * @param {number} columnCount The grid's column count, which makes the key unique per cell.
 * @param {number} row Visual row index.
 * @param {number} column Visual column index.
 * @returns {boolean}
 */
function isCellAlreadyCovered(
  visited: Set<number> | null, columnCount: number, row: number, column: number
): boolean {
  if (visited === null) {
    return false;
  }

  const key = (row * columnCount) + column;

  if (visited.has(key)) {
    return true;
  }

  visited.add(key);

  return false;
}

/**
 * Reports whether one cell would accept the value.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {*} value The value to write.
 * @param {number} row Visual row index.
 * @param {number} column Visual column index.
 * @returns {boolean}
 */
function canFillCell(hot: HotInstance, value: unknown, row: number, column: number): boolean {
  // The transient read keeps a fill over a large selection from permanently materializing one meta
  // object per target cell - only `readOnly` and `valueSetter` are read here.
  const cellMeta = hot.getCellMetaTransient(row, column);

  if (cellMeta.readOnly) {
    return false;
  }

  // `getSourceDataAtCell()` takes a PHYSICAL row and a VISUAL column. The walk produces visual
  // coordinates, so the row is translated - without it, a sorted or filtered grid reads a different
  // record than the one about to be written.
  const originalValue = hot.getSourceDataAtCell(hot.toPhysicalRow(row), column) ?? null;

  return canOverwriteValue(value, originalValue, !!cellMeta.valueSetter);
}

/**
 * Answers whether `Ctrl`/`Cmd`+`Enter` over this selection would write to any cell other than the one
 * named by `row`/`column`.
 *
 * Three callers need this exact question, and each used to answer it from the active layer alone, so
 * a selection whose focused layer held a single cell read as "nothing else to fill" however many
 * other layers it had. The editor then did nothing at all: the text editor inserted a line break, and
 * the unchanged-edit guard treated the keystroke as a plain `Enter`.
 *
 * The answer is derived from the cells themselves rather than from a layer count, so a layer that
 * contributes nothing - all `readOnly`, a header, or a repeat of the same cell - correctly reads as
 * nothing to fill. The walk stops at the first cell that would be written, so a gate asking this on
 * every keystroke does not pay for the rest of the selection.
 *
 * The value matters, because whether a cell accepts it is part of the answer: a plain value cannot
 * land on a cell holding an object. So the caller passes what it would actually write.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {*} value The value that would be written.
 * @param {number} row Visual row of the cell the value comes from.
 * @param {number} column Visual column of that cell.
 * @returns {boolean}
 */
export function selectionFillsOtherCells(
  hot: HotInstance, value: unknown, row: number | null, column: number | null
): boolean {
  const selectedRanges = hot.getSelectedRange();

  if (!selectedRanges?.length) {
    return false;
  }

  return walkSelectionFill(hot, value, selectedRanges, row, column, null);
}
