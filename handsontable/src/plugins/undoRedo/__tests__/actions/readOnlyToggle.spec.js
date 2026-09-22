describe('UndoRedo -> ReadOnlyToggle action', () => {
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

    await selectCell(1, 1, 2, 2);
    await contextMenu();
    await selectContextMenuOption('Read only');

    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'read_only_toggle',
      ranges: [{
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 2, col: 2 },
      }],
      readOnly: true,
      stateBefore: { 1: [undefined, false, false], 2: [undefined, false, false] },
    });
  });

  it('should undo and redo a single-cell toggle', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
    });

    await selectCell(0, 0);
    await contextMenu();
    await selectContextMenuOption('Read only');

    expect(getCellMeta(0, 0).readOnly).toBe(true);

    getPlugin('undoRedo').undo();

    expect(getCellMeta(0, 0).readOnly).toBe(false);

    getPlugin('undoRedo').redo();

    expect(getCellMeta(0, 0).readOnly).toBe(true);
  });

  it('should undo a range toggle in one action', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
    });

    await selectCell(0, 0, 2, 2);
    await contextMenu();
    await selectContextMenuOption('Read only');

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(getCellMeta(1, 1).readOnly).toBe(true);
    expect(getCellMeta(2, 2).readOnly).toBe(true);

    getPlugin('undoRedo').undo();

    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect(getCellMeta(1, 1).readOnly).toBe(false);
    expect(getCellMeta(2, 2).readOnly).toBe(false);
  });

  it('should restore each cell to its OWN prior state when undoing a mixed-state selection', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      contextMenu: true,
    });

    // Seed a mixed selection: (0,0) and (2,2) already read-only, the rest writable.
    getCellMeta(0, 0).readOnly = true;
    getCellMeta(2, 2).readOnly = true;

    await selectCell(0, 0, 2, 2);
    await contextMenu();
    await selectContextMenuOption('Read only');

    // "At least one read-only" -> the whole range is made writable.
    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect(getCellMeta(1, 1).readOnly).toBe(false);
    expect(getCellMeta(2, 2).readOnly).toBe(false);

    getPlugin('undoRedo').undo();

    // Each cell must come back to what IT carried before the toggle, not to a single uniform value.
    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect(getCellMeta(1, 1).readOnly).toBe(false);
    expect(getCellMeta(2, 2).readOnly).toBe(true);
  });

  it('should undo a sequence of read-only toggles', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
    });

    await selectCell(0, 0);
    await contextMenu();
    await selectContextMenuOption('Read only');

    await selectCell(1, 1);
    await contextMenu();
    await selectContextMenuOption('Read only');

    await selectCell(2, 2);
    await contextMenu();
    await selectContextMenuOption('Read only');

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(getCellMeta(1, 1).readOnly).toBe(true);
    expect(getCellMeta(2, 2).readOnly).toBe(true);

    getPlugin('undoRedo').undo();

    expect(getCellMeta(2, 2).readOnly).toBe(false);
    expect(getCellMeta(1, 1).readOnly).toBe(true);

    getPlugin('undoRedo').undo();

    expect(getCellMeta(1, 1).readOnly).toBe(false);
    expect(getCellMeta(0, 0).readOnly).toBe(true);

    getPlugin('undoRedo').undo();

    expect(getCellMeta(0, 0).readOnly).toBe(false);
  });

  it('should record and undo a toggle made through the column (dropdown) menu', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      colHeaders: true,
      dropdownMenu: true,
    });

    await selectCell(0, 0, 3, 0);
    await dropdownMenu(0);
    await selectDropdownMenuOption('Read only');

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(getCellMeta(3, 0).readOnly).toBe(true);

    getPlugin('undoRedo').undo();

    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect(getCellMeta(3, 0).readOnly).toBe(false);
  });
});
