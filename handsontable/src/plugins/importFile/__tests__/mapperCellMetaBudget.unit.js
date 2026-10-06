import { mapWorkbook, resolveImportOptions } from '../mapper';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import { isLimitError } from '../../../utils/xlsxEngine/limits';
import { createCellSnapshot, createSheetSnapshot, createWorkbookSnapshot } from '../../../utils/xlsxEngine/model';

// The real floor is a million cells; a test at that size would take seconds and gigabytes, so the
// floor is lowered here and the budget's arithmetic is the same.
jest.mock('../../../utils/xlsxEngine/limits', () => ({
  ...jest.requireActual('../../../utils/xlsxEngine/limits'),
  MIN_CELL_META_BUDGET: 1000,
}));

/**
 * Maps a one-sheet workbook with type inference on.
 *
 * @param {Array[]} rows The sheet's rows.
 * @param {object} [sheetOverrides] Extra sheet snapshot fields.
 * @returns {object} The mapped result.
 */
function mapRows(rows, sheetOverrides = {}) {
  const sheet = Object.assign(createSheetSnapshot('S'), sheetOverrides, { rows });
  const workbook = createWorkbookSnapshot();

  workbook.sheets.push(sheet);

  return mapWorkbook(workbook, resolveImportOptions({}), {
    formulasEnabled: false, commentsEnabled: false, customBordersEnabled: false,
  }, new DroppedFeatures());
}

/**
 * One shared empty cell carrying a list validation, the shape the native reader hands over for
 * every slot a validation covers.
 *
 * @param {string} list The list formula.
 * @returns {object} The cell snapshot.
 */
function validatedSlot(list) {
  return Object.assign(createCellSnapshot(), { validation: { type: 'list', formulae: [list], allowBlank: true } });
}

describe('mapWorkbook per-cell meta budget', () => {
  it('should refuse a sheet whose two validations split empty columns past the budget', () => {
    // Two list formulas over the top and bottom halves of two columns: the column takes one, and the
    // other half is expanded one `cellsMeta` entry per empty cell. A 2 kB file did this for 2.5 M cells.
    const top = validatedSlot('"a,b"');
    const bottom = validatedSlot('"c,d"');
    const rows = Array.from({ length: 2400 }, (_, row) => (row < 1200 ? [top, top] : [bottom, bottom]));
    let refusal = null;

    try {
      mapRows(rows);
    } catch (error) {
      refusal = error;
    }

    expect(isLimitError(refusal)).toBe(true);
    expect(refusal.message)
      .toMatch(/expand to more than 1000 cells, above the limit this reader accepts for a sheet with 0 cells of data/);
  });

  it('should map a sheet whose expanded cells hold data, however many there are', () => {
    // A column of mixed real values expands its minority type per cell. Those cells carry their own
    // data, so the budget grows with them and the sheet is mapped.
    const rows = Array.from({ length: 3000 }, (_, row) => [
      Object.assign(createCellSnapshot(), { value: row % 3 === 0 ? `t${row}` : row }),
    ]);
    const result = mapRows(rows);

    expect(result.columns[0].type).toBe('numeric');
    expect(result.cellsMeta).toHaveLength(1000);
  });

  it('should map one validation over many empty rows, which lifts to the column', () => {
    const slot = validatedSlot('"a,b"');
    const result = mapRows(Array.from({ length: 5000 }, () => [slot, slot]));

    expect(result.columns.map(column => column.type)).toEqual(['dropdown', 'dropdown']);
    expect(result.cellsMeta).toBeUndefined();
  });
});
