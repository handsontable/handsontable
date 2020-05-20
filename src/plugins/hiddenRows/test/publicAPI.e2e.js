describe('HiddenRows', () => {
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

  describe('public API', () => {
    it('should hide row after calling the hiderow method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        hiddenRows: true,
      });

      expect(getCell(1, 0).innerText).toBe('A2');

      getPlugin('hiddenRows').hideRow(1);
      render();

      expect(getCell(1, 0)).toBe(null);
    });

    it('should show row after calling the showrow method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        hiddenRows: {
          rows: [1],
        },
      });

      expect(getCell(1, 0)).toBe(null);

      getPlugin('hiddenRows').showRow(1);
      render();

      expect(getCell(1, 0).innerText).toBe('A2');
    });
  });
});
