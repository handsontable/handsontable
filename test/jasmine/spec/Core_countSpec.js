describe('Core_count', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    destroy();
    this.$container.remove();
  });

  describe('countVisibleRows', function () {
    it('should return number of visible rows', function () {
      var instance = handsontable({
        data: createSpreadsheetData(10, 10),
        height: 100
      });
      expect(instance.countVisibleRows()).toEqual(5);
    });

    it('should return -1 if table is not rendered', function () {
      this.$container.remove();
      var instance = handsontable({
        data: createSpreadsheetData(10, 10),
        width: 100
      });
      expect(instance.countVisibleRows()).toEqual(-1);
    });
  });

  describe('countVisibleCols', function () {
    it('should return number of visible columns', function () {
      var instance = handsontable({
        data: createSpreadsheetData(10, 10),
        width: 100
      });
      expect(instance.countVisibleCols()).toEqual(2);
    });

    it('should return -1 if table is not rendered', function () {
      this.$container.remove();
      var instance = handsontable({
        data: createSpreadsheetData(10, 10),
        width: 100
      });
      expect(instance.countVisibleCols()).toEqual(-1);
    });
  });
});