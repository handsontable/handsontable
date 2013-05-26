describe('Core_getDataAt*', function () {
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

  it('should return data at specyfied row', function () {
    handsontable({
      data: arrayOfArrays()
    });

    expect(getDataAtRow(0)).toEqual(["", "Kia", "Nissan", "Toyota", "Honda"]);
  });

  it('should return data at specyfied col', function () {
    handsontable({
      data: arrayOfArrays()
    });

    expect(getDataAtCol(1)).toEqual(["Kia", 10, 20, 30]);
  });
});