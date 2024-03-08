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

  describe('"Tab"', () => {
    it('should correctly navigate forward horizontally through the merged cells (auto-wrapping is disabled)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        autoWrapRow: false,
        autoWrapCol: false,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ]
      });

      selectCell(2, 0);
      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);

      keyDownUp('tab');

      expect(getSelectedRange()).toBeUndefined();
    });

    it('should correctly navigate forward horizontally through the merged cells (auto-wrapping is enabled)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        autoWrapRow: true,
        autoWrapCol: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ]
      });

      selectCell(2, 0);
      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 3,4 to: 3,4']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 4,0 to: 4,0']);
    });

    it('should correctly navigate forward horizontally through the merged cells within the range', () => {
      const hot = handsontable({
        data: createSpreadsheetData(7, 7),
        colHeaders: true,
        rowHeaders: true,
        mergeCells: [
          { row: 2, col: 2, rowspan: 3, colspan: 3 }
        ]
      });

      selectCell(1, 1, 5, 5);
      hot.selection.setRangeFocus(cellCoords(3, 1));
      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,5 from: 1,1 to: 5,5']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 1,1 to: 5,5']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,5 from: 1,1 to: 5,5']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,1 from: 1,1 to: 5,5']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,2 from: 1,1 to: 5,5']);
    });

    it('should correctly navigate forward horizontally through two adjacent vertically merged cells', () => {
      handsontable({
        data: createSpreadsheetData(6, 3),
        colHeaders: true,
        rowHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 3, colspan: 3 },
          { row: 3, col: 0, rowspan: 3, colspan: 3 },
        ]
      });

      selectCell(0, 0, 5, 2);
      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 0,0 to: 5,2']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 5,2']);
    });

    it('should correctly navigate forward horizontally through two adjacent horizontally merged cells', () => {
      handsontable({
        data: createSpreadsheetData(3, 6),
        colHeaders: true,
        rowHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 3, colspan: 3 },
          { row: 0, col: 3, rowspan: 3, colspan: 3 },
        ]
      });

      selectCell(0, 0, 2, 5);
      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,0 to: 2,5']);

      keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,5']);
    });

    it('should correctly navigate forward horizontally through the merged cells within the range (complex example)', () => {
      handsontable({
        data: createSpreadsheetData(12, 12),
        colHeaders: true,
        rowHeaders: true,
        mergeCells: [
          { row: 1, col: 3, rowspan: 1, colspan: 3 },
          { row: 2, col: 1, rowspan: 2, colspan: 4 },
          { row: 4, col: 1, rowspan: 2, colspan: 4 },
          { row: 2, col: 5, rowspan: 4, colspan: 2 },
          { row: 2, col: 8, rowspan: 2, colspan: 1 },
          { row: 5, col: 8, rowspan: 1, colspan: 2 },
          { row: 6, col: 5, rowspan: 2, colspan: 2 },
          { row: 6, col: 7, rowspan: 2, colspan: 1 },
          { row: 7, col: 1, rowspan: 3, colspan: 3 },
        ]
      });

      selectCell(1, 1, 9, 6);

      const focusOrder = [
        '1,2', '1,3', '1,6',
        '2,1', '2,5',
        '4,1',
        '6,1', '6,2', '6,3', '6,4', '6,5',
        '7,1', '7,4',
        '8,4', '8,5', '8,6',
        '9,4', '9,5', '9,6',
        '1,1',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 1,1 to: 9,6`]);
      });
      expect(focusOrder.length).toBe(20);
    });
  });
});
