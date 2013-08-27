describe('passwordEditor', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it("should display editor as password field", function () {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          editor: Handsontable.PasswordEditor
        }
      ]
    });

    selectCell(0, 0);
    keyDown('enter');

    var editor = $('.handsontableInput');

    expect(editor.is(':visible')).toBe(true);
    expect(editor.is(':password')).toBe(true);

  });

  it("should set passwordEditor using 'password' alias", function () {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          editor: 'password'
        }
      ]
    });

    selectCell(0, 0);
    keyDown('enter');

    var editor = $('.handsontableInput');

    expect(editor.is(':visible')).toBe(true);
    expect(editor.is(':password')).toBe(true);

  });

  it("should set passwordEditor using column type 'password' ", function () {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          type: 'password'
        }
      ]
    });

    selectCell(0, 0);
    keyDown('enter');

    var editorHolder = $('.handsontableInputHolder');
    var editor = editorHolder.find('.handsontableInput');

    expect(editorHolder.is(':visible')).toBe(true);
    expect(editor.is(':password')).toBe(true);

  });

  it("should save values typed in passwordEditor", function () {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          editor: Handsontable.PasswordEditor
        }
      ]
    });

    selectCell(0, 0);

    expect(getDataAtCell(0, 0)).toMatch('Joe');
    expect(getRenderedValue(0, 0)).toMatch('Joe');

    keyDown('enter');


    var editorHolder = $('.handsontableInputHolder');
    var editor = editorHolder.find('.handsontableInput');

    expect(editorHolder.is(':visible')).toBe(true);

    editor.val('Edgar');

    selectCell(1, 0); //closes editor and saves current value

    expect(editorHolder.is(':visible')).toBe(false);

    expect(getDataAtCell(0, 0)).toMatch('Edgar');
    expect(getRenderedValue(0, 0)).toMatch('Edgar');

  });

});