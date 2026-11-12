import Handsontable from 'handsontable';

export function trace(message: string): void {
  // TODO(handsontable-codemod 18.0.0/helper-typings-only): Remove the call, or use your own function.
  Handsontable.helper.log(message);
}

// TODO(handsontable-codemod 18.0.0/helper-typings-only): Remove the call, or use your own function.
export const legacy = Handsontable.helper.isIE() ? 1 : 0;

export const numeric = Handsontable.helper.isNumeric('1');

const other = { helper: { log(): void {} } };

other.helper.log();
