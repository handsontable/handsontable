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

  describe('"ArrowLeft"', () => {
    it('should move the cell selection left keeping the internal current focus position', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ],
      });

      selectCell(1, 4);
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);

      selectCell(2, 4);
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);

      selectCell(3, 4);
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
    });

    it('should move the cell selection left keeping the internal current focus position when some columns are hidden', () => {
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
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 3,3']);

      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
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
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,4']);
    });

    it('should move the cell selection through multiple merged cells when hidden index is selected', () => {
      handsontable({
        data: createSpreadsheetData(6, 11),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 0, col: 2, rowspan: 3, colspan: 3 },
          { row: 0, col: 5, rowspan: 3, colspan: 3 },
          { row: 3, col: 2, rowspan: 3, colspan: 3 },
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

      selectCell(2, 10);
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,7 from: 0,5 to: 2,7']);

      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 2,4']);

      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 2,1']);

      selectCell(1, 5);
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 2,4']);

      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the previous row', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 0, rowspan: 3, colspan: 4 }
          ],
          autoWrapRow: false
        });

        selectCell(1, 0);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 3,3']);
      });

      it('should NOT move the cell selection to the previous row (hidden first columns)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 0, rowspan: 3, colspan: 4 }
          ],
          autoWrapRow: false
        });

        const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(0, true);
        hidingMap.setValueAtIndex(1, true);
        render();

        selectCell(1, 2);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,0 to: 3,3']);
      });

      it('should NOT move the cell selection to the previous row (selected hidden column)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 0, rowspan: 3, colspan: 4 }
          ],
          autoWrapRow: false
        });

        const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(0, true);
        hidingMap.setValueAtIndex(1, true);
        render();

        selectCell(1, 1);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,0 to: 3,3']);
      });

      it('should NOT move the cell selection to the previous row (multiple merged cells)', () => {
        handsontable({
          data: createSpreadsheetData(6, 9),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 0, rowspan: 3, colspan: 3 },
            { row: 0, col: 3, rowspan: 3, colspan: 3 },
            { row: 3, col: 0, rowspan: 3, colspan: 3 },
            { row: 3, col: 3, rowspan: 3, colspan: 3 },
            { row: 0, col: 6, rowspan: 3, colspan: 3 },
            { row: 3, col: 6, rowspan: 3, colspan: 3 },
          ],
          autoWrapRow: false,
        });

        selectCell(0, 3);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);

        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the last column of the previous row', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 0, rowspan: 3, colspan: 4 }
          ],
          autoWrapRow: true
        });

        selectCell(2, 4);
        keyDownUp('arrowleft');
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);
      });

      it('should move the cell selection to the bottom-right corner', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 0, rowspan: 4, colspan: 4 }
          ],
          autoWrapRow: true
        });

        selectCell(0, 4);
        keyDownUp('arrowleft');
        keyDownUp('arrowleft');

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
          autoWrapRow: true
        });

        const hidingRowMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
        const hidingColumnMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingRowMap.setValueAtIndex(0, true);
        hidingRowMap.setValueAtIndex(3, true);
        hidingColumnMap.setValueAtIndex(0, true);
        hidingColumnMap.setValueAtIndex(3, true);
        render();

        selectCell(1, 4);
        keyDownUp('arrowleft');
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the bottom-right corner (selected hidden column)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 0, rowspan: 4, colspan: 4 }
          ],
          autoWrapRow: true
        });

        const hidingRowMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
        const hidingColumnMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingRowMap.setValueAtIndex(0, true);
        hidingRowMap.setValueAtIndex(3, true);
        hidingColumnMap.setValueAtIndex(0, true);
        hidingColumnMap.setValueAtIndex(3, true);
        render();

        selectCell(1, 3);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the row header (navigableHeaders on)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 0, col: 0, rowspan: 4, colspan: 4 }
          ],
          autoWrapRow: true,
          navigableHeaders: true,
        });

        selectCell(0, 4);
        keyDownUp('arrowleft');
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
      });
    });
  });
});
