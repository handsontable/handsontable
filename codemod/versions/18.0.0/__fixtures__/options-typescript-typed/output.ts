import Handsontable from 'handsontable';
import type { GridSettings, ColumnSettings } from 'handsontable/settings';

const columns: ColumnSettings[] = [
  {
    // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
    type: 'date'
  },
  {
    type: 'numeric',
    locale: 'en-GB',

    numericFormat: {
      pattern: '0,0'
    }
  },
];

export const settings: GridSettings = {
  columns,

  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  colHeaders: true
};

export const compact = {
  colHeaders: true,
  columns: [{
    // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Deleted datePickerConfig here. Check the native date input, which replaces Pikaday. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
    type: 'date'
  }],
} satisfies GridSettings;

export function createGrid(container: HTMLElement): Handsontable {
  return new Handsontable(container, {
    columns: [{
      type: 'numeric',
      locale: 'pl-PL',
      numericFormat: {}
    }],
  } as GridSettings);
}
