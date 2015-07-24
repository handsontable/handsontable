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

  it('should set copyable text until copyRowsLimit is reached', function () {
    handsontable({
      data: arrayOfArrays(),
      copyRowsLimit: 2
    });

    selectCell(0, 0, countRows() - 1, countCols() - 1); //selectAll
    keyDownUp('ctrl');

    // should prepare 2 rows for copying
    expect($('textarea.copyPaste').val()).toEqual('\tKia\tNissan\tToyota\tHonda\n2008\t10\t11\t12\t13\n');
  });

  it('should set copyable text until copyColsLimit is reached', function () {
    handsontable({
      data: arrayOfArrays(),
      copyColsLimit: 2
    });

    selectCell(0, 0, countRows() - 1, countCols() - 1); //selectAll
    keyDownUp('ctrl');

    //should prepare 2 columns for copying
    expect($('textarea.copyPaste').val()).toEqual('\tKia\n2008\t10\n2009\t20\n2010\t30\n');
  });

  it('should call onCopyLimit callback when copy limit was reached', function () {
    var result;

    handsontable({
      data: arrayOfArrays(),
      copyRowsLimit: 2,
      copyColsLimit: 2,
      afterCopyLimit: function (selectedRowsCount, selectedColsCount, copyRowsLimit, copyColsLimit) {
        result = [selectedRowsCount, selectedColsCount, copyRowsLimit, copyColsLimit];
      }
    });

    selectCell(0, 0, countRows() - 1, countCols() - 1); //selectAll
    keyDownUp('ctrl');
    expect(result).toEqual([4, 5, 2, 2]);
  });

  it('ctrl+x should cut selected data', function () {
    var hot = handsontable({
      data: arrayOfArrays()
    });

    selectCell(0, 0, countRows() - 1, countCols() - 1); //selectAll
    keyDownUp('ctrl+x');
    waits(200);

    runs(function() {
      expect(hot.getDataAtCell(0, 0)).toEqual('');
      expect(hot.getDataAtCell(1, 1)).toEqual('');
      expect(hot.getDataAtCell(2, 2)).toEqual('');
    });
  });

  it('ctrl+v should paste copied data to selected range', function () {
    var hot = handsontable({
      data: arrayOfArrays()
    });
    $('textarea.copyPaste').val('\tKia\tNissan\tToyota\tHonda\n2008\t10\t11\t12\t13\n');

    selectCell(0, 0, countRows() - 1, countCols() - 1); //selectAll
    keyDownUp('ctrl+v');
    waits(200);

    runs(function() {
      expect(hot.getDataAtCell(0, 0)).toEqual('');
      expect(hot.getDataAtCell(0, 1)).toEqual('Kia');
      expect(hot.getDataAtCell(0, 2)).toEqual('Nissan');
      expect(hot.getDataAtCell(0, 3)).toEqual('Toyota');
      expect(hot.getDataAtCell(1, 0)).toEqual('2008');
      expect(hot.getDataAtCell(1, 1)).toEqual('10');
      expect(hot.getDataAtCell(1, 2)).toEqual('11');
      expect(hot.getDataAtCell(1, 3)).toEqual('12');
    });
  });
});
