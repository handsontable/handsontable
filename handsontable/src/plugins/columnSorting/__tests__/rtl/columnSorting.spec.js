describe('ColumnSorting (RTL)', () => {
  /**
   * Returns the sort-direction indicator icon for a header label, or `null` when the header shows
   * none. DEV-3003: the indicator is a real `<i class="ht-icon ht-sort-indicator">` sibling of the
   * label inside `.relative`, not a `::before` pseudo-element on the label (see the non-RTL
   * `__tests__/columnSorting.spec.js`, which this file mirrors).
   *
   * @param {HTMLElement} headerLabel The `span.colHeader`/`span.columnSorting` label element.
   * @returns {HTMLElement|null}
   */
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
      const icon = getSortIndicatorIcon(sortedColumn);

      expect(icon).not.toBe(null);

      // DEV-3003: the indicator is a real `.ht-sort-indicator` element now, positioned by
      // `_column-sorting.scss` against the header's `.relative` container with
      // `inset-inline-end: calc(--ht-sort-indicator-offset-end + 2px)` - that is what keeps it
      // pinned to the header edge instead of travelling with the label. Assert against the real
      // element's own box, derived from the same custom property the rule reads, rather than a
      // hardcoded pixel offset - and that it ends up centred in the header cell.
      const container = sortedColumn.closest('.relative');
      const containerRect = container.getBoundingClientRect();
      const headerRect = sortedColumn.closest('th').getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();

      // The indicator sits on the header's vertical midline; allow a 1px tolerance for sub-pixel
      // rounding.
      const iconCentreY = (iconRect.top + iconRect.bottom) / 2;

      expect(Math.abs(iconCentreY - ((headerRect.top + headerRect.bottom) / 2))).toBeLessThanOrEqual(1);

      const offsetEnd = parseFloat(
        window.getComputedStyle(container).getPropertyValue('--ht-sort-indicator-offset-end')
      ) || 0;
      // The SCSS rule adds a literal 2px edge margin on top of the custom property (kept from the
      // old pseudo-element's `right: 2px`/`left: 2px`, on top of its own `margin-inline-end`).
      const expectedInset = offsetEnd + 2;

      // `inset-inline-end` resolves against the CONTAINER's own computed `direction`, not against
      // `htmlDir`/`layoutDirection` directly - branching on the resolved direction (rather than the
      // test parameters) is what keeps this correct for both matrix cases above.
      if (window.getComputedStyle(container).direction === 'rtl') {
        // In RTL, `inset-inline-end` resolves to the LEFT edge.
        expect(Math.abs((iconRect.left - containerRect.left) - expectedInset)).toBeLessThanOrEqual(1);

      } else {
        // In LTR, `inset-inline-end` resolves to the RIGHT edge.
        expect(Math.abs((containerRect.right - iconRect.right) - expectedInset)).toBeLessThanOrEqual(1);
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
      const icon = getSortIndicatorIcon(label);

      expect(icon).not.toBe(null);

      const container = label.closest('.relative');
      const containerStyle = window.getComputedStyle(container);
      const containerRect = container.getBoundingClientRect();
      const labelRect = label.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();

      // In RTL a left-aligned header pins the indicator to the physical right - `inset-inline-end`
      // resolves to the right edge whenever the container's direction is RTL (the default here,
      // since `htLeft` is the class that points AGAINST the direction). The inset is the same
      // `--ht-sort-indicator-offset-end` custom property plus the literal 2px edge margin the old
      // pseudo-element carried (see the non-RTL spec and `_column-sorting.scss`), not a fixed pixel
      // tolerance - the property defaults to the cell's own horizontal padding.
      expect(window.getComputedStyle(container).direction).toBe('rtl');

      const offsetEnd = parseFloat(containerStyle.getPropertyValue('--ht-sort-indicator-offset-end')) || 0;
      const expectedInset = offsetEnd + 2;

      expect(Math.abs((containerRect.right - iconRect.right) - expectedInset)).toBeLessThanOrEqual(1);

      // So the room has to be reserved on the right too, not on the left.
      const paddingLeft = parseFloat(containerStyle.getPropertyValue('padding-left'));
      const paddingRight = parseFloat(containerStyle.getPropertyValue('padding-right'));

      expect(paddingRight).toBeGreaterThan(paddingLeft);

      // What the user sees: the label stops before the indicator instead of running under it.
      const overlap = Math.min(labelRect.right, iconRect.right) - Math.max(labelRect.left, iconRect.left);

      expect(overlap).toBeLessThanOrEqual(0);
    });
  });
});
