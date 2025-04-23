describe('UndoRedo keyboard shortcuts', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  it('should undo single change after hitting CTRL+Z', () => {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });

    selectCell(0, 0);
    setDataAtCell(0, 0, 'new value');

    keyDownUp(['control/meta', 'z']);
    expect(getDataAtCell(0, 0)).toBe('A1');
  });

  it('should redo single change after hitting CTRL+Y', () => {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });

    selectCell(0, 0);
    setDataAtCell(0, 0, 'new value');

    expect(getDataAtCell(0, 0)).toBe('new value');

    getPlugin('undoRedo').undo();
    expect(getDataAtCell(0, 0)).toBe('A1');

    keyDownUp(['control/meta', 'y']);

    expect(getDataAtCell(0, 0)).toBe('new value');
  });

  it('should redo single change after hitting CTRL+SHIFT+Z', () => {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });

    selectCell(0, 0);
    setDataAtCell(0, 0, 'new value');

    expect(getDataAtCell(0, 0)).toBe('new value');

    getPlugin('undoRedo').undo();
    expect(getDataAtCell(0, 0)).toBe('A1');

    keyDownUp(['control/meta', 'shift', 'z']);

    expect(getDataAtCell(0, 0)).toBe('new value');
  });

  it('should be possible to block keyboard shortcuts', () => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      beforeKeyDown: (e) => {
        const ctrlDown = (e.ctrlKey || e.metaKey) && !e.altKey;

        if (ctrlDown && (e.keyCode === 90 || (e.shiftKey && e.keyCode === 90))) {
          Handsontable.dom.stopImmediatePropagation(e);
        }
      }
    });

    selectCell(0, 0);
    setDataAtCell(0, 0, 'new value');

    keyDownUp(['control/meta', 'z']);
    expect(getDataAtCell(0, 0)).toBe('new value');
  });
});
