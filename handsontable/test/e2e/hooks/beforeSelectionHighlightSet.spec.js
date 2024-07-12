describe('Hook', () => {
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

  describe('beforeSelectionHighlightSet', () => {
    it('should be fired every time the selection is changed', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
      });

      const beforeSelectionHighlightSet = jasmine.createSpy('beforeSelectionHighlightSet');

      addHook('beforeSelectionHighlightSet', beforeSelectionHighlightSet);
      selectColumns(2, 4);

      expect(beforeSelectionHighlightSet).toHaveBeenCalledWith();
      expect(beforeSelectionHighlightSet).toHaveBeenCalledTimes(1);

      beforeSelectionHighlightSet.calls.reset();
      selectRows(2, 4);

      expect(beforeSelectionHighlightSet).toHaveBeenCalledTimes(1);

      beforeSelectionHighlightSet.calls.reset();
      selectCell(2, 4);

      expect(beforeSelectionHighlightSet).toHaveBeenCalledTimes(1);

      $(getCell(2, 4)).simulate('mousedown');
      beforeSelectionHighlightSet.calls.reset();
      // extends the selection down
      $(getCell(3, 4))
        .simulate('mouseover')
        .simulate('mouseup');

      expect(beforeSelectionHighlightSet).toHaveBeenCalledTimes(1);

      $(getCell(2, 4)).simulate('mousedown');
      beforeSelectionHighlightSet.calls.reset();
      // extends the selection right
      $(getCell(2, 5))
        .simulate('mouseover')
        .simulate('mouseup');

      expect(beforeSelectionHighlightSet).toHaveBeenCalledTimes(1);
    });

    it('should be possible to modify selection before it\'s applied to the Walkontable API', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
        beforeSelectionHighlightSet() {
          const { from, to, highlight } = this.getSelectedRangeLast();

          from.col -= 1;
          from.row -= 2;
          to.col += 3;
          to.row += 4;
          highlight.row -= 3;
          highlight.col += 5;
        }
      });

      selectCell(4, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,9 from: 2,3 to: 8,7']);
    });
  });
});
