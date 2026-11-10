// Both the cell and the handle are read through `Handsontable.dom.offset()`, the integer `offsetTop` and
// `offsetLeft` chain the engine places handles from. jQuery's `offset()` comes from `getBoundingClientRect()`,
// which is fractional on a fractional layout, so an exact comparison of it fails by a fraction of a pixel.
describe('MultipleSelectionHandles (RTL mode)', () => {
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

    it('should show selection handles in correct positions', async() => {
      handsontable({
        layoutDirection,
        width: 400,
        height: 400
      });

      await selectCell(1, 1);

      const topSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:first-child .topSelectionHandle');
      const topSelectionHandleSize = topSelectionHandle.outerWidth();
      const bottomSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:first-child .bottomSelectionHandle');
      const bottomSelectionHandleSize = bottomSelectionHandle.outerWidth();
      const cell = $(getCell(1, 1));
      const cellOffset = Handsontable.dom.offset(cell[0]);
      const cellWidth = cell.outerWidth();
      const cellHeight = cell.outerHeight();

      expect(topSelectionHandle.is(':visible')).toBe(true);
      expect(bottomSelectionHandle.is(':visible')).toBe(true);
      expect(topSelectionHandle.css('z-index')).toBe('9999');
      expect(bottomSelectionHandle.css('z-index')).toBe('9999');
      expect(Handsontable.dom.offset(topSelectionHandle[0])).toEqual({
        top: cellOffset.top - topSelectionHandleSize,
        left: cellOffset.left + cellWidth,
      });
      // -/+1 as the bottom handler is positioned ending in the most bottom-left pixel
      expect(Handsontable.dom.offset(bottomSelectionHandle[0])).toEqual({
        top: cellOffset.top + cellHeight - 1,
        left: cellOffset.left - bottomSelectionHandleSize + 1,
      });
    });

    it('should show both selection handles in correct position after horizontal drag & drop', async() => {
      handsontable({
        layoutDirection,
        width: 400,
        height: 400
      });

      await selectCell(1, 1);

      await waitForNextAnimationFrames(2);

      const cellFrom = $(getCell(1, 1));
      const cellTo = spec().$container.find('tbody tr:eq(1) td:eq(3)');
      const cellToOffset = Handsontable.dom.offset(cellTo[0]);
      const cellToHeight = cellFrom.outerHeight();

      await triggerTouchEvent('touchstart', spec().$container.find('.htBorders .bottomSelectionHandle-HitArea')[0]);
      await triggerTouchEvent('touchmove', spec().$container.find('tbody tr:eq(1) td:eq(2)')[0]);
      await triggerTouchEvent('touchmove', cellTo[0]);
      await triggerTouchEvent('touchend', cellTo[0]);

      await waitForNextAnimationFrames(2);

      const topSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:last-child .topSelectionHandle');
      const topSelectionHandleSize = topSelectionHandle.outerWidth();
      const bottomSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:last-child .bottomSelectionHandle');
      const bottomSelectionHandleSize = bottomSelectionHandle.outerWidth();
      const cellFromOffset = Handsontable.dom.offset(cellFrom[0]);
      const cellFromWidth = cellFrom.outerWidth();

      expect(topSelectionHandle.is(':visible')).toBe(true);
      expect(bottomSelectionHandle.is(':visible')).toBe(true);
      expect(topSelectionHandle.css('z-index')).toBe('9999');
      expect(bottomSelectionHandle.css('z-index')).toBe('9999');
      expect(Handsontable.dom.offset(topSelectionHandle[0])).toEqual({
        top: cellFromOffset.top - topSelectionHandleSize,
        left: cellFromOffset.left + cellFromWidth,
      });
      // -/+1 as the bottom handler is positioned ending in the most bottom-left pixel
      expect(Handsontable.dom.offset(bottomSelectionHandle[0])).toEqual({
        top: cellToOffset.top + cellToHeight - 1,
        left: cellToOffset.left - bottomSelectionHandleSize + 1,
      });
      expect(getSelected()).toEqual([[1, 1, 1, 3]]);
    });

    it('should show both selection handles in correct position after vertical drag & drop', async() => {
      handsontable({
        layoutDirection,
        width: 400,
        height: 400
      });

      await selectCell(1, 1);

      await waitForNextAnimationFrames(2);

      const cellFrom = $(getCell(1, 1));
      const cellTo = spec().$container.find('tbody tr:eq(3) td:eq(1)');
      const cellToOffset = Handsontable.dom.offset(cellTo[0]);
      const cellToHeight = cellFrom.outerHeight();

      await triggerTouchEvent('touchstart', spec().$container.find('.htBorders .bottomSelectionHandle-HitArea')[0]);
      await triggerTouchEvent('touchmove', spec().$container.find('tbody tr:eq(2) td:eq(1)')[0]);
      await triggerTouchEvent('touchmove', cellTo[0]);
      await triggerTouchEvent('touchend', cellTo[0]);

      await waitForNextAnimationFrames(2);

      const topSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:last-child .topSelectionHandle');
      const topSelectionHandleSize = topSelectionHandle.outerWidth();
      const bottomSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:last-child .bottomSelectionHandle');
      const bottomSelectionHandleSize = bottomSelectionHandle.outerWidth();
      const cellFromOffset = Handsontable.dom.offset(cellFrom[0]);
      const cellFromWidth = cellFrom.outerWidth();

      expect(topSelectionHandle.is(':visible')).toBe(true);
      expect(bottomSelectionHandle.is(':visible')).toBe(true);
      expect(topSelectionHandle.css('z-index')).toBe('9999');
      expect(bottomSelectionHandle.css('z-index')).toBe('9999');
      expect(Handsontable.dom.offset(topSelectionHandle[0])).toEqual({
        top: cellFromOffset.top - topSelectionHandleSize,
        left: cellFromOffset.left + cellFromWidth,
      });
      // -/+1 as the bottom handler is positioned ending in the most bottom-left pixel
      expect(Handsontable.dom.offset(bottomSelectionHandle[0])).toEqual({
        top: cellToOffset.top + cellToHeight - 1,
        left: cellToOffset.left - bottomSelectionHandleSize + 1,
      });
      expect(getSelected()).toEqual([[1, 1, 3, 1]]);
    });
  });
});
