import { arrayEach } from 'handsontable/helpers/array';
import { cellCoordFactory, isFormulaExpression } from './../utils';
import CellValue from './../cell/value';
import ExpressionModifier from './../expressionModifier';

/**
 * When "inser_column" is triggered the following operations must be performed:
 *
 * - All formulas which contain cell coordinates must be updated and saved into source data - Column must be increased
 *   by "amount" of times (eq: D4 to E4, $F$5 to $G$5);
 * - Mark all formulas which need update with "STATE_OUT_OFF_DATE" flag, so they can be recalculated after the operation.
 */
export const OPERATION_NAME = 'insert_column';

/**
 * Execute changes.
 *
 * @param {Number} start Index column from which the operation starts.
 * @param {Number} amount Count of columns to be inserted.
 * @param {Boolean} [modifyFormula=true] If `true` all formula expressions will be modified according to the changes.
 *                                       `false` value is used by UndoRedo plugin which saves snapshoots before alter
 *                                       operation so it doesn't have to modify formulas if "undo" action was triggered.
 */
export function operate(start, amount, modifyFormula = true) {
  const { matrix, dataProvider } = this;
  const translate = [0, amount];

  arrayEach(matrix.cellReferences, (cell) => {
    if (cell.column >= start) {
      cell.translateTo(...translate);
    }
  });

  arrayEach(matrix.data, (cell) => {
    const { row: origRow, column: origColumn } = cell;

    if (cell.column >= start) {
      cell.translateTo(...translate);
      cell.setState(CellValue.STATE_OUT_OFF_DATE);
    }

    if (modifyFormula) {
      const { row, column } = cell;
      const value = dataProvider.getSourceDataAtCell(row, column);

      if (isFormulaExpression(value)) {
        const startCoord = cellCoordFactory('column', start);
        const expModifier = new ExpressionModifier(value);

        expModifier.useCustomModifier(customTranslateModifier);
        expModifier.translate({ column: amount }, startCoord({ row: origRow, column: origColumn }));

        dataProvider.updateSourceData(row, column, expModifier.toString());
      }
    }
  });
}

function customTranslateModifier(cell, axis, delta, startFromIndex) {
  const { start, end } = cell;
  const startIndex = start[axis].index;
  const endIndex = end[axis].index;
  let deltaStart = delta;
  let deltaEnd = delta;

  // Do not translate cells above inserted row or on the left of inserted column
  if (startFromIndex > startIndex) {
    deltaStart = 0;
  }
  if (startFromIndex > endIndex) {
    deltaEnd = 0;
  }

  return [deltaStart, deltaEnd, false];
}
