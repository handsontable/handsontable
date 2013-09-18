describe('TextEditor', function () {
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

  it('should begin editing when enterBeginsEditing equals true', function () {
    handsontable({
      enterBeginsEditing: true
    });
    selectCell(2, 2);

    keyDown('enter');

    var selection = getSelected();
    expect(selection).toEqual([2, 2, 2, 2]);
    expect(isEditorVisible()).toEqual(true);
  });

  it('should move down after editing', function () {
    handsontable();
    selectCell(2, 2);

    keyDown('enter');
    keyDown('enter');

    var selection = getSelected();
    expect(selection).toEqual([3, 2, 3, 2]);
  });

  it('should move down when enterBeginsEditing equals false', function () {
    handsontable({
      enterBeginsEditing: false
    });
    selectCell(2, 2);

    keyDown('enter');

    var selection = getSelected();
    expect(selection).toEqual([3, 2, 3, 2]);
    expect(isEditorVisible()).toEqual(false);
  });

  it('should render string in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, "string");
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("string");
  });

  it('should render number in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, 13);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("13");
  });

  it('should render boolean true in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, true);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("true");
  });

  it('should render boolean false in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, false);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("false");
  });

  it('should render null in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, null);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("");
  });

  it('should render undefined in textarea', function () {
    handsontable();
    setDataAtCell(2, 2, void 0);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual("");
  });

  it('should open editor after cancelling edit and beginning it again', function () {
    handsontable();
    selectCell(2, 2);

    keyDown('f2');
    keyDown('esc');
    keyDown('f2');

    expect(isEditorVisible()).toEqual(true);
  });

  it('loadData should not destroy editor', function () {
    handsontable();
    selectCell(2, 2);

    keyDown('f2');
    loadData(getData());

    expect(isEditorVisible()).toEqual(true);
  });

  it('updateSettings should not destroy editor', function () {
    handsontable();
    selectCell(2, 2);

    keyDown('f2');
    updateSettings({data: getData()});

    expect(isEditorVisible()).toEqual(true);
  });

  it('textarea should have cell dimensions (after render)', function () {
    runs(function () {
      var data = [
        ["a", "b"],
        ["c", "d"]
      ];

      handsontable({
        data: data,
        minRows: 4,
        minCols: 4,
        minSpareRows: 4,
        minSpareCols: 4
      });

      selectCell(1, 1);
      keyDownUp('enter');

      data[1][1] = "dddddddddddddddddddd";
      render();
    });

    waits(10);

    runs(function () {
      var $td = this.$container.find('.htCore tbody tr:eq(1) td:eq(1)');
      expect(keyProxy().width()).toEqual($td.width());
    });
  });

  it('global shortcuts (like CTRL+A) should be blocked when cell is being edited', function () {
    handsontable();
    selectCell(2, 2);

    keyDownUp('enter');

    keyDown(65, {ctrlKey: true}); //CTRL+A should NOT select all table when cell is edited

    var selection = getSelected();
    expect(selection).toEqual([2, 2, 2, 2]);
    expect(isEditorVisible()).toEqual(true);
  });

  it('should open editor after double clicking on a cell', function () {

    handsontable({
      data: createSpreadsheetData(5, 2)
    });

    var cell = $(getCell(0, 0));
    var clicks = 0;

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
      expect(document.activeElement.nodeName).toEqual('TEXTAREA');
    });

  });

  it('editor size should not exceed the viewport after text edit', function () {

    handsontable({
      data: createSpreadsheetData(10, 5),
      width: 200,
      height: 200
    });

    selectCell(2, 2);

    keyDown('enter');

    expect(isEditorVisible()).toEqual(true);

    document.activeElement.value = 'Very very very very very very very very very very very very very very very very very long text';
    keyDownUp(32); //space - trigger textarea resize

    var $textarea = $(document.activeElement);
    var $wtHider = this.$container.find('.wtHider');
    expect($textarea.offset().left + $textarea.outerWidth()).not.toBeGreaterThan($wtHider.offset().left + $wtHider.outerWidth());
    expect($textarea.offset().top + $textarea.outerHeight()).not.toBeGreaterThan($wtHider.offset().top + $wtHider.outerHeight());

  });

  it("should open editor after selecting cell in another table and hitting enter", function () {
    this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');

    var hot1 = handsontable();
    var hot2 = handsontable2.call(this);

    this.$container.find('tbody tr:eq(0) td:eq(0)').mousedown();

    //Open editor in HOT1
    keyDown('enter');
    var editor = $('.handsontableInputHolder');
    expect(editor.is(':visible')).toBe(true);

    //Close editor in HOT1
    keyDown('enter');
    expect(editor.is(':visible')).toBe(false);



    this.$container2.find('tbody tr:eq(0) td:eq(0)').mousedown();

    expect(hot1.getSelected()).toBeUndefined();
    expect(hot2.getSelected()).toEqual([0, 0, 0, 0]);

    //Open editor in HOT2
    keyDown('enter');
    editor = $('.handsontableInputHolder');
    expect(editor.is(':visible')).toBe(true);

    this.$container2.remove();

    function handsontable2(options) {
      var container = this.$container2;
      container.handsontable(options);
      container[0].focus(); //otherwise TextEditor tests do not pass in IE8
      return container.data('handsontable');
    }

  });

  it("should open editor after pressing a printable character", function () {
    var hot = handsontable({
      data: createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    var editorHolder = $('.handsontableInputHolder');
    var editorInput = editorHolder.find('.handsontableInput');

    expect(editorHolder.is(':visible')).toBe(false);

    var keyboardEvent = $.Event('keydown', {
      keyCode: 'a'.charCodeAt(0)
    });

    this.$container.trigger(keyboardEvent);

    expect(editorHolder.is(':visible')).toBe(true);
  });

  it("should open editor after pressing a printable character with shift key", function () {
    var hot = handsontable({
      data: createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    var editorHolder = $('.handsontableInputHolder');
    var editorInput = editorHolder.find('.handsontableInput');

    expect(editorHolder.is(':visible')).toBe(false);


    /**
     * To reliably mimic SHIFT+SOME_KEY combination we have to trigger two events.
     * First we need to trigger keydown event with SHIFT keyCode (16)
     * and then trigger a keydown event with keyCode of SOME_KEY and shiftKey property set to true
     */
    var shiftKeyboardEvent = $.Event('keydown', {
      keyCode: 16, //shift
      shiftKey: true
    });

    var keyboardEvent = $.Event('keydown', {
      keyCode: 'a'.charCodeAt(0),
      shiftKey: true
    });

    this.$container.trigger(shiftKeyboardEvent);
    this.$container.trigger(keyboardEvent);

    expect(editorHolder.is(':visible')).toBe(true);
  });

  it("should be able to open editor after clearing cell data with DELETE", function () {
    var hot = handsontable({
      data: createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    var editorHolder = $('.handsontableInputHolder');
    var editorInput = editorHolder.find('.handsontableInput');

    expect(editorHolder.is(':visible')).toBe(false);

    var deleteKeyboardEvent = $.Event('keydown', {
      keyCode: 46 //delete
    });

    var keyboardEvent = $.Event('keydown', {
      keyCode: 'a'.charCodeAt(0)
    });

    this.$container.trigger(deleteKeyboardEvent);
    this.$container.trigger(keyboardEvent);

    expect(editorHolder.is(':visible')).toBe(true);
  });


  it("should be able to open editor after clearing cell data with BACKSPACE", function () {
    var hot = handsontable({
      data: createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    var editorHolder = $('.handsontableInputHolder');
    var editorInput = editorHolder.find('.handsontableInput');

    expect(editorHolder.is(':visible')).toBe(false);

    var backspaceKeyboardEvent = $.Event('keydown', {
      keyCode: 8 //backspace
    });

    var keyboardEvent = $.Event('keydown', {
      keyCode: 'a'.charCodeAt(0)
    });

    this.$container.trigger(backspaceKeyboardEvent);
    this.$container.trigger(keyboardEvent);

    expect(editorHolder.is(':visible')).toBe(true);
  });


  it("should scroll editor to a cell, if trying to edit cell that is outside of the viewport", function () {
    var hot = handsontable({
      data: createSpreadsheetData(20, 20),
      width: 100,
      height: 50
    });

    selectCell(0, 0);

    expect(getCell(0, 0)).not.toBeNull();
    expect(getCell(19, 19)).toBeNull();

    hot.view.scrollViewport({row: 19, col: 19});
    hot.render();

    expect(getCell(0, 0)).toBeNull();
    expect(getCell(19, 19)).not.toBeNull();

    keyDown('enter');

    expect(getCell(0, 0)).not.toBeNull();
    expect(getCell(19, 19)).toBeNull();
  });


});