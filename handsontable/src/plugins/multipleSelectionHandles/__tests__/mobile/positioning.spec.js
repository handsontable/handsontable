describe('MultipleSelectionHandles', () => {
  using('configuration object', [
    { htmlDir: 'ltr', layoutDirection: 'inherit' },
    { htmlDir: 'rtl', layoutDirection: 'ltr' },
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

    it('should show selection handles in correct positions', () => {
      handsontable({
        layoutDirection,
        width: 400,
        height: 400
      });

      selectCell(1, 1);

      const topSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:first-child .topSelectionHandle');
      const topSelectionHandleSize = topSelectionHandle.outerWidth();
      const bottomSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:first-child .bottomSelectionHandle');
      const cell = $(getCell(1, 1));
      const cellOffset = cell.offset();
      const cellWidth = cell.outerWidth();
      const cellHeight = cell.outerHeight();

      expect(topSelectionHandle.is(':visible')).toBe(true);
      expect(bottomSelectionHandle.is(':visible')).toBe(true);
      expect(topSelectionHandle.offset()).toEqual({
        top: cellOffset.top - topSelectionHandleSize,
        left: cellOffset.left - topSelectionHandleSize,
      });
      // -1 as the bottom handler is positioned starting from the most bottom-right pixel
      expect(bottomSelectionHandle.offset()).toEqual({
        top: cellOffset.top + cellHeight - 1,
        left: cellOffset.left + cellWidth - 1,
      });
    });

    it('should show both selection handles in correct position after horizontal drag & drop', async() => {
      handsontable({
        layoutDirection,
        width: 400,
        height: 400
      });

      selectCell(1, 1);

      await sleep(100);

      const cellFrom = $(getCell(1, 1));
      const cellTo = spec().$container.find('tbody tr:eq(1) td:eq(3)');
      const cellToOffset = cellTo.offset();
      const cellToWidth = cellFrom.outerWidth();
      const cellToHeight = cellFrom.outerHeight();

      triggerTouchEvent('touchstart', spec().$container.find('.htBorders .bottomSelectionHandle-HitArea')[0]);
      triggerTouchEvent('touchmove', spec().$container.find('tbody tr:eq(1) td:eq(2)')[0]);
      triggerTouchEvent('touchmove', cellTo[0]);
      triggerTouchEvent('touchend', cellTo[0]);

      await sleep(100);

      const topSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:last-child .topSelectionHandle');
      const topSelectionHandleSize = topSelectionHandle.outerWidth();
      const bottomSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:last-child .bottomSelectionHandle');
      const cellFromOffset = cellFrom.offset();

      expect(topSelectionHandle.is(':visible')).toBe(true);
      expect(bottomSelectionHandle.is(':visible')).toBe(true);
      expect(topSelectionHandle.offset()).toEqual({
        top: cellFromOffset.top - topSelectionHandleSize,
        left: cellFromOffset.left - topSelectionHandleSize,
      });
      // -1 as the bottom handler is positioned starting from the most bottom-right pixel
      expect(bottomSelectionHandle.offset()).toEqual({
        top: cellToOffset.top + cellToHeight - 1,
        left: cellToOffset.left + cellToWidth - 1,
      });
      expect(getSelected()).toEqual([[1, 1, 1, 3]]);
    });

    it('should show both selection handles in correct position after vertical drag & drop', async() => {
      handsontable({
        layoutDirection,
        width: 400,
        height: 400
      });

      selectCell(1, 1);

      await sleep(100);

      const cellFrom = $(getCell(1, 1));
      const cellTo = spec().$container.find('tbody tr:eq(3) td:eq(1)');
      const cellToOffset = cellTo.offset();
      const cellToWidth = cellFrom.outerWidth();
      const cellToHeight = cellFrom.outerHeight();

      triggerTouchEvent('touchstart', spec().$container.find('.htBorders .bottomSelectionHandle-HitArea')[0]);
      triggerTouchEvent('touchmove', spec().$container.find('tbody tr:eq(2) td:eq(1)')[0]);
      triggerTouchEvent('touchmove', cellTo[0]);
      triggerTouchEvent('touchend', cellTo[0]);

      await sleep(100);

      const topSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:last-child .topSelectionHandle');
      const topSelectionHandleSize = topSelectionHandle.outerWidth();
      const bottomSelectionHandle = spec().$container
        .find('.ht_master .htBorders div:last-child .bottomSelectionHandle');
      const cellFromOffset = cellFrom.offset();

      expect(topSelectionHandle.is(':visible')).toBe(true);
      expect(bottomSelectionHandle.is(':visible')).toBe(true);
      expect(topSelectionHandle.offset()).toEqual({
        top: cellFromOffset.top - topSelectionHandleSize,
        left: cellFromOffset.left - topSelectionHandleSize,
      });
      // -1 as the bottom handler is positioned starting from the most bottom-right pixel
      expect(bottomSelectionHandle.offset()).toEqual({
        top: cellToOffset.top + cellToHeight - 1,
        left: cellToOffset.left + cellToWidth - 1,
      });
      expect(getSelected()).toEqual([[1, 1, 3, 1]]);
    });
  });
});
