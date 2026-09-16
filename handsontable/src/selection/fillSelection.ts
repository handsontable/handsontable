import type { HotInstance } from '../core/types';
import type { default as CellRange } from '../3rdparty/walkontable/src/cell/range';
import { deepClone } from '../helpers/object';

/**
 * One cell to write, as `setDataAtCell()` takes it.
 */
type CellChange = [number, number, unknown];

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
  // One layer cannot overlap itself, so the bookkeeping is only worth it from the second layer on -
  // a fill over a whole large grid would otherwise allocate a key per cell for nothing.
  const visited = selectedRanges.length > 1 ? new Set<number>() : null;
  const columnCount = hot.countCols();

  selectedRanges.forEach((cellRange) => {
    const bounds = resolveLayerBounds(hot, cellRange);

    if (bounds === null) {
      return;
    }

    for (let row = bounds.fromRow; row <= bounds.toRow; row++) {
      for (let column = bounds.fromColumn; column <= bounds.toColumn; column++) {
        if (isCellAlreadyCovered(visited, columnCount, row, column) ||
            (row === skipRow && column === skipColumn)) {
          continue;
        }

        const change = buildFillChange(hot, value, row, column);

        if (change !== null) {
          changes.push(change);
        }
      }
    }
  });

  return changes;
}

/**
 * Resolves the rectangle of cells one selection layer contributes to a fill.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {CellRange} cellRange The selection layer.
 * @returns {object|null} The clamped bounds, or `null` when the layer contributes no cell.
 */
function resolveLayerBounds(hot: HotInstance, cellRange: CellRange): {
  fromRow: number; fromColumn: number; toRow: number; toColumn: number;
} | null {
  if (cellRange.isSingleHeader()) {
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
 * Builds the change one cell contributes, or `null` when the cell refuses the value.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {*} value The value to write.
 * @param {number} row Visual row index.
 * @param {number} column Visual column index.
 * @returns {Array|null}
 */
function buildFillChange(hot: HotInstance, value: unknown, row: number, column: number): CellChange | null {
  // The transient read keeps a fill over a large selection from permanently materializing one meta
  // object per target cell - only `readOnly` and `valueSetter` are read here.
  const cellMeta = hot.getCellMetaTransient(row, column);

  if (cellMeta.readOnly) {
    return null;
  }

  const originalValue = hot.getSourceDataAtCell(row, column) ?? null;

  if (!canOverwriteValue(value, originalValue, !!cellMeta.valueSetter)) {
    return null;
  }

  // One object spread over many cells must not leave them sharing a reference.
  return [row, column, value !== null && typeof value === 'object' ? deepClone(value) : value];
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
 * The answer is derived from the changes themselves rather than from a layer count, so a layer that
 * contributes nothing - all `readOnly`, a header, or a repeat of the same cell - correctly reads as
 * nothing to fill.
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

  return collectSelectionFillChanges(hot, value, selectedRanges, row, column).length > 0;
}
