import { mapWorkbook, resolveImportOptions } from '../mapper';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import { createCellSnapshot, createSheetSnapshot, createWorkbookSnapshot } from '../../../utils/xlsxEngine/model';

// This file deliberately does NOT mock `limits`: it pins behavior on the real `MIN_CELL_META_BUDGET`,
// which `mapperCellMetaBudget.unit.js` lowers for its own cases.

/**
 * Builds a cell snapshot.
 *
 * @param {object} overrides The snapshot fields to set.
 * @returns {object} The cell snapshot.
 */
function cell(overrides) {
  return { ...createCellSnapshot(), ...overrides };
}

/**
 * Maps a one-sheet workbook with type inference on.
 *
 * @param {Array[]} rows The sheet's rows.
 * @param {object} [options] The import options.
 * @returns {object} The mapped result.
 */
function mapRows(rows, options = {}) {
  const sheet = Object.assign(createSheetSnapshot('S'), { rows });
  const workbook = createWorkbookSnapshot();

  workbook.sheets.push(sheet);

  return mapWorkbook(workbook, resolveImportOptions(options), {
    formulasEnabled: false, commentsEnabled: false, customBordersEnabled: false,
  }, new DroppedFeatures());
}

/**
 * One shared empty cell carrying a list validation.
 *
 * @param {string} list The list formula.
 * @returns {object} The cell snapshot.
 */
function validatedSlot(list) {
  return cell({ validation: { type: 'list', formulae: [list], allowBlank: true } });
}

describe('mapWorkbook per-cell meta on the real budget', () => {
  it('should not let a run of one meta swallow a row that has none', () => {
    // A numeric run that spanned the empty row would count three cells and tie the three text cells.
    const rows = [
      [cell({ value: 1 })],
      [cell({ value: null })],
      [cell({ value: 2 })],
      [cell({ value: 'a' })],
      [cell({ value: 'b' })],
      [cell({ value: 'c' })],
    ];
    const result = mapRows(rows);

    expect(result.columns[0].type).toBe('text');
    expect(result.cellsMeta.map(({ row }) => row)).toEqual([0, 2]);
  });

  it('should expand two small validations that split a column on the real floor', () => {
    // A wrong `MIN_CELL_META_BUDGET` (for example 10) refuses this 40-row sheet.
    const top = validatedSlot('"a,b"');
    const bottom = validatedSlot('"c,d"');
    const rows = Array.from({ length: 40 }, (_, row) => (row < 20 ? [top] : [bottom]));

    expect(mapRows(rows).cellsMeta).toHaveLength(20);
  });
});
