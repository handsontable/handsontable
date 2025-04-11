describe('Core_destroyEditor', () => {
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

  it('editor should not be visible', async() => {
    handsontable();

    await selectCell(1, 1);
    await keyDownUp('enter');

    destroyEditor();

    expect(isEditorVisible()).toEqual(false);
  });

  it('value should be saved', async() => {
    handsontable();

    await selectCell(1, 1);
    await keyDownUp('enter');

    keyProxy().val('Ted');

    destroyEditor();
    expect(getDataAtCell(1, 1)).toEqual('Ted');
  });

  it('cell should be selected', async() => {
    handsontable();

    await selectCell(1, 1);
    await keyDownUp('enter');

    destroyEditor();
    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
  });

  it('should revert original value when param set to true', async() => {
    handsontable();

    await selectCell(1, 1);
    await keyDownUp('enter');

    keyProxy().val('Ted');

    destroyEditor(true);
    expect(getDataAtCell(1, 1)).toEqual(null);
  });

  it('should not destroy editor on scroll', async() => {
    spec().$container.css({
      width: 200,
      height: 100
    });

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 10)
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = $('.handsontableInputHolder');

    expect(editor.is(':visible')).toBe(true);

    spec().$container.scroll();

    expect(editor.is(':visible')).toBe(true);

  });

});
