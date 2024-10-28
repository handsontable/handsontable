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

  it('shouldn\'t begin editing when enterBeginsEditing equals true', () => {
    handsontable({
      enterBeginsEditing: true,
      editor: false
    });
    selectCell(2, 2);
    keyDownUp('enter');

    expect(getSelected()).toEqual([[2, 2, 2, 2]]);
    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t move down after editing', () => {
    handsontable({
      editor: false
    });
    selectCell(2, 2);
    keyDownUp('enter');
    keyDownUp('enter');

    expect(getSelected()).toEqual([[2, 2, 2, 2]]);
  });

  it('shouldn\'t move down when enterBeginsEditing equals false', () => {
    handsontable({
      enterBeginsEditing: false,
      editor: false
    });
    selectCell(2, 2);
    keyDownUp('enter');

    expect(getSelected()).toEqual([[3, 2, 3, 2]]);
    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t render any value in editor', () => {
    handsontable({
      editor: false
    });
    setDataAtCell(2, 2, 'string');
    selectCell(2, 2);
    keyDownUp('enter');

    expect(keyProxy().length).toEqual(0);
  });

  it('shouldn\'t open editor after hitting F2', () => {
    handsontable({
      editor: false
    });
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    keyDownUp('f2');

    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t open editor after hitting CapsLock', () => {
    handsontable({
      editor: false
    });
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    keyDownUp('capslock');

    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t open editor after double clicking on a cell', (done) => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      editor: false
    });

    const cell = $(getCell(0, 0));
    let clicks = 0;

    window.scrollTo(0, cell.offset().top);

    setTimeout(() => {
      mouseDown(cell);
      mouseUp(cell);
      clicks += 1;
    }, 0);

    setTimeout(() => {
      mouseDown(cell);
      mouseUp(cell);
      clicks += 1;
    }, 100);

    setTimeout(() => {
      expect(clicks).toBe(2);
      expect(hot.getActiveEditor()).toBe(undefined);
      expect(isEditorVisible()).toBe(false);
      done();
    }, 200);
  });

  it('should not open editor after pressing a printable character', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      editor: false
    });
    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    keyDownUp('a');

    expect(isEditorVisible()).toBe(false);
  });

  it('should not open editor after pressing a printable character with shift key', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      editor: false
    });
    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    keyDownUp(['shift', 'a']);

    expect(isEditorVisible()).toBe(false);
  });

  it('should not not open editor after hitting ALT', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      editor: false
    });
    expect(getDataAtCell(0, 0)).toEqual('A1');

    selectCell(0, 0);
    keyDownUp('alt');

    expect(isEditorVisible()).toBe(false);
  });

  it('should blur `activeElement` while preparing the editor to open', () => {
    const externalInputElement = document.createElement('input');

    document.body.appendChild(externalInputElement);
    spyOn(externalInputElement, 'blur').and.callThrough();

    handsontable({
      editor: false,
    });

    externalInputElement.select();
    selectCell(2, 2);

    expect(externalInputElement.blur).toHaveBeenCalled();
    expect(document.activeElement).not.toBe(externalInputElement);

    document.body.removeChild(externalInputElement);
  });
});
