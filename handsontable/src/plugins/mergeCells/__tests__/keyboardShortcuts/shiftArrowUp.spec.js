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

  describe('"Shift + ArrowUp"', () => {
    it('should expand the cells selection up keeping the internal current focus position', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ],
      });

      selectCell(4, 1);
      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,3 to: 1,1']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,3 to: 0,1']);

      selectCell(4, 2);
      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,3 to: 1,1']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,3 to: 0,1']);

      selectCell(4, 3);
      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,3 from: 4,3 to: 1,1']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,3 from: 4,3 to: 0,1']);
    });

    it('should extend the cells selection down when focus is moved within a range', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 2, col: 1, rowspan: 2, colspan: 2 },
          { row: 4, col: 1, rowspan: 2, colspan: 2 },
          { row: 7, col: 1, rowspan: 2, colspan: 2 },
        ],
      });

      selectCells([[4, 1, 8, 2]]);
      keyDownUp('enter'); // move cell focus down
      keyDownUp('enter'); // move cell focus down
      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 7,1 from: 8,1 to: 2,2']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 7,1 from: 8,1 to: 1,2']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 7,1 from: 8,1 to: 0,2']);
    });

    it('should expand the cells selection up keeping the internal current focus position when some rows are hidden', () => {
      handsontable({
        data: createSpreadsheetData(6, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ],
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(4, true);
      render();

      selectCell(5, 2);
      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,2 from: 5,3 to: 1,1']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,2 from: 5,3 to: 0,1']);
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
      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,4']);
    });

    it('should expand the cells selection through multiple merged cells when hidden index is selected', () => {
      handsontable({
        data: createSpreadsheetData(11, 6),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 2, col: 0, rowspan: 3, colspan: 3 },
          { row: 5, col: 0, rowspan: 3, colspan: 3 },
          { row: 2, col: 3, rowspan: 3, colspan: 3 },
          { row: 5, col: 3, rowspan: 3, colspan: 3 },
          { row: 8, col: 0, rowspan: 3, colspan: 3 },
          { row: 8, col: 3, rowspan: 3, colspan: 3 },
        ],
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(3, true);
      hidingMap.setValueAtIndex(5, true);
      hidingMap.setValueAtIndex(6, true);
      hidingMap.setValueAtIndex(10, true);
      render();

      selectCell(9, 2);
      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 8,0 from: 10,0 to: 5,2']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 8,0 from: 10,0 to: 2,2']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 8,0 from: 10,0 to: 1,2']);

      selectCell(5, 1);
      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 7,0 from: 7,0 to: 2,2']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 7,0 from: 7,0 to: 1,2']);
    });

    it('should expand the cells selection through multiple merged cells that intersect with each other', () => {
      handsontable({
        data: createSpreadsheetData(11, 8),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 4 },
          { row: 3, col: 1, rowspan: 2, colspan: 4 },
          { row: 1, col: 5, rowspan: 4, colspan: 2 },
          { row: 5, col: 5, rowspan: 2, colspan: 2 },
          { row: 4, col: 7, rowspan: 2, colspan: 1 },
          { row: 6, col: 1, rowspan: 3, colspan: 3 },
          { row: 9, col: 3, rowspan: 1, colspan: 3 },
        ],
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(4, true);
      hidingMap.setValueAtIndex(7, true);
      render();

      selectCell(10, 4);
      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 10,4 from: 10,5 to: 9,3']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 10,4 from: 10,6 to: 5,1']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 10,4 from: 10,6 to: 1,1']);

      keyDownUp(['shift', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 10,4 from: 10,6 to: 0,1']);
    });
  });
});
