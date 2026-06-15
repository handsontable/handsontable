import { isKeyValueObject } from '../../../helpers/object';

/**
 * Defines what value is set to an autocomplete-typed cell.
 *
 * @param {*} newValue The value to be set.
 * @param {number} row The visual row index.
 * @param {number} column The visual column index.
 * @returns {*} The new value to be set.
 */
export type SetterContext = {
  getSourceDataAtCell: (row: number, col: number) => unknown;
  toPhysicalRow: (row: number) => number;
  toPhysicalColumn: (col: number) => number;
};

/**
 *
 */
export function valueSetter(this: SetterContext, newValue: unknown, row: number, column: number): unknown {
  const sourceDataAtCell = this.getSourceDataAtCell(this.toPhysicalRow(row), this.toPhysicalColumn(column));

  if (isKeyValueObject(sourceDataAtCell)) {
    return isKeyValueObject(newValue) ? newValue : { key: newValue, value: newValue };
  }

  return newValue;
}
