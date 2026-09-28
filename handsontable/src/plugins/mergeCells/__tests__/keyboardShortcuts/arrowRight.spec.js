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
    it('should move the cell selection right onto the merge\'s top row when leaving it, whatever row it was entered on (DEV-102)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ],
      });

      await selectCell(1, 0);
      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);

      await selectCell(2, 0);
      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      await keyDownUp('arrowright');

      // entered on row 2, but a horizontal exit lands on the merge's top row
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);

      await selectCell(3, 0);
      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      await keyDownUp('arrowright');

      // entered on row 3, but a horizontal exit lands on the merge's top row
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);
    });

    it('should move the cell selection right onto the merge\'s top row when leaving it, with some columns hidden (DEV-102)', async() => {
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
      await render();

      await selectCell(2, 0);
      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 3,3']);

      await keyDownUp('arrowright');

      // entered on row 2, but a horizontal exit lands on the merge's top row
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,5 from: 1,5 to: 1,5']);
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
      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,4']);
    });

    it('should move the cell selection through multiple merged cells when hidden index is selected', async() => {
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
      await render();

      await selectCell(2, 1);
      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,3 to: 2,5']);

      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,6 from: 0,6 to: 2,8']);

      await keyDownUp('arrowright');

      // a horizontal exit off the last merge lands on that merge's top row (DEV-102)
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,9 from: 0,9 to: 0,9']);

      await selectCell(1, 4);
      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,6 from: 0,6 to: 2,8']);

      await keyDownUp('arrowright');

      // a horizontal exit off the last merge lands on that merge's top row (DEV-102)
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,9 from: 0,9 to: 0,9']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the next column', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 3, colspan: 4 }
          ],
          autoWrapRow: false
        });

        await selectCell(1, 1);
        await keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,4']);
      });

      it('should NOT move the cell selection to the next column (hidden last rows)', async() => {
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
        await render();

        await selectCell(1, 1);
        await keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,4']);
      });

      it('should NOT move the cell selection to the next column (selected hidden row)', async() => {
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
        await render();

        await selectCell(1, 3);
        await keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,4']);
      });

      it('should NOT move the cell selection to the next column (multiple merged cells)', async() => {
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

        await selectCell(3, 3);
        await keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,6 from: 3,6 to: 5,8']);

        await keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,6 from: 3,6 to: 5,8']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first column of the next row', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 3, colspan: 4 }
          ],
          autoWrapRow: true
        });

        await selectCell(2, 0);
        await keyDownUp('arrowright');
        await keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
      });

      it('should move the cell selection to the top-left corner', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          mergeCells: [
            { row: 1, col: 1, rowspan: 4, colspan: 4 }
          ],
          autoWrapRow: true
        });

        await selectCell(4, 0);
        await keyDownUp('arrowright');
        await keyDownUp('arrowright');

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
          autoWrapRow: true
        });

        const hidingRowMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
        const hidingColumnMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingRowMap.setValueAtIndex(1, true);
        hidingRowMap.setValueAtIndex(4, true);
        hidingColumnMap.setValueAtIndex(1, true);
        hidingColumnMap.setValueAtIndex(4, true);
        await render();

        await selectCell(3, 0);
        await keyDownUp('arrowright');
        await keyDownUp('arrowright');

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
          autoWrapRow: true
        });

        const hidingRowMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
        const hidingColumnMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingRowMap.setValueAtIndex(1, true);
        hidingRowMap.setValueAtIndex(4, true);
        hidingColumnMap.setValueAtIndex(1, true);
        hidingColumnMap.setValueAtIndex(4, true);
        await render();

        await selectCell(3, 1);
        await keyDownUp('arrowright');

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
          autoWrapRow: true,
          navigableHeaders: true,
        });

        await selectCell(4, 4);
        await keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
      });
    });
  });
});
