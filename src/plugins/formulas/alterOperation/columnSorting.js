import { arrayEach } from '../../../helpers/array';
import { isFormulaExpression } from '../utils';
import CellValue from '../cell/value';
import ExpressionModifier from '../expressionModifier';

/**
 * When "column_sorting" is triggered the following operations must be performed:
 *
 * - All formulas which contain cell coordinates must be updated and saved into source data - Column must be changed
 *   (decreased or increased) depends on new target position - previous position.
 * - Mark all formulas which need update with "STATE_OUT_OFF_DATE" flag, so they can be recalculated after the operation.
 */
export const OPERATION_NAME = 'column_sorting';

let visualRows;

/**
 * Collect all previous visual rows from CellValues.
 */
export function prepare() {
  const { matrix, dataProvider } = this;

  visualRows = new WeakMap();

  arrayEach(matrix.data, (cell) => {
    visualRows.set(cell, dataProvider.t.toVisualRow(cell.row));
  });
}

/**
 * Translate all CellValues depends on previous position.
 */
export function operate() {
  const { matrix, dataProvider } = this;

  matrix.cellReferences.length = 0;

  arrayEach(matrix.data, (cell) => {
    cell.setState(CellValue.STATE_OUT_OFF_DATE);
    cell.clearPrecedents();

    const { row, column } = cell;
    const value = dataProvider.getSourceDataAtCell(row, column);

    if (isFormulaExpression(value)) {
      const prevRow = visualRows.get(cell);
      const expModifier = new ExpressionModifier(value);

      expModifier.translate({ row: dataProvider.t.toVisualRow(row) - prevRow });

      dataProvider.updateSourceData(row, column, expModifier.toString());
    }
  });

  visualRows = null;
}
