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

  describe('"Shift + ArrowRight"', () => {
    it('should expand the cells selection right keeping the internal current focus position', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ],
      });

      selectCell(1, 0);
      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 3,3']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 3,4']);

      selectCell(2, 0);
      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,0 to: 3,3']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,0 to: 3,4']);

      selectCell(3, 0);
      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 1,0 to: 3,3']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 1,0 to: 3,4']);
    });

    it('should extend the cells selection right when focus is moved within a range', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 1, col: 4, rowspan: 2, colspan: 2 },
          { row: 1, col: 6, rowspan: 2, colspan: 2 },
        ],
      });

      selectCells([[1, 4, 2, 1]]);
      keyDownUp(['shift', 'tab']); // move cell focus left
      keyDownUp(['shift', 'tab']); // move cell focus left
      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 2,7']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 2,8']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 2,9']);
    });

    it('should correctly extend the cells selection right by one cell when merged cell is selected (#11010)', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 },
        ],
      });

      selectCells([[1, 3, 3, 1]]);
      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,4']);
    });

    it('should expand the cells selection right keeping the internal current focus position when some columns are hidden', () => {
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

      selectCell(2, 0);
      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,0 to: 3,3']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,0 to: 3,5']);
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
      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,4']);
    });

    it('should expand the cells selection through multiple merged cells when hidden index is selected', () => {
      handsontable({
        data: createSpreadsheetData(6, 11),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 3, colspan: 3 },
          { row: 3, col: 0, rowspan: 3, colspan: 3 },
          { row: 0, col: 3, rowspan: 3, colspan: 3 },
          { row: 3, col: 3, rowspan: 3, colspan: 3 },
          { row: 0, col: 6, rowspan: 3, colspan: 3 },
          { row: 3, col: 6, rowspan: 3, colspan: 3 },
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(3, true);
      hidingMap.setValueAtIndex(4, true);
      hidingMap.setValueAtIndex(8, true);
      render();

      selectCell(2, 1);
      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,5']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,8']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,9']);

      selectCell(1, 4);
      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,3 to: 2,8']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,3 to: 2,9']);
    });

    it('should expand the cells selection through multiple merged cells that intersect with each other', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 4, col: 1, rowspan: 3, colspan: 1 },
          { row: 1, col: 2, rowspan: 2, colspan: 4 },
          { row: 3, col: 2, rowspan: 2, colspan: 4 },
          { row: 1, col: 6, rowspan: 4, colspan: 2 },
          { row: 5, col: 6, rowspan: 2, colspan: 2 },
          { row: 4, col: 8, rowspan: 2, colspan: 1 },
          { row: 6, col: 2, rowspan: 3, colspan: 3 },
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(2, true);
      hidingMap.setValueAtIndex(4, true);
      render();

      selectCell(5, 0);
      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,0 from: 4,0 to: 6,1']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,0 from: 3,0 to: 8,5']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,0 from: 1,0 to: 8,7']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,0 from: 1,0 to: 8,8']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,0 from: 1,0 to: 8,9']);
    });
  });
});
