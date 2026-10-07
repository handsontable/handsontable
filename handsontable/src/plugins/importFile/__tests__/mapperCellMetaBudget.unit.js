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
 * @param {object} [options] The import options.
 * @param {object} [context] Overrides of the mapper context.
 * @returns {object} The mapped result.
 */
function mapRows(rows, sheetOverrides = {}, options = {}, context = {}) {
  const sheet = Object.assign(createSheetSnapshot('S'), sheetOverrides, { rows });
  const workbook = createWorkbookSnapshot();

  workbook.sheets.push(sheet);

  return mapWorkbook(workbook, resolveImportOptions(options), {
    formulasEnabled: false, commentsEnabled: false, customBordersEnabled: false, ...context,
  }, new DroppedFeatures());
}

/**
 * Maps the rows and answers the limit error the mapper refused them with, or `null`.
 *
 * @param {...*} args The `mapRows` arguments.
 * @returns {Error|null} The refusal.
 */
function refusalOf(...args) {
  try {
    mapRows(...args);
  } catch (error) {
    if (isLimitError(error)) {
      return error;
    }

    throw error;
  }

  return null;
}

/**
 * A cell style with the given parts and every other part empty.
 *
 * @param {object} parts The style parts to set.
 * @returns {object} The style snapshot.
 */
function styleOf(parts) {
  return { alignment: null, font: null, fill: null, border: null, ...parts };
}

/**
 * A solid fill style.
 *
 * @param {string} argb The fill color.
 * @returns {object} The style snapshot.
 */
function fill(argb) {
  return styleOf({ fill: { type: 'pattern', pattern: 'solid', fgColor: { argb } } });
}

const THIN_BOX = styleOf({
  border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
});

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

  it('should charge the per-cell class names against the same budget', () => {
    // With `importStyles`, a column whose cells carry different classes keeps them per cell. Those go
    // into `cellsMeta` too, and used to bypass the budget the type and `readOnly` entries are charged to.
    const style = horizontal => ({ alignment: { horizontal }, font: null, fill: null, border: null });
    const center = Object.assign(createCellSnapshot(), { style: style('center') });
    const right = Object.assign(createCellSnapshot(), { style: style('right') });
    const rows = Array.from({ length: 2400 }, (_, row) => [row % 2 === 0 ? center : right]);
    let refusal = null;

    try {
      mapRows(rows, {}, { importStyles: true });
    } catch (error) {
      refusal = error;
    }

    expect(isLimitError(refusal)).toBe(true);
  });

  it('should accept exactly the budget and refuse one more', () => {
    const column = (majority, minority) => [
      ...Array.from({ length: majority }, () => [validatedSlot('"a,b"')]),
      ...Array.from({ length: minority }, () => [validatedSlot('"c,d"')]),
    ];

    expect(mapRows(column(1001, 1000)).cellsMeta).toHaveLength(1000);
    expect(refusalOf(column(1002, 1001))?.message).toMatch(/expand to more than 1000 cells/);
  });

  it('should let the budget grow with the data cells', () => {
    // 1 500 text outliers: above the floor, below the 3 000 cells of data.
    const rows = Array.from({ length: 3000 }, (_, row) => [
      Object.assign(createCellSnapshot(), { value: row % 2 ? 'x' : row }),
    ]);

    expect(mapRows(rows).cellsMeta).toHaveLength(1500);
  });

  it('should count formula cells as data', () => {
    // The same shape as above, every cell a formula with a cached result and no value of its own.
    const rows = Array.from({ length: 3000 }, (_, row) => [
      Object.assign(createCellSnapshot(), { formula: { text: 'A1', result: row % 2 ? 'x' : row } }),
    ]);

    expect(mapRows(rows).cellsMeta).toHaveLength(1500);
  });

  it('should refuse fills alternating by row across many columns while it collects them', () => {
    // The 101 KB file of 305 rows x 16 384 columns, scaled to the mocked floor: no column can be lifted,
    // so every row of every column is a class-name run of its own.
    const even = Object.assign(createCellSnapshot(), { style: fill('FFFF0000') });
    const odd = Object.assign(createCellSnapshot(), { style: fill('FF00FF00') });
    const rows = Array.from({ length: 40 }, (_, row) => Array.from({ length: 60 }, () => (row % 2 ? odd : even)));
    const placed = jest.spyOn(Map.prototype, 'set');
    let refusal;
    let indexedCells;

    try {
      refusal = refusalOf(rows, {}, { importStyles: true });
      indexedCells = placed.mock.calls.filter(([key]) => typeof key === 'string' && /^\d+:\d+$/.test(key));
    } finally {
      placed.mockRestore();
    }

    expect(refusal?.message).toMatch(/expand to more than 1000 cells/);
    // Refused at collection: no `"row:col"` index entry of the placement was ever allocated.
    expect(indexedCells).toEqual([]);
  });

  it('should refuse a sheet of bordered empty cells past the budget', () => {
    const boxed = Object.assign(createCellSnapshot(), { style: THIN_BOX });
    const rows = Array.from({ length: 30 }, () => Array.from({ length: 40 }, () => boxed));

    expect(refusalOf(rows, {}, { importStyles: true }, { customBordersEnabled: true })?.message)
      .toMatch(/expand to more than 1000 cells, above the limit this reader accepts for a sheet with 0 cells of data/);
    // Exactly the floor still maps.
    expect(mapRows(rows.slice(0, 25), {}, { importStyles: true }, { customBordersEnabled: true }).customBorders)
      .toHaveLength(1000);
  });

  it('should map a styled, bordered sheet of real data larger than the floor', () => {
    // Banded rows, every cell boxed and holding a value: 3 000 class-name cells and 3 000 borders, all
    // carried by the sheet's own data.
    const rows = Array.from({ length: 1000 }, (_, row) => Array.from({ length: 3 }, (__, col) => (
      Object.assign(createCellSnapshot(), {
        value: (row * 3) + col,
        style: { ...fill(row % 2 ? 'FFEEEEEE' : 'FFFFFFFF'), border: THIN_BOX.border },
      })
    )));
    const result = mapRows(rows, {}, { importStyles: true }, { customBordersEnabled: true });

    expect(result.cellsMeta).toHaveLength(3000);
    expect(result.customBorders).toHaveLength(3000);
    expect(result.customBorders[0]).toEqual({
      row: 0,
      col: 0,
      top: { width: 1, color: '#000000' },
      bottom: { width: 1, color: '#000000' },
      start: { width: 1, color: '#000000' },
      end: { width: 1, color: '#000000' },
    });
  });

  it('should lift a uniformly styled column to the column however many rows it has', () => {
    const red = Object.assign(createCellSnapshot(), { style: fill('FFFF0000') });
    const result = mapRows(Array.from({ length: 5000 }, () => [red, red]), {}, { importStyles: true });

    expect(result.columns.map(column => column.className)).toEqual([
      expect.stringMatching(/^htImported-/), expect.stringMatching(/^htImported-/),
    ]);
    expect(result.cellsMeta).toBeUndefined();
  });
});
