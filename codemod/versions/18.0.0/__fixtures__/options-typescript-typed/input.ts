import Handsontable from 'handsontable';
import type { GridSettings, ColumnSettings } from 'handsontable/settings';

const columns: ColumnSettings[] = [
  { type: 'date', correctFormat: true },
  { type: 'numeric', numericFormat: { culture: 'en-GB', pattern: '0,0' } },
];

export const settings: GridSettings = {
  columns,
  colHeaders: true,
  'correctFormat': true,
};

export const compact = {
  colHeaders: true,
  columns: [{ type: 'date', datePickerConfig: {} }],
} satisfies GridSettings;

export function createGrid(container: HTMLElement): Handsontable {
  return new Handsontable(container, {
    columns: [{ type: 'numeric', numericFormat: { culture: 'pl-PL' } }],
  } as GridSettings);
}
