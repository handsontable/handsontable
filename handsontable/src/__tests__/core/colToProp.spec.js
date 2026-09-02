describe('Core.colToProp', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return the property name for the provided column number', async() => {
    handsontable({
      data: [{
        id: 1,
        firstName: 'Tobias',
        lastName: 'Forge'
      }]
    });

    expect(colToProp(0)).toBe('id');
    expect(colToProp(1)).toBe('firstName');
    expect(colToProp(2)).toBe('lastName');
  });

  it('it should return the provided property name, when the user passes a property name as a column number', async() => {
    handsontable({
      data: [{
        id: 1,
        sort: true,
        length: 2
      }]
    });

    expect(colToProp('id')).toBe('id');
    expect(colToProp('sort')).toBe('sort');
    expect(colToProp('length')).toBe('length');
  });

  it('should return proper value after calling the function when columns was reorganized (data is array of arrays)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5)
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    expect(colToProp(0)).toBe(4);
    // Since #7031: an index past the last column names no column, so it resolves to `null`
    // rather than being handed back.
    expect(colToProp(10)).toBe(null);
  });

  it('should return proper value after calling the function when columns was reorganized (data is array of objects)', async() => {
    handsontable({
      data: [
        { id: 1, name: 'Ted', lastName: 'Right', date: '01/01/2015' },
        { id: 2, name: 'Frank', lastName: 'Honest', date: '01/01/15' },
        { id: 3, name: 'Joan', lastName: 'Well', date: '41/01/2015' },
        { id: 4, name: 'Sid', lastName: 'Strong', date: '01/51/2015' },
      ]
    });

    rowIndexMapper().setIndexesSequence([3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([3, 2, 1, 0]);

    expect(colToProp(0)).toBe('date');
    // Since #7031: an index past the last column names no column, so it resolves to `null`
    // rather than being handed back.
    expect(propToCol(10)).toBe(null);
  });

  it('should return `null` for an index that names no column', async() => {
    handsontable({
      data: createSpreadsheetData(2, 3),
    });

    expect(colToProp(3)).toBe(null);
    expect(colToProp(999)).toBe(null);
    expect(colToProp(-1)).toBe(null);
  });

  it('should return `null` for a column that is trimmed', async() => {
    const hot = handsontable({
      data: [
        { id: 1, name: 'Ted' },
        { id: 2, name: 'Frank' },
      ]
    });

    expect(colToProp(1)).toBe('name');

    const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('spec-trim', 'trimming');

    trimmingMap.setValueAtIndex(1, true);

    await render();

    // Only one column is left, so index 1 names nothing.
    expect(countCols()).toBe(1);
    expect(colToProp(1)).toBe(null);
  });

  it('should still hand back a non-integer argument unchanged', async() => {
    handsontable({
      data: createSpreadsheetData(2, 3),
    });

    // Unchanged by #7031, and `UndoRedo`'s row-removal action depends on the `null` case: it feeds
    // `colToProp` the result of `toVisualColumn`, then bails out when the answer is not an accessor.
    expect(colToProp(null)).toBe(null);
    expect(colToProp('name')).toBe('name');
  });

  it('should keep reporting the header sentinel to the `*ByProp` selection hooks', async() => {
    const seen = [];

    handsontable({
      data: createSpreadsheetData(2, 3),
      colHeaders: true,
      rowHeaders: true,
      afterSelectionByProp(row, prop, row2, prop2) {
        seen.push([row, prop, row2, prop2]);
      },
    });

    // A row selection starts at column `-1`, a header sentinel rather than an out-of-range index.
    // `colToProp(-1)` is `null` since #7031, so the hook must not route through it — every
    // consumer of these two hooks already reads `-1` here.
    await selectRows(0);

    expect(seen[seen.length - 1]).toEqual([0, -1, 0, 2]);

    seen.length = 0;

    await selectCell(0, 1);

    expect(seen[seen.length - 1]).toEqual([0, 1, 0, 1]);
  });

  it('should keep an unbound column unbound', async() => {
    handsontable({
      data: [['first', 'second']],
      columns: [{ data: 1 }, { data: null }],
    });

    // `{ data: null }` declares a column with no source binding — the sparkline recipe ships one.
    // `colToProp()` answers `null` for it, and that `null` means "no property", not "no column".
    // Substituting the index would bind the column to the source field column 0 already reads.
    expect(colToProp(1)).toBe(null);
    expect(getDataAtCell(0, 1)).toBe(null);

    await setDataAtCell(0, 1, 'CHANGED');

    expect(getDataAtCell(0, 0)).toBe('second');
    expect(getSourceDataAtRow(0)).toEqual(['first', 'second']);
  });
});
