import { mapWorkbook, resolveImportOptions } from '../mapper';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import { isLimitError, MAX_TRANSLATED_FORMULA_CHARS } from '../../../utils/xlsxEngine/limits';
import { createCellSnapshot, createSheetSnapshot, createWorkbookSnapshot } from '../../../utils/xlsxEngine/model';

// The real budget is 32 Mi characters; filling it takes thousands of long formulas, so it is lowered
// here and the arithmetic is the same.
jest.mock('../../../utils/xlsxEngine/limits', () => ({
  ...jest.requireActual('../../../utils/xlsxEngine/limits'),
  MAX_TRANSLATED_FORMULA_CHARS: 10000,
}));

/**
 * A 100-character formula starting with `head`, padded with `+1` terms.
 *
 * @param {string} head The start of the formula.
 * @returns {string}
 */
function formulaOf(head) {
  const padding = 100 - head.length;

  return `${head}${'+1'.repeat(Math.floor(padding / 2))}${padding % 2 ? '1' : ''}`;
}

/**
 * Maps a one-sheet workbook of `count` formula cells, live formulas on.
 *
 * @param {string} formula The formula every cell holds.
 * @param {number} count How many cells hold it.
 * @param {object} [settings] The import settings.
 * @param {boolean} [settings.header] Whether a header row precedes the formulas and is dropped.
 * @param {string[]} [settings.names] The names the workbook defines.
 * @param {number} [settings.readerChars] What the reader's shared-formula translation spent.
 * @returns {object} The mapped result.
 */
function mapFormulas(formula, count, { header = false, names = [], readerChars } = {}) {
  const sheet = createSheetSnapshot('Data');
  const workbook = createWorkbookSnapshot();
  const formulaCell = Object.assign(createCellSnapshot(), { formula: { text: formula, result: 1 } });

  sheet.rows = Array.from({ length: count }, () => [formulaCell]);

  if (header) {
    sheet.rows.unshift([Object.assign(createCellSnapshot(), { value: 'Total' })]);
  }

  workbook.sheets.push(sheet);
  workbook.definedNames = names.map(name => ({ name, formula: '1', sheetName: null }));

  if (readerChars !== undefined) {
    workbook.translatedFormulaChars = readerChars;
  }

  return mapWorkbook(workbook, resolveImportOptions(header ? { colHeaders: 'firstRow' } : {}), {
    formulasEnabled: true,
    commentsEnabled: false,
    customBordersEnabled: false,
    formulaSheetNames: new Set(['sheet1', 'rates']),
  }, new DroppedFeatures());
}

/**
 * Returns the error `run` throws, or `null`.
 *
 * @param {Function} run The call.
 * @returns {Error|null}
 */
function refusalOf(run) {
  try {
    run();
  } catch (error) {
    return error;
  }

  return null;
}

describe('mapWorkbook formula walk budget', () => {
  const qualified = formulaOf('Rates!A1');
  const named = formulaOf('A1*Sales');
  const fits = Math.floor(MAX_TRANSLATED_FORMULA_CHARS / 100);

  it('should take the mocked budget', () => {
    expect(MAX_TRANSLATED_FORMULA_CHARS).toBe(10000);
    expect(qualified).toHaveLength(100);
    expect(named).toHaveLength(100);
  });

  it('should charge the unknown-sheet walk of a formula with `!`, and accept exactly the budget', () => {
    expect(mapFormulas(qualified, fits).data).toHaveLength(fits);

    const refusal = refusalOf(() => mapFormulas(qualified, fits + 1));

    expect(isLimitError(refusal)).toBe(true);
    expect(refusal.message).toMatch(/rewrite to more than 10000 characters/);
  });

  it('should charge the defined-name scan of a workbook that defines a name the engine lacks', () => {
    expect(mapFormulas(named, fits, { names: ['Sales'] }).data).toHaveLength(fits);
    expect(isLimitError(refusalOf(() => mapFormulas(named, fits + 1, { names: ['Sales'] })))).toBe(true);
  });

  it('should charge each formula once when a header shift, a `!` and an unknown name all walk it', () => {
    // The shift, the qualifier check and the name scan each charged the whole formula, so a
    // workbook that fit the budget with no header was refused once its header row was dropped.
    const both = formulaOf('Rates!A1*Sales+A2');
    const result = mapFormulas(both, fits, { header: true, names: ['Sales'] });

    expect(result.data).toHaveLength(fits);
    expect(isLimitError(refusalOf(() => mapFormulas(both, fits + 1, { header: true, names: ['Sales'] }))))
      .toBe(true);
  });

  it('should charge a formula once when it is both prefix-stripped and walked', () => {
    // The prefix strip and the qualifier walk share one charge; charged apart, `fits` of them were
    // refused at twice their length.
    const prefixed = formulaOf('_xlfn.IFS(Rates!A1>1,A2,1)');

    expect(prefixed).toHaveLength(100);
    expect(mapFormulas(prefixed, fits).data).toHaveLength(fits);

    const refusal = refusalOf(() => mapFormulas(prefixed, fits + 1));

    expect(isLimitError(refusal)).toBe(true);
    expect(refusal.message).toMatch(/rewrite to more than 10000 characters/);
  });

  it('should charge the boolean rewrite once, shared with the other walks', () => {
    // A formula spelling `TRUE` is walked by the rewrite; with a qualifier and a prefix as well it
    // is still one charge.
    const boolish = formulaOf('_xlfn.IFS(Rates!A1>1,TRUE,1)');

    expect(boolish).toHaveLength(100);
    expect(mapFormulas(boolish, fits).data).toHaveLength(fits);
    expect(isLimitError(refusalOf(() => mapFormulas(boolish, fits + 1)))).toBe(true);

    const plainBoolean = formulaOf('IF(TRUE,A1,2)');

    expect(isLimitError(refusalOf(() => mapFormulas(plainBoolean, fits + 1)))).toBe(true);
  });

  it('should import a header and qualified formulas within the budget live', () => {
    const result = mapFormulas(formulaOf('Rates!A1+A2'), fits, { header: true });

    expect(result.data).toHaveLength(fits);
    expect(result.data[0][0]).toBe(`=${formulaOf('Rates!A1+A1')}`);
    expect(result.formulas).toBeUndefined();
  });

  it('should not charge a formula no walk runs over', () => {
    const plain = formulaOf('A1');

    expect(mapFormulas(plain, fits * 3).data).toHaveLength(fits * 3);
  });
});

describe('mapWorkbook formula walk budget shared with the reader (review round 12)', () => {
  // A qualified formula is one the mapper walks, and so charges.
  const formula = formulaOf('Rates!A1');
  const fits = Math.floor(MAX_TRANSLATED_FORMULA_CHARS / 100);

  it('should start from what the reader spent translating shared formulas', () => {
    // The reader and the mapper each had the whole budget, so one import could spend it twice:
    // 17.4 s in the reader and about 12 s more in the mapper for one 12 kB file.
    const error = refusalOf(() => mapFormulas(formula, 1, { readerChars: MAX_TRANSLATED_FORMULA_CHARS - 50 }));

    expect(isLimitError(error)).toBe(true);
    expect(error.message).toMatch(/rewrite to more than/);
  });

  it('should still map a workbook whose two halves fit the budget together', () => {
    expect(refusalOf(() => mapFormulas(formula, fits - 10, { readerChars: 1000 }))).toBeNull();
  });
});
