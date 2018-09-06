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

  it('HTML special chars should be preserved in data map but escaped in DOM', () => {
    // https://github.com/handsontable/handsontable/issues/147
    handsontable();
    const td = setDataAtCell(0, 0, htmlText);
    selectCell(0, 0);

    $(td).simulate('dblclick');
    deselectCell();

    expect(getDataAtCell(0, 0)).toEqual(htmlText);
  });

  it('should correctly paste string that contains "quotes"', (done) => {
    // https://github.com/handsontable/handsontable/issues/205
    handsontable({});
    selectCell(0, 0);
    triggerPaste('1\nThis is a "test" and a test\n2');

    setTimeout(() => {
      expect(getDataAtCell(0, 0)).toEqual('1');
      expect(getDataAtCell(1, 0)).toEqual('This is a "test" and a test');
      expect(getDataAtCell(2, 0)).toEqual('2');
      done();
    }, 200);
  });

  it('should correctly paste string when dataSchema is used', (done) => {
    // https://github.com/handsontable/handsontable/issues/237
    handsontable({
      colHeaders: true,
      dataSchema: {
        col1: null,
        col2: null,
        col3: null
      }
    });
    selectCell(0, 0);
    triggerPaste('1\tTest\t2');

    setTimeout(() => {
      expect(getDataAtCell(0, 0)).toEqual('1');
      expect(getDataAtCell(0, 1)).toEqual('Test');
      expect(getDataAtCell(0, 2)).toEqual('2');
      done();
    }, 200);
  });

  it('should paste not more rows than maxRows', async() => {
    handsontable({
      minSpareRows: 1,
      minRows: 5,
      maxRows: 10,
    });
    selectCell(4, 0);
    triggerPaste('1\n2\n3\n4\n5\n6\n7\n8\n9\n10');

    await sleep(200);

    expect(countRows()).toEqual(10);
    expect(getDataAtCell(9, 0)).toEqual('6');
  });

  it('should paste not more cols than maxCols', (done) => {
    handsontable({
      minSpareCols: 1,
      minCols: 5,
      maxCols: 10,
    });
    selectCell(0, 4);
    triggerPaste('1\t2\t3\t4\t5\t6\t7\t8\t9\t10');

    setTimeout(() => {
      expect(countCols()).toEqual(10);
      expect(getDataAtCell(0, 9)).toEqual('6');
      done();
    }, 200);
  });

  it('should paste not more rows & cols than maxRows & maxCols', (done) => {
    handsontable({
      minSpareRows: 1,
      minSpareCols: 1,
      minRows: 5,
      minCols: 5,
      maxRows: 6,
      maxCols: 6,
    });
    selectCell(4, 4);
    triggerPaste('1\t2\t3\n4\t5\t6\n7\t8\t9');

    setTimeout(() => {
      expect(countRows()).toEqual(6);
      expect(countCols()).toEqual(6);
      expect(getDataAtCell(5, 5)).toEqual('5');
      done();
    }, 200);
  });

  // https://github.com/handsontable/handsontable/issues/250
  it('should create new rows when pasting into grid with object data source', (done) => {
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
    selectCell(3, 0);
    triggerPaste('a\tb\tc\nd\te\tf\ng\th\ti');

    setTimeout(() => {
      expect(countRows()).toEqual(7);
      expect(getDataAtCell(5, 2)).toEqual('i');
      done();
    }, 200);
  });

  // https://handsontable.com/demo/datasources.html
  it('should work with functional data source', () => {
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
    setDataAtCell(1, 1, 'Something Else');
    expect(getDataAtCell(1, 1)).toEqual('Something Else');
  });

  it('should accept changes array as 1st param and source as 2nd param', () => {
    let lastSource = '';

    handsontable({
      afterChange(changes, source) {
        lastSource = source;
      }
    });

    setDataAtCell([[0, 0, 'new value']], 'customSource');
    expect(getDataAtCell(0, 0)).toEqual('new value');
    expect(lastSource).toEqual('customSource');
  });

  it('should trigger `afterSetDataAtCell` hook with applied changes', () => {
    let _changes;
    let _source;

    handsontable({
      afterSetDataAtCell(changes, source) {
        _changes = changes;
        _source = source;
      }
    });

    setDataAtCell(0, 0, 'foo bar', 'customSource');

    expect(_changes).toEqual([[0, 0, null, 'foo bar']]);
    expect(_source).toBe('customSource');
    expect(getDataAtCell(0, 0)).toEqual('foo bar');
  });

  it('should modify value on the fly using `afterSetDataAtCell` hook', () => {
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

    setDataAtCell(0, 0, 'foo bar', 'customSource');
    setDataAtCell(1, 2, 22, 'customSource');

    expect(getDataAtCell(0, 0)).toBe('bar');
    expect(getDataAtCell(1, 2)).toBe(33);
    expect(getData()).toEqual([['bar', 'b', 'c'], [1, 2, 33]]);
  });

  it('should trigger `afterSetDataAtRowProp` hook with applied changes', () => {
    let _changes;
    let _source;

    handsontable({
      columns: [{ data: 'name' }, { data: 'id' }],
      afterSetDataAtRowProp(changes, source) {
        _changes = changes;
        _source = source;
      }
    });

    setDataAtRowProp(0, 'name', 'foo bar', 'customSource');

    expect(_changes).toEqual([[0, 'name', void 0, 'foo bar']]);
    expect(_source).toBe('customSource');
    expect(getDataAtCell(0, 0)).toBe('foo bar');
  });

  it('should modify value on the fly using `afterSetDataAtRowProp` hook', () => {
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

    setDataAtRowProp(0, 'name', 'foo bar', 'customSource');
    setDataAtRowProp(1, 'id', 22, 'customSource');

    expect(getDataAtRowProp(0, 'name')).toEqual('bar');
    expect(getDataAtRowProp(1, 'id')).toBe(33);
    expect(getData()).toEqual([['bar', 1], ['b', 33], ['c', 3]]);
  });
});
