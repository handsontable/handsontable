import Handsontable from 'handsontable/base';

/**
 * A spare column appended after the last end column would take over the frozen position and unfreeze the column
 * that held the data. `minSpareCols` therefore creates no columns while `fixedColumnsEnd` is above 0.
 */
describe('`minSpareCols` and the `fixedColumnsEnd` option', () => {
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
      data: [['a', 'b', 'c'], ['d', 'e', 'f']],
      minSpareCols: 1,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return core;
  }

  it('should append a spare column when a column is not frozen at the end (control)', () => {
    createGrid({ fixedColumnsEnd: 0 });

    expect(core.countCols()).toBe(4);

    core.setDataAtCell(0, 3, 'x');

    expect(core.countCols()).toBe(5);
  });

  it('should not append spare columns when the grid is created with end columns', () => {
    createGrid({ fixedColumnsEnd: 1 });

    expect(core.countCols()).toBe(3);
  });

  it.each([0.4, -1, -0.5, NaN, 'abc'])(
    'should append a spare column when `fixedColumnsEnd` (%s) freezes no column',
    (fixedColumnsEnd) => {
      // The renderer floors the option, so these values draw no end columns and must not block the spare ones.
      createGrid({ fixedColumnsEnd });

      expect(core.countCols()).toBe(4);
    }
  );

  it('should still block the spare columns when `fixedColumnsEnd` is a fraction that floors to a band', () => {
    createGrid({ fixedColumnsEnd: 1.5 });

    expect(core.countCols()).toBe(3);
  });

  it('should keep the column count and the end band when data is written into the last end column', () => {
    createGrid({ fixedColumnsEnd: 1 });

    core.setDataAtCell(0, 2, 'x');

    expect(core.countCols()).toBe(3);
    expect(core.getSettings().fixedColumnsEnd).toBe(1);
  });

  it('should resume appending spare columns once the end columns are released', () => {
    createGrid({ fixedColumnsEnd: 1 });

    core.updateSettings({ fixedColumnsEnd: 0 });
    core.setDataAtCell(0, 2, 'x');

    expect(core.countCols()).toBeGreaterThan(3);
  });
});
