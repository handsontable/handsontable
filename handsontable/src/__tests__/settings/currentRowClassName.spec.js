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

    it('should apply a new currentRowClassName set via updateSettings', async() => {
      handsontable({
        data: createSpreadsheetData(5, 7),
        currentRowClassName: 'oldRowClass'
      });

      await selectCell(2, 2);

      expect(spec().$container.find('td.oldRowClass').length).toEqual(7);
      expect(spec().$container.find('td.newRowClass').length).toEqual(0);

      await updateSettings({ currentRowClassName: 'newRowClass' });

      await selectCell(2, 2);

      expect(spec().$container.find('td.oldRowClass').length).toEqual(0);
      expect(spec().$container.find('td.newRowClass').length).toEqual(7);
    });

    it('should remove the row highlight when currentRowClassName is unset via updateSettings', async() => {
      handsontable({
        data: createSpreadsheetData(5, 7),
        currentRowClassName: 'myRowClass'
      });

      await selectCell(2, 2);

      expect(spec().$container.find('td.myRowClass').length).toEqual(7);

      await updateSettings({ currentRowClassName: undefined });

      await selectCell(2, 2);

      expect(spec().$container.find('td.myRowClass').length).toEqual(0);
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

    it('should apply a new currentColClassName set via updateSettings', async() => {
      handsontable({
        data: createSpreadsheetData(5, 7),
        currentColClassName: 'oldColClass'
      });

      await selectCell(2, 2);

      expect(spec().$container.find('td.oldColClass').length).toEqual(5);
      expect(spec().$container.find('td.newColClass').length).toEqual(0);

      await updateSettings({ currentColClassName: 'newColClass' });

      await selectCell(2, 2);

      expect(spec().$container.find('td.oldColClass').length).toEqual(0);
      expect(spec().$container.find('td.newColClass').length).toEqual(5);
    });

    it('should remove the column highlight when currentColClassName is unset via updateSettings', async() => {
      handsontable({
        data: createSpreadsheetData(5, 7),
        currentColClassName: 'myColClass'
      });

      await selectCell(2, 2);

      expect(spec().$container.find('td.myColClass').length).toEqual(5);

      await updateSettings({ currentColClassName: undefined });

      await selectCell(2, 2);

      expect(spec().$container.find('td.myColClass').length).toEqual(0);
    });
  });
});
