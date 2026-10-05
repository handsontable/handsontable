import Handsontable from 'handsontable/base';

/**
 * `alter('remove_col')` lowers `fixedColumnsEnd` by the number of removed columns that belonged to the
 * end band, the way `alter('remove_row')` lowers `fixedRowsBottom`. The end band is the LAST columns of the
 * grid, so the boundary is compared with the column count from before the removal.
 */
describe('alter("remove_col") and the `fixedColumnsEnd` option', () => {
  let container;
  let core;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    core?.destroy();
    core = null;
    container.remove();
  });

  /**
   * Builds a grid of `startCols` columns with the given end band.
   *
   * @param {number} startCols The number of columns.
   * @param {number} fixedColumnsEnd The number of the end columns.
   * @returns {Handsontable}
   */
  function createGrid(startCols, fixedColumnsEnd) {
    core = new Handsontable(container, {
      startRows: 2,
      startCols,
      ...(fixedColumnsEnd === undefined ? {} : { fixedColumnsEnd }),
      licenseKey: 'non-commercial-and-evaluation',
    });

    return core;
  }

  it('should default to 0', () => {
    createGrid(4, undefined);

    expect(core.getSettings().fixedColumnsEnd).toBe(0);
  });

  it('should decrement the end band when a column of the band is removed', () => {
    createGrid(5, 2);

    core.alter('remove_col', 4, 1);

    expect(core.getSettings().fixedColumnsEnd).toBe(1);

    core.alter('remove_col', 3, 1);

    expect(core.getSettings().fixedColumnsEnd).toBe(0);
  });

  it('should not change the end band when the removed column is before it', () => {
    createGrid(5, 1);

    core.alter('remove_col', 3, 1);

    expect(core.getSettings().fixedColumnsEnd).toBe(1);
  });

  it('should not change the end band when a range of columns before it is removed', () => {
    createGrid(8, 2);

    core.alter('remove_col', 1, 3);

    expect(core.getSettings().fixedColumnsEnd).toBe(2);
  });

  it('should decrement the end band only by the number of removed band columns (a straddling range)', () => {
    createGrid(6, 3);

    // Removes columns 2 and 3 - only column 3 belongs to the end band (columns 3, 4 and 5).
    core.alter('remove_col', 2, 2);

    expect(core.getSettings().fixedColumnsEnd).toBe(2);
  });

  it('should decrement the end band by the whole band when a range covering it is removed', () => {
    createGrid(6, 2);

    // Removes columns 3, 4 and 5 - only columns 4 and 5 belong to the end band.
    core.alter('remove_col', 3, 3);

    expect(core.getSettings().fixedColumnsEnd).toBe(0);
  });

  it('should decrement the end band when the columns are removed from the end (no index)', () => {
    createGrid(6, 2);

    core.alter('remove_col', undefined, 2);

    expect(core.countCols()).toBe(4);
    expect(core.getSettings().fixedColumnsEnd).toBe(0);
  });

  it('should decrement the end band only by the band columns removed from the end (no index)', () => {
    createGrid(6, 1);

    // With no index passed the last three columns (3, 4 and 5) are removed - only column 5 is in the band.
    core.alter('remove_col', undefined, 3);

    expect(core.countCols()).toBe(3);
    expect(core.getSettings().fixedColumnsEnd).toBe(0);
  });

  it('should not touch `fixedColumnsStart` when an end column is removed', () => {
    core = new Handsontable(container, {
      startRows: 2,
      startCols: 6,
      fixedColumnsStart: 2,
      fixedColumnsEnd: 2,
      licenseKey: 'non-commercial-and-evaluation',
    });

    core.alter('remove_col', 5, 1);

    expect(core.getSettings().fixedColumnsStart).toBe(2);
    expect(core.getSettings().fixedColumnsEnd).toBe(1);
  });

  it('should count the band columns across several groups removed in one call', () => {
    createGrid(6, 3);

    // Groups [1, 1] and [4, 2]: column 1 is outside the band (3, 4 and 5), columns 4 and 5 are inside it.
    core.alter('remove_col', [[1, 1], [4, 2]]);

    expect(core.countCols()).toBe(3);
    expect(core.getSettings().fixedColumnsEnd).toBe(1);
  });

  it('should not change the end band when several groups removed in one call all sit before it', () => {
    createGrid(8, 2);

    core.alter('remove_col', [[0, 1], [3, 2]]);

    expect(core.countCols()).toBe(5);
    expect(core.getSettings().fixedColumnsEnd).toBe(2);
  });

  it('should drop the whole band when several groups removed in one call cover it', () => {
    createGrid(7, 3);

    core.alter('remove_col', [[4, 1], [5, 2]]);

    expect(core.countCols()).toBe(4);
    expect(core.getSettings().fixedColumnsEnd).toBe(0);
  });
});
