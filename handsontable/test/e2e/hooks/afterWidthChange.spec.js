describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('afterWidthChange', () => {
    it('should be fired once after table is initialized', async() => {
      const afterWidthChange = jasmine.createSpy('afterWidthChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        width: 100,
        afterWidthChange,
      });

      expect(afterWidthChange).toHaveBeenCalledTimes(1);
      expect(afterWidthChange).toHaveBeenCalledWith(100);
    });

    it('should not be fired if the width is not declared', async() => {
      const afterWidthChange = jasmine.createSpy('afterWidthChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterWidthChange,
      });

      expect(afterWidthChange).toHaveBeenCalledTimes(0);
    });

    it('should be fired after table width is changed', async() => {
      const afterWidthChange = jasmine.createSpy('afterWidthChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        width: 100,
        afterWidthChange,
      });

      afterWidthChange.calls.reset();

      await updateSettings({
        width: 200,
      });

      expect(afterWidthChange).toHaveBeenCalledTimes(1);
      expect(afterWidthChange).toHaveBeenCalledWith(200);
    });

    it('should be possible to modify the width of the table (width as a number)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        width: 100,
        height: 100,
        afterWidthChange(width) {
          return width + 15;
        },
      });

      expect(tableView().getViewportWidth()).toBe(115);
    });

    it('should be possible to modify the width of the table (width as a string)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        width: '100px',
        height: 100,
        afterWidthChange(width) {
          return `calc(${width} + 15px)`;
        },
      });

      expect(tableView().getViewportWidth()).toBe(115);
    });
  });
});
