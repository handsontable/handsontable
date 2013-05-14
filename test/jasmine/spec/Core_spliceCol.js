describe('Core_spliceCol', function () {
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

  it('should remove data from specified col', function () {
    handsontable({
      data: arrayOfArrays()
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(spliceCol(1, 1, 2)).toEqual(['Kia', 10]);
      expect(getData(0, 1, 3, 1)).toEqual([[20],[30],[null],[null]]);
    });
  });

  it('should insert data into specified col', function () {
    handsontable({
      data: arrayOfArrays()
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(spliceCol(1, 1, 0, 'test', 'test', 'test')).toEqual([]);
      expect(getData(0, 1, 6, 1)).toEqual([['Kia'],[10],[20],[30],['test'],['test'],['test']]);
    });
  });

  it('should remove and insert data into specified col', function () {
    handsontable({
      data: arrayOfArrays()
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(spliceCol(1, 1, 2, 'test', 'test', 'test')).toEqual(['Kia', 10]);
      expect(getData(0, 1, 4, 1)).toEqual([[20],[30],['test'],['test'],['test']]);
    });
  });

});