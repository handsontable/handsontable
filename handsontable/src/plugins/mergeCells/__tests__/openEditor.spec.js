describe('MergeCells open editor', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer" style="width: 300px; height: 200px; overflow: auto"></div>')
      .appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to open an editor using a mouse when merge cell is selected', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ]
    });
    await selectCell(1, 1);
    await mouseDoubleClick(getCell(1, 1));

    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor()).toBeDefined();
  });

  it('should be possible to open an editor using a mouse when merge cell is selected (while holding Shift)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ]
    });
    await selectCell(1, 1);
    await keyDown('shift');
    await mouseDoubleClick(getCell(1, 1));

    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor()).toBeDefined();
  });

  it('should not be possible to open an editor using a mouse when more than 2 cells are selected (while holding Shift)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ]
    });
    await selectCell(1, 1, 2, 3);
    await keyDown('shift');
    await mouseDoubleClick(getCell(2, 3));

    expect(isEditorVisible()).toBe(false);
    expect(getActiveEditor()).toBeUndefined();
  });

  it('should not be possible to open an editor using a mouse when Ctrl/Cmd key is pressed', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ]
    });
    await selectCell(1, 1);
    await keyDown('control/meta');
    await mouseDoubleClick(getCell(1, 1));

    expect(isEditorVisible()).toBe(false);
    expect(getActiveEditor()).toBeUndefined();
  });

  it('should be possible to open an editor for merged cell using Enter key', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ]
    });
    await selectCell(1, 1);
    await keyDown('enter');

    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor()).toBeDefined();
  });

  it('should be possible to open an editor for merged cell using Enter (while holding Shift)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ]
    });
    await selectCell(1, 1);
    await keyDownUp(['shift', 'enter']);

    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor()).toBeDefined();
    expect(getActiveEditor().row).toBe(1);
    expect(getActiveEditor().col).toBe(1);
  });

  it('should not be possible to open an editor using Enter key when Ctrl/Cmd key is pressed', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 }
      ]
    });
    await selectCells([[1, 1], [3, 4]]);
    await keyDownUp(['control/meta', 'enter']);

    expect(isEditorVisible()).toBe(false);
    expect(getActiveEditor()).toBeDefined();
  });

  using('DOM virtualization as', [false, true], (virtualized) => {
    it('should render the editor correctly after scroll for very wide merged cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 100),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 2, colspan: 90 }
          ]
        }
      });

      await selectCell(1, 90);

      await sleep(10);

      await keyDownUp('enter');

      await sleep(50);

      expect(isEditorVisible()).toBe(true);
      expect($(getActiveEditor().TEXTAREA_PARENT).offset()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual({ top: 49, left: 50 });
        main.toEqual({ top: 58, left: 50 });
        horizon.toEqual({ top: 74, left: 50 });
      });
    });

    it('should render the editor correctly after scroll for very high merged cell', async() => {
      handsontable({
        data: createSpreadsheetData(100, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 90, colspan: 2 }
          ]
        }
      });

      await selectCell(90, 1);

      await sleep(10);

      await keyDownUp('enter');

      await sleep(50);

      expect(isEditorVisible()).toBe(true);
      expect($(getActiveEditor().TEXTAREA_PARENT).offset()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual({ top: 27, left: 99 });
        main.toEqual({ top: 30, left: 100 });
        horizon.toEqual({ top: 38, left: 108 });
      });
    });
  });
});
