import Handsontable from 'handsontable';

export function trace(message: string): void {
  Handsontable.helper.log(message);
}

export const legacy = Handsontable.helper.isIE() ? 1 : 0;

export const numeric = Handsontable.helper.isNumeric('1');

const other = { helper: { log(): void {} } };

other.helper.log();
