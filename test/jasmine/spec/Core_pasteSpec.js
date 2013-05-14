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

 it('should insert instead of overwrite when paste', function () {
    handsontable({
      data: arrayOfArrays(),
      insertWhenPaste: true
    });
    selectCell(1, 0); //selectAll
    triggerPaste('Kia\tNissan\tToyota')

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(getData().length).toEqual(5);
      expect(getData(0,0,1,4)).toEqual([["", "Kia", "Nissan", "Toyota", "Honda"],["Kia", "Nissan", "Toyota", null, null]]);
    });
  });

});