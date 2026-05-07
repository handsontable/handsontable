describe('ColumnSorting (RTL)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);

      this.$container = $(`<div id="${id}" style="overflow: auto; width: 300px; height: 200px;"></div>`)
        .appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('should display the indicator properly after changing the sorted column sequence', async() => {
      handsontable({
        layoutDirection,
        data: [
          [1, 9, 3, 4, 5, 6, 7, 8, 9],
          [9, 8, 7, 6, 5, 4, 3, 2, 1],
          [8, 7, 6, 5, 4, 3, 3, 1, 9],
          [0, 3, 0, 5, 6, 7, 8, 9, 1]
        ],
        colHeaders: true,
        columnSorting: {
          indicator: true
        }
      });

      getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      // changing column sequence: 0 <-> 1
      columnIndexMapper().moveIndexes([1], 0);
      await render();

      const sortedColumn = spec().$container.find('th span.columnSorting')[1];
      const computedStyle = window.getComputedStyle(sortedColumn, ':before');

      expect(computedStyle.getPropertyValue('-webkit-mask-image')).toMatch(/url/);

      // _column-sorting.scss sets `top: 50%; right: 2px;` (LTR) or `left: 2px;` (RTL) on
      // `.columnSorting::before`. Assert the exact hardcoded horizontal offset and that the
      // vertical anchor resolves to the span's vertical midpoint.
      const spanRect = sortedColumn.getBoundingClientRect();
      const topPx = parseFloat(computedStyle.getPropertyValue('top'));
      const iconSize = parseFloat(
        window.getComputedStyle(sortedColumn).getPropertyValue('--ht-icon-size')
      ) || 16;

      // `top: 50%` resolves relative to the ::before's containing block (the sortedColumn span);
      // allow a 1px tolerance for sub-pixel rounding.
      expect(Math.abs(topPx - (spanRect.height / 2))).toBeLessThanOrEqual(1);

      if (htmlDir === 'rtl' || layoutDirection === 'rtl') {
        // In RTL mode the indicator is anchored to the left of the span at exactly 2px.
        expect(parseFloat(computedStyle.getPropertyValue('left'))).toBe(2);
        const rightPx = parseFloat(computedStyle.getPropertyValue('right'));

        expect(rightPx).toBeGreaterThanOrEqual(spanRect.width - iconSize - 2 - 1);

      } else {
        // In LTR mode the indicator is anchored to the right of the span at exactly 2px.
        expect(parseFloat(computedStyle.getPropertyValue('right'))).toBe(2);
        const leftPx = parseFloat(computedStyle.getPropertyValue('left'));

        expect(leftPx).toBeGreaterThanOrEqual(spanRect.width - iconSize - 2 - 1);
      }
    });
  });
});
