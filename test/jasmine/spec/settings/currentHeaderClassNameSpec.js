describe('settings', function () {
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

  describe('currentHeaderClassName', function () {
    it('should apply default currentHeaderClassName to cells in row where there is a selection', function () {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: Handsontable.helper.createSpreadsheetData(5, 7),
      });

      selectCell(2, 2);

      expect(this.$container.find(".ht_master th.ht__highlight").length).toEqual(2);
    });

    it('should apply default currentHeaderClassName from cells after deselection', function () {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: Handsontable.helper.createSpreadsheetData(5, 7),
      });

      selectCell(2, 2);
      deselectCell();

      expect(this.$container.find(".ht_master th.ht__highlight").length).toEqual(0);
    });
    it('should apply custom currentHeaderClassName to cells in row where there is a selection', function () {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: Handsontable.helper.createSpreadsheetData(5, 7),
        currentHeaderClassName: "currentHeaderClassName"
      });

      selectCell(2, 2);

      expect(this.$container.find(".ht_master th.currentHeaderClassName").length).toEqual(2);
    });
  });
});
