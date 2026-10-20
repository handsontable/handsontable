import Handsontable from '../../../index';

describe('CustomBorders#clearBorders with rows sorted or trimmed', () => {
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
   * Ten rows holding their own index in column 0.
   *
   * @returns {Array[]}
   */
  function rows() {
    return Array.from({ length: 10 }, (_, row) => [row, `r${row}`]);
  }

  /**
   * The physical rows that still carry `borders` meta.
   *
   * @returns {number[]}
   */
  function borderedPhysicalRows() {
    return hot._getMetaManager().getUserDefinedCellMetas()
      .filter(({ key }) => key === 'borders')
      .map(({ physicalRow }) => physicalRow);
  }

  it('should remove the meta of a border whose row a filter hid, after a sort moved it', () => {
    hot = new Handsontable(container, {
      data: rows(),
      filters: true,
      columnSorting: true,
      customBorders: true,
      undo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');
    const filters = hot.getPlugin('filters');

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    // Visual row 7 holds physical row 2 (value 2).
    borders.setBorders([[7, 0, 7, 0]], { top: { width: 2, color: '#FF0000' } });
    filters.addCondition(0, 'gt', [6]);
    filters.filter();
    borders.clearBorders();
    filters.clearConditions();
    filters.filter();

    expect(borders.getBorders()).toEqual([]);
    expect(borderedPhysicalRows()).toEqual([]);
    expect(hot.getCellMeta(7, 0).borders).toBeUndefined();
  });

  it('should not bring a cleared border back on an unrelated undo', () => {
    hot = new Handsontable(container, {
      data: rows(),
      filters: true,
      columnSorting: true,
      customBorders: true,
      undo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');
    const filters = hot.getPlugin('filters');

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    borders.setBorders([[7, 0, 7, 0]], { top: { width: 2, color: '#FF0000' } });
    filters.addCondition(0, 'gt', [6]);
    filters.filter();
    borders.clearBorders();
    filters.clearConditions();
    filters.filter();
    borders.setBorders([[0, 1, 0, 1]], { bottom: { width: 2, color: '#0000FF' } });
    hot.getPlugin('undoRedo').undo();

    expect(borders.getBorders()).toEqual([]);
    expect(borderedPhysicalRows()).toEqual([]);
  });

  it('should restore a border cleared from a trimmed row on undo of the clear', () => {
    hot = new Handsontable(container, {
      data: rows(),
      trimRows: [0, 1],
      customBorders: true,
      undo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');
    const trimRows = hot.getPlugin('trimRows');

    // Visual row 1 is physical row 3.
    borders.setBorders([[1, 0, 1, 0]], { top: { width: 2, color: '#FF0000' } });
    trimRows.trimRows([2, 3, 4]);
    borders.clearBorders();

    expect(borderedPhysicalRows()).toEqual([]);

    hot.getPlugin('undoRedo').undo();

    expect(borderedPhysicalRows()).toEqual([3]);
  });

  it('should paint a border restored by undo onto a filtered-out row once the filter is cleared', () => {
    hot = new Handsontable(container, {
      data: rows(),
      filters: true,
      customBorders: true,
      undo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');
    const filters = hot.getPlugin('filters');

    borders.setBorders([[8, 0, 8, 0]], { top: { width: 2, color: '#FF0000' } });
    filters.addCondition(0, 'lt', [3]);
    filters.filter();
    borders.clearBorders();
    hot.getPlugin('undoRedo').undo();
    filters.clearConditions();
    filters.filter();

    expect(hot.getCellMeta(8, 0).borders).toEqual(expect.objectContaining({
      top: expect.objectContaining({ width: 2, color: '#FF0000' }),
    }));
    expect(borders.getBorders().length).toBe(1);
    expect(borders.getBorders()[0]).toEqual(expect.objectContaining({ row: 8, col: 0 }));
  });

  it('should paint a border restored by undo onto a trimmed row once the row is untrimmed', () => {
    hot = new Handsontable(container, {
      data: rows(),
      trimRows: true,
      customBorders: true,
      undo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');
    const trimRows = hot.getPlugin('trimRows');

    borders.setBorders([[8, 0, 8, 0]], { top: { width: 2, color: '#FF0000' } });
    trimRows.trimRow(8);
    borders.clearBorders();
    hot.getPlugin('undoRedo').undo();
    trimRows.untrimAll();

    expect(borderedPhysicalRows()).toEqual([8]);
    expect(borders.getBorders().length).toBe(1);
    expect(borders.getBorders()[0]).toEqual(expect.objectContaining({ row: 8, col: 0 }));
  });

  it('should keep a border on its record across a filter, so a range clear of its new row clears it', () => {
    hot = new Handsontable(container, {
      data: rows(),
      filters: true,
      columnSorting: true,
      customBorders: true,
      undo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');
    const filters = hot.getPlugin('filters');

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    // Visual row 7 holds physical row 2 (value 2).
    borders.setBorders([[7, 0, 7, 0]], { top: { width: 2, color: '#FF0000' } });
    filters.addCondition(0, 'lt', [9]);
    filters.filter();

    // The value 9 is filtered out, so the record holding 2 moves up to visual row 6.
    expect(borders.getBorders().map(({ row }) => row)).toEqual([6]);

    borders.clearBorders([[6, 0, 6, 0]]);
    filters.clearConditions();
    filters.filter();

    expect(hot.getCellMeta(7, 0).borders).toBeUndefined();
    expect(borderedPhysicalRows()).toEqual([]);
    expect(borders.getBorders()).toEqual([]);
  });

  it('should clear the border of a row a lowered maxRows cut off, after a sort', () => {
    hot = new Handsontable(container, {
      data: rows(),
      columnSorting: true,
      customBorders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    // Visual row 8 is physical row 1.
    hot.getPlugin('customBorders').setBorders([[8, 0, 8, 0]], { top: { width: 2, color: '#FF0000' } });
    hot.updateSettings({ maxRows: 5 });
    hot.getPlugin('customBorders').clearBorders();

    expect(borderedPhysicalRows()).toEqual([]);
  });

  it('should clear the border of a column a lowered maxCols cut off, after a column move', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 3 }, (_, row) => Array.from({ length: 10 }, (__, col) => `${row}-${col}`)),
      manualColumnMove: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
      customBorders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    // Visual column 8 is physical column 1.
    hot.getPlugin('customBorders').setBorders([[0, 8, 0, 8]], { top: { width: 2, color: '#FF0000' } });
    hot.updateSettings({ maxCols: 5 });
    hot.getPlugin('customBorders').clearBorders();

    expect(hot._getMetaManager().getUserDefinedCellMetas()
      .filter(({ key }) => key === 'borders')
      .map(({ physicalColumn }) => physicalColumn)).toEqual([]);
  });

  it('should clear a border set under trimmed rows once more rows are trimmed', () => {
    hot = new Handsontable(container, {
      data: rows(),
      trimRows: [0, 1],
      customBorders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const borders = hot.getPlugin('customBorders');

    // Visual row 7 is physical row 9.
    borders.setBorders([[7, 0, 7, 0]], { top: { width: 2, color: '#FF0000' } });
    hot.getPlugin('trimRows').trimRows([0, 1, 2, 3, 4]);
    hot.updateSettings({ customBorders: [] });

    expect(borderedPhysicalRows()).toEqual([]);
    expect(borders.getBorders()).toEqual([]);
  });

  it('should keep a border whose removal a beforeRemoveCellMeta listener vetoed, in the model and the meta', () => {
    hot = new Handsontable(container, {
      data: rows(),
      customBorders: [{ row: 2, col: 0, top: { width: 2, color: '#FF0000' } }],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.addHook('beforeRemoveCellMeta', (row, column, key) => (key === 'borders' && row === 2 ? false : undefined));
    hot.getPlugin('customBorders').clearBorders();

    expect(borderedPhysicalRows()).toEqual([2]);
    expect(hot.getPlugin('customBorders').getBorders()).toEqual([
      expect.objectContaining({ row: 2, col: 0 }),
    ]);
  });
});
