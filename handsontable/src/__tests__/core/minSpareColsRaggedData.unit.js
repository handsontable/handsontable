import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

/**
 * The grid width comes from the first row, so a later row can be longer than the grid. The columns `minSpareCols`
 * and `minCols` add are inserted as a block at one position, so the values of a longer row keep their order and
 * undo and redo take out exactly the columns that were added (DEV-485).
 */
describe('Creating columns in a grid with rows of different length', () => {
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
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Returns a copy of the source data.
   *
   * @returns {Array}
   */
  function snapshot() {
    return JSON.parse(JSON.stringify(hot.getSourceData()));
  }

  /**
   * Returns the values of a source row without the `null` values the grid inserted.
   *
   * @param {number} row The physical row.
   * @returns {Array}
   */
  function getValues(row) {
    return hot.getSourceDataAtRow(row).filter(value => value !== null);
  }

  /**
   * Edits the last column, which makes `minSpareCols` add columns, then undoes and redoes the edit.
   *
   * @returns {{ before: Array, after: Array, undone: Array, redone: Array }}
   */
  function editLastColumnThenUndoAndRedo() {
    const undoRedo = hot.getPlugin('undoRedo');
    const before = snapshot();

    hot.setDataAtCell(0, hot.countCols() - 1, 'x');

    const after = snapshot();

    undoRedo.undo();

    const undone = snapshot();

    undoRedo.redo();

    return { before, after, undone, redone: snapshot() };
  }

  it('should keep the values of a longer row in order when `minSpareCols` adds columns', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minSpareCols: 2,
    });

    expect(hot.countCols()).toBe(3);
    expect(hot.getSourceDataAtRow(1)).toEqual(['alpha', null, null, 'beta', 'cookie', 'delta']);
  });

  it('should keep the values of a longer row in order after an edit makes `minSpareCols` add more columns', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minSpareCols: 2,
    });

    hot.setDataAtCell(0, hot.countCols() - 1, 'x');

    const row = hot.getSourceDataAtRow(1);

    expect(row.slice(row.indexOf('beta'))).toEqual(['beta', 'cookie', 'delta']);
    expect(getValues(1)).toEqual(['alpha', 'beta', 'cookie', 'delta']);
    expect(getValues(0)).toEqual(['first', 'x']);
  });

  it('should keep the values of a longer row in order when `minCols` adds columns', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minCols: 4,
    });

    expect(hot.countCols()).toBe(4);
    expect(hot.getSourceDataAtRow(1)).toEqual(['alpha', null, null, null, 'beta', 'cookie', 'delta']);
  });

  it('should keep the values of a longer row in order when `minSpareCols` adds several columns at once', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minSpareCols: 3,
    });

    expect(hot.countCols()).toBe(4);
    expect(hot.getSourceDataAtRow(1)).toEqual(['alpha', null, null, null, 'beta', 'cookie', 'delta']);
  });

  it('should keep the values of a longer row when `minSpareCols` is lowered', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minSpareCols: 2,
    });

    hot.updateSettings({ minSpareCols: 0 });

    expect(hot.getSourceDataAtRow(1)).toEqual(['alpha', 'beta', 'cookie', 'delta']);
  });

  it('should still insert into the middle of a longer row when a column is created before the last one', () => {
    createGrid({
      data: [['first', 'second'], ['alpha', 'beta', 'cookie', 'delta']],
    });

    hot.alter('insert_col_start', 1, 2);

    expect(hot.getSourceDataAtRow(0)).toEqual(['first', null, null, 'second']);
    expect(hot.getSourceDataAtRow(1)).toEqual(['alpha', null, null, 'beta', 'cookie', 'delta']);
  });

  it('should undo and redo an edit that made `minSpareCols` add columns to a grid with a trimmed longer row', () => {
    createGrid({
      data: [['a'], ['1', '2', '3', '4', '5', '6'], ['b']],
      minSpareCols: 2,
      trimRows: [1],
      undo: true,
    });

    const { before, after, undone, redone } = editLastColumnThenUndoAndRedo();

    expect(undone).toEqual(before);
    expect(redone).toEqual(after);
  });

  it('should undo and redo an edit that made `minSpareCols` add one column to a longer row', () => {
    createGrid({
      data: [['a', 'b'], ['1', '2', '3', '4', '5', '6']],
      minSpareCols: 1,
      undo: true,
    });

    const { before, after, undone, redone } = editLastColumnThenUndoAndRedo();

    expect(undone).toEqual(before);
    expect(redone).toEqual(after);
  });

  it('should undo and redo an edit that made `minSpareCols` add columns', () => {
    createGrid({
      data: [['first'], ['alpha', 'beta', 'cookie', 'delta']],
      minSpareCols: 2,
      undo: true,
    });

    const { before, after, undone, redone } = editLastColumnThenUndoAndRedo();

    expect(undone).toEqual(before);
    expect(redone).toEqual(after);
  });

  it('should undo and redo an `insert_col_end` made on the last column of a grid with a longer row', () => {
    createGrid({
      data: [['a'], ['b', 'c', 'd']],
      undo: true,
    });

    const undoRedo = hot.getPlugin('undoRedo');
    const before = snapshot();

    hot.alter('insert_col_end', 0, 2);

    const after = snapshot();

    expect(after[1]).toEqual(['b', null, null, 'c', 'd']);

    undoRedo.undo();

    expect(hot.getSourceData()).toEqual(before);

    undoRedo.redo();

    expect(hot.getSourceData()).toEqual(after);
  });

  it('should undo and redo an `insert_col_start` made at the last column of a grid with a longer row', () => {
    createGrid({
      data: [['a'], ['b', 'c', 'd']],
      undo: true,
    });

    const undoRedo = hot.getPlugin('undoRedo');
    const before = snapshot();

    hot.alter('insert_col_start', 1, 2);

    const after = snapshot();

    expect(after[1]).toEqual(['b', null, null, 'c', 'd']);

    undoRedo.undo();

    expect(hot.getSourceData()).toEqual(before);

    undoRedo.redo();

    expect(hot.getSourceData()).toEqual(after);
  });

  it('should add the spare column after the last column of a grid that `dataSchema` makes wider than the first row', () => {
    createGrid({
      data: [['A'], ['B', 'C']],
      dataSchema: [null, null],
      minSpareCols: 1,
    });

    expect(hot.countCols()).toBe(3);
    expect(hot.getSourceDataAtRow(1)).toEqual(['B', 'C', null]);
  });

  it('should undo and redo a column inserted at the end of a grid that `dataSchema` makes wider than the first row', () => {
    createGrid({
      data: [['A'], ['B', 'C']],
      dataSchema: [null, null],
      undo: true,
    });

    const undoRedo = hot.getPlugin('undoRedo');

    hot.alter('insert_col_start', hot.countCols(), 2);

    expect(hot.getSourceDataAtRow(1)).toEqual(['B', 'C', null, null]);

    undoRedo.undo();

    // A row shorter than the grid keeps the trailing `null` values it was padded with.
    expect(hot.getSourceDataAtRow(1)).toEqual(['B', 'C']);
    expect(getValues(0)).toEqual(['A']);

    undoRedo.redo();

    expect(hot.getSourceDataAtRow(1)).toEqual(['B', 'C', null, null]);
    expect(getValues(0)).toEqual(['A']);
  });

  it('should keep the values of a row shorter than the first row when columns are inserted and undone', () => {
    createGrid({
      data: [['a', 'b', 'c'], ['x']],
      undo: true,
    });

    hot.alter('insert_col_start', 3, 2);

    expect(getValues(1)).toEqual(['x']);

    hot.getPlugin('undoRedo').undo();

    expect(getValues(0)).toEqual(['a', 'b', 'c']);
    expect(getValues(1)).toEqual(['x']);
  });
});
