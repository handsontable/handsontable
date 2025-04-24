describe('UndoRedo -> CellAlignment action', () => {
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

  it('should have defined correct action properties', async() => {
    const afterUndo = jasmine.createSpy('afterUndo');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      contextMenu: true,
      afterUndo,
    });

    await selectCells([[1, 1, 2, 2]]);
    await contextMenu();

    await selectContextSubmenuOption('Alignment', 'Right');

    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'cell_alignment',
      alignment: 'htRight',
      range: [{
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 2, col: 2 },
      }],
      stateBefore: { 1: [null, null, null], 2: [null, null, null] },
      type: 'horizontal',
    });
  });

  it('should undo a sequence of aligning cells', async() => {
    handsontable({
      data: createSpreadsheetData(9, 9),
      contextMenu: true,
      colWidths: [50, 50, 50, 50, 50, 50, 50, 50, 50],
      rowHeights: [50, 50, 50, 50, 50, 50, 50, 50, 50]
    });

    // top 3 rows center
    await selectCell(0, 0, 2, 8);
    getPlugin('contextMenu').executeCommand('alignment:center');

    // middle 3 rows unchanged - left

    // bottom 3 rows right
    await selectCell(6, 0, 8, 8);
    getPlugin('contextMenu').executeCommand('alignment:right');

    // left 3 columns - middle
    await selectCell(0, 0, 8, 2);
    getPlugin('contextMenu').executeCommand('alignment:middle');

    // middle 3 columns unchanged - top

    // right 3 columns - bottom
    await selectCell(0, 6, 8, 8);
    getPlugin('contextMenu').executeCommand('alignment:bottom');

    let cellMeta = getCellMeta(0, 0);

    expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(0, 7);
    expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(5, 1);
    expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(5, 7);
    expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(7, 1);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(7, 5);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(7, 7);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

    getPlugin('undoRedo').undo();
    cellMeta = getCellMeta(0, 7);
    expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

    cellMeta = getCellMeta(5, 7);
    expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

    cellMeta = getCellMeta(7, 7);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

    getPlugin('undoRedo').undo();

    cellMeta = getCellMeta(0, 0);
    expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

    cellMeta = getCellMeta(5, 1);
    expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

    cellMeta = getCellMeta(7, 1);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

    getPlugin('undoRedo').undo();

    cellMeta = getCellMeta(7, 1);
    expect(cellMeta.className.indexOf('htRight')).toEqual(-1);
    expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

    cellMeta = getCellMeta(7, 5);
    expect(cellMeta.className.indexOf('htRight')).toEqual(-1);

    cellMeta = getCellMeta(7, 7);
    expect(cellMeta.className.indexOf('htRight')).toEqual(-1);
    expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

    getPlugin('undoRedo').undo();

    // check if all cells are either non-adjusted or adjusted to the left (as default)
    let finish;

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        cellMeta = getCellMeta(i, j);
        finish = cellMeta.className === undefined || cellMeta.className.trim() === '' ||
          cellMeta.className.trim() === 'htLeft';

        expect(finish).toBe(true);
      }
    }
  });

  it('should undo/redo row removal with cell meta', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      cells(row, column) {
        const cellProperties = { readOnly: false };

        if (row % 2 === 0 && column % 2 === 0) {
          cellProperties.readOnly = true;
        }

        return cellProperties;
      },
    });

    await alter('remove_row', 0, 1);
    await alter('remove_row', 0, 2);
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect(getCellMeta(0, 2).readOnly).toBe(true);
    expect(getCellMeta(0, 3).readOnly).toBe(false);
    expect(getCellMeta(0, 4).readOnly).toBe(true);

    expect(getCellMeta(1, 0).readOnly).toBe(false);
    expect(getCellMeta(1, 1).readOnly).toBe(false);
    expect(getCellMeta(1, 2).readOnly).toBe(false);
    expect(getCellMeta(1, 3).readOnly).toBe(false);
    expect(getCellMeta(1, 4).readOnly).toBe(false);

    expect(getCellMeta(2, 0).readOnly).toBe(true);
    expect(getCellMeta(2, 1).readOnly).toBe(false);
    expect(getCellMeta(2, 2).readOnly).toBe(true);
    expect(getCellMeta(2, 3).readOnly).toBe(false);
    expect(getCellMeta(2, 4).readOnly).toBe(true);

    getPlugin('undoRedo').redo();
    getPlugin('undoRedo').redo();
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect(getCellMeta(0, 2).readOnly).toBe(true);
    expect(getCellMeta(0, 3).readOnly).toBe(false);
    expect(getCellMeta(0, 4).readOnly).toBe(true);

    expect(getCellMeta(1, 0).readOnly).toBe(false);
    expect(getCellMeta(1, 1).readOnly).toBe(false);
    expect(getCellMeta(1, 2).readOnly).toBe(false);
    expect(getCellMeta(1, 3).readOnly).toBe(false);
    expect(getCellMeta(1, 4).readOnly).toBe(false);

    expect(getCellMeta(2, 0).readOnly).toBe(true);
    expect(getCellMeta(2, 1).readOnly).toBe(false);
    expect(getCellMeta(2, 2).readOnly).toBe(true);
    expect(getCellMeta(2, 3).readOnly).toBe(false);
    expect(getCellMeta(2, 4).readOnly).toBe(true);
  });

  it('should undo/redo column removal with cell meta', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      cells(row, column) {
        const cellProperties = { readOnly: false };

        if (row % 2 === 0 && column % 2 === 0) {
          cellProperties.readOnly = true;
        }

        return cellProperties;
      },
    });

    await alter('remove_col', 0, 1);
    await alter('remove_col', 0, 2);
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect(getCellMeta(0, 2).readOnly).toBe(true);
    expect(getCellMeta(0, 3).readOnly).toBe(false);
    expect(getCellMeta(0, 4).readOnly).toBe(true);

    expect(getCellMeta(1, 0).readOnly).toBe(false);
    expect(getCellMeta(1, 1).readOnly).toBe(false);
    expect(getCellMeta(1, 2).readOnly).toBe(false);
    expect(getCellMeta(1, 3).readOnly).toBe(false);
    expect(getCellMeta(1, 4).readOnly).toBe(false);

    expect(getCellMeta(2, 0).readOnly).toBe(true);
    expect(getCellMeta(2, 1).readOnly).toBe(false);
    expect(getCellMeta(2, 2).readOnly).toBe(true);
    expect(getCellMeta(2, 3).readOnly).toBe(false);
    expect(getCellMeta(2, 4).readOnly).toBe(true);

    getPlugin('undoRedo').redo();
    getPlugin('undoRedo').redo();
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect(getCellMeta(0, 2).readOnly).toBe(true);
    expect(getCellMeta(0, 3).readOnly).toBe(false);
    expect(getCellMeta(0, 4).readOnly).toBe(true);

    expect(getCellMeta(1, 0).readOnly).toBe(false);
    expect(getCellMeta(1, 1).readOnly).toBe(false);
    expect(getCellMeta(1, 2).readOnly).toBe(false);
    expect(getCellMeta(1, 3).readOnly).toBe(false);
    expect(getCellMeta(1, 4).readOnly).toBe(false);

    expect(getCellMeta(2, 0).readOnly).toBe(true);
    expect(getCellMeta(2, 1).readOnly).toBe(false);
    expect(getCellMeta(2, 2).readOnly).toBe(true);
    expect(getCellMeta(2, 3).readOnly).toBe(false);
    expect(getCellMeta(2, 4).readOnly).toBe(true);
  });

  it('should not throw an error after undoing the row header aligning', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      contextMenu: true,
    });

    await selectRows(1);
    getPlugin('contextMenu').executeCommand('alignment:center');

    expect(() => {
      getPlugin('undoRedo').undo();
    }).not.toThrowError();
  });

  it('should not throw an error after undoing the column header aligning', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      contextMenu: true,
    });

    await selectColumns(1);
    getPlugin('contextMenu').executeCommand('alignment:right');

    expect(() => {
      getPlugin('undoRedo').undo();
    }).not.toThrowError();
  });

  it('should redo a sequence of aligning cells', async() => {
    handsontable({
      data: createSpreadsheetData(9, 9),
      contextMenu: true,
      colWidths: [50, 50, 50, 50, 50, 50, 50, 50, 50],
      rowHeights: [50, 50, 50, 50, 50, 50, 50, 50, 50]
    });

    // top 3 rows center
    await selectCell(0, 0, 2, 8);
    getPlugin('contextMenu').executeCommand('alignment:center');

    // middle 3 rows unchanged - left

    // bottom 3 rows right
    await selectCell(6, 0, 8, 8);
    getPlugin('contextMenu').executeCommand('alignment:right');

    // left 3 columns - middle
    await selectCell(0, 0, 8, 2);
    getPlugin('contextMenu').executeCommand('alignment:middle');

    // middle 3 columns unchanged - top

    // right 3 columns - bottom
    await selectCell(0, 6, 8, 8);
    getPlugin('contextMenu').executeCommand('alignment:bottom');

    let cellMeta = getCellMeta(0, 0);

    expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(0, 7);
    expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(5, 1);
    expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(5, 7);
    expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(7, 1);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(7, 5);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

    cellMeta = getCellMeta(7, 7);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();

    // check if all cells are either non-adjusted or adjusted to the left (as default)
    let finish;

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        cellMeta = getCellMeta(i, j);
        finish = cellMeta.className === undefined || cellMeta.className.trim() === '' ||
          cellMeta.className.trim() === 'htLeft';

        expect(finish).toBe(true);
      }
    }

    getPlugin('undoRedo').redo();
    cellMeta = getCellMeta(0, 0);
    expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
    cellMeta = getCellMeta(1, 5);
    expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
    cellMeta = getCellMeta(2, 8);
    expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);

    getPlugin('undoRedo').redo();
    cellMeta = getCellMeta(6, 0);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
    cellMeta = getCellMeta(7, 5);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
    cellMeta = getCellMeta(8, 8);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

    getPlugin('undoRedo').redo();
    cellMeta = getCellMeta(0, 0);
    expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
    cellMeta = getCellMeta(5, 1);
    expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);
    cellMeta = getCellMeta(8, 2);
    expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

    getPlugin('undoRedo').redo();
    cellMeta = getCellMeta(0, 6);
    expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
    cellMeta = getCellMeta(5, 7);
    expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);
    cellMeta = getCellMeta(8, 8);
    expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);
    expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
  });

  it('should not throw an error after redoing the row header aligning', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      contextMenu: true,
    });

    await selectRows(1);
    getPlugin('contextMenu').executeCommand('alignment:center');
    getPlugin('undoRedo').undo();

    expect(() => {
      getPlugin('undoRedo').redo();
    }).not.toThrowError();
  });

  it('should not throw an error after redoing the column header aligning', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      contextMenu: true,
    });

    await selectColumns(1);
    getPlugin('contextMenu').executeCommand('alignment:right');
    getPlugin('undoRedo').undo();

    expect(() => {
      getPlugin('undoRedo').redo();
    }).not.toThrowError();
  });
});
