describe('keyboard navigation', () => {
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

  describe('"Tab"', () => {
    it('should select the next cell when the editor is opened in full edit mode triggered by Enter', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        type: 'select',
      });

      selectCell(1, 1);
      keyDownUp('enter');
      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
    });

    it('should select the next cell when the editor is opened in fast edit mode triggered by Space', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        type: 'select',
      });

      selectCell(1, 1);
      keyDownUp('space');
      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
    });
  });

  describe('"Shift + Tab"', () => {
    it('should select the previous cell when the editor is opened in full edit mode triggered by Enter', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        type: 'select',
      });

      selectCell(1, 1);
      keyDownUp('enter');
      keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
    });

    it('should select the previous cell when the editor is opened in fast edit mode triggered by Space', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        type: 'select',
      });

      selectCell(1, 1);
      keyDownUp('space');
      keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
    });
  });
});
