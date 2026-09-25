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
      it('should add proper class names in column headers', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(1, 5),
          hiddenColumns: {
            columns: [1, 3],
            indicators: true,
          },
          colHeaders: true,
        });

        // DEV-3003: the caret is a real `<i class="ht-icon ht-icon-caret-hidden-*">` element now
        // (`syncIcon()` against a named slot that is a child of the `th` itself), not a
        // `::before`/`::after` pseudo-element - `beforeHiddenColumn` fills the END slot with a
        // left-pointing caret, `afterHiddenColumn` fills the START slot with a right-pointing one
        // (see `hiddenColumns/AGENTS.md`, "The caret is a real element now"). Slot assignment is
        // not direction-dependent - only the CSS that positions the slots mirrors under RTL.
        expect(getCell(-1, 0)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
        expect(getCell(-1, 0).querySelector('.ht-hidden-indicator-start')).toBe(null);
        expect(getCell(-1, 0).querySelector('.ht-hidden-indicator-end'))
          .toHaveClass('ht-icon-caret-hidden-left');
        expect(getCell(-1, 1)).toBe(null);
        expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
        expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
        expect(getCell(-1, 2).querySelector('.ht-hidden-indicator-start'))
          .toHaveClass('ht-icon-caret-hidden-right');
        expect(getCell(-1, 2).querySelector('.ht-hidden-indicator-end'))
          .toHaveClass('ht-icon-caret-hidden-left');
        expect(getCell(-1, 3)).toBe(null);
        expect(getCell(-1, 4)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
        expect(getCell(-1, 4).querySelector('.ht-hidden-indicator-start'))
          .toHaveClass('ht-icon-caret-hidden-right');
        expect(getCell(-1, 4).querySelector('.ht-hidden-indicator-end')).toBe(null);
      });

      it('should render indicators after enabling them in updateSettings', async() => {
        handsontable({
          data: createSpreadsheetData(1, 3),
          hiddenColumns: {
            columns: [0, 2],
          },
          colHeaders: true,
        });

        expect(getCell(-1, 1)).not.toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
        expect(getCell(-1, 1)).not.toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);

        await updateSettings({
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
