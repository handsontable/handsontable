import type { ColumnSettings } from 'handsontable/settings';
import type Handsontable from 'handsontable/base';

interface Chip {
  numericFormat: { culture: string };
}

export const A: ColumnSettings[] = [
  // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  {
    data: 'a',
    type: 'numeric',
    locale: 'de-DE',
    numericFormat: {}
  },
];

export const B: readonly ColumnSettings[] = [
  // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  {
    data: 'b',
    type: 'numeric',
    locale: 'de-DE',
    numericFormat: {}
  },
];

export const C: Array<ColumnSettings> = [
  // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  {
    data: 'c',
    type: 'numeric',
    locale: 'de-DE',
    numericFormat: {}
  },
];

export const D = [
  // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  {
    data: 'd',
    type: 'numeric',
    locale: 'de-DE',
    numericFormat: {}
  },
] as const satisfies readonly ColumnSettings[];

export const E = [
  // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  {
    data: 'e',
    type: 'numeric',
    locale: 'de-DE',
    numericFormat: {}
  },
] satisfies ColumnSettings[];

export const F: Handsontable.ColumnSettings[] = [
  // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  {
    data: 'f',
    type: 'numeric',
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
