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

  describe('currentHeaderClassName', () => {
    it('should apply default currentHeaderClassName to cells in row where there is a selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: createSpreadsheetData(5, 7),
      });

      await selectCell(2, 2);

      expect(spec().$container.find('.ht_master th.ht__highlight').length).toEqual(2);
    });

    it('should apply default currentHeaderClassName from cells after deselection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: createSpreadsheetData(5, 7),
      });

      await selectCell(2, 2);
      await deselectCell();

      expect(spec().$container.find('.ht_master th.ht__highlight').length).toEqual(0);
    });

    it('should apply custom currentHeaderClassName to cells in row where there is a selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: createSpreadsheetData(5, 7),
        currentHeaderClassName: 'currentHeaderClassName'
      });

      await selectCell(2, 2);

      expect(spec().$container.find('.ht_master th.currentHeaderClassName').length).toEqual(2);
    });
  });
});
