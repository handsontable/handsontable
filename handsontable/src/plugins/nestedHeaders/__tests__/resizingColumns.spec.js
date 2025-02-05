describe('NestedHeaders', () => {
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

  describe('resizing columns', () => {
    it('should be possible to resize a column manually when both `manualColumnResize` and `nestedHeaders` plugins are enabled', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        manualColumnResize: true,
        nestedHeaders: [
          [
            'A4',
            { label: 'B4', colspan: 2 },
            { label: 'D4', colspan: 2 },
          ],
          ['A5A5A5', 'B5B5B5B5', 'C5C5C5C5', 'D5D5D5D5', 'E5E5E5E5'],
        ],
      });

      getTopClone().find('thead tr:eq(1) th:eq(2)').simulate('mouseover');
      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientX: resizerPosition.left });
      $resizer.simulate('mousemove', { clientX: resizerPosition.left - 50 });
      $resizer.simulate('mouseup');

      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main }) => {
        classic.toBe(20);
        main.toBe(37);
      });
    });

    it('should be possible to resize a column using the `manualColumnSize` settings when both `manualColumnResize` and `nestedHeaders` plugins are enabled', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        manualColumnResize: [20, 20, 20, 20, 20],
        nestedHeaders: [
          [
            'A4',
            { label: 'B4', colspan: 2 },
            { label: 'D4', colspan: 2 },
          ],
          ['A5A5A5', 'B5B5B5B5', 'C5C5C5C5', 'D5D5D5D5', 'E5E5E5E5'],
        ],
      });

      expect(colWidth(spec().$container, 0)).toBe(20);
      expect(colWidth(spec().$container, 1)).toBe(20);
      expect(colWidth(spec().$container, 2)).toBe(20);
      expect(colWidth(spec().$container, 3)).toBe(20);
      expect(colWidth(spec().$container, 4)).toBe(20);
    });
  });
});
