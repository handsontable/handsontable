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
    // By design: an unmatched property comes straight back (introduced with the index mappers in
    // #5945, and `applyChanges()` depends on it to grow the grid past the last column).
    expect(propToCol(10)).toBe(10);
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
    // By design: an unmatched property comes straight back (introduced with the index mappers in
    // #5945, and `applyChanges()` depends on it to grow the grid past the last column).
    expect(propToCol(10)).toBe(10);
  });

  it('should return `null` for a property whose column is trimmed', async() => {
    const hot = handsontable({
      data: [
        { id: 1, name: 'Ted', lastName: 'Right' },
        { id: 2, name: 'Frank', lastName: 'Honest' },
      ]
    });

    expect(propToCol('name')).toBe(1);

    const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('spec-trim', 'trimming');

    trimmingMap.setValueAtIndex(1, true);

    await render();

    // A cached property resolves through `toVisualColumn()`, which has no visual index left to
    // return. So `null` is a real result here — the unmatched-property echo does not cover it, and
    // a `result < countCols()` guard would let this `null` through as column 0.
    expect(propToCol('name')).toBe(null);
  });
});
