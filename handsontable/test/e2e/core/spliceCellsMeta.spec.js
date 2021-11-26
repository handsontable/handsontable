describe('Core.spliceCellsMeta', () => {
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

  it('should splice the cell meta array analogously to the native `splice` method', () => {
    handsontable({
      cell: [
        { row: 0, col: 1, myId: 1 },
        { row: 1, col: 1, myId: 2 },
        { row: 2, col: 1, myId: 3 },
        { row: 3, col: 1, myId: 4 },
        { row: 4, col: 1, myId: 5 },
      ]
    });

    let allMeta = getCellsMeta();

    expect(allMeta.length).toBe(25);

    spliceCellsMeta(3, 1);
    allMeta = getCellsMeta();

    expect(allMeta.length).toBe(25);

    let metaAtRow = getCellMetaAtRow(2);

    expect(metaAtRow[0].myId).toBe(3);

    metaAtRow = getCellMetaAtRow(3);

    expect(metaAtRow[0].myId).toBe(5);
  });

  it('should remove cell meta objects from the collection', () => {
    handsontable();

    getCellMeta(0, 1)._test = 'foo-0x1';
    getCellMeta(0, 10)._test = 'foo-0x10';
    getCellMeta(3, 1)._test = 'foo-3x1';
    getCellMeta(3, 10)._test = 'foo-3x10';

    spliceCellsMeta(1, 2);

    expect(getCellMeta(0, 1)._test).toBe('foo-0x1');
    expect(getCellMeta(0, 10)._test).toBe('foo-0x10');
    expect(getCellMeta(1, 1)._test).toBe('foo-3x1');
    expect(getCellMeta(1, 10)._test).toBe('foo-3x10');
    expect(getCellMeta(2, 1)._test).toBeUndefined();
    expect(getCellMeta(2, 10)._test).toBeUndefined();
  });

  it('should add new cell meta object to the collection', () => {
    handsontable();

    getCellMeta(0, 1)._test = 'foo-0x1';
    getCellMeta(0, 10)._test = 'foo-0x10';
    getCellMeta(3, 1)._test = 'foo-3x1';
    getCellMeta(3, 10)._test = 'foo-3x10';

    spliceCellsMeta(1, 2, [{ _test: 'a' }, { _test: 'b' }]);

    expect(getCellMeta(0, 1)._test).toBe('foo-0x1');
    expect(getCellMeta(0, 10)._test).toBe('foo-0x10');
    expect(getCellMeta(1, 0)._test).toBe('a');
    expect(getCellMeta(1, 1)._test).toBe('b');
    expect(getCellMeta(1, 2)._test).toBeUndefined();
    expect(getCellMeta(2, 1)._test).toBe('foo-3x1');
    expect(getCellMeta(2, 10)._test).toBe('foo-3x10');
    expect(getCellMeta(3, 1)._test).toBeUndefined();
    expect(getCellMeta(3, 10)._test).toBeUndefined();
  });

  it('should add new cell meta objects to the collection', () => {
    handsontable();

    getCellMeta(0, 1)._test = 'foo-0x1';
    getCellMeta(0, 10)._test = 'foo-0x10';
    getCellMeta(3, 1)._test = 'foo-3x1';
    getCellMeta(3, 10)._test = 'foo-3x10';

    spliceCellsMeta(1, 2, [{ _test: 'a' }, { _test: 'b' }],
      [{ _test: 'c' }, { _test: 'd' }], [{ _test: 'e' }, { _test: 'f' }]);

    expect(getCellMeta(0, 1)._test).toBe('foo-0x1');
    expect(getCellMeta(0, 10)._test).toBe('foo-0x10');
    expect(getCellMeta(1, 0)._test).toBe('a');
    expect(getCellMeta(1, 1)._test).toBe('b');
    expect(getCellMeta(2, 0)._test).toBe('c');
    expect(getCellMeta(2, 1)._test).toBe('d');
    expect(getCellMeta(3, 0)._test).toBe('e');
    expect(getCellMeta(3, 1)._test).toBe('f');
    expect(getCellMeta(4, 1)._test).toBe('foo-3x1');
    expect(getCellMeta(4, 10)._test).toBe('foo-3x10');
    expect(getCellMeta(5, 1)._test).toBeUndefined();
    expect(getCellMeta(5, 10)._test).toBeUndefined();
  });

  it('should throw an error when a new row meta collection is passed in an unexpected format', () => {
    handsontable();

    getCellMeta(0, 1)._test = 'foo-0x1';
    getCellMeta(0, 10)._test = 'foo-0x10';
    getCellMeta(3, 1)._test = 'foo-3x1';
    getCellMeta(3, 10)._test = 'foo-3x10';

    expect(() => {
      spliceCellsMeta(1, 2, { _test: 'a' }, { _test: 'b' });
    }).toThrowError('The 3rd argument (cellMetaRows) has to be passed as an array of cell meta objects array.');

    // After an error, nothing should be changed in the cell meta collection
    expect(getCellMeta(0, 1)._test).toBe('foo-0x1');
    expect(getCellMeta(0, 10)._test).toBe('foo-0x10');
    expect(getCellMeta(1, 0)._test).toBeUndefined();
    expect(getCellMeta(1, 1)._test).toBeUndefined();
    expect(getCellMeta(2, 0)._test).toBeUndefined();
    expect(getCellMeta(2, 1)._test).toBeUndefined();
    expect(getCellMeta(3, 1)._test).toBe('foo-3x1');
    expect(getCellMeta(3, 10)._test).toBe('foo-3x10');
    expect(getCellMeta(4, 1)._test).toBeUndefined();
    expect(getCellMeta(4, 10)._test).toBeUndefined();
  });
});
