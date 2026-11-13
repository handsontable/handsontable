import type Handsontable from 'handsontable/base';
import type { NumericFormatOptions } from 'handsontable/settings';

export const FMT = {
  amount: { pattern: '0,0.00', culture: 'de-DE' },
  fxRate: { pattern: '0.000000' },
  percent: { style: 'percent' },
} satisfies Record<string, Handsontable.NumericFormatOptions>;

export const PLAIN: Record<string, NumericFormatOptions> = {
  rate: { pattern: '0.0000' },
  share: { style: 'percent' },
};

export const COMPOUND: Record<'a' | 'b', Handsontable.NumericFormatOptions> = {
  a: { pattern: '0%' },
  b: { minimumFractionDigits: 2 },
};

export const UNRELATED: Record<string, { pattern: string }> = {
  mask: { pattern: '00-000' },
};

export const NOT_A_MAP = {
  fxRate: { pattern: '0.000000' },
};
