import Handsontable from 'handsontable/base';

// Grid operations, with no knowledge of any agent framework. The scripted driver in the
// demo and the CopilotKit tools in Step 4 both call these functions, so a hand-written
// script and the agent drive the grid through one code path. Every function writes through
// the live instance, which is what keeps undo working across agent and user edits alike.

export type Cell = string | number;

// A model sometimes wraps a cell value in an object ({ value } or { formula }) even when the
// schema asks for a string or a number. Coerce anything to a primitive before it reaches a cell.
export function toCell(value: unknown): Cell {
  if (value == null) return '';
  if (typeof value === 'number' || typeof value === 'string') return value;

  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const picked = object.formula ?? object.value ?? object.text;

    if (typeof picked === 'number' || typeof picked === 'string') return picked;
  }

  return String(value);
}

export function normalizeRows(rows: unknown): Cell[][] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => (Array.isArray(row) ? row.map(toCell) : [toCell(row)]));
}

// Build or replace the whole sheet. Clone the rows first: Handsontable binds to the array by
// reference, so a shared array would let later edits mutate the caller's copy.
export function createSpreadsheet(hot: Handsontable.Core, columns: string[], rows: unknown): void {
  hot.updateData(structuredClone(normalizeRows(rows)));
  hot.updateSettings({ colHeaders: columns.length ? columns : true });
}

// Set one or more cells. The agent addresses cells by physical (source) coordinates, so translate
// each to a visual coordinate and write with setDataAtCell. That path recomputes HyperFormula and
// records the change for undo; setSourceDataAtCell does neither, so it is not used here. Grow the
// grid first when the agent addresses a cell past the current bounds.
export function setCells(hot: Handsontable.Core, cells: { row: number; col: number; value: Cell }[]): void {
  if (cells.length === 0) return;

  hot.batch(() => {
    const maxRow = Math.max(...cells.map((cell) => cell.row));
    const maxCol = Math.max(...cells.map((cell) => cell.col));

    const sourceCols = hot.countSourceCols();

    if (maxCol >= sourceCols) {
      const add = maxCol - sourceCols + 1;

      if (sourceCols === 0) hot.alter('insert_col_start', 0, add);
      else hot.alter('insert_col_end', hot.countCols() - 1, add);
    }

    const sourceRows = hot.countSourceRows();

    if (maxRow >= sourceRows) {
      const add = maxRow - sourceRows + 1;

      if (sourceRows === 0) hot.alter('insert_row_above', 0, add);
      else hot.alter('insert_row_below', hot.countRows() - 1, add);
    }

    cells.forEach((cell) => {
      const visualRow = hot.toVisualRow(cell.row);
      const visualCol = hot.toVisualColumn(cell.col);

      if (typeof visualRow === 'number' && visualRow >= 0 && typeof visualCol === 'number' && visualCol >= 0) {
        hot.setDataAtCell(visualRow, visualCol, toCell(cell.value));
      }
    });
  });
}

// Append a labeled column to the right of the sheet.
export function addColumn(hot: Handsontable.Core, name: string): void {
  const headers = (hot.getColHeader() as (string | number)[]).map(String);

  hot.alter('insert_col_end', hot.countCols() - 1, 1);
  hot.updateSettings({ colHeaders: [...headers, name] });
}

// Undo the last change. It spans both agent and user edits, because every change goes through the
// instance. undo and redo live on the UndoRedo plugin, not on the core -- hot.undo() does not exist.
export function undo(hot: Handsontable.Core): boolean {
  const plugin = hot.getPlugin('undoRedo');

  if (!plugin.isUndoAvailable()) return false;

  plugin.undo();

  return true;
}
