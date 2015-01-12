describe('TextEditor', function () {
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

  it('should begin editing when enterBeginsEditing equals true', function () {
    handsontable({
      enterBeginsEditing: true,
      editor: 'text'
    });
    selectCell(2, 2);

    keyDown('enter');

    var selection = getSelected();
    expect(selection).toEqual([2, 2, 2, 2]);
    expect(isEditorVisible()).toEqual(true);
  });

  it('should move down after editing', function () {
    handsontable({
      editor: 'text'
    });
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

  it('should open editor after hitting F2', function () {
    handsontable();
    selectCell(2, 2);

    var editor = $('.handsontableInput');
    expect(isEditorVisible()).toEqual(false);
    keyDown('f2');
    expect(isEditorVisible()).toEqual(true);
  });

  it('should close editor after hitting ESC', function () {
    handsontable();
    selectCell(2, 2);

    var editor = $('.handsontableInput');
    expect(isEditorVisible()).toEqual(false);
    keyDown('f2');
    expect(isEditorVisible()).toEqual(true);
    keyDown('esc');
    expect(isEditorVisible()).toEqual(false);
  });

  it('should NOT open editor after hitting CapsLock', function () {
    handsontable();
    selectCell(2, 2);

    var editor = $('.handsontableInput');
    expect(isEditorVisible()).toEqual(false);
    keyDown(Handsontable.helper.keyCode.CAPS_LOCK);
    expect(isEditorVisible()).toEqual(false);
  });

  it('should open editor after cancelling edit and beginning it again', function () {
    handsontable();
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);
    keyDown('f2');
    expect(isEditorVisible()).toEqual(true);
    keyDown('esc');
    expect(isEditorVisible()).toEqual(false);
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
    var data = [
      ["a", "b"],
      ["c", "d"]
    ];

    var hot = handsontable({
      data: data,
      minRows: 4,
      minCols: 4,
      minSpareRows: 4,
      minSpareCols: 4,
      enterMoves: false
    });

    selectCell(1, 1);
    var $td = getHtCore().find('tbody tr:eq(1) td:eq(1)');
    var editor = hot.getActiveEditor();
    keyDownUp('enter');
    expect(keyProxy().width()).toEqual($td.width());
    keyDownUp('enter');
    data[1][1] = "dddddddddddddddddddd";
    render();
    keyDownUp('enter');

    expect(keyProxy().width()).toEqual($td.width());
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

    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2)
    });

    var cell = $(getCell(0, 0));
    var clicks = 0;

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
      var editor = hot.getActiveEditor();
      expect(editor.isOpened()).toBe(true);
    });

  });

  it('should call editor focus() method after opening an editor', function () {
    var hot = handsontable();
    selectCell(2, 2);

    var editor = hot.getActiveEditor();

    spyOn(editor, 'focus');

    expect(editor.isOpened()).toEqual(false);
    expect(editor.focus).not.toHaveBeenCalled();
    keyDown('f2');
    expect(editor.isOpened()).toEqual(true);
    expect(editor.focus).toHaveBeenCalled();
  });

  it('editor size should not exceed the viewport after text edit', function () {

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 5),
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

    expect($textarea.offset().left + $textarea.outerWidth()).not.toBeGreaterThan($wtHider.offset().left + this.$container.outerWidth());
    expect($textarea.offset().top + $textarea.outerHeight()).not.toBeGreaterThan($wtHider.offset().top + $wtHider.outerHeight());

  });

  it("should open editor after selecting cell in another table and hitting enter", function () {
    this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');

    var hot1 = handsontable();
    var hot2 = handsontable2.call(this);

    this.$container.find('tbody tr:eq(0) td:eq(0)').simulate('mousedown');
    this.$container.find('tbody tr:eq(0) td:eq(0)').simulate('mouseup');

    //Open editor in HOT1
    keyDown('enter');
    var editor = $('.handsontableInputHolder');
    expect(editor.is(':visible')).toBe(true);

    //Close editor in HOT1
    keyDown('enter');
    expect(editor.is(':visible')).toBe(false);



    this.$container2.find('tbody tr:eq(0) td:eq(0)').simulate('mousedown');
    this.$container2.find('tbody tr:eq(0) td:eq(0)').simulate('mouseup');

    expect(hot1.getSelected()).toBeUndefined();
    expect(hot2.getSelected()).toEqual([0, 0, 0, 0]);

    //Open editor in HOT2
    keyDown('enter');
    editor = $('.handsontableInputHolder');
    expect(editor.is(':visible')).toBe(true);

    this.$container2.handsontable('destroy');
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
      data: Handsontable.helper.createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    var editorHolder = $('.handsontableInputHolder');
//    var editorInput = editorHolder.find('.handsontableInput');

    expect(editorHolder.is(':visible')).toBe(false);

//    var keyboardEvent = $.Event('keydown', {
//      keyCode: 'a'.charCodeAt(0)
//    });

//    this.$container.trigger(keyboardEvent);

    this.$container.simulate('keydown', {keyCode: 'a'.charCodeAt(0)});

    expect(editorHolder.is(':visible')).toBe(true);
  });

  it("should open editor after pressing a printable character with shift key", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    var editorHolder = $('.handsontableInputHolder');
//    var editorInput = editorHolder.find('.handsontableInput');

    expect(editorHolder.is(':visible')).toBe(false);


    /**
     * To reliably mimic SHIFT+SOME_KEY combination we have to trigger two events.
     * First we need to trigger keydown event with SHIFT keyCode (16)
     * and then trigger a keydown event with keyCode of SOME_KEY and shiftKey property set to true
     */
//    var shiftKeyboardEvent = $.Event('keydown', {
//      keyCode: 16, //shift
//      shiftKey: true
//    });
//
//    var keyboardEvent = $.Event('keydown', {
//      keyCode: 'a'.charCodeAt(0),
//      shiftKey: true
//    });

    this.$container.simulate('keydown',
      {
        keyCode: 'a'.charCodeAt(0),
        shiftKey: true
      });

//    this.$container.trigger(shiftKeyboardEvent);
//    this.$container.trigger(keyboardEvent);

    expect(editorHolder.is(':visible')).toBe(true);
  });

  it("should be able to open editor after clearing cell data with DELETE", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    var editorHolder = $('.handsontableInputHolder');

    expect(editorHolder.is(':visible')).toBe(false);

    this.$container.simulate('keydown',{
      keyCode: 46
    });

    this.$container.simulate('keydown',{
      keyCode: 'a'.charCodeAt(0)
    });
    expect(editorHolder.is(':visible')).toBe(true);
  });

  it("should be able to open editor after clearing cell data with BACKSPACE", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    var editorHolder = $('.handsontableInputHolder');

    expect(editorHolder.is(':visible')).toBe(false);

    this.$container.simulate('keydown', {
      keyCode: 8 //backspace
    });

    this.$container.simulate('keydown', {
      keyCode: 'a'.charCodeAt(0)
    });

    expect(editorHolder.is(':visible')).toBe(true);
  });


  it("should scroll editor to a cell, if trying to edit cell that is outside of the viewport", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 20),
      width: 100,
      height: 50
    });

    selectCell(0, 0);

    expect(getCell(0, 0)).not.toBeNull();
    expect(getCell(19, 19)).toBeNull();

    hot.view.scrollViewport(new WalkontableCellCoords(19, 19));
    hot.render();

    expect(getCell(0, 0)).toBeNull();
    expect(getCell(19, 19)).not.toBeNull();

    keyDown('enter');

    expect(getCell(0, 0)).not.toBeNull();
    expect(getCell(19, 19)).toBeNull();
  });

  it("should open empty editor after clearing cell value width BACKSPACE", function () {
     var hot = handsontable({
       data: Handsontable.helper.createSpreadsheetData(4, 4)
     });

     expect(getDataAtCell(0, 0)).toEqual('A1');

     selectCell(0, 0);

     keyDown(Handsontable.helper.keyCode.BACKSPACE);

    expect(getDataAtCell(0, 0)).toEqual('');
    expect(hot.getActiveEditor().isOpened()).toBe(false);

    keyDown(Handsontable.helper.keyCode.ENTER);

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().getValue()).toEqual('');
  });

  it("should open empty editor after clearing cell value width DELETE", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4)
    });

    expect(getDataAtCell(0, 0)).toEqual('A1');

    selectCell(0, 0);

    keyDown(Handsontable.helper.keyCode.DELETE);

    expect(getDataAtCell(0, 0)).toEqual('');
    expect(hot.getActiveEditor().isOpened()).toBe(false);

    keyDown(Handsontable.helper.keyCode.ENTER);

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().getValue()).toEqual('');
  });

  it("should not open editor after hitting ALT (#1239)", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4)
    });

    expect(getDataAtCell(0, 0)).toEqual('A1');

    selectCell(0, 0);

    keyDown(Handsontable.helper.keyCode.ALT);

    expect(hot.getActiveEditor().isOpened()).toBe(false);

  });

  it("should open editor at the same coordinates as the edited cell", function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(16, 8),
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });

    // corner
    selectCell(1, 1);
    keyDown(Handsontable.helper.keyCode.ENTER);
    var $inputHolder = $('.handsontableInputHolder');
    expect($(getCell(1,1)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1,1)).offset().top).toEqual($inputHolder.offset().top + 1);

    // top
    selectCell(1, 4);
    keyDown(Handsontable.helper.keyCode.ENTER);
    expect($(getCell(1,4)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1,4)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    selectCell(4, 1);
    keyDown(Handsontable.helper.keyCode.ENTER);
    expect($(getCell(4,1)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4,1)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    selectCell(4, 4);
    keyDown(Handsontable.helper.keyCode.ENTER);
    expect($(getCell(4,4)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4,4)).offset().top).toEqual($inputHolder.offset().top + 1);

    this.$container.scrollTop(1000);
  });

  it("should open editor at the same coordinates as the edited cell after the table had been scrolled (corner)", function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(16, 8),
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });

    this.$container.scrollTop(100);
    this.$container.scrollLeft(100);

    hot.render();

    // corner
    selectCell(1, 1);
    var currentCell = hot.getCell(1, 1, true);
    var left = $(currentCell).offset().left;
    var top = $(currentCell).offset().top;

    var $inputHolder = $('.handsontableInputHolder');
    keyDown(Handsontable.helper.keyCode.ENTER);
    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it("should open editor at the same coordinates as the edited cell after the table had been scrolled (top)", function() {
    var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 50),
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });

    this.$container.scrollTop(500);
    this.$container.scrollLeft(500);

    hot.render();

    // top
    selectCell(1, 6);
    var currentCell = hot.getCell(1, 6, true);
    var left = $(currentCell).offset().left;
    var top = $(currentCell).offset().top;

    var $inputHolder = $('.handsontableInputHolder');
    keyDown(Handsontable.helper.keyCode.ENTER);
    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it("should open editor at the same coordinates as the edited cell after the table had been scrolled (left)", function() {
    var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 50),
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });

    this.$container.scrollTop(500);
    this.$container.scrollLeft(500);

    hot.render();

    // left
    selectCell(6, 1);
    var currentCell = hot.getCell(6, 1, true);
    var left = $(currentCell).offset().left;
    var top = $(currentCell).offset().top;

    var $inputHolder = $('.handsontableInputHolder');
    keyDown(Handsontable.helper.keyCode.ENTER);
    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it("should open editor at the same coordinates as the edited cell after the table had been scrolled (non-fixed)", function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(50, 50),
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });

    this.$container.scrollTop(500);
    this.$container.scrollLeft(500);

    hot.render();

    // non-fixed
    selectCell(7, 7);
    var currentCell = hot.getCell(7, 7, true);
    var left = $(currentCell).offset().left;
    var top = $(currentCell).offset().top;

    var $inputHolder = $('.handsontableInputHolder');
    keyDown(Handsontable.helper.keyCode.ENTER);
    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it("should display editor with the proper size, when the edited column is beyond the tables container", function() {
    this.$container.css('overflow','');
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 9)
    });

    selectCell(0,7);
    keyDown(Handsontable.helper.keyCode.ENTER);

    expect(Handsontable.Dom.outerWidth(hot.getActiveEditor().TEXTAREA)).toBeAroundValue(Handsontable.Dom.outerWidth(hot.getCell(0,7)));
  });

  it("should display editor with the proper size, when editing a last row after the table is scrolled to the bottom", function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 8),
      minSpareRows: 1,
      height: 100
    });

    selectCell(0,2);
    keyDown(Handsontable.helper.keyCode.ENTER);
    var regularHeight = Handsontable.Dom.outerHeight(hot.getActiveEditor().TEXTAREA);

    selectCell(3,2);
    keyDown(Handsontable.helper.keyCode.ENTER);
    keyDown(Handsontable.helper.keyCode.ENTER);
    keyDown(Handsontable.helper.keyCode.ENTER);

    // lame check, needs investigating why sometimes it leaves 1px error
    if(Handsontable.Dom.outerHeight(hot.getActiveEditor().TEXTAREA) == regularHeight) {
      expect(Handsontable.Dom.outerHeight(hot.getActiveEditor().TEXTAREA)).toEqual(regularHeight);
    } else {
      expect(Handsontable.Dom.outerHeight(hot.getActiveEditor().TEXTAREA)).toEqual(regularHeight - 1);
    }

  });

});
