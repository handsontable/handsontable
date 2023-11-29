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

    it('should display indicator properly after changing sorted column sequence', () => {
      const hot = handsontable({
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
      hot.columnIndexMapper.moveIndexes([1], 0);
      hot.render();

      const sortedColumn = spec().$container.find('th span.columnSorting')[1];

      expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('background-image')).toMatch(/url/);
      expect(window.getComputedStyle(sortedColumn, ':before').getPropertyValue('left')).toEqual('-9px');
    });
  });
});
