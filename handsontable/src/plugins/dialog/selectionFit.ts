import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import type { ImportedSelectionState, SelectionState } from '../../selection/types';

/**
 * Fits one axis of a range into a grid whose last index on that axis is `lastIndex`. A range that lies within the
 * grid is kept as it is. A range that spans the whole grid along the axis (a full column or row, select-all) keeps
 * spanning it: its far end moves to the last index. Any other range that reaches past the last index addresses data
 * the grid no longer has, so it is dropped rather than moved onto cells the user never selected.
 *
 * @param {CellRange} range The range to fit. Changed in place.
 * @param {'row'|'col'} axis The axis to fit.
 * @param {number} lastIndex The last index of the grid along the axis.
 * @param {boolean} spansGrid Whether the range spans the whole grid along the axis.
 * @returns {boolean} `false` when the range has to be dropped.
 */
function fitRangeAxis(range: CellRange, axis: 'row' | 'col', lastIndex: number, spansGrid: boolean): boolean {
  const corners: CellCoords[] = [range.from, range.to, range.highlight];
  const isOutside = corners.some(coords => (coords[axis] ?? 0) > lastIndex);

  if (!isOutside) {
    return true;
  }

  const start = Math.min(range.from[axis] ?? 0, range.to[axis] ?? 0);

  if (!spansGrid || start > lastIndex) {
    return false;
  }

  corners.forEach((coords) => {
    if ((coords[axis] ?? 0) > lastIndex) {
      coords[axis] = lastIndex;
    }
  });

  return true;
}

/**
 * Returns the part of a stashed selection the grid can still show: the layers that lie within the current row and
 * column counts, with whole-row and whole-column extents fitted to the new size. Nothing past the end of the data
 * survives, so restoring the result never selects cells of data the selection was not made on. Every layer-indexed
 * list is re-indexed to the layers that survive, and the active layer falls back to the last surviving one when
 * its own layer was dropped.
 *
 * @param {SelectionState} state The stashed selection.
 * @param {number} rowCount The number of rows the grid has now.
 * @param {number} columnCount The number of columns the grid has now.
 * @returns {ImportedSelectionState|null} The selection to restore, `null` when no layer survives.
 */
export function fitSelectionToGrid(
  state: SelectionState,
  rowCount: number,
  columnCount: number,
): ImportedSelectionState | null {
  const rowSpans = new Set(state.rowExtentSpansGrid);
  const columnSpans = new Set(state.columnExtentSpansGrid);
  const newLayerIndexes = new Map<number, number>();
  const ranges: CellRange[] = [];

  state.ranges.forEach((sourceRange, layerIndex) => {
    const range = sourceRange.clone();
    const fits = fitRangeAxis(range, 'row', rowCount - 1, rowSpans.has(layerIndex)) &&
      fitRangeAxis(range, 'col', columnCount - 1, columnSpans.has(layerIndex));

    if (fits) {
      newLayerIndexes.set(layerIndex, ranges.length);
      ranges.push(range);
    }
  });

  if (ranges.length === 0) {
    return null;
  }

  const remap = (layerIndexes: number[]) => layerIndexes
    .filter(layerIndex => newLayerIndexes.has(layerIndex))
    .map(layerIndex => newLayerIndexes.get(layerIndex)!);
  const activeSelectionLayer = newLayerIndexes.get(state.activeSelectionLayer) ?? ranges.length - 1;

  return {
    ranges,
    activeRange: ranges[activeSelectionLayer],
    activeSelectionLayer,
    selectedByRowHeader: remap(state.selectedByRowHeader),
    selectedByColumnHeader: remap(state.selectedByColumnHeader),
    disableHeadersHighlight: state.disableHeadersHighlight,
    rowExtentSpansGrid: remap(state.rowExtentSpansGrid),
    columnExtentSpansGrid: remap(state.columnExtentSpansGrid),
  };
}
