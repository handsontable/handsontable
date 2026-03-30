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

      // master table: clientHeight = calcRowHeight(t) - 1 (excludes bottom border) = calcColHeaderHeight(t)
      expect(getCell(0, 0).clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(calcColHeaderHeight('classic'));
        main.toBe(calcColHeaderHeight('main'));
        horizon.toBe(calcColHeaderHeight('horizon'));
      });
      expect(getCell(1, 0).clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(calcColHeaderHeight('classic'));
        main.toBe(calcColHeaderHeight('main'));
        horizon.toBe(calcColHeaderHeight('horizon'));
      });
      expect(getCell(2, 0).clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(calcColHeaderHeight('classic'));
        main.toBe(calcColHeaderHeight('main'));
        horizon.toBe(calcColHeaderHeight('horizon'));
      });
      expect(getCell(3, 0).clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(calcColHeaderHeight('classic'));
        main.toBe(calcColHeaderHeight('main'));
        horizon.toBe(calcColHeaderHeight('horizon'));
      });
      expect(getCell(4, 0).clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(calcColHeaderHeight('classic'));
        main.toBe(calcColHeaderHeight('main'));
        horizon.toBe(calcColHeaderHeight('horizon'));
      });
      // top inline start corner: hook sets row 0 height=30; effective clientHeight = max(30, calcRowHeight(t)) - 2
      // TODO: verify formula — border accounting differs per overlay; horizon stays at its natural height
      expect(getCell(0, 0, true).clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(28);
        main.toBe(28);
        horizon.toBe(calcColHeaderHeight('horizon'));
      });
      // top overlay: hook sets row 0 height=35; effective clientHeight = max(35, calcRowHeight(t)) - 2
      // TODO: verify formula — horizon stays at its natural height since calcRowHeight('horizon') > 35
      expect(getCell(0, 2, true).clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(33);
        main.toBe(33);
        horizon.toBe(calcColHeaderHeight('horizon'));
      });
      // inline start overlay: hook sets row 2 height=40; clientHeight=40-1=39 (theme-invariant override)
      expect(getCell(2, 0, true).clientHeight).toBe(39);
      // bottom inline start corner: hook sets row 3 height=45; clientHeight=45-2=43 (theme-invariant, all themes < 45)
      expect(getCell(3, 0, true).clientHeight).forThemes(({ classic, main, horizon }) => {
        // TODO: verify formula — all themes have calcRowHeight(t) < 45, so hook value dominates: 45 - 2 = 43
        classic.toBe(43);
        main.toBe(43);
        horizon.toBe(43);
      });
      // bottom overlay: hook sets row 4 height=50; clientHeight=50-1=49 (theme-invariant override)
      expect(getCell(4, 2, true).clientHeight).toBe(49);
    });
  });
});
