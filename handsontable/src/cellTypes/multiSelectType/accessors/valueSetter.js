import { isKeyValueObject } from '../../../helpers/object';

/**
 * Defines what value is set to an multiSelect-typed cell.
 *
 * @param {*} newValue The value to be set.
 * @param {number} row The visual row index.
 * @param {number|string} column The visual column index or property name.
 * @returns {*} The new value to be set.
 */
export function valueSetter(newValue, row, column) {
  const physicalColumn = typeof column === 'string' ? column : this.toPhysicalColumn(column);

  if (Array.isArray(newValue)) {
    const sourceDataAtCell = this.getSourceDataAtCell(this.toPhysicalRow(row), physicalColumn);

    if (
      Array.isArray(sourceDataAtCell) &&
      sourceDataAtCell.length > 0 &&
      isKeyValueObject(sourceDataAtCell[0])
    ) {
      return newValue.map((val) => {
        return isKeyValueObject(val) ? val : { key: val, value: val };
      });
    }
  }

  return newValue;
}
