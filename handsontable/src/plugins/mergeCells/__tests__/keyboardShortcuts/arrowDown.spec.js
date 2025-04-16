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

  describe('"ArrowDown"', () => {
    it('should move the cell selection down keeping the internal current focus position', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ],
      });

      await selectCell(0, 1);
      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);

      await selectCell(0, 2);
      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);

      await selectCell(0, 3);
      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,3 from: 4,3 to: 4,3']);
    });

    it('should move the cell selection down keeping the internal current focus position when some rows are hidden', async() => {
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
      await render();

      await selectCell(0, 2);
      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 1,1 to: 3,3']);

      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,2 from: 5,2 to: 5,2']);
    });

    it('should not move the cell selection when there is only one merged cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 5, colspan: 5 }
        ],
      });

      await selectCell(0, 0);
      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,4']);
    });

    it('should move the cell selection through multiple merged cells when hidden index is selected', async() => {
      handsontable({
        data: createSpreadsheetData(11, 6),
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
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(3, true);
      hidingMap.setValueAtIndex(4, true);
      hidingMap.setValueAtIndex(8, true);
      await render();

      await selectCell(1, 2);
      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,0 from: 3,0 to: 5,2']);

      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 6,0 from: 6,0 to: 8,2']);

      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 9,2 from: 9,2 to: 9,2']);

      await selectCell(4, 1);
      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 6,0 from: 6,0 to: 8,2']);

      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 9,1 from: 9,1 to: 9,1']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the next column', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 3 }
          ],
          autoWrapCol: false
        });

        await selectCell(1, 1);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 4,3']);
      });

      it('should NOT move the cell selection to the next column (hidden last rows)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 3 }
          ],
          autoWrapCol: false
        });

        const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(3, true);
        hidingMap.setValueAtIndex(4, true);
        await render();

        await selectCell(1, 1);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 4,3']);
      });

      it('should NOT move the cell selection to the next column (selected hidden row)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 3 }
          ],
          autoWrapCol: false
        });

        const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(3, true);
        hidingMap.setValueAtIndex(4, true);
        await render();

        await selectCell(3, 1);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 4,3']);
      });

      it('should NOT move the cell selection to the next column (multiple merged cells)', async() => {
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

        await selectCell(3, 3);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 6,3 from: 6,3 to: 8,5']);

        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 6,3 from: 6,3 to: 8,5']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first row of the next column', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 3 }
          ],
          autoWrapCol: true
        });

        await selectCell(0, 2);
        await keyDownUp('arrowdown');
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);
      });

      it('should move the cell selection to the top-left corner', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 4 }
          ],
          autoWrapCol: true
        });

        await selectCell(0, 4);
        await keyDownUp('arrowdown');
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner (hidden indexes)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 4 }
          ],
          autoWrapCol: true
        });

        const hidingRowMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
        const hidingColumnMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingRowMap.setValueAtIndex(1, true);
        hidingRowMap.setValueAtIndex(4, true);
        hidingColumnMap.setValueAtIndex(1, true);
        hidingColumnMap.setValueAtIndex(4, true);
        await render();

        await selectCell(0, 3);
        await keyDownUp('arrowdown');
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner (selected hidden row)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 4 }
          ],
          autoWrapCol: true
        });

        const hidingRowMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
        const hidingColumnMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingRowMap.setValueAtIndex(1, true);
        hidingRowMap.setValueAtIndex(4, true);
        hidingColumnMap.setValueAtIndex(1, true);
        hidingColumnMap.setValueAtIndex(4, true);
        await render();

        await selectCell(1, 3);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner (navigableHeaders on)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 4 }
          ],
          autoWrapCol: true,
          navigableHeaders: true,
        });

        await selectCell(4, 4);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
      });
    });
  });
});
