import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import type { ColumnSettings } from 'handsontable/settings';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import type { Cell } from './sheets';

registerAllModules();

// A column whose filled cells are all numbers gets the numeric cell type.
function columnFor(rows: Cell[][], column: number): ColumnSettings {
  const filled = rows.map((row) => row[column]).filter((value) => value !== '');
  const numeric = filled.length > 0 && filled.every((value) => typeof value === 'number');

  return numeric ? { type: 'numeric' } : { type: 'text' };
}

// The grid uses arrays, not objects keyed by header: a header such as "Unit.price" would
// otherwise be read as a nested path.
export function createGrid(container: HTMLElement, header: string[], rows: Cell[][], idColumn: number) {
  return new Handsontable(container, {
    data: rows,
    colHeaders: header,
    // The ID column is read-only, so a paste or Delete over a selected row can't change an ID.
    columns: header.map((_, column) => (column === idColumn ? { readOnly: true } : columnFor(rows, column))),
    // The ID column stays in the data, so edits can be matched to sheet rows, but users never see it.
    hiddenColumns: { columns: [idColumn] },
    rowHeaders: true,
    columnSorting: true,
    filters: true,
    dropdownMenu: true,
    contextMenu: ['row_above', 'row_below', 'remove_row', '---------', 'undo', 'redo'],
    notification: true,
    height: 520,
    stretchH: 'all',
    themeName: 'ht-theme-main',
    // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  });
}
