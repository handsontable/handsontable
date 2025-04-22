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

  describe('"ArrowUp"', () => {
    it('should move the cell selection up keeping the internal current focus position', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ],
      });

      selectCell(4, 1);
      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);

      selectCell(4, 2);
      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      selectCell(4, 3);
      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);
    });

    it('should move the cell selection up keeping the internal current focus position when some rows are hidden', () => {
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
      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 1,1 to: 3,3']);

      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
    });

    it('should not move the cell selection when there is only one merged cell', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 5, colspan: 5 }
        ],
      });

      selectCell(0, 0);
      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,4']);
    });

    it('should move the cell selection through multiple merged cells when hidden index is selected', () => {
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

      selectCell(10, 2);
      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 7,0 from: 5,0 to: 7,2']);

      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 4,2']);

      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);

      selectCell(5, 1);
      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 4,2']);

      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the previous column', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 1, rowspan: 4, colspan: 3 }
          ],
          autoWrapCol: false
        });

        selectCell(0, 1);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 3,3']);
      });

      it('should NOT move the cell selection to the previous column (hidden first rows)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 1, rowspan: 4, colspan: 3 }
          ],
          autoWrapCol: false
        });

        const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(0, true);
        hidingMap.setValueAtIndex(1, true);
        render();

        selectCell(2, 1);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 0,1 to: 3,3']);
      });

      it('should NOT move the cell selection to the previous column (selected hidden row)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 1, rowspan: 4, colspan: 3 }
          ],
          autoWrapCol: false
        });

        const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(0, true);
        hidingMap.setValueAtIndex(1, true);
        render();

        selectCell(1, 1);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 0,1 to: 3,3']);
      });

      it('should NOT move the cell selection to the previous column (multiple merged cells)', () => {
        handsontable({
          data: createSpreadsheetData(9, 6),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 0, rowspan: 3, colspan: 3 },
            { row: 3, col: 0, rowspan: 3, colspan: 3 },
            { row: 0, col: 3, rowspan: 3, colspan: 3 },
            { row: 3, col: 3, rowspan: 3, colspan: 3 },
            { row: 6, col: 0, rowspan: 3, colspan: 3 },
            { row: 6, col: 3, rowspan: 3, colspan: 3 },
          ],
          autoWrapCol: false,
        });

        selectCell(3, 0);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);

        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the last row of the previous column', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 1, rowspan: 4, colspan: 3 }
          ],
          autoWrapCol: true
        });

        selectCell(4, 2);
        keyDownUp('arrowup');
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);
      });

      it('should move the cell selection to the bottom-right corner', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 0, rowspan: 4, colspan: 4 }
          ],
          autoWrapCol: true
        });

        selectCell(4, 0);
        keyDownUp('arrowup');
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the bottom-right corner (hidden indexes)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 0, rowspan: 4, colspan: 4 }
          ],
          autoWrapCol: true
        });

        const hidingRowMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
        const hidingColumnMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingRowMap.setValueAtIndex(0, true);
        hidingRowMap.setValueAtIndex(3, true);
        hidingColumnMap.setValueAtIndex(0, true);
        hidingColumnMap.setValueAtIndex(3, true);
        render();

        selectCell(4, 1);
        keyDownUp('arrowup');
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the bottom-right corner (selected hidden row)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 0, rowspan: 4, colspan: 4 }
          ],
          autoWrapCol: true
        });

        const hidingRowMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
        const hidingColumnMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingRowMap.setValueAtIndex(0, true);
        hidingRowMap.setValueAtIndex(3, true);
        hidingColumnMap.setValueAtIndex(0, true);
        hidingColumnMap.setValueAtIndex(3, true);
        render();

        selectCell(3, 1);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the column header (navigableHeaders on)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 0, rowspan: 4, colspan: 4 }
          ],
          autoWrapCol: true,
          navigableHeaders: true,
        });

        selectCell(4, 0);
        keyDownUp('arrowup');
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
      });
    });
  });
});
