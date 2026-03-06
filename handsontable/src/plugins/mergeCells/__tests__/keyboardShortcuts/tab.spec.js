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
    it('should correctly navigate forward horizontally through the merged cells (auto-wrapping is disabled)', async() => {
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

      await selectCell(2, 0);
      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toBeUndefined();
    });

    it('should correctly navigate forward horizontally through the merged cells (auto-wrapping is enabled)', async() => {
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

      await selectCell(2, 0);
      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 3,4 to: 3,4']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 4,0 to: 4,0']);
    });

    it('should correctly navigate forward horizontally through the merged cells within the range', async() => {
      handsontable({
        data: createSpreadsheetData(7, 7),
        colHeaders: true,
        rowHeaders: true,
        mergeCells: [
          { row: 2, col: 2, rowspan: 3, colspan: 3 }
        ]
      });

      await selectCell(1, 1, 5, 5);
      selection().setRangeFocus(cellCoords(3, 1));
      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,5 from: 1,1 to: 5,5']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 1,1 to: 5,5']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,5 from: 1,1 to: 5,5']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,1 from: 1,1 to: 5,5']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,2 from: 1,1 to: 5,5']);
    });

    it('should correctly navigate forward vertically through the merged cells within the multiple ranges', async() => {
      handsontable({
        data: createSpreadsheetData(7, 7),
        colHeaders: true,
        rowHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 3 },
          { row: 3, col: 3, rowspan: 3, colspan: 2 },
          { row: 1, col: 6, rowspan: 3, colspan: 1 },
        ]
      });

      await selectCells([
        [0, 0, 2, 2],
        [3, 3, 5, 5],
        [1, 6, 3, 5],
      ]);

      await keyDownUp('tab');
      await keyDownUp('tab');
      await keyDownUp('tab'); // moves focus to the next layer

      expect(getActiveSelectionLayerIndex()).toBe(0);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 3,3 from: 3,3 to: 5,5',
        'highlight: 1,6 from: 1,6 to: 3,5',
      ]);

      await keyDownUp('tab');
      await keyDownUp('tab');
      await keyDownUp('tab');
      await keyDownUp('tab'); // moves focus to the next layer

      expect(getActiveSelectionLayerIndex()).toBe(1);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,2 from: 0,0 to: 2,2',
        'highlight: 3,3 from: 3,3 to: 5,5',
        'highlight: 1,6 from: 1,6 to: 3,5',
      ]);

      await keyDownUp('tab');
      await keyDownUp('tab');
      await keyDownUp('tab');
      await keyDownUp('tab'); // moves focus to the next layer

      expect(getActiveSelectionLayerIndex()).toBe(2);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,2 from: 0,0 to: 2,2',
        'highlight: 5,5 from: 3,3 to: 5,5',
        'highlight: 1,5 from: 1,6 to: 3,5',
      ]);

      await keyDownUp('tab');
      await keyDownUp('tab');
      await keyDownUp('tab');
      await keyDownUp('tab'); // moves focus to the next layer

      expect(getActiveSelectionLayerIndex()).toBe(0);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 5,5 from: 3,3 to: 5,5',
        'highlight: 1,6 from: 1,6 to: 3,5',
      ]);
    });

    it('should correctly navigate forward vertically through the merged cells within the multiple ranges (selected only merged cells)', async() => {
      handsontable({
        data: createSpreadsheetData(7, 7),
        colHeaders: true,
        rowHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 3 },
          { row: 3, col: 3, rowspan: 3, colspan: 2 },
          { row: 1, col: 6, rowspan: 3, colspan: 1 },
        ]
      });

      await selectCells([
        [0, 0, 1, 2],
        [3, 3, 5, 4],
        [1, 6, 3, 6],
      ]);

      await keyDownUp('tab');

      expect(getActiveSelectionLayerIndex()).toBe(0);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,2',
        'highlight: 3,3 from: 3,3 to: 5,4',
        'highlight: 1,6 from: 1,6 to: 3,6',
      ]);

      await keyDownUp('tab'); // moves focus to the next layer

      expect(getActiveSelectionLayerIndex()).toBe(1);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,2',
        'highlight: 3,3 from: 3,3 to: 5,4',
        'highlight: 1,6 from: 1,6 to: 3,6',
      ]);

      await keyDownUp('tab'); // moves focus to the next layer

      expect(getActiveSelectionLayerIndex()).toBe(2);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,2',
        'highlight: 3,3 from: 3,3 to: 5,4',
        'highlight: 1,6 from: 1,6 to: 3,6',
      ]);

      await keyDownUp('tab'); // moves focus to the next layer

      expect(getActiveSelectionLayerIndex()).toBe(0);
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,2',
        'highlight: 3,3 from: 3,3 to: 5,4',
        'highlight: 1,6 from: 1,6 to: 3,6',
      ]);
    });

    it('should correctly navigate forward horizontally through two adjacent vertically merged cells', async() => {
      handsontable({
        data: createSpreadsheetData(6, 3),
        colHeaders: true,
        rowHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 3, colspan: 3 },
          { row: 3, col: 0, rowspan: 3, colspan: 3 },
        ]
      });

      await selectCell(0, 0, 5, 2);
      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 0,0 to: 5,2']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 5,2']);
    });

    it('should correctly navigate forward horizontally through two adjacent horizontally merged cells', async() => {
      handsontable({
        data: createSpreadsheetData(3, 6),
        colHeaders: true,
        rowHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 3, colspan: 3 },
          { row: 0, col: 3, rowspan: 3, colspan: 3 },
        ]
      });

      await selectCell(0, 0, 2, 5);
      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,0 to: 2,5']);

      await keyDownUp('tab');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,5']);
    });

    it('should correctly navigate forward horizontally through the merged cells within the range (complex example)', async() => {
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

      await selectCell(1, 1, 9, 6);

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

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: 1,1 to: 9,6`]);
      }

      expect(focusOrder.length).toBe(20);
    });

    it('should correctly navigate forward horizontally through the merged cells within the range ' +
       '(complex example, top-start to bottom-end selection, hidden indexes)', async() => {
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

      const columnHiddenMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
      const rowHiddenMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnHiddenMap.setValueAtIndex(1, true);
      columnHiddenMap.setValueAtIndex(7, true);
      rowHiddenMap.setValueAtIndex(4, true);
      rowHiddenMap.setValueAtIndex(9, true);

      await render();
      await selectCell(1, 1, 9, 7);

      const focusOrder = [
        '1,3', '1,6',
        '2,2', '2,5',
        '5,2',
        '6,2', '6,3', '6,4', '6,5',
        '7,2', '7,4',
        '8,4', '8,5', '8,6',
        '1,2', '1,3',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: 1,1 to: 9,7`]);
      }

      expect(focusOrder.length).toBe(16);
    });

    it('should correctly navigate forward horizontally through the merged cells within the range ' +
       '(complex example, top-end to bottom-start selection, hidden indexes)', async() => {
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

      const columnHiddenMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
      const rowHiddenMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnHiddenMap.setValueAtIndex(1, true);
      columnHiddenMap.setValueAtIndex(7, true);
      rowHiddenMap.setValueAtIndex(4, true);
      rowHiddenMap.setValueAtIndex(9, true);

      await render();
      await selectCell(1, 7, 9, 1);

      const focusOrder = [
        '2,2', '2,5',
        '5,2',
        '6,2', '6,3', '6,4', '6,5',
        '7,2', '7,4',
        '8,4', '8,5', '8,6',
        '1,2', '1,3', '1,6',
        '2,2',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: 1,7 to: 9,1`]);
      }

      expect(focusOrder.length).toBe(16);
    });

    it('should correctly navigate forward horizontally through the merged cells within the range ' +
       '(complex example, bottom-end to top-start selection, hidden indexes)', async() => {
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

      const columnHiddenMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
      const rowHiddenMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnHiddenMap.setValueAtIndex(1, true);
      columnHiddenMap.setValueAtIndex(7, true);
      rowHiddenMap.setValueAtIndex(4, true);
      rowHiddenMap.setValueAtIndex(9, true);

      await render();
      await selectCell(9, 7, 1, 1);

      const focusOrder = [
        '1,2', '1,3', '1,6',
        '2,2', '2,5',
        '5,2',
        '6,2', '6,3', '6,4', '6,5',
        '7,2', '7,4',
        '8,4', '8,5', '8,6',
        '1,2',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: 9,7 to: 1,1`]);
      }

      expect(focusOrder.length).toBe(16);
    });

    it('should correctly navigate forward horizontally through the merged cells within the range ' +
       '(complex example, bottom-start to top-end selection, hidden indexes)', async() => {
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

      const columnHiddenMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
      const rowHiddenMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnHiddenMap.setValueAtIndex(1, true);
      columnHiddenMap.setValueAtIndex(7, true);
      rowHiddenMap.setValueAtIndex(4, true);
      rowHiddenMap.setValueAtIndex(9, true);

      await render();
      await selectCell(9, 1, 1, 7);

      const focusOrder = [
        '7,4',
        '8,4', '8,5', '8,6',
        '1,2', '1,3', '1,6',
        '2,2', '2,5',
        '5,2',
        '6,2', '6,3', '6,4', '6,5',
        '7,2', '7,4',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: 9,1 to: 1,7`]);
      }

      expect(focusOrder.length).toBe(16);
    });

    it('should navigate forward horizontally through the fully visible merged cells only (left-to-right column header selection)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 11),
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

      await selectColumns(2, 4);
      await listen();

      const focusOrder = [
        '0,3', '0,4',
        '1,2',
        '6,2', '6,3', '6,4',
        '7,4',
        '8,4',
        '9,4',
        '10,2', '10,3', '10,4',
        '0,2',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: -1,2 to: 10,4`]);
      }

      expect(focusOrder.length).toBe(13);
    });

    it('should navigate forward horizontally through the fully visible merged cells only (left-to-right column header selection, navigable headers on)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 11),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
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

      await selectColumns(2, 4, -1);
      await listen();

      const focusOrder = [
        '0,2', '0,3', '0,4',
        '1,2',
        '6,2', '6,3', '6,4',
        '7,4',
        '8,4',
        '9,4',
        '10,2', '10,3', '10,4',
        '0,2',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: -1,2 to: 10,4`]);
      }

      expect(focusOrder.length).toBe(14);
    });

    it('should navigate forward horizontally through the fully visible merged cells only (right-to-left column header selection)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 11),
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

      await selectColumns(4, 2);
      await listen();

      const focusOrder = [
        '1,2',
        '6,2', '6,3', '6,4',
        '7,4',
        '8,4',
        '9,4',
        '10,2', '10,3', '10,4',
        '0,2', '0,3', '0,4',
        '1,2',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: -1,4 to: 10,2`]);
      }

      expect(focusOrder.length).toBe(14);
    });

    it('should navigate forward horizontally through the fully visible merged cells only (right-to-left column header selection, navigable headers on)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 11),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
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

      await selectColumns(4, 2, -1);
      await listen();

      const focusOrder = [
        '0,4',
        '1,2',
        '6,2', '6,3', '6,4',
        '7,4',
        '8,4',
        '9,4',
        '10,2', '10,3', '10,4',
        '0,2', '0,3', '0,4',
        '1,2',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: -1,4 to: 10,2`]);
      }

      expect(focusOrder.length).toBe(15);
    });

    it('should navigate forward horizontally through the fully visible merged cells only (top-to-bottom row header selection)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 10),
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

      await selectRows(2, 4);
      await listen();

      const focusOrder = [
        '2,1', '2,7', '2,8', '2,9',
        '3,0', '3,7', '3,9',
        '4,0', '4,7', '4,8', '4,9',
        '2,0', '2,1',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: 2,-1 to: 4,9`]);
      }

      expect(focusOrder.length).toBe(13);
    });

    it('should navigate forward horizontally through the fully visible merged cells only (top-to-bottom row header selection, navigable headers on)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
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

      await selectRows(2, 4, -1);
      await listen();

      const focusOrder = [
        '2,0', '2,1', '2,7', '2,8', '2,9',
        '3,0', '3,7', '3,9',
        '4,0', '4,7', '4,8', '4,9',
        '2,0',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: 2,-1 to: 4,9`]);
      }

      expect(focusOrder.length).toBe(13);
    });

    it('should navigate forward horizontally through the fully visible merged cells only (bottom-to-top row header selection)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 10),
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

      await selectRows(4, 2);
      await listen();

      const focusOrder = [
        '4,7', '4,8', '4,9',
        '2,0', '2,1', '2,7', '2,8', '2,9',
        '3,0', '3,7', '3,9',
        '4,0', '4,7',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: 4,-1 to: 2,9`]);
      }

      expect(focusOrder.length).toBe(13);
    });

    it('should navigate forward horizontally through the fully visible merged cells only (bottom-to-top row header selection, navigable headers on)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
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

      await selectRows(4, 2, -1);
      await listen();

      const focusOrder = [
        '4,0', '4,7', '4,8', '4,9',
        '2,0', '2,1', '2,7', '2,8', '2,9',
        '3,0', '3,7', '3,9',
        '4,0',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: 4,-1 to: 2,9`]);
      }

      expect(focusOrder.length).toBe(13);
    });

    it('should navigate forward horizontally through the fully visible merged cells only ' +
       '(left-to-right column header selection, navigable headers on, hidden indexes)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 11),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
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

      const columnHiddenMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
      const rowHiddenMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnHiddenMap.setValueAtIndex(1, true);
      columnHiddenMap.setValueAtIndex(3, true);
      rowHiddenMap.setValueAtIndex(3, true);

      await render();

      await selectColumns(0, 2, -1);
      await listen();

      const focusOrder = [
        '0,0', '0,2',
        '1,0', '1,2',
        '2,0',
        '4,0',
        '5,0',
        '6,0', '6,2',
        '7,0',
        '8,0',
        '9,0',
        '10,0', '10,2',
        '0,0',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: -1,0 to: 10,2`]);
      }

      expect(focusOrder.length).toBe(15);
    });

    it('should navigate forward horizontally through the fully visible merged cells only ' +
        '(right-to-left column header selection, navigable headers on, hidden indexes)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 11),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
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

      const columnHiddenMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
      const rowHiddenMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnHiddenMap.setValueAtIndex(1, true);
      columnHiddenMap.setValueAtIndex(3, true);
      rowHiddenMap.setValueAtIndex(3, true);

      await render();

      await selectColumns(2, 0, -1);
      await listen();

      const focusOrder = [
        '0,2',
        '1,0', '1,2',
        '2,0',
        '4,0',
        '5,0',
        '6,0', '6,2',
        '7,0',
        '8,0',
        '9,0',
        '10,0', '10,2',
        '0,0', '0,2',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: -1,2 to: 10,0`]);
      }

      expect(focusOrder.length).toBe(15);
    });

    it('should navigate forward horizontally through the fully visible merged cells only ' +
       '(top-to-bottom row header selection, navigable headers on, hidden indexes)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        mergeCells: [
          { row: 1, col: 3, rowspan: 1, colspan: 3 },
          { row: 2, col: 1, rowspan: 2, colspan: 4 },
          { row: 4, col: 1, rowspan: 2, colspan: 4 },
          { row: 2, col: 5, rowspan: 4, colspan: 2 },
          { row: 2, col: 8, rowspan: 2, colspan: 1 },
          { row: 5, col: 8, rowspan: 1, colspan: 2 },
          { row: 6, col: 5, rowspan: 2, colspan: 4 },
          { row: 6, col: 7, rowspan: 2, colspan: 1 },
          { row: 7, col: 1, rowspan: 3, colspan: 3 },
          { row: 8, col: 6, rowspan: 2, colspan: 4 },
        ]
      });

      const columnHiddenMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
      const rowHiddenMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnHiddenMap.setValueAtIndex(1, true);
      rowHiddenMap.setValueAtIndex(3, true);
      rowHiddenMap.setValueAtIndex(7, true);

      await render();
      await selectRows(5, 8, -1);
      await listen();

      const focusOrder = [
        '5,0', '5,7', '5,8',
        '6,0', '6,2', '6,3', '6,4', '6,5', '6,9',
        '8,0', '8,4', '8,5',
        '5,0',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: 5,-1 to: 8,9`]);
      }

      expect(focusOrder.length).toBe(13);
    });

    it('should navigate forward horizontally through the fully visible merged cells only ' +
       '(bottom-to-top row header selection, navigable headers on, hidden indexes)', async() => {
      handsontable({
        data: createSpreadsheetData(11, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        mergeCells: [
          { row: 1, col: 3, rowspan: 1, colspan: 3 },
          { row: 2, col: 1, rowspan: 2, colspan: 4 },
          { row: 4, col: 1, rowspan: 2, colspan: 4 },
          { row: 2, col: 5, rowspan: 4, colspan: 2 },
          { row: 2, col: 8, rowspan: 2, colspan: 1 },
          { row: 5, col: 8, rowspan: 1, colspan: 2 },
          { row: 6, col: 5, rowspan: 2, colspan: 4 },
          { row: 6, col: 7, rowspan: 2, colspan: 1 },
          { row: 7, col: 1, rowspan: 3, colspan: 3 },
          { row: 8, col: 6, rowspan: 2, colspan: 4 },
        ]
      });

      const columnHiddenMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
      const rowHiddenMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnHiddenMap.setValueAtIndex(1, true);
      rowHiddenMap.setValueAtIndex(3, true);
      rowHiddenMap.setValueAtIndex(7, true);

      await render();
      await selectRows(8, 5, -1);
      await listen();

      const focusOrder = [
        '8,0', '8,4', '8,5',
        '5,0', '5,7', '5,8',
        '6,0', '6,2', '6,3', '6,4', '6,5', '6,9',
        '8,0',
      ];

      for (let i = 0; i < focusOrder.length; i++) {
        await keyDownUp('tab');
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusOrder[i]} from: 8,-1 to: 5,9`]);
      }

      expect(focusOrder.length).toBe(13);
    });
  });
});
