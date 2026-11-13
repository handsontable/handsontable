import type { ColumnSettings } from 'handsontable/settings';
import type Handsontable from 'handsontable/base';

interface Chip {
  numericFormat: { culture: string };
}

export const A: ColumnSettings[] = [
  { data: 'a', numericFormat: { culture: 'de-DE' } },
];

export const B: readonly ColumnSettings[] = [
  { data: 'b', numericFormat: { culture: 'de-DE' } },
];

export const C: Array<ColumnSettings> = [
  { data: 'c', numericFormat: { culture: 'de-DE' } },
];

export const D = [
  { data: 'd', numericFormat: { culture: 'de-DE' } },
] as const satisfies readonly ColumnSettings[];

export const E = [
  { data: 'e', numericFormat: { culture: 'de-DE' } },
] satisfies ColumnSettings[];

export const F: Handsontable.ColumnSettings[] = [
  { data: 'f', numericFormat: { culture: 'de-DE' } },
];

export const G: Chip[] = [
  { numericFormat: { culture: 'de-DE' } },
];

export const H = [
  { data: 'h', numericFormat: { culture: 'de-DE' } },
];
