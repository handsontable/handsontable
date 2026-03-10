import { isKeyValueObject } from '../../../helpers/object';

/**
 * Defines what value is set to an multiSelect-typed cell.
 */
export function valueSetter(
  this: { getSourceDataAtCell: (row: number, col: number | string) => unknown; toPhysicalRow: (row: number) => number },
  newValue: unknown,
  row: number,
  column: number | string
): unknown {
  if (Array.isArray(newValue)) {
    const sourceDataAtCell = this.getSourceDataAtCell(this.toPhysicalRow(row), column);

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
