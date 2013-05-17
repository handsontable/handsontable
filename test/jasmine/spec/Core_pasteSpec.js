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

 it('should shift data down instead of overwrite when paste', function () {
    handsontable({
      data: arrayOfArrays(),
      pasteMode: 'shift_down'
    });

    selectCell(1, 0); //selectAll
    triggerPaste('Kia\tNissan\tToyota');

    waits(30);

    runs(function () {
      expect(getData().length).toEqual(7);
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

    waits(30);

    runs(function () {
      expect(getData()[0].length).toEqual(8);
      expect(getData(1,0,1,7)).toEqual([["Kia", "Nissan", "Toyota", "2008", 10, 11, 12, 13]]);
    });

  });

});