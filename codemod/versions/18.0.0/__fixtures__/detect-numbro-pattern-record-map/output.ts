import type Handsontable from 'handsontable/base';
import type { NumericFormatOptions } from 'handsontable/settings';

export const FMT = {
  // TODO(handsontable-codemod 18.0.0/numbro-pattern): Replace numericFormat.pattern with Intl.NumberFormat options. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  amount: { pattern: '0,0.00', culture: 'de-DE' },
  // TODO(handsontable-codemod 18.0.0/numbro-pattern): Replace numericFormat.pattern with Intl.NumberFormat options. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  fxRate: { pattern: '0.000000' },
  percent: { style: 'percent' },
} satisfies Record<string, Handsontable.NumericFormatOptions>;

export const PLAIN: Record<string, NumericFormatOptions> = {
  // TODO(handsontable-codemod 18.0.0/numbro-pattern): Replace numericFormat.pattern with Intl.NumberFormat options. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  rate: { pattern: '0.0000' },
  share: { style: 'percent' },
};

export const COMPOUND: Record<'a' | 'b', Handsontable.NumericFormatOptions> = {
  // TODO(handsontable-codemod 18.0.0/numbro-pattern): Replace numericFormat.pattern with Intl.NumberFormat options. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  a: { pattern: '0%' },
  b: { minimumFractionDigits: 2 },
};

export const UNRELATED: Record<string, { pattern: string }> = {
  mask: { pattern: '00-000' },
};

export const NOT_A_MAP = {
  fxRate: { pattern: '0.000000' },
};
