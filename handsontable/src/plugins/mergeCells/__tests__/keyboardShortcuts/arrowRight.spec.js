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

  describe('"ArrowRight"', () => {
    it('should move the cell selection right keeping the internal current focus position', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ],
      });

      selectCell(1, 0);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);

      selectCell(2, 0);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);

      selectCell(3, 0);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 3,4 to: 3,4']);
    });

    it('should move the cell selection right keeping the internal current focus position when some columns are hidden', () => {
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
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 3,3']);

      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,5 from: 2,5 to: 2,5']);
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
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,4']);
    });

    it('should move the cell selection through multiple merged cells when hidden index is selected', () => {
      handsontable({
        data: createSpreadsheetData(6, 11),
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
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(3, true);
      hidingMap.setValueAtIndex(4, true);
      hidingMap.setValueAtIndex(8, true);
      render();

      selectCell(2, 1);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,3 to: 2,5']);

      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,6 from: 0,6 to: 2,8']);

      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,9 from: 2,9 to: 2,9']);

      selectCell(1, 4);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,6 from: 0,6 to: 2,8']);

      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,9 from: 1,9 to: 1,9']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the next column', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 3, colspan: 4 }
          ],
          autoWrapRow: false
        });

        selectCell(1, 1);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,4']);
      });

      it('should NOT move the cell selection to the next column (hidden last rows)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 3, colspan: 4 }
          ],
          autoWrapRow: false
        });

        const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(3, true);
        hidingMap.setValueAtIndex(4, true);
        render();

        selectCell(1, 1);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,4']);
      });

      it('should NOT move the cell selection to the next column (selected hidden row)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 3, colspan: 4 }
          ],
          autoWrapRow: false
        });

        const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(3, true);
        hidingMap.setValueAtIndex(4, true);
        render();

        selectCell(1, 3);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,4']);
      });

      it('should NOT move the cell selection to the next column (multiple merged cells)', () => {
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

        selectCell(3, 3);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,6 from: 3,6 to: 5,8']);

        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,6 from: 3,6 to: 5,8']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first column of the next row', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 3, colspan: 4 }
          ],
          autoWrapRow: true
        });

        selectCell(2, 0);
        keyDownUp('arrowright');
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
      });

      it('should move the cell selection to the top-left corner', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 4 }
          ],
          autoWrapRow: true
        });

        selectCell(4, 0);
        keyDownUp('arrowright');
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner (hidden indexes)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 4 }
          ],
          autoWrapRow: true
        });

        const hidingRowMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
        const hidingColumnMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingRowMap.setValueAtIndex(1, true);
        hidingRowMap.setValueAtIndex(4, true);
        hidingColumnMap.setValueAtIndex(1, true);
        hidingColumnMap.setValueAtIndex(4, true);
        render();

        selectCell(3, 0);
        keyDownUp('arrowright');
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner (selected hidden row)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 4 }
          ],
          autoWrapRow: true
        });

        const hidingRowMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
        const hidingColumnMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingRowMap.setValueAtIndex(1, true);
        hidingRowMap.setValueAtIndex(4, true);
        hidingColumnMap.setValueAtIndex(1, true);
        hidingColumnMap.setValueAtIndex(4, true);
        render();

        selectCell(3, 1);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner (navigableHeaders on)', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 4 }
          ],
          autoWrapRow: true,
          navigableHeaders: true,
        });

        selectCell(4, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
      });
    });
  });
});
