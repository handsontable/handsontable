import { planEngineWorkbook } from '../engineSheets';

/**
 * Builds a stand-in for the engine reads the plan makes.
 *
 * @param {object} sheets The serialized content of each sheet, by name, in engine order.
 * @returns {object}
 */
function fakeEngine(sheets) {
  const names = Object.keys(sheets);

  return {
    getSheetNames: () => names.slice(),
    getSheetId: (name) => {
      const index = names.findIndex(candidate => candidate.toLowerCase() === name.toLowerCase());

      return index === -1 ? undefined : index;
    },
    getSheetSerialized: id => sheets[names[id]],
  };
}

describe('planEngineWorkbook', () => {
  const plan = ({ sheets, formulas = {}, data, activeSheet, defaultName = 'Sheet1', excludedNames }) => {
    const engine = fakeEngine(sheets);

    return planEngineWorkbook({
      engine, formulas: { engine, ...formulas }, data, activeSheet, defaultName, excludedNames,
    });
  };
  const names = result => result.entries.map(entry => entry.name);

  it('lists one entry per engine sheet in engine order, bound by name', () => {
    const result = plan({ sheets: { A: [[1]], B: [['=A!A1']] } });

    expect(names(result)).toEqual(['A', 'B']);
    expect(result.entries[1].data).toEqual([['=A!A1']]);
    expect(result.entries[1].settings.formulas.sheetName).toBe('B');
    expect(result.openingIndex).toBe(0);
    expect(result.missingSheetName).toBeNull();
  });

  it('keeps the other grid-level formulas keys on every entry', () => {
    const result = plan({ sheets: { A: [[1]] }, formulas: { hyperlinks: false } });

    expect(result.entries[0].settings.formulas.hyperlinks).toBe(false);
  });

  it('pads uneven rows to the widest row without changing the engine output', () => {
    const rows = [[1], [1, 2, 3]];
    const result = plan({ sheets: { A: rows } });

    expect(result.entries[0].data).toEqual([[1, null, null], [1, 2, 3]]);
    expect(rows).toEqual([[1], [1, 2, 3]]);
  });

  it('gives an empty sheet no data', () => {
    expect(plan({ sheets: { A: [] } }).entries[0].data).toBeUndefined();
  });

  it('opens the `activeSheet` position without reordering', () => {
    const result = plan({ sheets: { A: [], B: [], C: [] }, activeSheet: 2 });

    expect(names(result)).toEqual(['A', 'B', 'C']);
    expect(result.openingIndex).toBe(2);
  });

  it('ignores an `activeSheet` out of range', () => {
    const result = plan({ sheets: { A: [], B: [] }, activeSheet: 5 });

    expect(names(result)).toEqual(['A', 'B']);
    expect(result.openingIndex).toBe(0);
  });

  it('opens the `sheetName` sheet in place, matching names without regard to case', () => {
    const result = plan({ sheets: { A: [], B: [] }, formulas: { sheetName: 'b' }, activeSheet: 0 });

    expect(names(result)).toEqual(['A', 'B']);
    expect(result.openingIndex).toBe(1);
  });

  it('reports a missing `sheetName` and opens the first entry', () => {
    const result = plan({ sheets: { A: [], B: [] }, formulas: { sheetName: 'Z' }, activeSheet: 1 });

    expect(names(result)).toEqual(['A', 'B']);
    expect(result.openingIndex).toBe(0);
    expect(result.missingSheetName).toBe('Z');
  });

  it('binds the data to an existing `sheetName` sheet in its engine position and opens it', () => {
    const data = [[9]];
    const result = plan({ sheets: { A: [[1]], B: [[2]], C: [[3]] }, formulas: { sheetName: 'b' }, data });

    expect(names(result)).toEqual(['A', 'B', 'C']);
    expect(result.openingIndex).toBe(1);
    expect(result.entries[1].data).toBe(data);
    expect(result.entries[1].settings.formulas.sheetName).toBe('B');
  });

  it('adds the data entry last for a missing `sheetName` and opens it', () => {
    const result = plan({ sheets: { A: [[1]] }, formulas: { sheetName: 'New' }, data: [[9]] });

    expect(names(result)).toEqual(['A', 'New']);
    expect(result.openingIndex).toBe(1);
    expect(result.missingSheetName).toBeNull();
  });

  it('names the data entry after a free default name without a `sheetName`, last', () => {
    const result = plan({ sheets: { sheet1: [[1]], 'Sheet1 (2)': [] }, data: [[9]] });

    expect(names(result)).toEqual(['sheet1', 'Sheet1 (2)', 'Sheet1 (3)']);
    expect(result.openingIndex).toBe(2);
    expect(result.entries[2].settings.formulas.sheetName).toBe('Sheet1 (3)');
  });

  it('leaves out the excluded sheets, matching names without regard to case', () => {
    const result = plan({ sheets: { A: [], Rates: [[1]], B: [] }, activeSheet: 1, excludedNames: ['rates'] });

    expect(names(result)).toEqual(['A', 'B']);
    expect(result.openingIndex).toBe(1);
  });

  it('names the data entry free of an excluded engine sheet', () => {
    const result = plan({ sheets: { Sheet1: [[1]], A: [] }, data: [[9]], excludedNames: ['Sheet1'] });

    expect(names(result)).toEqual(['A', 'Sheet1 (2)']);
  });

  it('reports a `sheetName` bound elsewhere and opens the first entry, without data', () => {
    const result = plan({
      sheets: { A: [], Rates: [[1]], B: [] },
      formulas: { sheetName: 'rates' },
      activeSheet: 1,
      excludedNames: ['Rates'],
    });

    expect(names(result)).toEqual(['A', 'B']);
    expect(result.openingIndex).toBe(0);
    expect(result.boundElsewhereSheetName).toBe('rates');
    expect(result.missingSheetName).toBeNull();
  });

  it('binds no entry to a `sheetName` bound elsewhere and opens the first entry, with data', () => {
    const result = plan({
      sheets: { A: [[1]], Rates: [[2]] }, formulas: { sheetName: 'Rates' }, data: [[9]], excludedNames: ['Rates'],
    });

    expect(names(result)).toEqual(['A']);
    expect(result.entries.map(entry => entry.settings.formulas.sheetName)).toEqual(['A']);
    expect(result.entries[0].data).toEqual([[1]]);
    expect(result.openingIndex).toBe(0);
    expect(result.boundElsewhereSheetName).toBe('Rates');
    expect(result.missingSheetName).toBeNull();
  });

  it('reports no sheet bound elsewhere for an engine sheet this grid may use', () => {
    expect(plan({ sheets: { A: [] } }).boundElsewhereSheetName).toBeNull();
  });
});
