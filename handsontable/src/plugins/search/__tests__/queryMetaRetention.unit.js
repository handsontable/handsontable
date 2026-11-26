import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

describe('Search: cell meta a query stores', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a 200 x 5 grid of `A1`-style values.
   *
   * @param {object} [settings] Settings merged over the defaults.
   * @returns {object} The Search plugin.
   */
  function buildGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(200, 5),
      search: true,
      autoRowSize: false,
      autoColumnSize: false,
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot.getPlugin('search');
  }

  /**
   * Returns the physical coordinates of every stored cell meta, as `row,col` strings.
   *
   * @returns {Set<string>}
   */
  function storedCells() {
    return new Set(hot.getCellsMeta().map(meta => `${meta.row},${meta.col}`));
  }

  /**
   * Returns the stored cells a query added: the matches that had no stored meta before.
   *
   * @param {Set<string>} before The stored cells before the query.
   * @param {object[]} results The query results.
   * @returns {string[]}
   */
  function expectedStoredAfter(before, results) {
    const added = results.map(({ row, col }) => `${row},${col}`).filter(cell => !before.has(cell));

    return [...before, ...added].sort();
  }

  it('should store cell meta for the matched cells only', () => {
    const plugin = buildGrid();
    const before = storedCells();

    const results = plugin.query('A15');

    // A15, A150 to A159.
    expect(results.length).toBe(11);
    expect([...storedCells()].sort()).toEqual(expectedStoredAfter(before, results));
  });

  it('should store cell meta for the matched cells only when a custom callback calls the default one', () => {
    const calls = [];
    const plugin = buildGrid();
    const defaultCallback = plugin.getCallback();

    plugin.setCallback((instance, row, col, data, testResult) => {
      calls.push([row, col, testResult]);
      defaultCallback(instance, row, col, data, testResult);
    });

    const before = storedCells();
    const results = plugin.query('B19');

    expect(results.length).toBe(11);
    expect(calls.length).toBe(200 * 5);
    expect([...storedCells()].sort()).toEqual(expectedStoredAfter(before, results));
    expect(hot.getCellMeta(190, 1).isSearchResult).toBe(true);
  });

  it('should call the callback for every cell, in row order, with the test result', () => {
    const calls = [];
    const plugin = buildGrid({
      data: Handsontable.helper.createSpreadsheetData(3, 2),
      search: { callback: (instance, row, col, data, testResult) => calls.push([row, col, data, testResult]) },
    });

    plugin.query('A2');

    expect(calls).toEqual([
      [0, 0, 'A1', false], [0, 1, 'B1', false],
      [1, 0, 'A2', true], [1, 1, 'B2', false],
      [2, 0, 'A3', false], [2, 1, 'B3', false],
    ]);
  });

  it('should read rows in visual order on a sorted grid', () => {
    const plugin = buildGrid({
      columnSorting: { initialConfig: { column: 0, sortOrder: 'desc' } },
    });

    const visualRow = hot.toVisualRow(199);
    const results = plugin.query('A200');

    expect(visualRow).not.toBe(199);
    expect(results).toEqual([{ row: visualRow, col: 0, data: 'A200' }]);
    expect(hot.getCellMeta(visualRow, 0).isSearchResult).toBe(true);
  });

  it('should read the values of every row block, across block boundaries', () => {
    const calls = [];
    const plugin = buildGrid({
      data: Handsontable.helper.createSpreadsheetData(2500, 2),
      search: { callback: (instance, row, col, data, testResult) => testResult && calls.push([row, col, data]) },
    });

    const results = plugin.query('A', undefined, (query, value) => ['A1000', 'A1001', 'A2000', 'A2001', 'A2500']
      .includes(value));

    expect(results).toEqual([
      { row: 999, col: 0, data: 'A1000' },
      { row: 1000, col: 0, data: 'A1001' },
      { row: 1999, col: 0, data: 'A2000' },
      { row: 2000, col: 0, data: 'A2001' },
      { row: 2499, col: 0, data: 'A2500' },
    ]);
    expect(calls).toEqual(results.map(({ row, col, data }) => [row, col, data]));
  });

  it('should test the values `getDataAtCell()` returns, `modifyData` included', () => {
    const plugin = buildGrid({
      data: Handsontable.helper.createSpreadsheetData(1200, 2),
      modifyData(row, col, valueHolder, ioMode) {
        if (ioMode === 'get' && col === 1 && row === 1100) {
          valueHolder.value = 'modified';
        }
      },
    });

    const results = plugin.query('modified');

    expect(results).toEqual([{ row: 1100, col: 1, data: 'modified' }]);
    expect(hot.getDataAtCell(1100, 1)).toBe('modified');
  });

  it('should use a column-level `search` override for that column only', () => {
    const columnQueryMethod = jest.fn(() => true);
    const columnCallback = jest.fn();
    const plugin = buildGrid({
      data: Handsontable.helper.createSpreadsheetData(3, 2),
      columns: [{}, { search: { queryMethod: columnQueryMethod, callback: columnCallback } }],
    });

    const results = plugin.query('A2');

    expect(results.map(({ row, col }) => [row, col])).toEqual([[0, 1], [1, 0], [1, 1], [2, 1]]);
    expect(columnQueryMethod).toHaveBeenCalledTimes(3);
    expect(columnCallback.mock.calls.map(([, row, col, , testResult]) => [row, col, testResult]))
      .toEqual([[0, 1, true], [1, 1, true], [2, 1, true]]);
    // The column's own callback replaces the default one, so the default flag is not set there.
    expect(hot.getCellMeta(1, 1).isSearchResult).toBeUndefined();
    expect(hot.getCellMeta(1, 0).isSearchResult).toBe(true);
  });

  it('should use a `cells` override for the cells it returns it for, and pass them the cell properties', () => {
    const cellQueryMethod = jest.fn((query, value, cellProperties) => cellProperties.locale === 'tr-TR');
    const cellCallback = jest.fn();
    const plugin = buildGrid({
      data: Handsontable.helper.createSpreadsheetData(3, 2),
      cells(row, col) {
        return row === 2 && col === 0 ?
          { locale: 'tr-TR', search: { queryMethod: cellQueryMethod, callback: cellCallback } } : {};
      },
    });

    const results = plugin.query('B1');

    expect(results.map(({ row, col }) => [row, col])).toEqual([[0, 1], [2, 0]]);
    expect(cellQueryMethod).toHaveBeenCalledTimes(1);
    expect(cellQueryMethod.mock.calls[0][2].locale).toBe('tr-TR');
    expect(cellCallback).toHaveBeenCalledWith(hot, 2, 0, 'A3', true);
    expect(hot.getCellMeta(0, 1).isSearchResult).toBe(true);
  });

  it('should use a `cells` override on a cell with no stored meta', () => {
    const cellQueryMethod = jest.fn((query, value, cellProperties) => cellProperties.locale === 'tr-TR');
    const plugin = buildGrid({
      cells(row, col) {
        return row === 150 && col === 2 ? { locale: 'tr-TR', search: { queryMethod: cellQueryMethod } } : {};
      },
    });

    expect(storedCells().has('150,2')).toBe(false);

    const results = plugin.query('no such value');

    expect(results).toEqual([{ row: 150, col: 2, data: 'C151' }]);
    expect(cellQueryMethod).toHaveBeenCalledTimes(1);
    expect(hot.getCellMeta(150, 2).isSearchResult).toBe(true);
  });

  it('should clear a previous match that the next query does not match', () => {
    const plugin = buildGrid();

    plugin.query('C170');

    const meta = hot.getCellMeta(169, 2);

    expect(meta.isSearchResult).toBe(true);
    expect(meta._persistedMetaProps.has('isSearchResult')).toBe(true);

    plugin.query('C171');

    expect(meta.isSearchResult).toBe(false);
    expect(meta._persistedMetaProps.has('isSearchResult')).toBe(false);
    expect(hot.getCellMeta(170, 2).isSearchResult).toBe(true);
  });

  it('should leave `isSearchResult` unset on a non-matching cell the query found with no stored meta', () => {
    const plugin = buildGrid();

    expect(storedCells().has('180,3')).toBe(false);

    plugin.query('A1');

    expect(storedCells().has('180,3')).toBe(false);
    expect(hot.getCellMeta(180, 3).isSearchResult).toBeUndefined();
  });

  it('should keep the results through a `search` settings update', () => {
    const plugin = buildGrid();

    plugin.query('E199');

    hot.updateSettings({ search: { searchResultClass: 'my-hit' } });

    expect(hot.getCellMeta(198, 4).isSearchResult).toBe(true);
  });
});
