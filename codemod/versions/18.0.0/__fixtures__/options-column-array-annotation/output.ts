import type { ColumnSettings } from 'handsontable/settings';
import type Handsontable from 'handsontable/base';

interface Chip {
  numericFormat: { culture: string };
}

export const A: ColumnSettings[] = [
  {
    data: 'a',
    locale: 'de-DE',
    numericFormat: {}
  },
];

export const B: readonly ColumnSettings[] = [
  {
    data: 'b',
    locale: 'de-DE',
    numericFormat: {}
  },
];

export const C: Array<ColumnSettings> = [
  {
    data: 'c',
    locale: 'de-DE',
    numericFormat: {}
  },
];

export const D = [
  {
    data: 'd',
    locale: 'de-DE',
    numericFormat: {}
  },
] as const satisfies readonly ColumnSettings[];

export const E = [
  {
    data: 'e',
    locale: 'de-DE',
    numericFormat: {}
  },
] satisfies ColumnSettings[];

export const F: Handsontable.ColumnSettings[] = [
  {
    data: 'f',
    locale: 'de-DE',
    numericFormat: {}
  },
];

export const G: Chip[] = [
  // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if this object holds Handsontable options. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  { numericFormat: { culture: 'de-DE' } },
];

export const H = [
  // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  { data: 'h', numericFormat: { culture: 'de-DE' } },
];
