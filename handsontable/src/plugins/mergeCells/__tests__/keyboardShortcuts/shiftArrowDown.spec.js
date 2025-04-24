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

  describe('"Shift + ArrowDown"', () => {
    it('should expand the cells selection down keeping the internal current focus position', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 }
        ],
      });

      await selectCell(0, 1);
      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 3,3']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 4,3']);

      await selectCell(0, 2);
      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,1 to: 3,3']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,1 to: 4,3']);

      await selectCell(0, 3);
      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,1 to: 3,3']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,1 to: 4,3']);
    });

    it('should extend the cells selection down when focus is moved within a range', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 4, col: 1, rowspan: 2, colspan: 2 },
          { row: 6, col: 1, rowspan: 2, colspan: 2 },
        ],
      });

      await selectCells([[4, 1, 1, 1]]);
      await keyDownUp(['shift', 'enter']); // move cell focus up
      await keyDownUp(['shift', 'enter']); // move cell focus up
      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,2 to: 7,1']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,2 to: 8,1']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,2 to: 9,1']);
    });

    it('should correctly extend the cells selection down by one cell when merged cell is selected (#11010)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 },
        ],
      });

      await selectCells([[3, 3, 1, 1]]);
      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,3 to: 4,1']);
    });

    it('should expand the cells selection down keeping the internal current focus position when some rows are hidden', async() => {
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
      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,1 to: 3,3']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,1 to: 5,3']);
    });

    it('should not expand the cells selection when there is only one merged cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 0, col: 0, rowspan: 5, colspan: 5 }
        ],
      });

      await selectCell(0, 0);
      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,4']);
    });

    it('should expand the cells selection through multiple merged cells when hidden index is selected', async() => {
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
      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 5,2']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 8,2']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 9,2']);

      await selectCell(4, 1);
      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,0 from: 3,0 to: 8,2']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,0 from: 3,0 to: 9,2']);
    });

    it('should expand the cells selection through multiple merged cells that intersect with each other', async() => {
      handsontable({
        data: createSpreadsheetData(11, 8),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 3, rowspan: 1, colspan: 3 },
          { row: 2, col: 1, rowspan: 2, colspan: 4 },
          { row: 4, col: 1, rowspan: 2, colspan: 4 },
          { row: 2, col: 5, rowspan: 4, colspan: 2 },
          { row: 6, col: 5, rowspan: 2, colspan: 2 },
          { row: 5, col: 7, rowspan: 2, colspan: 1 },
          { row: 7, col: 1, rowspan: 3, colspan: 3 },
        ],
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(2, true);
      hidingMap.setValueAtIndex(5, true);
      hidingMap.setValueAtIndex(8, true);
      await render();

      await selectCell(0, 4);
      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,3 to: 1,5']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,1 to: 5,6']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,1 to: 9,6']);

      await keyDownUp(['shift', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,1 to: 10,6']);
    });
  });
});
