describe('EditorManager open editor', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px; overflow: auto"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to open an editor using a mouse', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await selectCell(2, 2);
    await mouseDoubleClick(getCell(2, 2));

    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor()).toBeDefined();
  });

  it('should not be possible to open an editor using a mouse when more than 2 cells are selected (while holding Shift)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await selectCell(2, 2, 2, 3);
    await keyDown('shift');
    await mouseDoubleClick(getCell(2, 3));

    expect(isEditorVisible()).toBe(false);
    expect(getActiveEditor()).toBeUndefined();
  });

  it('should be possible to open an editor using a mouse when 1 cell is selected (while holding Shift)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await selectCell(2, 2);
    await keyDown('shift');
    await mouseDoubleClick(getCell(2, 2));

    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor()).toBeDefined();
  });

  it('should not be possible to open an editor using a mouse when Ctrl/Cmd key is pressed', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await selectCell(2, 3);
    await keyDown('control/meta');
    await mouseDoubleClick(getCell(2, 3));

    expect(isEditorVisible()).toBe(false);
    expect(getActiveEditor()).toBeUndefined();
  });

  it('should be possible to open an editor using Enter key', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await selectCell(2, 2);
    await keyDown('enter');

    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor()).toBeDefined();
  });

  it('should not be possible to open an editor using Enter key when more than 2 cells are selected (while holding Shift)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await selectCell(2, 2, 2, 3);
    await keyDownUp(['shift', 'enter']);

    expect(isEditorVisible()).toBe(false);
    expect(getActiveEditor()).toBeDefined();
    expect(getActiveEditor().row).toBe(2);
    expect(getActiveEditor().col).toBe(3);
  });

  it('should not be possible to open an editor using Enter key when Ctrl/Cmd key is pressed', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await selectCells([[1, 1], [2, 3]]);
    await keyDownUp(['control/meta', 'enter']);

    expect(isEditorVisible()).toBe(false);
    expect(getActiveEditor()).toBeDefined();
  });
});
