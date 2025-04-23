describe('Core_setDataAtCell', () => {
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

  const arrayOfNestedObjects = function() {
    return [
      { id: 1,
        name: {
          first: 'Ted',
          last: 'Right'
        } },
      { id: 2,
        name: {
          first: 'Frank',
          last: 'Honest'
        } },
      { id: 3,
        name: {
          first: 'Joan',
          last: 'Well'
        } }
    ];
  };

  const htmlText = 'Ben & Jerry\'s';

  it('HTML special chars should be preserved in data map but escaped in DOM', async() => {
    // https://github.com/handsontable/handsontable/issues/147
    handsontable();

    const td = await setDataAtCell(0, 0, htmlText);

    await selectCell(0, 0);

    $(td).simulate('dblclick');
    await deselectCell();

    expect(getDataAtCell(0, 0)).toEqual(htmlText);
  });

  it('should correctly paste string that contains "quotes"', async() => {
    // https://github.com/handsontable/handsontable/issues/205
    handsontable({});

    await selectCell(0, 0);

    triggerPaste('1\nThis is a "test" and a test\n2');

    expect(getDataAtCell(0, 0)).toEqual('1');
    expect(getDataAtCell(1, 0)).toEqual('This is a "test" and a test');
    expect(getDataAtCell(2, 0)).toEqual('2');
  });

  it('should correctly paste string when dataSchema is used', async() => {
    // https://github.com/handsontable/handsontable/issues/237
    handsontable({
      colHeaders: true,
      dataSchema: {
        col1: null,
        col2: null,
        col3: null
      }
    });

    await selectCell(0, 0);

    triggerPaste('1\tTest\t2');

    expect(getDataAtCell(0, 0)).toEqual('1');
    expect(getDataAtCell(0, 1)).toEqual('Test');
    expect(getDataAtCell(0, 2)).toEqual('2');
  });

  it('should paste not more rows than maxRows', async() => {
    handsontable({
      minSpareRows: 1,
      minRows: 5,
      maxRows: 10,
    });

    await selectCell(4, 0);

    triggerPaste('1\n2\n3\n4\n5\n6\n7\n8\n9\n10');

    expect(countRows()).toEqual(10);
    expect(getDataAtCell(9, 0)).toEqual('6');
  });

  it('should paste not more cols than maxCols', async() => {
    handsontable({
      minSpareCols: 1,
      minCols: 5,
      maxCols: 10,
    });

    await selectCell(0, 4);

    triggerPaste('1\t2\t3\t4\t5\t6\t7\t8\t9\t10');

    expect(countCols()).toEqual(10);
    expect(getDataAtCell(0, 9)).toEqual('6');
  });

  it('should paste not more rows & cols than maxRows & maxCols', async() => {
    handsontable({
      minSpareRows: 1,
      minSpareCols: 1,
      minRows: 5,
      minCols: 5,
      maxRows: 6,
      maxCols: 6,
    });

    await selectCell(4, 4);

    triggerPaste('1\t2\t3\n4\t5\t6\n7\t8\t9');

    expect(countRows()).toEqual(6);
    expect(countCols()).toEqual(6);
    expect(getDataAtCell(5, 5)).toEqual('5');
  });

  // https://github.com/handsontable/handsontable/issues/250
  it('should create new rows when pasting into grid with object data source', async() => {
    handsontable({
      data: arrayOfNestedObjects(),
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name.last' },
        { data: 'name.first' }
      ],
      minSpareRows: 1,
    });

    await selectCell(3, 0);

    triggerPaste('a\tb\tc\nd\te\tf\ng\th\ti');

    expect(countRows()).toEqual(7);
    expect(getDataAtCell(5, 2)).toEqual('i');
  });

  // https://handsontable.com/demo/datasources.html
  it('should work with functional data source', async() => {
    handsontable({
      data: [
        model({ id: 1, name: 'Ted Right', address: '' }),
        model({ id: 2, name: 'Frank Honest', address: '' }),
        model({ id: 3, name: 'Joan Well', address: '' })
      ],
      dataSchema: model,
      startRows: 5,
      startCols: 3,
      colHeaders: ['ID', 'Name', 'Address'],
      columns: [
        { data: property('id') },
        { data: property('name') },
        { data: property('address') }
      ],
      minSpareRows: 1
    });

    function model(opts) {
      const _pub = {};
      const _priv = $.extend({
        id: undefined,
        name: undefined,
        address: undefined
      }, opts);

      _pub.attr = function(attr, val) {
        if (typeof val === 'undefined') {
          return _priv[attr];
        }
        _priv[attr] = val;

        return _pub;
      };

      return _pub;
    }

    function property(attr) {
      return function(row, value) {
        return row.attr(attr, value);
      };
    }

    expect(getDataAtCell(1, 1)).toEqual('Frank Honest');
    await setDataAtCell(1, 1, 'Something Else');
    expect(getDataAtCell(1, 1)).toEqual('Something Else');
  });

  it('should accept changes array as 1st param and source as 2nd param', async() => {
    let lastSource = '';

    handsontable({
      afterChange(changes, source) {
        lastSource = source;
      }
    });

    await setDataAtCell([[0, 0, 'new value']], 'customSource');
    expect(getDataAtCell(0, 0)).toEqual('new value');
    expect(lastSource).toEqual('customSource');
  });

  it('should trigger `afterSetDataAtCell` hook with applied changes', async() => {
    let _changes;
    let _source;

    handsontable({
      afterSetDataAtCell(changes, source) {
        _changes = changes;
        _source = source;
      }
    });

    await setDataAtCell(0, 0, 'foo bar', 'customSource');

    expect(_changes).toEqual([[0, 0, null, 'foo bar']]);
    expect(_source).toBe('customSource');
    expect(getDataAtCell(0, 0)).toEqual('foo bar');
  });

  it('should modify value on the fly using `afterSetDataAtCell` hook', async() => {
    handsontable({
      data: [['a', 'b', 'c'], [1, 2, 3]],
      afterSetDataAtCell(changes) {
        if (changes[0][3] === 'foo bar') {
          changes[0][3] = 'bar';
        }
        if (changes[0][3] === 22) {
          changes[0][3] = 33;
        }
      }
    });

    await setDataAtCell(0, 0, 'foo bar', 'customSource');
    await setDataAtCell(1, 2, 22, 'customSource');

    expect(getDataAtCell(0, 0)).toBe('bar');
    expect(getDataAtCell(1, 2)).toBe(33);
    expect(getData()).toEqual([['bar', 'b', 'c'], [1, 2, 33]]);
  });

  it('should trigger `afterSetDataAtRowProp` hook with applied changes', async() => {
    let _changes;
    let _source;

    handsontable({
      columns: [{ data: 'name' }, { data: 'id' }],
      afterSetDataAtRowProp(changes, source) {
        _changes = changes;
        _source = source;
      }
    });

    await setDataAtRowProp(0, 'name', 'foo bar', 'customSource');

    expect(_changes).toEqual([[0, 'name', undefined, 'foo bar']]);
    expect(_source).toBe('customSource');
    expect(getDataAtCell(0, 0)).toBe('foo bar');
  });

  it('should modify value on the fly using `afterSetDataAtRowProp` hook', async() => {
    handsontable({
      data: [{ name: 'a', id: 1 }, { name: 'b', id: 2 }, { name: 'c', id: 3 }],
      columns: [{ data: 'name' }, { data: 'id' }],
      afterSetDataAtRowProp(changes) {
        if (changes[0][3] === 'foo bar') {
          changes[0][3] = 'bar';
        }
        if (changes[0][3] === 22) {
          changes[0][3] = 33;
        }
      }
    });

    await setDataAtRowProp(0, 'name', 'foo bar', 'customSource');
    await setDataAtRowProp(1, 'id', 22, 'customSource');

    expect(getDataAtRowProp(0, 'name')).toEqual('bar');
    expect(getDataAtRowProp(1, 'id')).toBe(33);
    expect(getData()).toEqual([['bar', 1], ['b', 33], ['c', 3]]);
  });

  it('should not throw an error when trying set data after selection on cell read-only', async() => {
    let errors = 0;

    handsontable({
      data: [[1, 1]],
      readOnly: true
    });

    try {
      await selectCell(0, 0);

      await setDataAtCell(0, 0, '333');
    } catch (e) {
      errors += 1;
    }

    expect(errors).toBe(0);
  });

  it('should trigger `beforeChange` and `afterSetDataAtCell` in the correct order', async() => {
    const beforeChange = jasmine.createSpy('beforeChange');
    const afterSetDataAtCell = jasmine.createSpy('afterSetDataAtCell');

    handsontable({
      data: [[1, 1]],
      beforeChange,
      afterSetDataAtCell,
    });

    await setDataAtCell(0, 0, 5);

    expect(beforeChange).toHaveBeenCalledBefore(afterSetDataAtCell);
  });

  it('should trigger `beforeChange` and `afterSetDataAtRowProp` in the correct order', async() => {
    const beforeChange = jasmine.createSpy('beforeChange');
    const afterSetDataAtRowProp = jasmine.createSpy('afterSetDataAtRowProp');

    handsontable({
      data: [[1, 1]],
      beforeChange,
      afterSetDataAtRowProp,
    });

    await setDataAtRowProp(0, 0, 5);

    expect(beforeChange).toHaveBeenCalledBefore(afterSetDataAtRowProp);
  });

  it('should override set values using `beforeChange` hook', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
      ],
      beforeChange(changes) {
        changes[0][3] = 'test';
      }
    });

    await setDataAtCell(0, 0, 5);
    await setDataAtCell(1, 1, 6);
    await setDataAtCell(2, 2, 7);
    await setDataAtRowProp(3, 3, 8);
    await setDataAtRowProp(4, 4, 9);

    expect(getData()).toEqual([
      ['test', 2, 3, 4, 5, 6],
      [1, 'test', 3, 4, 5, 6],
      [1, 2, 'test', 4, 5, 6],
      [1, 2, 3, 'test', 5, 6],
      [1, 2, 3, 4, 'test', 6],
    ]);
  });

  describe('Coordinates out of dataset', () => {
    it('should insert new column', async() => {
      handsontable({
        data: createSpreadsheetData(1, 1)
      });

      await setDataAtCell([[0, 1, 'new column']], 'customSource');

      expect(countCols()).toBe(2);
    });

    it('should insert new row', async() => {
      handsontable({
        data: createSpreadsheetData(1, 1)
      });

      await setDataAtCell([[1, 0, 'new row']], 'customSource');

      expect(countRows()).toBe(2);
    });

    it('should not insert new column if `beforeCreateCol` returns false', async() => {
      handsontable({
        data: createSpreadsheetData(1, 1),
        beforeCreateCol() {
          return false;
        }
      });

      const countedColumns = countCols();

      await setDataAtCell([[0, 1, 'new column']], 'customSource');

      expect(countCols()).toBe(countedColumns);
    });

    it('should not insert new row if `beforeCreateRow` returns false', async() => {
      handsontable({
        data: createSpreadsheetData(1, 1),
        beforeCreateRow() {
          return false;
        }
      });

      const countedRows = countRows();

      await setDataAtCell([[1, 0, 'new row']], 'customSource');

      expect(countRows()).toBe(countedRows);
    });

    it('should work also when the `editor` option is set to `false`', async() => {
      handsontable({
        data: createSpreadsheetData(1, 1),
        editor: false,
      });

      await setDataAtCell(0, 0, 'aaa');

      expect(getData()).toEqual([['aaa']]);
    });
  });
});
