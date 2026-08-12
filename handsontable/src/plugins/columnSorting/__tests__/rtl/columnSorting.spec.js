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
      // `.columnSorting::before`. The label is sized to its text, so the indicator is positioned
      // against the header's `.relative` container - that is what keeps it pinned to the header
      // edge instead of travelling with the label. Assert the hardcoded horizontal offset against
      // that container, and that the indicator ends up centred in the header cell.
      const container = sortedColumn.closest('.relative');
      const containerRect = container.getBoundingClientRect();
      const headerRect = sortedColumn.closest('th').getBoundingClientRect();
      const topPx = parseFloat(computedStyle.getPropertyValue('top'));
      const iconSize = parseFloat(
        window.getComputedStyle(sortedColumn).getPropertyValue('--ht-icon-size')
      ) || 16;

      // `top: 50%` resolves relative to the ::before's containing block; allow a 1px tolerance
      // for sub-pixel rounding.
      expect(Math.abs(topPx - (containerRect.height / 2))).toBeLessThanOrEqual(1);

      // What the user actually sees: the indicator sits on the header's vertical midline.
      const indicatorCentreY = containerRect.top + topPx;

      expect(Math.abs(indicatorCentreY - ((headerRect.top + headerRect.bottom) / 2)))
        .toBeLessThanOrEqual(1);

      // The indicator carries inline margins that hold it clear of the cell padding, so they are
      // part of what the free edge resolves to.
      const inlineMargins = (parseFloat(computedStyle.getPropertyValue('margin-left')) || 0) +
        (parseFloat(computedStyle.getPropertyValue('margin-right')) || 0);
      const freeEdge = containerRect.width - iconSize - inlineMargins - 2 - 1;

      if (htmlDir === 'rtl' || layoutDirection === 'rtl') {
        // In RTL mode the indicator is anchored to the left of the container at exactly 2px.
        expect(parseFloat(computedStyle.getPropertyValue('left'))).toBe(2);
        const rightPx = parseFloat(computedStyle.getPropertyValue('right'));

        expect(rightPx).toBeGreaterThanOrEqual(freeEdge);

      } else {
        // In LTR mode the indicator is anchored to the right of the container at exactly 2px.
        expect(parseFloat(computedStyle.getPropertyValue('right'))).toBe(2);
        const leftPx = parseFloat(computedStyle.getPropertyValue('left'));

        expect(leftPx).toBeGreaterThanOrEqual(freeEdge);
      }
    });
  });
});
