describe('Core_getDataType', () => {
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

  const arrayOfArrays = function() {
    return [
      ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
      ['2008', 10, 11, 12, 13],
      ['2009', 20, 11, 14, 13],
      ['2010', 30, 15, 12, 13]
    ];
  };

  it('should return data type at specified range (default type)', () => {
    handsontable({
      data: arrayOfArrays()
    });

    expect(getDataType(0, 0)).toEqual('text');
    expect(getDataType(0, 0, 1, 1)).toEqual('text');
  });

  it('should iterate only for table cell range and ignore header coordinates (negative values)', () => {
    const hot = handsontable({
      data: arrayOfArrays()
    });

    spyOn(hot, 'getCellMeta').and.callThrough();

    expect(getDataType(-1, -2, 2, 2)).toEqual('text');
    expect(hot.getCellMeta.calls.count()).toBe(9);
    expect(hot.getCellMeta.calls.first().args).toEqual([0, 0]);
    expect(hot.getCellMeta.calls.mostRecent().args).toEqual([2, 2]);
  });

  it('should return data type at specified range (type defined in columns)', () => {
    handsontable({
      data: arrayOfArrays(),
      columns: [
        { type: 'numeric' },
        { type: 'text' },
        { type: 'date' },
        { type: 'autocomplete' },
        { type: 'dropdown' },
      ]
    });

    expect(getDataType(0, 0)).toEqual('numeric');
    expect(getDataType(0, 0, 1, 1)).toEqual('mixed');
    expect(getDataType(0, 1, 1, 1)).toEqual('text');
    expect(getDataType(0, 2, 1, 2)).toEqual('date');
    expect(getDataType(3, 3, 3, 3)).toEqual('autocomplete');
    expect(getDataType(3, 4, 3, 4)).toEqual('dropdown');
  });

  it('should return data type at specified range (type defined in columns) when columns is a function', () => {
    handsontable({
      data: arrayOfArrays(),
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.type = 'numeric';

        } else if (column === 1) {
          colMeta.type = 'text';

        } else if (column === 2) {
          colMeta.type = 'date';

        } else if (column === 3) {
          colMeta.type = 'autocomplete';

        } else if (column === 4) {
          colMeta.type = 'dropdown';

        } else {
          colMeta = null;
        }

        return colMeta;
      }
    });

    expect(getDataType(0, 0)).toEqual('numeric');
    expect(getDataType(0, 0, 1, 1)).toEqual('mixed');
    expect(getDataType(0, 1, 1, 1)).toEqual('text');
    expect(getDataType(0, 2, 1, 2)).toEqual('date');
    expect(getDataType(3, 3, 3, 3)).toEqual('autocomplete');
    expect(getDataType(3, 4, 3, 4)).toEqual('dropdown');
  });

  it('should return data type at specified range (type defined in cells)', () => {
    handsontable({
      data: arrayOfArrays(),
      cells(row, column) {
        const cellMeta = {};

        if (row === 1 && column === 1) {
          cellMeta.type = 'date';
        }
        if (column === 2) {
          cellMeta.type = 'checkbox';
        }

        return cellMeta;
      }
    });

    expect(getDataType(0, 0)).toEqual('text');
    expect(getDataType(1, 1)).toEqual('date');
    expect(getDataType(1, 2)).toEqual('checkbox');
    expect(getDataType(0, 0, 1, 1)).toEqual('mixed');
  });
});
