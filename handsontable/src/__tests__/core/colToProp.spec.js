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
    expect(colToProp(10)).toBe(10); // I'm not sure if this should return result like that by design.
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
    // Was `propToCol(10)` — a copy of the propToCol spec that left `colToProp` out of range
    // untested. The pass-through below is by design (introduced with the index mappers in #5945)
    // and is what the API reference documents.
    expect(colToProp(10)).toBe(10);
  });

  it('should hand an out-of-range column index back unchanged', async() => {
    handsontable({
      data: createSpreadsheetData(2, 3),
    });

    expect(colToProp(10)).toBe(10);
    expect(colToProp(-1)).toBe(-1);
  });

  it('should hand a non-integer argument back unchanged, `null` included', async() => {
    handsontable({
      data: createSpreadsheetData(2, 3),
    });

    // `UndoRedo`'s row-removal action relies on this echo: it feeds `colToProp` the result of
    // `toVisualColumn`, which is `null` for a trimmed column, and bails out on a non-accessor.
    expect(colToProp(null)).toBe(null);
    expect(colToProp('name')).toBe('name');
  });

  it('should return `null` for a column declared as `{ data: null }`', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      columns: [{ data: null }, { data: 1 }],
    });

    // A valid, in-range index that still resolves to `null` — so a `null` result does not mean
    // "no such column".
    expect(countCols()).toBe(2);
    expect(colToProp(0)).toBe(null);
  });
});
