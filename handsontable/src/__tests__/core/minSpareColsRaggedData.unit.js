import Handsontable from 'handsontable';

/**
 * The grid width comes from the first row, so a later row can be longer than the grid. The columns `minSpareCols`
 * and `minCols` append must only append to such a row, and never move a value it already holds (DEV-485).
 */
describe('Appending `minSpareCols` and `minCols` columns to a grid with rows of different length', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  /**
   * Creates a grid on the test container.
   *
   * @param {object} settings The grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  /**
   * Returns the source row without the trailing `null` values the grid appended.
   *
   * @param {number} row The physical row.
   * @returns {Array}
   */
  function getRowWithoutTrailingNulls(row) {
    const values = hot.getSourceDataAtRow(row).slice();

    while (values.length > 0 && values[values.length - 1] === null) {
      values.pop();
    }

    return values;
  }

  it('should keep the values of a longer row in place when `minSpareCols` adds columns', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minSpareCols: 2,
    });

    expect(getRowWithoutTrailingNulls(1)).toEqual(['alpha', 'beta', 'cookie', 'delta']);
  });

  it('should keep the values of a longer row in place after an edit makes `minSpareCols` add more columns', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minSpareCols: 2,
    });

    hot.setDataAtCell(0, hot.countCols() - 1, 'x');

    expect(getRowWithoutTrailingNulls(1)).toEqual(['alpha', 'beta', 'cookie', 'delta']);
    expect(getRowWithoutTrailingNulls(0)).toContain('x');
  });

  it('should keep the values of a longer row in place when `minCols` adds columns', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minCols: 4,
    });

    expect(getRowWithoutTrailingNulls(1)).toEqual(['alpha', 'beta', 'cookie', 'delta']);
  });

  it('should keep the values of a longer row in place when `minSpareCols` adds several columns at once', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minSpareCols: 3,
    });

    expect(getRowWithoutTrailingNulls(1)).toEqual(['alpha', 'beta', 'cookie', 'delta']);
  });

  it('should bring back a longer row when an explicit insert at the end of the grid is undone', () => {
    createGrid({
      data: [['a'], ['b', 'c', 'd']],
      undo: true,
    });

    const before = JSON.parse(JSON.stringify(hot.getSourceData()));

    hot.alter('insert_col_end', 0, 2);
    hot.getPlugin('undoRedo').undo();

    expect(hot.getSourceData()).toEqual(before);
  });

  it('should still insert into the middle of a longer row when a column is created before the last one', () => {
    createGrid({
      data: [['first', 'second'], ['alpha', 'beta', 'cookie', 'delta']],
    });

    hot.alter('insert_col_start', 1, 2);

    expect(hot.getSourceDataAtRow(0)).toEqual(['first', null, null, 'second']);
    expect(hot.getSourceDataAtRow(1)).toEqual(['alpha', null, null, 'beta', 'cookie', 'delta']);
  });

  it('should keep all the values of a longer row when `minSpareCols` is lowered', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minSpareCols: 2,
    });

    hot.updateSettings({ minSpareCols: 0 });

    expect(getRowWithoutTrailingNulls(1)).toEqual(['alpha', 'beta', 'cookie', 'delta']);
  });

  it('should restore the source data after undoing and redoing an edit that made `minSpareCols` add columns', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minSpareCols: 2,
      undo: true,
    });

    const before = JSON.parse(JSON.stringify(hot.getSourceData()));

    hot.setDataAtCell(0, 0, 'changed');

    const after = JSON.parse(JSON.stringify(hot.getSourceData()));

    hot.getPlugin('undoRedo').undo();

    expect(hot.getSourceData()).toEqual(before);

    hot.getPlugin('undoRedo').redo();

    expect(hot.getSourceData()).toEqual(after);
  });
});
