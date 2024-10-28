describe('settings', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('currentRowClassName', () => {
    it('should apply currentRowClassName to cells in row where there is a selection', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 7),
        currentRowClassName: 'currentRowClassName'
      });

      selectCell(2, 2);

      expect(spec().$container.find('td.currentRowClassName').length).toEqual(7);
    });

    it('should apply currentRowClassName from cells after deselection', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 7),
        currentRowClassName: 'currentRowClassName'
      });

      selectCell(2, 2);
      deselectCell();

      expect(spec().$container.find('td.currentRowClassName').length).toEqual(0);
    });
  });

  describe('currentColClassName', () => {
    it('should apply currentColClassName to cells in row where there is a selection', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 7),
        currentColClassName: 'currentColClassName'
      });

      selectCell(2, 2);

      expect(spec().$container.find('td.currentColClassName').length).toEqual(5);
    });

    it('should remove currentColClassName from cells after deselection', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 7),
        currentColClassName: 'currentColClassName'
      });

      selectCell(2, 2);
      deselectCell();

      expect(spec().$container.find('td.currentColClassName').length).toEqual(0);
    });
  });
});
