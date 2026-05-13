describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('beforeWidthChange', () => {
    it('should be fired once after table is initialized', async() => {
      const beforeWidthChange = jasmine.createSpy('beforeWidthChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        width: 100,
        beforeWidthChange,
      });

      expect(beforeWidthChange).toHaveBeenCalledTimes(1);
      expect(beforeWidthChange).toHaveBeenCalledWith(100);
    });

    it('should not be fired if the width is not declared', async() => {
      const beforeWidthChange = jasmine.createSpy('beforeWidthChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        beforeWidthChange,
      });

      expect(beforeWidthChange).toHaveBeenCalledTimes(0);
    });

    it('should be fired before table width is changed', async() => {
      const beforeWidthChange = jasmine.createSpy('beforeWidthChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        width: 100,
        beforeWidthChange,
      });

      beforeWidthChange.calls.reset();

      await updateSettings({
        width: 200,
      });

      expect(beforeWidthChange).toHaveBeenCalledTimes(1);
      expect(beforeWidthChange).toHaveBeenCalledWith(200);
    });

    it('should be possible to modify the width of the table (width as a number)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        width: 100,
        height: 100,
        beforeWidthChange(width) {
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
        beforeWidthChange(width) {
          return `calc(${width} + 15px)`;
        },
      });

      expect(tableView().getViewportWidth()).toBe(115);
    });
  });
});
