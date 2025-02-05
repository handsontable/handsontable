describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('modifyRowHeightByOverlayName', () => {
    it('should be possible to change the row height of the specific overlay only', () => {
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

      // master table
      expect(getCell(0, 0).clientHeight).forThemes(({ classic, main }) => {
        classic.toBe(22);
        main.toBe(28);
      });
      expect(getCell(1, 0).clientHeight).forThemes(({ classic, main }) => {
        classic.toBe(22);
        main.toBe(28);
      });
      expect(getCell(2, 0).clientHeight).forThemes(({ classic, main }) => {
        classic.toBe(22);
        main.toBe(28);
      });
      expect(getCell(3, 0).clientHeight).forThemes(({ classic, main }) => {
        classic.toBe(22);
        main.toBe(28);
      });
      expect(getCell(4, 0).clientHeight).forThemes(({ classic, main }) => {
        classic.toBe(22);
        main.toBe(28);
      });
      // top inline start corner
      expect(getCell(0, 0, true).clientHeight).forThemes(({ classic, main }) => {
        classic.toBe(29);
        main.toBe(28);
      });
      // top overlay
      expect(getCell(0, 2, true).clientHeight).forThemes(({ classic, main }) => {
        classic.toBe(34);
        main.toBe(33);
      });
      // inline start overlay
      expect(getCell(2, 0, true).clientHeight).toBe(39);
      // bottom inline start corner
      expect(getCell(3, 0, true).clientHeight).forThemes(({ classic, main }) => {
        classic.toBe(44);
        main.toBe(43);
      });
      // bottom overlay
      expect(getCell(4, 2, true).clientHeight).toBe(49);
    });
  });
});
