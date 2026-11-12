import Handsontable from 'handsontable';
import type { GridSettings, ColumnSettings } from 'handsontable/settings';

const columns: ColumnSettings[] = [
  {
    // TODO(handsontable-codemod 18.0.0/correct-format-removed): The correctFormat option was removed in 18.0 and was deleted here. The date, time, intl-date, and intl-time cell types work with ISO 8601 values and do not reformat input. To normalize or correct entered values, use the valueParser or valueSetter option.
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

  // TODO(handsontable-codemod 18.0.0/correct-format-removed): The correctFormat option was removed in 18.0 and was deleted here. The date, time, intl-date, and intl-time cell types work with ISO 8601 values and do not reformat input. To normalize or correct entered values, use the valueParser or valueSetter option.
  colHeaders: true
};

export const compact = {
  colHeaders: true,
  columns: [{
    // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): The datePickerConfig option was removed in 18.0 and was deleted here. The date and intl-date cell types use the browser's native date input instead of Pikaday.
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
