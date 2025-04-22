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

  describe('"Shift + Enter"', () => {
    it('should correctly navigate backward vertically through the merged cells (auto-wrapping is disabled)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        autoWrapRow: false,
        autoWrapCol: false,
        enterBeginsEditing: false,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ]
      });

      selectCell(4, 2);
      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
    });

    it('should correctly navigate backward vertically through the merged cells (auto-wrapping is enabled)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        autoWrapRow: true,
        autoWrapCol: true,
        enterBeginsEditing: false,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ]
      });

      selectCell(4, 2);
      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,3']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 4,0 to: 4,0']);
    });

    it('should correctly navigate backward vertically through the merged cells within the range', () => {
      const hot = handsontable({
        data: createSpreadsheetData(7, 7),
        colHeaders: true,
        rowHeaders: true,
        enterBeginsEditing: false,
        mergeCells: [
          { row: 2, col: 2, rowspan: 3, colspan: 3 }
        ]
      });

      selectCell(1, 1, 5, 5);
      hot.selection.setRangeFocus(cellCoords(5, 3));
      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,1 to: 5,5']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,2 from: 1,1 to: 5,5']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 5,5']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 5,5']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,1 from: 1,1 to: 5,5']);
    });

    it('should correctly navigate backward vertically through two adjacent vertically merged cells', () => {
      handsontable({
        data: createSpreadsheetData(6, 3),
        colHeaders: true,
        rowHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 3, colspan: 3 },
          { row: 3, col: 0, rowspan: 3, colspan: 3 },
        ]
      });

      selectCell(5, 2, 0, 0);
      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 5,2 to: 0,0']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 5,2 to: 0,0']);
    });

    it('should correctly navigate backward vertically through two adjacent horizontally merged cells', () => {
      handsontable({
        data: createSpreadsheetData(3, 6),
        colHeaders: true,
        rowHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 3, colspan: 3 },
          { row: 0, col: 3, rowspan: 3, colspan: 3 },
        ]
      });

      selectCell(0, 5, 2, 0);
      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,5 to: 2,0']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,5 to: 2,0']);
    });

    it('should correctly navigate backward vertically through the merged cells within the range (complex example)', () => {
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

      selectCell(9, 6, 1, 1);

      const focusOrder = [
        '8,6', '1,6',
        '9,5', '8,5', '6,5', '2,5',
        '9,4', '8,4', '7,4', '6,4',
        '6,3', '1,3',
        '6,2', '1,2',
        '7,1', '6,1', '4,1', '2,1', '1,1',
        '9,6',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 9,6 to: 1,1`]);
      });
      expect(focusOrder.length).toBe(20);
    });

    it('should correctly navigate backward horizontally through the merged cells within the range ' +
       '(complex example, top-start to bottom-end selection, hidden indexes)', () => {
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

      render();
      selectCell(1, 1, 9, 7);

      const focusOrder = [
        '8,6', '1,6',
        '8,5', '6,5', '2,5',
        '8,4', '7,4', '6,4',
        '6,3', '1,3',
        '7,2', '6,2', '5,2', '2,2', '1,2',
        '8,6',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 1,1 to: 9,7`]);
      });
      expect(focusOrder.length).toBe(16);
    });

    it('should correctly navigate backward horizontally through the merged cells within the range ' +
       '(complex example, top-end to bottom-start selection, hidden indexes)', () => {
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

      render();
      selectCell(1, 7, 9, 1);

      const focusOrder = [
        '8,5', '6,5', '2,5',
        '8,4', '7,4', '6,4',
        '6,3', '1,3',
        '7,2', '6,2', '5,2', '2,2', '1,2',
        '8,6', '1,6',
        '8,5',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 1,7 to: 9,1`]);
      });
      expect(focusOrder.length).toBe(16);
    });

    it('should correctly navigate backward horizontally through the merged cells within the range ' +
       '(complex example, bottom-end to top-start selection, hidden indexes)', () => {
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

      render();
      selectCell(9, 7, 1, 1);

      const focusOrder = [
        '1,6',
        '8,5', '6,5', '2,5',
        '8,4', '7,4', '6,4',
        '6,3', '1,3',
        '7,2', '6,2', '5,2', '2,2', '1,2',
        '8,6', '1,6',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 9,7 to: 1,1`]);
      });
      expect(focusOrder.length).toBe(16);
    });

    it('should correctly navigate backward horizontally through the merged cells within the range ' +
       '(complex example, bottom-start to top-end selection, hidden indexes)', () => {
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

      render();
      selectCell(9, 1, 1, 7);

      const focusOrder = [
        '6,2', '5,2', '2,2', '1,2',
        '8,6', '1,6',
        '8,5', '6,5', '2,5',
        '8,4', '7,4', '6,4',
        '6,3', '1,3',
        '7,2', '6,2',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 9,1 to: 1,7`]);
      });
      expect(focusOrder.length).toBe(16);
    });

    it('should navigate backward vertically through the fully visible merged cells only (left-to-right column header selection)', () => {
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

      selectColumns(2, 4);
      listen();

      const focusOrder = [
        '10,4', '9,4', '8,4', '7,4', '6,4', '0,4',
        '10,3', '6,3', '0,3',
        '10,2', '6,2', '1,2', '0,2',
        '10,4',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: -1,2 to: 10,4`]);
      });
      expect(focusOrder.length).toBe(14);
    });

    it('should navigate backward vertically through the fully visible merged cells only (left-to-right column header selection, navigable headers on)', () => {
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

      selectColumns(2, 4, -1);
      listen();

      const focusOrder = [
        '10,4', '9,4', '8,4', '7,4', '6,4', '0,4',
        '10,3', '6,3', '0,3',
        '10,2', '6,2', '1,2', '0,2',
        '10,4',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: -1,2 to: 10,4`]);
      });
      expect(focusOrder.length).toBe(14);
    });

    it('should navigate backward vertically through the fully visible merged cells only (right-to-left column header selection)', () => {
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

      selectColumns(4, 2);
      listen();

      const focusOrder = [
        '10,3', '6,3', '0,3',
        '10,2', '6,2', '1,2', '0,2',
        '10,4', '9,4', '8,4', '7,4', '6,4', '0,4',
        '10,3',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: -1,4 to: 10,2`]);
      });
      expect(focusOrder.length).toBe(14);
    });

    it('should navigate backward vertically through the fully visible merged cells only (right-to-left column header selection, navigable headers on)', () => {
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

      selectColumns(4, 2, -1);
      listen();

      const focusOrder = [
        '10,3', '6,3', '0,3',
        '10,2', '6,2', '1,2', '0,2',
        '10,4', '9,4', '8,4', '7,4', '6,4', '0,4',
        '10,3',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: -1,4 to: 10,2`]);
      });
      expect(focusOrder.length).toBe(14);
    });

    it('should navigate backward vertically through the fully visible merged cells only (top-to-bottom row header selection)', () => {
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

      selectRows(2, 4);
      listen();

      const focusOrder = [
        '4,9', '3,9', '2,9',
        '4,8', '2,8',
        '4,7', '3,7', '2,7',
        '2,1',
        '4,0', '3,0', '2,0',
        '4,9',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 2,-1 to: 4,9`]);
      });
      expect(focusOrder.length).toBe(13);
    });

    it('should navigate backward vertically through the fully visible merged cells only (top-to-bottom row header selection, navigable headers on)', () => {
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

      selectRows(2, 4, -1);
      listen();

      const focusOrder = [
        '4,9', '3,9', '2,9',
        '4,8', '2,8',
        '4,7', '3,7', '2,7',
        '2,1',
        '4,0', '3,0', '2,0',
        '4,9',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 2,-1 to: 4,9`]);
      });
      expect(focusOrder.length).toBe(13);
    });

    it('should navigate backward vertically through the fully visible merged cells only (bottom-to-top row header selection)', () => {
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

      selectRows(4, 2);
      listen();

      const focusOrder = [
        '3,0', '2,0',
        '4,9', '3,9', '2,9',
        '4,8', '2,8',
        '4,7', '3,7', '2,7',
        '2,1',
        '4,0', '3,0',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 4,-1 to: 2,9`]);
      });
      expect(focusOrder.length).toBe(13);
    });

    it('should navigate backward vertically through the fully visible merged cells only (bottom-to-top row header selection, navigable headers on)', () => {
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

      selectRows(4, 2, -1);
      listen();

      const focusOrder = [
        '4,0', '3,0', '2,0',
        '4,9', '3,9', '2,9',
        '4,8', '2,8',
        '4,7', '3,7', '2,7',
        '2,1',
        '4,0',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 4,-1 to: 2,9`]);
      });
      expect(focusOrder.length).toBe(13);
    });

    it('should navigate backward vertically through the fully visible merged cells only ' +
       '(left-to-right column header selection, navigable headers on, hidden indexes)', () => {
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
      rowHiddenMap.setValueAtIndex(8, true);

      render();
      selectColumns(0, 2, -1);
      listen();

      const focusOrder = [
        '10,2', '6,2', '1,2', '0,2',
        '10,0', '9,0', '7,0', '6,0', '5,0', '4,0', '2,0', '1,0', '0,0',
        '10,2',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: -1,0 to: 10,2`]);
      });
      expect(focusOrder.length).toBe(14);
    });

    it('should navigate backward horizontally through the fully visible merged cells only ' +
       '(right-to-left column header selection, navigable headers on, hidden indexes)', () => {
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
      rowHiddenMap.setValueAtIndex(8, true);

      render();
      selectColumns(2, 0, -1);
      listen();

      const focusOrder = [
        '10,0', '9,0', '7,0', '6,0', '5,0', '4,0', '2,0', '1,0', '0,0',
        '10,2', '6,2', '1,2', '0,2',
        '10,0',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: -1,2 to: 10,0`]);
      });
      expect(focusOrder.length).toBe(14);
    });

    it('should navigate backward vertically through the fully visible merged cells only ' +
       '(top-to-bottom row header selection, navigable headers on, hidden indexes)', () => {
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

      render();
      selectRows(5, 8, -1);
      listen();

      const focusOrder = [
        '6,9',
        '5,8',
        '5,7',
        '8,5', '6,5',
        '8,4', '6,4',
        '6,3',
        '6,2',
        '8,0', '6,0', '5,0',
        '6,9',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 5,-1 to: 8,9`]);
      });
      expect(focusOrder.length).toBe(13);
    });

    it('should navigate backward vertically through the fully visible merged cells only ' +
       '(bottom-to-top row header selection, navigable headers on, hidden indexes)', () => {
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

      render();
      selectRows(8, 5, -1);
      listen();

      const focusOrder = [
        '8,0', '6,0', '5,0',
        '6,9',
        '5,8',
        '5,7',
        '8,5', '6,5',
        '8,4', '6,4',
        '6,3',
        '6,2',
        '8,0',
      ];

      focusOrder.forEach((focusPosition) => {
        keyDownUp(['shift', 'enter']);
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${focusPosition} from: 8,-1 to: 5,9`]);
      });
      expect(focusOrder.length).toBe(13);
    });
  });
});
