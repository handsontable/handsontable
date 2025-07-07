describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('afterHeightChange', () => {
    it('should be fired once after table is initialized', async() => {
      const afterHeightChange = jasmine.createSpy('afterHeightChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        height: 100,
        afterHeightChange,
      });

      expect(afterHeightChange).toHaveBeenCalledTimes(1);
      expect(afterHeightChange).toHaveBeenCalledWith(100);
    });

    it('should not be fired if the height is not declared', async() => {
      const afterHeightChange = jasmine.createSpy('afterHeightChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterHeightChange,
      });

      expect(afterHeightChange).toHaveBeenCalledTimes(0);
    });

    it('should be fired after table height is changed', async() => {
      const afterHeightChange = jasmine.createSpy('afterHeightChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        height: 100,
        afterHeightChange,
      });

      afterHeightChange.calls.reset();

      await updateSettings({
        height: 200,
      });

      expect(afterHeightChange).toHaveBeenCalledTimes(1);
      expect(afterHeightChange).toHaveBeenCalledWith(200);
    });

    it('should be possible to modify the height of the table (height as a number)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        width: 100,
        height: 100,
        afterHeightChange(height) {
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
        afterHeightChange(height) {
          return `calc(${height} + 15px)`;
        },
      });

      expect(tableView().getViewportHeight()).toBe(115);
    });
  });
});
