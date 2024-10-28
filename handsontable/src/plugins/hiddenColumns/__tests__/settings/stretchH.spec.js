describe('HiddenColumns', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('cooperation with the `stretchH` option', () => {
    it('should stretch all columns to a window size', () => {
      const stretchedColumns = new Set();

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2],
        },
        stretchH: 'all',
        beforeStretchingColumnWidth(width, column) {
          stretchedColumns.add(column);
        }
      });

      expect($(getHtCore()).find('td')[0].offsetWidth).toBeAroundValue(document.documentElement.clientWidth / 3, 2);
      expect($(getHtCore()).find('td')[1].offsetWidth).toBeAroundValue(document.documentElement.clientWidth / 3, 2);
      expect($(getHtCore()).find('td')[2].offsetWidth).toBeAroundValue(document.documentElement.clientWidth / 3, 2);
      expect(Array.from(stretchedColumns.values())).toEqual([1, 3, 4]);
    });

    it('should work properly when the `ManualColumnResize` plugin define sizes for some columns', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2],
        },
        stretchH: 'all',
        manualColumnResize: [10, 11, 12, 13, 14],
      });

      expect(hot.getColWidth(0)).toBe(0);
      // Rendered index: 0, visual index: 1
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(11);
      expect(hot.getColWidth(1)).toBe(11);
      expect(hot.getColWidth(2)).toBe(0);
      // Rendered index: 1, visual index: 3
      expect($(getHtCore()).find('td')[1].offsetWidth).toBe(13);
      expect(hot.getColWidth(3)).toBe(13);
    });
  });
});
