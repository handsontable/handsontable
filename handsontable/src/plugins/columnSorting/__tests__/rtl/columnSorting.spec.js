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

    it('should reserve the indicator room on the side the indicator is pinned to for a left-aligned header', async() => {
      handsontable({
        layoutDirection,
        data: [
          [1, 9, 3],
          [9, 8, 7],
          [8, 7, 6],
        ],
        // Long enough to fill the header, so a reservation on the wrong side shows up as the
        // indicator sitting on top of the label instead of beside it.
        colHeaders: ['Revenue per employee division', 'B', 'C'],
        colWidths: 140,
        // `htLeft` is the alignment that points against the direction in RTL, so it is the case
        // where the indicator moves to the inline-start side and the reservation has to follow.
        afterGetColHeader: (column, TH) => {
          if (column === 0) {
            TH.classList.add('htLeft');
          }
        },
        columnSorting: {
          indicator: true
        }
      });

      getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
      await render();

      const label = spec().$container.find('th span.columnSorting')[0];
      const container = label.closest('.relative');
      const containerStyle = window.getComputedStyle(container);
      const indicatorStyle = window.getComputedStyle(label, ':before');
      const containerRect = container.getBoundingClientRect();
      const labelRect = label.getBoundingClientRect();
      const iconSize = parseFloat(
        window.getComputedStyle(label).getPropertyValue('--ht-icon-size')
      ) || 16;

      // In RTL a left-aligned header pins the indicator to the physical right.
      expect(parseFloat(indicatorStyle.getPropertyValue('right'))).toBe(2);

      // So the room has to be reserved on the right too, not on the left.
      const paddingLeft = parseFloat(containerStyle.getPropertyValue('padding-left'));
      const paddingRight = parseFloat(containerStyle.getPropertyValue('padding-right'));

      expect(paddingRight).toBeGreaterThan(paddingLeft);

      // What the user sees: the label stops before the indicator instead of running under it.
      // `.relative` carries no border, so its client rect edges are the padding box edges the
      // absolutely positioned indicator resolves against.
      const marginRight = parseFloat(indicatorStyle.getPropertyValue('margin-right')) || 0;
      const indicatorRight = containerRect.right - 2 - marginRight;
      const indicatorLeft = indicatorRight - iconSize;
      const overlap = Math.min(labelRect.right, indicatorRight) - Math.max(labelRect.left, indicatorLeft);

      expect(overlap).toBeLessThanOrEqual(0);
    });
  });
});
