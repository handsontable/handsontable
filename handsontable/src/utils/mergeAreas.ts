import type { default as CellRange } from '../3rdparty/walkontable/src/cell/range';
import type { HotInstance } from '../core/types';

/**
 * The visual geometry of a merge area: the top-left corner plus how far it spans. This is the shape
 * the `mergeCells` setting, `MergedCellsCollection#add` and the undo snapshots all speak in.
 */
export interface MergeAreaGeometry {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

/**
 * Builds the `CellRange` covering exactly the cells a merge area spans.
 *
 * This lives in the core `src/utils/` rather than in the MergeCells plugin on purpose: the UndoRedo
 * actions need it to restore merge geometry, and registering just `UndoRedo` must not pull the
 * MergeCells plugin into the bundle. Two copies would also drift, and both callers depend on the
 * range being anchored at the merge's top-left corner - which is what `MergeCells#unmergeRange`
 * matches on.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {object} mergeArea The merge area's visual geometry.
 * @param {number} mergeArea.row Visual row index of the merge area's top-left corner.
 * @param {number} mergeArea.col Visual column index of the merge area's top-left corner.
 * @param {number} mergeArea.rowspan Number of rows the merge area spans.
 * @param {number} mergeArea.colspan Number of columns the merge area spans.
 * @returns {CellRange} The range the merge area covers.
 */
export function toMergeAreaRange(
  hotInstance: HotInstance,
  { row, col, rowspan, colspan }: MergeAreaGeometry
): CellRange {
  const from = hotInstance._createCellCoords(row, col);
  const to = hotInstance._createCellCoords(row + rowspan - 1, col + colspan - 1);

  return hotInstance._createCellRange(from, from, to);
}
