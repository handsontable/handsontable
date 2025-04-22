describe('noEditor', () => {
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

  it('shouldn\'t begin editing when enterBeginsEditing equals true', async() => {
    handsontable({
      enterBeginsEditing: true,
      editor: false
    });

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(getSelected()).toEqual([[2, 2, 2, 2]]);
    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t move down after editing', async() => {
    handsontable({
      editor: false
    });

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(getSelected()).toEqual([[2, 2, 2, 2]]);
  });

  it('shouldn\'t move down when enterBeginsEditing equals false', async() => {
    handsontable({
      enterBeginsEditing: false,
      editor: false
    });

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(getSelected()).toEqual([[3, 2, 3, 2]]);
    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t render any value in editor', async() => {
    handsontable({
      editor: false
    });

    await setDataAtCell(2, 2, 'string');

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(keyProxy().length).toEqual(0);
  });

  it('shouldn\'t open editor after hitting F2', async() => {
    handsontable({
      editor: false
    });

    await selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    await keyDownUp('f2');

    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t open editor after hitting CapsLock', async() => {
    handsontable({
      editor: false
    });

    await selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    await keyDownUp('capslock');

    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t open editor after double clicking on a cell', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2),
      editor: false
    });

    const cell = $(getCell(0, 0));

    await mouseDoubleClick(cell);

    expect(getActiveEditor()).toBe(undefined);
    expect(isEditorVisible()).toBe(false);
  });

  it('should not open editor after pressing a printable character', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      editor: false
    });

    await selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    await keyDownUp('a');

    expect(isEditorVisible()).toBe(false);
  });

  it('should not open editor after pressing a printable character with shift key', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      editor: false
    });

    await selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    await keyDownUp(['shift', 'a']);

    expect(isEditorVisible()).toBe(false);
  });

  it('should not not open editor after hitting ALT', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      editor: false
    });
    expect(getDataAtCell(0, 0)).toEqual('A1');

    await selectCell(0, 0);
    await keyDownUp('alt');

    expect(isEditorVisible()).toBe(false);
  });

  it('should blur `activeElement` while preparing the editor to open', async() => {
    const externalInputElement = document.createElement('input');

    document.body.appendChild(externalInputElement);
    spyOn(externalInputElement, 'blur').and.callThrough();

    handsontable({
      editor: false,
    });

    externalInputElement.select();

    await selectCell(2, 2);

    expect(externalInputElement.blur).toHaveBeenCalled();
    expect(document.activeElement).not.toBe(externalInputElement);

    document.body.removeChild(externalInputElement);
  });
});
