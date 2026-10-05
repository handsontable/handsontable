import Handsontable from 'handsontable/base';

/**
 * A filler column appended after the last end column would take over the frozen position and slide the column
 * that held the data out of the band. `minCols` therefore creates no columns while `fixedColumnsEnd` is above 0.
 */
describe('`minCols` and the `fixedColumnsEnd` option', () => {
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
   * @param {object} settings The extra settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    core = new Handsontable(container, {
      data: [['a', 'b', 'c', 'Total'], ['d', 'e', 'f', 'Sum']],
      minCols: 4,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return core;
  }

  it('should refill the grid up to minCols after a column is removed (control)', () => {
    createGrid({ fixedColumnsEnd: 0 });

    core.alter('remove_col', 0);

    expect(core.countCols()).toBe(4);
    expect(core.getDataAtRow(0).slice(0, 3)).toEqual(['b', 'c', 'Total']);
  });

  it('should keep the last column in the end band when a column is removed', () => {
    createGrid({ fixedColumnsEnd: 1 });

    core.alter('remove_col', 0);

    expect(core.countCols()).toBe(3);
    expect(core.getDataAtRow(0)).toEqual(['b', 'c', 'Total']);
    expect(core.getSettings().fixedColumnsEnd).toBe(1);
  });

  it('should not append columns at initialization when the data has fewer columns than minCols', () => {
    createGrid({ fixedColumnsEnd: 1, minCols: 8 });

    expect(core.countCols()).toBe(4);
  });

  it.each([0.4, -1, -0.5, NaN, 'abc'])(
    'should fill the grid up to minCols when `fixedColumnsEnd` (%s) freezes no column',
    (fixedColumnsEnd) => {
      // The renderer floors the option, so these values draw no end columns and must not block the filler ones.
      createGrid({ fixedColumnsEnd, minCols: 8 });

      expect(core.countCols()).toBe(8);
    }
  );

  it('should resume filling the grid up to minCols once the end columns are released', () => {
    createGrid({ fixedColumnsEnd: 1, minCols: 8 });

    core.updateSettings({ fixedColumnsEnd: 0 });

    expect(core.countCols()).toBe(8);
  });
});
