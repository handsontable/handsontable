describe('Core_copy', function () {
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

  it('should set copiable text until copyRowsLimit is reached', function () {
    handsontable({
      data: arrayOfArrays(),
      copyRowsLimit: 2
    });

    selectCell(0, 0, countRows() - 1, countCols() - 1); //selectAll
    keyDownUp('ctrl');
    expect($('textarea.copyPaste').val()).toEqual('\tKia\tNissan\tToyota\tHonda\n2008\t10\t11\t12\t13\n'); //should prepare 2 rows for copying
  });

  it('should set copiable text until copyColsLimit is reached', function () {
    handsontable({
      data: arrayOfArrays(),
      copyColsLimit: 2
    });

    selectCell(0, 0, countRows() - 1, countCols() - 1); //selectAll
    keyDownUp('ctrl');
    expect($('textarea.copyPaste').val()).toEqual('\tKia\n2008\t10\n2009\t20\n2010\t30\n'); //should prepare 2 columns for copying
  });

  it('should call onCopyLimit callback when copy limit was reached', function () {
    var result;

    handsontable({
      data: arrayOfArrays(),
      copyRowsLimit: 2,
      copyColsLimit: 2,
      onCopyLimit: function (selectedRowsCount, selectedColsCount, copyRowsLimit, copyColsLimit) {
        result = [selectedRowsCount, selectedColsCount, copyRowsLimit, copyColsLimit];
      }
    });

    selectCell(0, 0, countRows() - 1, countCols() - 1); //selectAll
    keyDownUp('ctrl');
    expect(result).toEqual([4, 5, 2, 2]);
  });
});