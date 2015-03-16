describe('noEditor', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '" style="width: 300px; height: 200px; overflow: auto"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('shouldn\'t begin editing when enterBeginsEditing equals true', function () {
    var
      selection;

    handsontable({
      enterBeginsEditing: true,
      editor: false
    });
    selectCell(2, 2);
    keyDown('enter');
    selection = getSelected();

    expect(selection).toEqual([2, 2, 2, 2]);
    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t move down after editing', function () {
    var
      selection;

    handsontable({
      editor: false
    });
    selectCell(2, 2);
    keyDown('enter');
    keyDown('enter');
    selection = getSelected();

    expect(selection).toEqual([2, 2, 2, 2]);
  });

  it('shouldn\'t move down when enterBeginsEditing equals false', function () {
    var
      selection;

    handsontable({
      enterBeginsEditing: false,
      editor: false
    });
    selectCell(2, 2);
    keyDown('enter');
    selection = getSelected();

    expect(selection).toEqual([3, 2, 3, 2]);
    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t render any value in editor', function () {
    handsontable({
      editor: false
    });
    setDataAtCell(2, 2, "string");
    selectCell(2, 2);
    keyDown('enter');

    expect(keyProxy().length).toEqual(0);
  });

  it('shouldn\'t open editor after hitting F2', function () {
    handsontable({
      editor: false
    });
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    keyDown('f2');

    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t open editor after hitting CapsLock', function () {
    handsontable({
      editor: false
    });
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    keyDown(Handsontable.helper.keyCode.CAPS_LOCK);

    expect(isEditorVisible()).toEqual(false);
  });

  it('shouldn\'t open editor after double clicking on a cell', function () {
    var
      hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 2),
        editor: false
      }),
      cell, clicks = 0;

    cell = $(getCell(0, 0));
    clicks = 0;
    window.scrollTo(0, cell.offset().top);

    setTimeout(function () {
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 0);

    setTimeout(function () {
      mouseDown(cell);
      mouseUp(cell);
      clicks++;
    }, 100);

    waitsFor(function () {
      return clicks == 2;
    }, 'Two clicks', 1000);

    runs(function () {
      expect(hot.getActiveEditor()).toBe(undefined);
      expect(isEditorVisible()).toBe(false);
    });
  });

  it("shouldn\'t open editor after pressing a printable character", function () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      editor: false
    });
    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    this.$container.simulate('keydown', {keyCode: 'a'.charCodeAt(0)});

    expect(isEditorVisible()).toBe(false);
  });

  it("shouldn\'t open editor after pressing a printable character with shift key", function () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      editor: false
    });
    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    this.$container.simulate('keydown', {keyCode: 'a'.charCodeAt(0), shiftKey: true});

    expect(isEditorVisible()).toBe(false);
  });

  it("shouldn\'t not open editor after hitting ALT", function () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      editor: false
    });
    expect(getDataAtCell(0, 0)).toEqual('A1');

    selectCell(0, 0);
    keyDown(Handsontable.helper.keyCode.ALT);

    expect(isEditorVisible()).toBe(false);
  });
});
