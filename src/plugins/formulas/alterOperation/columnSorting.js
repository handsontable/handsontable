import {arrayEach} from 'handsontable/helpers/array';
import {isFormulaExpression} from './../utils';
import CellValue from './../cell/value';
import ExpressionModifier from './../expressionModifier';

export const OPERATION_NAME = 'column_sorting';

let visualRows;

export function prepare() {
  const {matrix, dataProvider} = this;

  visualRows = new WeakMap();

  arrayEach(matrix.data, (cell) => {
    visualRows.set(cell, dataProvider.t.toVisualRow(cell.row));
  });
}

export function operate() {
  const {matrix, dataProvider} = this;

  matrix.cellReferences.length = 0;

  arrayEach(matrix.data, (cell) => {
    cell.setState(CellValue.STATE_OUT_OFF_DATE);
    cell.clearPrecedents();

    const {row, column} = cell;
    const value = dataProvider.getSourceDataAtCell(row, column);

    if (isFormulaExpression(value)) {
      const prevRow = visualRows.get(cell);
      const expModifier = new ExpressionModifier(value);

      expModifier.translate({row: dataProvider.t.toVisualRow(row) - prevRow});

      dataProvider.updateSourceData(row, column, expModifier.toString());
    }
  });

  visualRows = null;
}
