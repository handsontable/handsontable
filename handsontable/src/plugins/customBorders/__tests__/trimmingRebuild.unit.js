import Handsontable from '../../../index';

describe('CustomBorders after trimRow, untrimRow and filter', () => {
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
   * Rows holding their own index in column 0.
   *
   * @param {number} [count=10] The number of rows.
   * @param {number} [columns=2] The number of columns.
   * @returns {Array[]}
   */
  function rows(count = 10, columns = 2) {
    return Array.from({ length: count }, (_, row) => Array.from({ length: columns }, (__, col) => (
      col === 0 ? row : `r${row}c${col}`
    )));
  }

  /**
   * Waits for the microtasks the plugin registers to run.
   */
  async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
  }

  /**
   * The rows of the rendered custom border selections.
   *
   * @returns {number[]}
   */
  function renderedBorderRows() {
    return hot.selection.highlight.customSelections
      .map(selection => selection.cellRange?.from.row)
      .filter(row => row !== undefined);
  }

  it('should report a border at its record\'s new row right after trimRow', () => {
    hot = new Handsontable(container, {
      data: rows(),
      trimRows: true,
      customBorders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');

    borders.setBorders([[8, 0, 8, 0]], { top: { width: 2, color: '#FF0000' } });
    hot.getPlugin('trimRows').trimRow(0);

    expect(borders.getBorders().map(({ row }) => row)).toEqual([7]);
    expect(hot.getDataAtCell(7, 0)).toBe(8);
  });

  it('should render the border at its record\'s new row after trimRow, with no explicit render', async() => {
    hot = new Handsontable(container, {
      data: rows(),
      trimRows: true,
      customBorders: true,
      width: 400,
      height: 400,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('customBorders').setBorders([[8, 0, 8, 0]], { top: { width: 2, color: '#FF0000' } });

    expect(renderedBorderRows()).toEqual([8]);

    const renderSpy = jest.spyOn(hot, 'render');

    hot.getPlugin('trimRows').trimRow(0);
    await flushMicrotasks();

    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(renderedBorderRows()).toEqual([7]);
  });

  it('should rebuild the border model once for a burst of trimRow calls', async() => {
    const rowCount = 2000;

    hot = new Handsontable(container, {
      data: rows(rowCount, 5),
      trimRows: true,
      customBorders: true,
      width: 400,
      height: 400,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');
    const trimRows = hot.getPlugin('trimRows');

    borders.setBorders([[0, 0, rowCount - 1, 4]], { top: { width: 1, color: '#000' } });

    const walkSpy = jest.spyOn(hot._getMetaManager(), 'getUserDefinedCellMetas');

    for (let index = 0; index < 100; index++) {
      trimRows.trimRow(index);
    }

    expect(walkSpy).not.toHaveBeenCalled();

    const reported = borders.getBorders();

    expect(walkSpy).toHaveBeenCalledTimes(1);
    expect(reported.length).toBe((rowCount - 100) * 5);
    // The record holding 100 is now the first visual row.
    expect(hot.getDataAtCell(0, 0)).toBe(100);
    expect(reported.filter(({ row }) => row === 0).length).toBe(5);
    expect(reported.some(({ row }) => row >= rowCount - 100)).toBe(false);

    await flushMicrotasks();

    expect(walkSpy).toHaveBeenCalledTimes(1);
  });

  it('should rebuild the border model once, in the render, for a burst of untrimRow calls', async() => {
    hot = new Handsontable(container, {
      data: rows(),
      trimRows: [0, 1, 2],
      customBorders: true,
      width: 400,
      height: 400,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');
    const trimRows = hot.getPlugin('trimRows');

    // Visual row 5 is physical row 8.
    borders.setBorders([[5, 0, 5, 0]], { top: { width: 2, color: '#FF0000' } });

    const walkSpy = jest.spyOn(hot._getMetaManager(), 'getUserDefinedCellMetas');

    trimRows.untrimRow(0);
    trimRows.untrimRow(1);
    trimRows.untrimRow(2);

    expect(walkSpy).not.toHaveBeenCalled();

    await flushMicrotasks();

    expect(walkSpy).toHaveBeenCalledTimes(1);
    expect(renderedBorderRows()).toEqual([8]);
    expect(borders.getBorders().map(({ row }) => row)).toEqual([8]);
  });

  it('should shift a border once when a row is inserted right after a trim', () => {
    hot = new Handsontable(container, {
      data: rows(),
      trimRows: true,
      customBorders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');

    borders.setBorders([[8, 0, 8, 0]], { top: { width: 2, color: '#FF0000' } });
    hot.getPlugin('trimRows').trimRow(0);
    hot.alter('insert_row_above', 0);

    expect(borders.getBorders().map(({ row }) => row)).toEqual([8]);
    expect(hot.getDataAtCell(8, 0)).toBe(8);
    expect(hot.getCellMeta(8, 0).borders).toBeDefined();
  });

  it('should move a border with its record when setBorders runs right after a trim', () => {
    hot = new Handsontable(container, {
      data: rows(),
      trimRows: true,
      customBorders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');

    borders.setBorders([[8, 0, 8, 0]], { top: { width: 2, color: '#FF0000' } });
    hot.getPlugin('trimRows').trimRow(0);
    borders.setBorders([[2, 1, 2, 1]], { bottom: { width: 2, color: '#0000FF' } });

    expect(borders.getBorders().map(({ row, col }) => [row, col])).toEqual([[7, 0], [2, 1]]);
  });

  it('should report a border at its record\'s new row right after a filter', () => {
    hot = new Handsontable(container, {
      data: rows(),
      filters: true,
      customBorders: true,
      width: 400,
      height: 400,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');
    const filters = hot.getPlugin('filters');

    borders.setBorders([[8, 0, 8, 0]], { top: { width: 2, color: '#FF0000' } });
    filters.addCondition(0, 'gt', [1]);
    filters.filter();

    expect(borders.getBorders().map(({ row }) => row)).toEqual([6]);
    expect(renderedBorderRows()).toEqual([6]);
  });
});
