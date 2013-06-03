describe('Core_paste', function () {
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

  it('should not create new rows or columns of minSpareRows and minSpareCols equal 0', function () {
    handsontable({
      data: arrayOfArrays(),
      pasteMode: 'shift_down'
    });

    selectCell(3, 4); //selectAll
    triggerPaste('Kia\tNissan\tToyota');

    waits(60);

    runs(function () {
      var expected = arrayOfArrays();
      expected[3][4] = "Kia";
      expect(getData()).toEqual(expected);
    });

  });

 it('should shift data down instead of overwrite when paste', function () {
    handsontable({
      data: arrayOfArrays(),
      pasteMode: 'shift_down'
    });

    selectCell(1, 0); //selectAll
    triggerPaste('Kia\tNissan\tToyota');

    waits(60);

    runs(function () {
      expect(getData().length).toEqual(4);
      expect(getData(0,0,2,4)).toEqual([["", "Kia", "Nissan", "Toyota", "Honda"],["Kia", "Nissan", "Toyota", 12, 13], ["2008", 10, 11, 14, 13]]);
    });

  });

 it('should shift data down instead of overwrite when paste (minSpareRows > 0)', function () {
    handsontable({
      data: arrayOfArrays(),
      pasteMode: 'shift_down',
      minSpareRows: 1
    });

    selectCell(1, 0); //selectAll
    triggerPaste('Kia\tNissan\tToyota');

    waits(60);

    runs(function () {
      expect(getData().length).toEqual(6);
      expect(getData(0,0,2,4)).toEqual([["", "Kia", "Nissan", "Toyota", "Honda"],["Kia", "Nissan", "Toyota", 12, 13], ["2008", 10, 11, 14, 13]]);
    });

  });

  it('should shift right insert instead of overwrite when paste', function () {
    handsontable({
      data: arrayOfArrays(),
      pasteMode: 'shift_right'
    });

    selectCell(1, 0); //selectAll
    triggerPaste('Kia\tNissan\tToyota');

    waits(60);

    runs(function () {
      expect(getData()[0].length).toEqual(5);
      expect(getDataAtRow(1)).toEqual(["Kia", "Nissan", "Toyota", "2008", 10]);
    });

  });

  it('should shift right insert instead of overwrite when paste (minSpareCols > 0)', function () {
    handsontable({
      data: arrayOfArrays(),
      pasteMode: 'shift_right',
      minSpareCols: 1
    });

    selectCell(1, 0); //selectAll
    triggerPaste('Kia\tNissan\tToyota');

    waits(60);

    runs(function () {
      expect(getData()[0].length).toEqual(9);
      expect(getDataAtRow(1)).toEqual(["Kia", "Nissan", "Toyota", "2008", 10, 11, 12, 13, null]);
    });

  });

});