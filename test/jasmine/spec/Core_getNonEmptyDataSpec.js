describe('Core_getNonEmptyData', function () {
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
  
  var nonEmptyData = function() {
    return [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13, 11]
    ];
  }
  
  var arrayOfArrays = function () {
    return [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13, ''],
      [null],
      [],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13, '', null]
      ['', '', null]
      []
    ];
  };

  it('should return data wihout trailing empty rows', function () {
    handsontable({
      data: arrayOfArrays()
    });

    expect(getNonEmptyData()).toEqual(nonEmptyData());
  });

});