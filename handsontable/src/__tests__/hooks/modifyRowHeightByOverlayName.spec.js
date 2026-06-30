describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('modifyRowHeightByOverlayName', () => {
    it('should be possible to change the row height of the specific overlay only', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        width: 400,
        height: 400,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        modifyRowHeightByOverlayName(height, row, overlayType) {
          if (row === 0 && overlayType === 'top_inline_start_corner') {
            height = 30;

          } else if (row === 0 && overlayType === 'top') {
            height = 35;

          } else if (row === 2 && overlayType === 'inline_start') {
            height = 40;

          } else if (row === 3 && overlayType === 'bottom_inline_start_corner') {
            height = 45;

          } else if (row === 4 && overlayType === 'bottom') {
            height = 50;
          }

          return height;
        },
      });

      const layout = getThemeLayout();

      // master table
      expect(getCell(0, 0).clientHeight).toBe(layout.cellContentHeight);
      expect(getCell(1, 0).clientHeight).toBe(layout.cellContentHeight);
      expect(getCell(2, 0).clientHeight).toBe(layout.cellContentHeight);
      expect(getCell(3, 0).clientHeight).toBe(layout.cellContentHeight);
      expect(getCell(4, 0).clientHeight).toBe(layout.cellContentHeight);
      // top inline start corner (row 0, first rendered row, hook returns 30)
      expect(getCell(0, 0, true).clientHeight)
        .toBe(Math.max(30 - (2 * layout.cellBorderWidth), layout.cellContentHeight));
      // top overlay (row 0, first rendered row, hook returns 35)
      expect(getCell(0, 2, true).clientHeight)
        .toBe(Math.max(35 - (2 * layout.cellBorderWidth), layout.cellContentHeight));
      // inline start overlay (row 2, hook returns 40)
      expect(getCell(2, 0, true).clientHeight)
        .toBe(Math.max(40 - layout.cellBorderWidth, layout.cellContentHeight));
      // bottom inline start corner (row 3, first rendered row, hook returns 45)
      expect(getCell(3, 0, true).clientHeight)
        .toBe(Math.max(45 - (2 * layout.cellBorderWidth), layout.cellContentHeight));
      // bottom overlay (row 4, not first rendered row, hook returns 50)
      expect(getCell(4, 2, true).clientHeight)
        .toBe(Math.max(50 - layout.cellBorderWidth, layout.cellContentHeight));
    });
  });
});
