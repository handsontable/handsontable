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

  describe('currentRowClassName', function () {
    it('should apply currentRowClassName to cells in row where there is a selection', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 7),
        currentRowClassName: "currentRowClassName"
      });

      selectCell(2, 2);

      expect(this.$container.find("td.currentRowClassName").length).toEqual(6);
    });

    it('should apply currentRowClassName from cells after deselection', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 7),
        currentRowClassName: "currentRowClassName"
      });

      selectCell(2, 2);
      deselectCell();

      expect(this.$container.find("td.currentRowClassName").length).toEqual(0);
    });
  });

  describe('currentColClassName', function () {
    it('should apply currentColClassName to cells in row where there is a selection', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 7),
        currentColClassName: "currentColClassName"
      });

      selectCell(2, 2);

      expect(this.$container.find("td.currentColClassName").length).toEqual(4);
    });

    it('should remove currentColClassName from cells after deselection', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 7),
        currentColClassName: "currentColClassName"
      });

      selectCell(2, 2);
      deselectCell();

      expect(this.$container.find("td.currentColClassName").length).toEqual(0);
    });
  });
});
