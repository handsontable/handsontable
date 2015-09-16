describe('Core_getDataType', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  var arrayOfArrays = function () {
    return [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];
  };

  it('should return data type at specyfied range (default type)', function () {
    handsontable({
      data: arrayOfArrays()
    });

    expect(getDataType(0, 0)).toEqual('text');
    expect(getDataType(0, 0, 1, 1)).toEqual('text');
  });

  it('should return data type at specyfied range (type defined in columns)', function () {
    handsontable({
      data: arrayOfArrays(),
      columns: [
        {type: 'numeric'},
        {type: 'text'},
        {type: 'date'},
        {type: 'autocomplete'},
        {type: 'dropdown'},
      ]
    });

    expect(getDataType(0, 0)).toEqual('numeric');
    expect(getDataType(0, 0, 1, 1)).toEqual('mixed');
    expect(getDataType(0, 1, 1, 1)).toEqual('text');
    expect(getDataType(0, 2, 1, 2)).toEqual('date');
    expect(getDataType(3, 3, 3, 3)).toEqual('autocomplete');
    expect(getDataType(3, 4, 3, 4)).toEqual('dropdown');
  });

  it('should return data type at specyfied range (type defined in cells)', function () {
    handsontable({
      data: arrayOfArrays(),
      cells: function(row, column) {
        var cellMeta = {};

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
