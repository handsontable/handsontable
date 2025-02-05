describe('HiddenColumns (RTL mode)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('indicators', () => {
      it.forTheme('classic')('should add proper class names in column headers', () => {
        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(1, 5),
          hiddenColumns: {
            columns: [1, 3],
            indicators: true,
          },
          colHeaders: true,
        });

        expect(getCell(-1, 0)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
        expect(getComputedStyle(getCell(-1, 0), ':before').content).toBe('none');
        expect(getComputedStyle(getCell(-1, 0), ':after').content).toBe('"▶"');
        expect(getCell(-1, 1)).toBe(null);
        expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
        expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
        expect(getComputedStyle(getCell(-1, 2), ':before').content).toBe('"◀"');
        expect(getComputedStyle(getCell(-1, 2), ':after').content).toBe('"▶"');
        expect(getCell(-1, 3)).toBe(null);
        expect(getCell(-1, 4)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
        expect(getComputedStyle(getCell(-1, 4), ':before').content).toBe('"◀"');
        expect(getComputedStyle(getCell(-1, 4), ':after').content).toBe('none');
      });

      it.forTheme('main')('should add proper class names in column headers', () => {
        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(1, 5),
          hiddenColumns: {
            columns: [1, 3],
            indicators: true,
          },
          colHeaders: true,
        });

        expect(getCell(-1, 0)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
        expect(getComputedStyle(getCell(-1, 0), ':before').content).toBe('none');
        expect(getComputedStyle(getCell(-1, 0), ':after').getPropertyValue('-webkit-mask-image')).toMatch(/url/);
        expect(getCell(-1, 1)).toBe(null);
        expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
        expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
        expect(getComputedStyle(getCell(-1, 2), ':before').getPropertyValue('-webkit-mask-image')).toMatch(/url/);
        expect(getComputedStyle(getCell(-1, 2), ':after').getPropertyValue('-webkit-mask-image')).toMatch(/url/);
        expect(getCell(-1, 3)).toBe(null);
        expect(getCell(-1, 4)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
        expect(getComputedStyle(getCell(-1, 4), ':before').getPropertyValue('-webkit-mask-image')).toMatch(/url/);
        expect(getComputedStyle(getCell(-1, 4), ':after').content).toBe('none');
      });

      it('should render indicators after enabling them in updateSettings', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 3),
          hiddenColumns: {
            columns: [0, 2],
          },
          colHeaders: true,
        });

        expect(getCell(-1, 1)).not.toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
        expect(getCell(-1, 1)).not.toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);

        updateSettings({
          hiddenColumns: {
            columns: [0, 2],
            indicators: true,
          },
        });

        expect(getCell(-1, 1)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
        expect(getCell(-1, 1)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
      });
    });
  });
});
