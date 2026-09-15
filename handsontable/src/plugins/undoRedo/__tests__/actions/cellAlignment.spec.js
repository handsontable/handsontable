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
      stateBefore: { 1: [undefined, undefined, undefined], 2: [undefined, undefined, undefined] },
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

    expect(getCellMeta(0, 0).className).toBe('htCenter htMiddle');
    expect(getCellMeta(0, 7).className).toBe('htCenter htBottom');
    expect(getCellMeta(5, 1).className).toBe('htMiddle');
    expect(getCellMeta(5, 7).className).toBe('htBottom');
    expect(getCellMeta(7, 1).className).toBe('htRight htMiddle');
    expect(getCellMeta(7, 5).className).toBe('htRight');
    expect(getCellMeta(7, 7).className).toBe('htRight htBottom');

    // Each undo is asserted against the exact expected value, so a class name that is wrongly
    // wiped fails here just as loudly as one that is wrongly kept.
    getPlugin('undoRedo').undo();

    expect(getCellMeta(0, 7).className).toBe('htCenter');
    expect(getCellMeta(5, 7).className).toBeUndefined();
    expect(getCellMeta(7, 7).className).toBe('htRight');

    getPlugin('undoRedo').undo();

    expect(getCellMeta(0, 0).className).toBe('htCenter');
    expect(getCellMeta(5, 1).className).toBeUndefined();
    expect(getCellMeta(7, 1).className).toBe('htRight');

    getPlugin('undoRedo').undo();

    expect(getCellMeta(7, 1).className).toBeUndefined();
    expect(getCellMeta(7, 5).className).toBeUndefined();
    expect(getCellMeta(7, 7).className).toBeUndefined();

    getPlugin('undoRedo').undo();

    // Every cell is back to carrying no class name at all.
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        expect(getCellMeta(i, j).className).toBeUndefined();
      }
    }
  });

  it('should restore no class name at all when the cell had none before the alignment', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      contextMenu: true,
    });

    await selectCell(0, 0);
    await contextMenu();
    await selectContextSubmenuOption('Alignment', 'Middle');

    expect(getCellMeta(0, 0).className).toBe('htMiddle');

    getPlugin('undoRedo').undo();

    await render();

    // The undo used to fall back to ' htLeft' - a leading space plus a horizontal alignment the
    // user never picked - so undoing left the cell aligned left instead of unaligned.
    expect(getCellMeta(0, 0).className).toBeUndefined();
    expect(getCell(0, 0).classList.contains('htLeft')).toBe(false);
    expect(getCell(0, 0).classList.contains('htMiddle')).toBe(false);

    getPlugin('undoRedo').redo();

    await render();

    // Redo must land back on exactly the original value, not grow the class name.
    expect(getCellMeta(0, 0).className).toBe('htMiddle');
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
    }).not.toThrowWithCause(undefined, { handsontable: true });
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
    }).not.toThrowWithCause(undefined, { handsontable: true });
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

    expect(cellMeta.className).toContain('htCenter');
    expect(cellMeta.className).toContain('htMiddle');

    cellMeta = getCellMeta(0, 7);
    expect(cellMeta.className).toContain('htCenter');
    expect(cellMeta.className).toContain('htBottom');

    cellMeta = getCellMeta(5, 1);
    expect(cellMeta.className).toContain('htMiddle');

    cellMeta = getCellMeta(5, 7);
    expect(cellMeta.className).toContain('htBottom');

    cellMeta = getCellMeta(7, 1);
    expect(cellMeta.className).toContain('htRight');
    expect(cellMeta.className).toContain('htMiddle');

    cellMeta = getCellMeta(7, 5);
    expect(cellMeta.className).toContain('htRight');

    cellMeta = getCellMeta(7, 7);
    expect(cellMeta.className).toContain('htRight');
    expect(cellMeta.className).toContain('htBottom');

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
    expect(cellMeta.className).toContain('htCenter');
    cellMeta = getCellMeta(1, 5);
    expect(cellMeta.className).toContain('htCenter');
    cellMeta = getCellMeta(2, 8);
    expect(cellMeta.className).toContain('htCenter');

    getPlugin('undoRedo').redo();
    cellMeta = getCellMeta(6, 0);
    expect(cellMeta.className).toContain('htRight');
    cellMeta = getCellMeta(7, 5);
    expect(cellMeta.className).toContain('htRight');
    cellMeta = getCellMeta(8, 8);
    expect(cellMeta.className).toContain('htRight');

    getPlugin('undoRedo').redo();
    cellMeta = getCellMeta(0, 0);
    expect(cellMeta.className).toContain('htMiddle');
    expect(cellMeta.className).toContain('htCenter');
    cellMeta = getCellMeta(5, 1);
    expect(cellMeta.className).toContain('htMiddle');
    cellMeta = getCellMeta(8, 2);
    expect(cellMeta.className).toContain('htMiddle');
    expect(cellMeta.className).toContain('htRight');

    getPlugin('undoRedo').redo();
    cellMeta = getCellMeta(0, 6);
    expect(cellMeta.className).toContain('htBottom');
    expect(cellMeta.className).toContain('htCenter');
    cellMeta = getCellMeta(5, 7);
    expect(cellMeta.className).toContain('htBottom');
    cellMeta = getCellMeta(8, 8);
    expect(cellMeta.className).toContain('htBottom');
    expect(cellMeta.className).toContain('htRight');
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
    }).not.toThrowWithCause(undefined, { handsontable: true });
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
    }).not.toThrowWithCause(undefined, { handsontable: true });
  });
});
