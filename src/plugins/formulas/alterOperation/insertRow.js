import {arrayEach} from 'handsontable/helpers/array';
import {cellCoordFactory, isFormulaExpression} from './../utils';
import CellValue from './../cell/value';
import ExpressionModifier from './../expressionModifier';

export const OPERATION_NAME = 'insert_row';

export function operate(start, amount, modifyFormula = true) {
  const {matrix, dataProvider} = this;
  const translate = [amount, 0];

  arrayEach(matrix.cellReferences, (cell) => {
    if (cell.row >= start) {
      cell.translateTo(...translate);
    }
  });

  arrayEach(matrix.data, (cell) => {
    const {row: origRow, column: origColumn} = cell;

    if (cell.row >= start) {
      cell.translateTo(...translate);
      cell.setState(CellValue.STATE_OUT_OFF_DATE);
    }

    if (modifyFormula) {
      const {row, column} = cell;
      const value = dataProvider.getSourceDataAtCell(row, column);

      if (isFormulaExpression(value)) {
        const startCoord = cellCoordFactory('row', start);
        const expModifier = new ExpressionModifier(value);

        expModifier.useCustomModifier(customTranslateModifier);
        expModifier.translate({row: amount}, startCoord({row: origRow, column: origColumn}));

        dataProvider.updateSourceData(row, column, expModifier.toString());
      }
    }
  });
}

function customTranslateModifier(cell, axis, delta, startFromIndex) {
  const {start, end} = cell;
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
