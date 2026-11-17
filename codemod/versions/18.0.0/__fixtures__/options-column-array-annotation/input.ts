import type { ColumnSettings } from 'handsontable/settings';
import type Handsontable from 'handsontable/base';

interface Chip {
  numericFormat: { culture: string };
}

export const A: ColumnSettings[] = [
  { data: 'a', type: 'numeric', numericFormat: { culture: 'de-DE' } },
];

export const B: readonly ColumnSettings[] = [
  { data: 'b', type: 'numeric', numericFormat: { culture: 'de-DE' } },
];

export const C: Array<ColumnSettings> = [
  { data: 'c', type: 'numeric', numericFormat: { culture: 'de-DE' } },
];

export const D = [
  { data: 'd', type: 'numeric', numericFormat: { culture: 'de-DE' } },
] as const satisfies readonly ColumnSettings[];

export const E = [
  { data: 'e', type: 'numeric', numericFormat: { culture: 'de-DE' } },
] satisfies ColumnSettings[];

export const F: Handsontable.ColumnSettings[] = [
  { data: 'f', type: 'numeric', numericFormat: { culture: 'de-DE' } },
];

export const G: Chip[] = [
  { numericFormat: { culture: 'de-DE' } },
];

export const H = [
  { data: 'h', numericFormat: { culture: 'de-DE' } },
];
