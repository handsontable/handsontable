describe('Core.propToCol', () => {
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

  it('should return valid index for newly added column when manualColumnMove is enabled', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      manualColumnMove: true,
    });

    await alter('insert_col_start', 5);

    expect(propToCol(0)).toBe(0);
    expect(propToCol(10)).toBe(10);
  });

  it('should return proper value after calling the function when columns was reorganized (data is array of arrays)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5)
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    expect(propToCol(0)).toBe(4);
    // Since #7031: an index past the last column names no column, so it resolves to `null`
    // rather than being handed back.
    expect(propToCol(10)).toBe(null);
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

    expect(propToCol('id')).toBe(3);
    expect(propToCol(0)).toBe(3);
    // Since #7031: an index past the last column names no column, so it resolves to `null`
    // rather than being handed back.
    expect(propToCol(10)).toBe(null);
  });

  it('should return `null` for a column that is trimmed', async() => {
    const hot = handsontable({
      data: [
        { id: 1, name: 'Ted' },
        { id: 2, name: 'Frank' },
      ]
    });

    expect(propToCol('name')).toBe(1);

    const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('spec-trim', 'trimming');

    trimmingMap.setValueAtIndex(1, true);

    await render();

    // The column still exists in the source data, but it has no visual index to report. Before
    // #7031 the numeric form answered with the physical index, which named a different column.
    expect(propToCol('name')).toBe(null);
    expect(propToCol(1)).toBe(null);
  });

  it('should still hand back a property this data set does not use', async() => {
    handsontable({
      data: [{ id: 1, name: 'Ted' }],
    });

    // Unchanged by #7031 — only indexes resolve, and an unknown property is not one.
    expect(propToCol('notAColumn')).toBe('notAColumn');
  });

  it('should keep growing the grid when a change is addressed past the last column', async() => {
    // `applyChanges()` reads the bound from the prop itself rather than through `propToCol()`,
    // which now answers `null` for exactly this case. Auto column growth has to survive that.
    handsontable({
      data: [['a0', 'a1', 'a2'], ['b0', 'b1', 'b2']],
    });

    expect(countCols()).toBe(3);

    await setDataAtCell(0, 6, 'FAR');

    expect(countCols()).toBe(7);
    expect(getDataAtCell(0, 6)).toBe('FAR');
  });
});
