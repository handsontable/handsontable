import Handsontable from 'handsontable/base';

/**
 * An explicit insert does not move the end band. `fixedColumnsEnd` counts the LAST columns, so a column inserted
 * inside the band or after it takes a band slot and the first band column leaves the band. It is the same as
 * `alter('insert_row_*')` with `fixedRowsBottom`, which does not move the bottom band either. The user raises
 * `fixedColumnsEnd` in `afterCreateCol` when the new column should stay outside the band.
 */
describe('alter("insert_col_*") and the `fixedColumnsEnd` option', () => {
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
   * Builds a grid of 5 columns and 5 rows with the given settings.
   *
   * @param {object} settings The settings to add.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    core = new Handsontable(container, {
      data: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (__, c) => `${r}-${c}`)),
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return core;
  }

  it('should keep the band size when a column is inserted after the last end column', () => {
    createGrid({ fixedColumnsEnd: 2 });

    core.alter('insert_col_end');

    expect(core.getSettings().fixedColumnsEnd).toBe(2);
    // The band is the last two columns now: the new empty one and the column that was the last.
    expect(core.getDataAtCol(core.countCols() - 1)).toEqual([null, null, null, null, null]);
    expect(core.getDataAtCol(core.countCols() - 2)).toEqual(['0-4', '1-4', '2-4', '3-4', '4-4']);
  });

  it('should keep the band size when a column is inserted inside the band', () => {
    createGrid({ fixedColumnsEnd: 2 });

    core.alter('insert_col_start', 4);

    expect(core.getSettings().fixedColumnsEnd).toBe(2);
  });

  it('should keep the band size when a column is inserted before the band', () => {
    createGrid({ fixedColumnsEnd: 2 });

    core.alter('insert_col_start', 1);

    expect(core.getSettings().fixedColumnsEnd).toBe(2);
  });

  it('should leave the bottom band alone for an insert after it, the precedent of the end band', () => {
    createGrid({ fixedRowsBottom: 2 });

    core.alter('insert_row_below');

    expect(core.getSettings().fixedRowsBottom).toBe(2);
  });

  it('should let the user raise the band in afterCreateCol to keep the same columns in the band', () => {
    createGrid({
      fixedColumnsEnd: 2,
      afterCreateCol(index, amount) {
        this.updateSettings({ fixedColumnsEnd: this.getSettings().fixedColumnsEnd + amount });
      },
    });

    core.alter('insert_col_end');

    expect(core.getSettings().fixedColumnsEnd).toBe(3);
  });
});
