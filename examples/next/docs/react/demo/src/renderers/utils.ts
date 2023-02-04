import Handsontable from 'handsontable';

export function getRangeValue(value: number, minAllowedValue: number, maxAllowedValue: number): number {
  if (value < minAllowedValue || !value) {
    return minAllowedValue;
  }

  if (value > maxAllowedValue) {
    return maxAllowedValue;
  }

  return value;
}

export type HandsontableProps = {
  instance: Handsontable.Core,
  TD: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: any,
  cellProperties: Handsontable.CellProperties
}