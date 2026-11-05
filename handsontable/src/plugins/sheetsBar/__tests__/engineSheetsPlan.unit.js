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
  const plan = ({ sheets, formulas = {}, data, activeSheet, defaultName = 'Sheet1' }) => {
    const engine = fakeEngine(sheets);

    return planEngineWorkbook({ engine, formulas: { engine, ...formulas }, data, activeSheet, defaultName });
  };
  const names = result => result.entries.map(entry => entry.name);

  it('lists one entry per engine sheet in engine order, bound by name', () => {
    const result = plan({ sheets: { A: [[1]], B: [['=A!A1']] } });

    expect(names(result)).toEqual(['A', 'B']);
    expect(result.entries[1].data).toEqual([['=A!A1']]);
    expect(result.entries[1].settings.formulas.sheetName).toBe('B');
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

  it('puts the `activeSheet` sheet first', () => {
    expect(names(plan({ sheets: { A: [], B: [], C: [] }, activeSheet: 2 }))).toEqual(['C', 'A', 'B']);
  });

  it('ignores an `activeSheet` out of range', () => {
    expect(names(plan({ sheets: { A: [], B: [] }, activeSheet: 5 }))).toEqual(['A', 'B']);
  });

  it('puts the `sheetName` sheet first, matching names without regard to case', () => {
    expect(names(plan({ sheets: { A: [], B: [] }, formulas: { sheetName: 'b' }, activeSheet: 0 })))
      .toEqual(['B', 'A']);
  });

  it('reports a missing `sheetName` and keeps the engine order', () => {
    const result = plan({ sheets: { A: [], B: [] }, formulas: { sheetName: 'Z' } });

    expect(names(result)).toEqual(['A', 'B']);
    expect(result.missingSheetName).toBe('Z');
  });

  it('makes the data the first entry, bound to an existing `sheetName` sheet it replaces', () => {
    const data = [[9]];
    const result = plan({ sheets: { A: [[1]], B: [[2]] }, formulas: { sheetName: 'b' }, data });

    expect(names(result)).toEqual(['B', 'A']);
    expect(result.entries[0].data).toBe(data);
    expect(result.entries[0].settings.formulas.sheetName).toBe('B');
  });

  it('binds the data to a missing `sheetName`', () => {
    const result = plan({ sheets: { A: [[1]] }, formulas: { sheetName: 'New' }, data: [[9]] });

    expect(names(result)).toEqual(['New', 'A']);
    expect(result.missingSheetName).toBeNull();
  });

  it('names the data entry after a free default name without a `sheetName`', () => {
    const result = plan({ sheets: { sheet1: [[1]], 'Sheet1 (2)': [] }, data: [[9]] });

    expect(names(result)).toEqual(['Sheet1 (3)', 'sheet1', 'Sheet1 (2)']);
    expect(result.entries[0].settings.formulas.sheetName).toBe('Sheet1 (3)');
  });
});
