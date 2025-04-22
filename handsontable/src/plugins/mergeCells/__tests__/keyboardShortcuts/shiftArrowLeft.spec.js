describe('MergeCells keyboard shortcut', () => {
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

  describe('"Shift + ArrowLeft"', () => {
    it('should expand the cells selection left keeping the internal current focus position', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ],
      });

      selectCell(1, 4);
      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 3,1']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 3,0']);

      selectCell(2, 4);
      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 1,4 to: 3,1']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 1,4 to: 3,0']);

      selectCell(3, 4);
      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 1,4 to: 3,1']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 1,4 to: 3,0']);
    });

    it('should extend the cells selection down when focus is moved within a range', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 2, rowspan: 2, colspan: 2 },
          { row: 1, col: 4, rowspan: 2, colspan: 2 },
          { row: 1, col: 7, rowspan: 2, colspan: 2 },
        ],
      });

      selectCells([[1, 4, 2, 8]]);
      keyDownUp('tab'); // move cell focus right
      keyDownUp('tab'); // move cell focus right
      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,7 from: 1,8 to: 2,2']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,7 from: 1,8 to: 2,1']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,7 from: 1,8 to: 2,0']);
    });

    it('should expand the cells selection left keeping the internal current focus position when some columns are hidden', () => {
      handsontable({
        data: createSpreadsheetData(5, 6),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(4, true);
      render();

      selectCell(2, 5);
      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,5 from: 1,5 to: 3,1']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,5 from: 1,5 to: 3,0']);
    });

    it('should not expand the cells selection when there is only one merged cell', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 5, colspan: 5 }
        ],
      });

      selectCell(0, 0);
      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,4']);
    });

    it('should expand the cells selection through multiple merged cells when hidden index is selected', () => {
      handsontable({
        data: createSpreadsheetData(6, 11),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 0, col: 2, rowspan: 3, colspan: 3 },
          { row: 3, col: 2, rowspan: 3, colspan: 3 },
          { row: 0, col: 5, rowspan: 3, colspan: 3 },
          { row: 3, col: 5, rowspan: 3, colspan: 3 },
          { row: 0, col: 8, rowspan: 3, colspan: 3 },
          { row: 3, col: 8, rowspan: 3, colspan: 3 },
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(3, true);
      hidingMap.setValueAtIndex(5, true);
      hidingMap.setValueAtIndex(6, true);
      hidingMap.setValueAtIndex(10, true);
      render();

      selectCell(2, 9);
      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,8 from: 0,10 to: 2,5']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,8 from: 0,10 to: 2,2']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,8 from: 0,10 to: 2,1']);

      selectCell(1, 5);
      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,7 from: 0,7 to: 2,2']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,7 from: 0,7 to: 2,1']);
    });

    it('should expand the cells selection through multiple merged cells that intersect with each other', () => {
      handsontable({
        data: createSpreadsheetData(11, 9),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 4 },
          { row: 3, col: 1, rowspan: 2, colspan: 4 },
          { row: 1, col: 5, rowspan: 4, colspan: 2 },
          { row: 5, col: 5, rowspan: 2, colspan: 2 },
          { row: 3, col: 7, rowspan: 3, colspan: 1 },
          { row: 6, col: 1, rowspan: 3, colspan: 3 },
          { row: 9, col: 3, rowspan: 1, colspan: 3 },
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(3, true);
      render();

      selectCell(4, 8);
      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,8 from: 3,8 to: 5,7']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,8 from: 1,8 to: 6,5']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,8 from: 1,8 to: 8,1']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,8 from: 1,8 to: 8,0']);
    });
  });
});
