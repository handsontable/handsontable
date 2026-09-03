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
    // `applyChanges()` falls back to the prop when `propToCol()` answers `null`, which is exactly
    // what it does for an index past the last column. Auto column growth has to survive that.
    handsontable({
      data: [['a0', 'a1', 'a2'], ['b0', 'b1', 'b2']],
    });

    expect(countCols()).toBe(3);

    await setDataAtCell(0, 6, 'FAR');

    expect(countCols()).toBe(7);
    expect(getDataAtCell(0, 6)).toBe('FAR');
  });

  it('should not grow the grid when a trimmed column offsets the prop from the column count',
    async() => {
      // The prop is a *physical* index, drawn from a wider space than `countCols()` once a column
      // is trimmed. Comparing it against the count without translating it back grows columns
      // nobody asked for: here physical 4 is visual 3, the last existing column.
      const hot = handsontable({
        data: [['a0', 'a1', 'a2', 'a3', 'a4'], ['b0', 'b1', 'b2', 'b3', 'b4']],
      });

      const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('spec-trim', 'trimming');

      trimmingMap.setValueAtIndex(0, true);

      await render();

      expect(countCols()).toBe(4);

      await setDataAtCell(0, 3, 'EDGE');

      expect(countCols()).toBe(4);
      expect(getDataAtCell(0, 3)).toBe('EDGE');
    });

  it('should resolve a column whose declared property is `null`', async() => {
    handsontable({
      data: [['a0', 'a1']],
      columns: [{ data: null }, { data: 1 }],
    });

    // `{ data: null }` stores `null` as that column's property, so the property cache has to be
    // consulted before `null` is read as "no column".
    expect(propToCol(null)).toBe(0);
  });

  it('should report `null` to `modifyData` for a numeric property that names no column', async() => {
    const seenColumns = [];

    handsontable({
      data: [['a0', 'a1', 'a2']],
      modifyData(row, column) {
        seenColumns.push(column);
      },
    });

    seenColumns.length = 0;

    getDataAtRowProp(0, 99);

    expect(seenColumns).toEqual([null]);
  });

  it('should return `null` for a bare physical index whose column is trimmed (array data)',
    async() => {
      const hot = handsontable({
        data: [
          ['a0', 'a1', 'a2', 'a3'],
          ['b0', 'b1', 'b2', 'b3'],
        ]
      });

      const trimmingMap = hot.columnIndexMapper
        .createAndRegisterIndexMap('spec-trim-array', 'trimming');

      trimmingMap.setValueAtIndex(1, true);

      await render();

      expect(hot.toVisualColumn(1)).toBe(null);

      // Plain array data caches no properties, so this takes the uncached branch. It used to fall
      // back to the passed index, which addressed a DIFFERENT column — visual 1 is physical 2 here
      // — so the caller got a wrong answer rather than an unknown one. Tracked as DEV-2726 and
      // pinned as a known defect by #13325; both branches now answer `null`.
      expect(propToCol(1)).toBe(null);
      expect(hot.toPhysicalColumn(1)).toBe(2);
    });
});
