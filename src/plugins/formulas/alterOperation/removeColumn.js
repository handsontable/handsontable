import { arrayEach } from '../../../helpers/array';
import { cellCoordFactory, isFormulaExpression } from '../utils';
import CellValue from '../cell/value';
import ExpressionModifier from '../expressionModifier';

/**
 * When "remove_column" is triggered the following operations must be performed:
 *
 * - All formulas which contain cell coordinates must be updated and saved into source data - Column must be decreased
 *   by "amount" of times (eq: D4 to C4, $F$5 to $E$5);
 * - Mark all formulas which need update with "STATE_OUT_OFF_DATE" flag, so they can be recalculated after the operation.
 */
export const OPERATION_NAME = 'remove_column';

/**
 * Execute changes.
 *
 * @param {Number} start Index column from which the operation starts.
 * @param {Number} amount Count of columns to be removed.
 * @param {Boolean} [modifyFormula=true] If `true` all formula expressions will be modified according to the changes.
 *                                       `false` value is used by UndoRedo plugin which saves snapshoots before alter
 *                                       operation so it doesn't modify formulas if undo action is triggered.
 */
export function operate(start, amount, modifyFormula = true) {
  const columnsAmount = -amount;

  const { matrix, dataProvider, sheet } = this;
  const translate = [0, columnsAmount];
  const indexOffset = Math.abs(columnsAmount) - 1;

  const removedCellRef = matrix.removeCellRefsAtRange({ column: start }, { column: start + indexOffset });
  const toRemove = [];

  arrayEach(matrix.data, (cell) => {
    arrayEach(removedCellRef, (cellRef) => {
      if (!cell.hasPrecedent(cellRef)) {
        return;
      }

      cell.removePrecedent(cellRef);
      cell.setState(CellValue.STATE_OUT_OFF_DATE);

      arrayEach(sheet.getCellDependencies(cell.row, cell.column), (cellValue) => {
        cellValue.setState(CellValue.STATE_OUT_OFF_DATE);
      });
    });

    if (cell.column >= start && cell.column <= (start + indexOffset)) {
      toRemove.push(cell);
    }
  });

  matrix.remove(toRemove);

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
        expModifier.translate({ column: columnsAmount }, startCoord({ row: origRow, column: origColumn }));

        dataProvider.updateSourceData(row, column, expModifier.toString());
      }
    }
  });
}

function customTranslateModifier(cell, axis, delta, startFromIndex) {
  const { start, end, type } = cell;
  const startIndex = start[axis].index;
  const endIndex = end[axis].index;
  const indexOffset = Math.abs(delta) - 1;
  let deltaStart = delta;
  let deltaEnd = delta;
  let refError = false;

  // Mark all cells as #REF! which refer to removed cells between startFromIndex and startFromIndex + delta
  if (startIndex >= startFromIndex && endIndex <= startFromIndex + indexOffset) {
    refError = true;
  }

  // Decrement all cells below startFromIndex
  if (!refError && type === 'cell') {
    if (startFromIndex >= startIndex) {
      deltaStart = 0;
      deltaEnd = 0;
    }
  }

  if (!refError && type === 'range') {
    if (startFromIndex >= startIndex) {
      deltaStart = 0;
    }
    if (startFromIndex > endIndex) {
      deltaEnd = 0;

    } else if (endIndex <= startFromIndex + indexOffset) {
      deltaEnd -= Math.min(endIndex - (startFromIndex + indexOffset), 0);
    }
  }

  if (startIndex + deltaStart < 0) {
    deltaStart -= startIndex + deltaStart;
  }

  return [deltaStart, deltaEnd, refError];
}
