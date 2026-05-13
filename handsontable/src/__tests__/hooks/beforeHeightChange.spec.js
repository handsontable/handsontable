describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('beforeHeightChange', () => {
    it('should be fired once after table is initialized', async() => {
      const beforeHeightChange = jasmine.createSpy('beforeHeightChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        height: 100,
        beforeHeightChange,
      });

      expect(beforeHeightChange).toHaveBeenCalledTimes(1);
      expect(beforeHeightChange).toHaveBeenCalledWith(100);
    });

    it('should not be fired if the height is not declared', async() => {
      const beforeHeightChange = jasmine.createSpy('beforeHeightChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        beforeHeightChange,
      });

      expect(beforeHeightChange).toHaveBeenCalledTimes(0);
    });

    it('should be fired before table height is changed', async() => {
      const beforeHeightChange = jasmine.createSpy('beforeHeightChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        height: 100,
        beforeHeightChange,
      });

      beforeHeightChange.calls.reset();

      await updateSettings({
        height: 200,
      });

      expect(beforeHeightChange).toHaveBeenCalledTimes(1);
      expect(beforeHeightChange).toHaveBeenCalledWith(200);
    });

    it('should be possible to modify the height of the table (height as a number)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        width: 100,
        height: 100,
        beforeHeightChange(height) {
          return height + 15;
        },
      });

      expect(tableView().getViewportHeight()).toBe(115);
    });

    it('should be possible to modify the height of the table (height as a string)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        width: 100,
        height: '100px',
        beforeHeightChange(height) {
          return `calc(${height} + 15px)`;
        },
      });

      expect(tableView().getViewportHeight()).toBe(115);
    });
  });
});
