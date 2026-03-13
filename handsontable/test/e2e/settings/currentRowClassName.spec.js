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
    it('should apply currentRowClassName to cells in row where there is a selection', async() => {
      handsontable({
        data: createSpreadsheetData(5, 7),
        currentRowClassName: 'currentRowClassName'
      });

      await selectCell(2, 2);

      expect(spec().$container.find('td.currentRowClassName').length).toEqual(7);
    });

    it('should apply currentRowClassName from cells after deselection', async() => {
      handsontable({
        data: createSpreadsheetData(5, 7),
        currentRowClassName: 'currentRowClassName'
      });

      await selectCell(2, 2);
      await deselectCell();

      expect(spec().$container.find('td.currentRowClassName').length).toEqual(0);
    });

    it('should update currentRowClassName after updateSettings', async() => {
      handsontable({
        data: createSpreadsheetData(5, 7),
        currentRowClassName: 'initial-row-highlight'
      });

      await selectCell(2, 2);

      expect(spec().$container.find('td.initial-row-highlight').length).toEqual(7);
      expect(spec().$container.find('td.updated-row-highlight').length).toEqual(0);

      await updateSettings({
        currentRowClassName: 'updated-row-highlight'
      });

      expect(spec().$container.find('td.initial-row-highlight').length).toEqual(0);
      expect(spec().$container.find('td.updated-row-highlight').length).toEqual(7);
    });

    it('should remove currentRowClassName after updateSettings sets it to undefined', async() => {
      handsontable({
        data: createSpreadsheetData(5, 7),
        currentRowClassName: 'current-row-highlight'
      });

      await selectCell(2, 2);

      expect(spec().$container.find('td.current-row-highlight').length).toEqual(7);

      await updateSettings({
        currentRowClassName: undefined
      });

      expect(spec().$container.find('td.current-row-highlight').length).toEqual(0);
    });
  });

  describe('currentColClassName', () => {
    it('should apply currentColClassName to cells in row where there is a selection', async() => {
      handsontable({
        data: createSpreadsheetData(5, 7),
        currentColClassName: 'currentColClassName'
      });

      await selectCell(2, 2);

      expect(spec().$container.find('td.currentColClassName').length).toEqual(5);
    });

    it('should remove currentColClassName from cells after deselection', async() => {
      handsontable({
        data: createSpreadsheetData(5, 7),
        currentColClassName: 'currentColClassName'
      });

      await selectCell(2, 2);
      await deselectCell();

      expect(spec().$container.find('td.currentColClassName').length).toEqual(0);
    });
  });
});
