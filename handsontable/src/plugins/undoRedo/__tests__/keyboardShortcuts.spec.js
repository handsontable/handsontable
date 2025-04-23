describe('UndoRedo keyboard shortcuts', () => {
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

  it('should undo single change after hitting CTRL+Z', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });

    await selectCell(0, 0);
    await setDataAtCell(0, 0, 'new value');

    await keyDownUp(['control/meta', 'z']);
    expect(getDataAtCell(0, 0)).toBe('A1');
  });

  it('should redo single change after hitting CTRL+Y', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });

    await selectCell(0, 0);
    await setDataAtCell(0, 0, 'new value');

    expect(getDataAtCell(0, 0)).toBe('new value');

    getPlugin('undoRedo').undo();
    expect(getDataAtCell(0, 0)).toBe('A1');

    await keyDownUp(['control/meta', 'y']);

    expect(getDataAtCell(0, 0)).toBe('new value');
  });

  it('should redo single change after hitting CTRL+SHIFT+Z', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });

    await selectCell(0, 0);
    await setDataAtCell(0, 0, 'new value');

    expect(getDataAtCell(0, 0)).toBe('new value');

    getPlugin('undoRedo').undo();
    expect(getDataAtCell(0, 0)).toBe('A1');

    await keyDownUp(['control/meta', 'shift', 'z']);

    expect(getDataAtCell(0, 0)).toBe('new value');
  });

  it('should be possible to block keyboard shortcuts', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      beforeKeyDown: (e) => {
        const ctrlDown = (e.ctrlKey || e.metaKey) && !e.altKey;

        if (ctrlDown && (e.keyCode === 90 || (e.shiftKey && e.keyCode === 90))) {
          Handsontable.dom.stopImmediatePropagation(e);
        }
      }
    });

    await selectCell(0, 0);
    await setDataAtCell(0, 0, 'new value');

    await keyDownUp(['control/meta', 'z']);
    expect(getDataAtCell(0, 0)).toBe('new value');
  });
});
