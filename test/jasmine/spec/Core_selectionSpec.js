describe('Core_selection', function () {
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

  it('should call onSelection callback', function () {
    var output = null;

    handsontable({
      afterSelection: function (r, c) {
        output = [r, c];
      }
    });
    selectCell(1, 2);

    expect(output[0]).toEqual(1);
    expect(output[1]).toEqual(2);
  });

  it('should trigger selection event', function () {
    var output = null;

    handsontable();
    Handsontable.hooks.add('afterSelection', function (r, c) {
      output = [r, c];
    });
    selectCell(1, 2);

    expect(output[0]).toEqual(1);
    expect(output[1]).toEqual(2);
  });

  it('this.rootElement should point to handsontable rootElement (onSelection)', function () {
    var output = null;

    handsontable({
      afterSelection: function () {
        output = this.rootElement;
      }
    });
    selectCell(0, 0);

    expect(output).toEqual(this.$container[0]);
  });

  it('this.rootElement should point to handsontable rootElement (onSelectionByProp)', function () {
    var output = null;

    handsontable({
      afterSelectionByProp: function () {
        output = this.rootElement;
      }
    });
    selectCell(0, 0);

    expect(output).toEqual(this.$container[0]);
  });

  it('should focus external textarea when clicked during editing', function () {
    var textarea = $('<input type="text">').prependTo($('body'));

    handsontable();
    selectCell(0, 0);

    keyDown('enter');
//    $("html").triggerHandler('mouseup');
    $("html").simulate('mouseup');
    textarea.focus();

    expect(document.activeElement).toBe(textarea[0]);
    textarea.remove();
  });

  it('should deselect currently selected cell', function () {
    handsontable();
    selectCell(0, 0);

    $('html').simulate('mousedown');

    expect(getSelected()).toBeUndefined();
  });

  it('should not deselect the currently selected cell after clicking on a scrollbar', function () {
    var hot = handsontable({
      outsideClickDeselects: false,
      minRows: 20,
      minCols: 2,
      width: 400,
      height: 100
    });
    selectCell(0, 0);

    var holderBoundingBox = hot.view.wt.wtTable.holder.getBoundingClientRect(),
      verticalScrollbarCoords = {
        x: holderBoundingBox.left + holderBoundingBox.width - 3,
        y: holderBoundingBox.top + ( holderBoundingBox.height / 2 )
      },
      horizontalScrollbarCoords = {
        x: holderBoundingBox.left + ( holderBoundingBox.width / 2 ),
        y: holderBoundingBox.top + holderBoundingBox.height - 3
      };

    $(hot.view.wt.wtTable.holder).simulate('mousedown', {
      clientX: verticalScrollbarCoords.x,
      clientY: verticalScrollbarCoords.y
    });

    expect(getSelected()).toEqual([0, 0, 0, 0]);

    $(hot.view.wt.wtTable.holder).simulate('mousedown', {
      clientX: horizontalScrollbarCoords.x,
      clientY: horizontalScrollbarCoords.y
    });

    expect(getSelected()).toEqual([0, 0, 0, 0]);
  });

  it('should not deselect currently selected cell', function () {
    handsontable({
      outsideClickDeselects: false
    });
    selectCell(0, 0);

    $("html").simulate('mousedown');

    expect(getSelected()).toEqual([0, 0, 0, 0]);
  });

  it('should allow to focus on external input and hold current selection informations', function () {
    var textarea = $('<input id="test_textarea" type="text">').prependTo($('body'));

    handsontable({
      outsideClickDeselects: false
    });
    selectCell(0, 0);

    textarea.simulate('mousedown');
    textarea.focus();

    expect(document.activeElement.id).toEqual('test_textarea');
    expect(getSelected()).toEqual([0, 0, 0, 0]);
    textarea.remove();
  });

  it('should allow to type in external input while holding current selection information', function () {
    var textarea = $('<textarea id="test_textarea"></textarea>').prependTo($('body'));
    var keyPressed;
    handsontable({
      outsideClickDeselects: false
    });
    selectCell(0, 0);

    textarea.focus();
    textarea.simulate('mousedown');
    textarea.simulate('mouseup');

    textarea.on('keydown', function (event) {
      keyPressed = event.keyCode;
    });

    var LETTER_a_KEY = 97;
//    var event = $.Event('keydown');
//    event.keyCode = LETTER_a_KEY;

//    $(document.activeElement).trigger(event);
    $(document.activeElement).simulate('keydown',{
      keyCode: LETTER_a_KEY
    });

    //textarea should receive the event and be an active element
    expect(keyPressed).toEqual(LETTER_a_KEY);
    expect(document.activeElement).toBe(document.getElementById('test_textarea'));

    //should preserve selection, close editor and save changes
    expect(getSelected()).toEqual([0, 0, 0, 0]);
    expect(getDataAtCell(0, 0)).toBeNull();

    textarea.remove();
  });

  it('should allow to type in external input after opening cell editor', function () {
    var textarea = $('<textarea id="test_textarea"></textarea>').prependTo($('body'));
    var keyPressed;
    handsontable({
      outsideClickDeselects: false
    });
    selectCell(0, 0);
    keyDown('enter');
    document.activeElement.value = 'Foo';

    textarea.focus();
    textarea.simulate('mousedown');
    textarea.simulate('mouseup');

    textarea.on('keydown', function (event) {
      keyPressed = event.keyCode;
    });

    var LETTER_a_KEY = 97;
//    var event = $.Event('keydown');
//    event.keyCode = LETTER_a_KEY;

    $(document.activeElement).simulate('keydown',{
      keyCode: LETTER_a_KEY
    });

    //textarea should receive the event and be an active element
    expect(keyPressed).toEqual(LETTER_a_KEY);
    expect(document.activeElement).toBe(document.getElementById('test_textarea'));

    //should preserve selection, close editor and save changes
    expect(getSelected()).toEqual([0, 0, 0, 0]);
    expect(getDataAtCell(0, 0)).toEqual('Foo');

    textarea.remove();
  });

  it('should fix start range if provided is out of bounds (to the left)', function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 0);
    keyDownUp('arrow_left');

    expect(getSelected()).toEqual([0, 0, 0, 0]);
  });

  it('should fix start range if provided is out of bounds (to the top)', function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 0);
    keyDownUp('arrow_up');

    expect(getSelected()).toEqual([0, 0, 0, 0]);
  });

  it('should fix start range if provided is out of bounds (to the right)', function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 4);
    keyDownUp('arrow_right');

    expect(getSelected()).toEqual([0, 4, 0, 4]);
  });

  it('should fix start range if provided is out of bounds (to the bottom)', function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(4, 0);
    keyDownUp('arrow_down');

    expect(getSelected()).toEqual([4, 0, 4, 0]);
  });

  it('should fix end range if provided is out of bounds (to the left)', function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 1);
    keyDownUp('shift+arrow_left');
    keyDownUp('shift+arrow_left');

    expect(getSelected()).toEqual([0, 1, 0, 0]);
  });

  it('should fix end range if provided is out of bounds (to the top)', function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(1, 0);
    keyDownUp('shift+arrow_up');
    keyDownUp('shift+arrow_up');

    expect(getSelected()).toEqual([1, 0, 0, 0]);
  });

  it('should fix end range if provided is out of bounds (to the right)', function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 3);
    keyDownUp('shift+arrow_right');
    keyDownUp('shift+arrow_right');

    expect(getSelected()).toEqual([0, 3, 0, 4]);
  });

  it('should fix end range if provided is out of bounds (to the bottom)', function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(3, 0);
    keyDownUp('shift+arrow_down');
    keyDownUp('shift+arrow_down');
    keyDownUp('shift+arrow_down');

    expect(getSelected()).toEqual([3, 0, 4, 0]);
  });

  it('should select multiple cells', function () {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(3, 0, 4, 1);

    expect(getSelected()).toEqual([3, 0, 4, 1]);
  });

  it('should call onSelectionEnd as many times as onSelection when `selectCell` is called', function () {
    var tick = 0
      , tickEnd = 0;
    handsontable({
      startRows: 5,
      startCols: 5,
      afterSelection: function () {
        tick++;
      },
      afterSelectionEnd: function () {
        tickEnd++;
      }
    });
    selectCell(3, 0);
    selectCell(1, 1);

    expect(tick).toEqual(2);
    expect(tickEnd).toEqual(2);
  });

  it('should call onSelectionEnd when user finishes selection by releasing SHIFT key (3 times)', function () {
    var tick = 0;
    handsontable({
      startRows: 5,
      startCols: 5,
      afterSelectionEnd: function () {
        tick++;
      }
    });
    selectCell(3, 0); //makes tick++
    keyDownUp('shift+arrow_down'); //makes tick++
    keyDownUp('shift+arrow_down'); //makes tick++
    keyDownUp('shift+arrow_down'); //makes tick++

    expect(getSelected()).toEqual([3, 0, 4, 0]);
    expect(tick).toEqual(4);
  });

  it('should call onSelectionEnd when user finishes selection by releasing SHIFT key (1 time)', function () {
    var tick = 0;
    handsontable({
      startRows: 5,
      startCols: 5,
      afterSelectionEnd: function () {
        tick++;
      }
    });
    selectCell(3, 0); //makes tick++
    keyDown('shift+arrow_down');
    keyDown('shift+arrow_down');
    keyDownUp('shift+arrow_down'); //makes tick++

    expect(getSelected()).toEqual([3, 0, 4, 0]);
    expect(tick).toEqual(2);
  });

  it('should call onSelection while user selects cells with mouse; onSelectionEnd when user finishes selection', function () {
    var tick = 0, tickEnd = 0;
    handsontable({
      startRows: 5,
      startCols: 5,
      afterSelection: function () {
        tick++;
      },
      afterSelectionEnd: function () {
        tickEnd++;
      }
    });

    this.$container.find('tr:eq(0) td:eq(0)').simulate('mousedown');
    this.$container.find('tr:eq(0) td:eq(1)').simulate('mouseover');
    this.$container.find('tr:eq(1) td:eq(3)').simulate('mouseover');


    this.$container.find('tr:eq(1) td:eq(3)').simulate('mouseup');

    expect(getSelected()).toEqual([0, 0, 1, 3]);
    expect(tick).toEqual(3);
    expect(tickEnd).toEqual(1);
  });

  it('should properly select columns, when the user moves the cursor over column headers across two overlays', function () {
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      fixedColumnsLeft: 2
    });

    this.$container.find('.ht_clone_left tr:eq(0) th:eq(1)').simulate('mousedown');
    this.$container.find('.ht_clone_left tr:eq(0) th:eq(1)').simulate('mouseover');
    this.$container.find('.ht_clone_top tr:eq(0) th:eq(2)').simulate('mouseover');
    this.$container.find('.ht_clone_left tr:eq(0) th:eq(1)').simulate('mouseover');
    this.$container.find('.ht_clone_left tr:eq(0) th:eq(1)').simulate('mouseup');

    expect(getSelected()).toEqual([0, 1, 4, 1]);
  });

  it('should move focus to selected cell', function () {
    var $input = $('<input>').appendTo(document.body);
    handsontable({
      startRows: 5,
      startCols: 5
    });
    $input[0].focus();
    selectCell(0, 0);

    keyDownUp('enter');
    expect(isEditorVisible()).toEqual(true);
    $input.remove();
  });

  //This test should cover the #893 case, but it always passes. It seems like the keydown event (with CTRL key pressed) isn't delivered.
  it("should not move focus from outside elements on CTRL keydown event, when no cell is selected", function () {
    var $input = $('<input type="text"/>');
    $('body').append($input);

    handsontable();

    selectCell(0, 0);

    expect(document.activeElement.nodeName).toBeInArray(['BODY', 'HTML']);

    $input.focus();

    expect(document.activeElement.nodeName).toBe('INPUT');

//    var keyDownEvent = $.Event('keydown', {ctrlKey: true, metaKey: true});
//    $input.trigger(keyDownEvent);

    $input.simulate('keydown',{ctrlKey: true, metaKey: true});

    expect(document.activeElement.nodeName).toBe('INPUT');

    $input.remove();


  });

  it("should select the entire column after column header is clicked", function(){
    handsontable({
      width: 200,
      height: 100,
      startRows: 50,
      startCols: 5,
      colHeaders: true
    });

    this.$container.find('thead th:eq(0)').simulate('mousedown');
    expect(getSelected()).toEqual([0, 0, 49, 0]);
  });

  it("should select the entire column after column header is clicked (in fixed rows/cols corner)", function(){
    handsontable({
      width: 200,
      height: 100,
      startRows: 50,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsLeft: 2
    });

    this.$container.find('.ht_master thead th:eq(1)').simulate('mousedown');
    expect(getSelected()).toEqual([0, 0, 49, 0]);
  });

  //it("should set the selection end to the first visible row, when dragging the selection from a cell to a column header", function () {
  //  var hot = handsontable({
  //    width: 200,
  //    height: 200,
  //    startRows: 20,
  //    startCols: 20,
  //    colHeaders: true,
  //    rowHeaders: true
  //  });
  //
  //  hot.view.wt.scrollVertical(10);
  //  hot.view.wt.scrollHorizontal(10);
  //
  //  hot.render();
  //
  //  waits(30);
  //
  //  runs(function() {
  //    $(getCell(12,11)).simulate('mousedown');
  //    this.$container.find('.ht_clone_top thead th:eq(2)').simulate('mouseover');
  //  });
  //
  //  waits(30);
  //
  //  runs(function() {
  //    expect(getSelected()).toEqual([12, 11, 10, 11]);
  //  });
  //});

  //it("should set the selection end to the first visible column, when dragging the selection from a cell to a row header", function () {
  //  var hot = handsontable({
  //    width: 200,
  //    height: 200,
  //    startRows: 20,
  //    startCols: 20,
  //    colHeaders: true,
  //    rowHeaders: true
  //  });
  //
  //  hot.view.wt.scrollVertical(10);
  //  hot.view.wt.scrollHorizontal(10);
  //
  //  hot.render();
  //
  //  waits(30);
  //
  //  runs(function() {
  //    $(getCell(12,11)).simulate('mousedown');
  //    this.$container.find('.ht_clone_left tbody th:eq(12)').simulate('mouseover');
  //  });
  //
  //  waits(30);
  //
  //  runs(function() {
  //    expect(getSelected()).toEqual([12, 11, 12, 10]);
  //  });
  //});

  it("should allow to scroll the table when a whole column is selected and table is longer than it's container", function () {
    var errCount = 0;
    $(window).on("error.selectionTest", function () {
      errCount++;
    });

    var onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');

    var hot = handsontable({
      height: 100,
      width: 300,
      startRows: 100,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
      afterScrollVertically: onAfterScrollVertically
    });

    var mainHolder = hot.view.wt.wtTable.holder;

    mainHolder.scrollTop = 0;

    this.$container.find('thead tr:eq(0) th:eq(2)').simulate('mousedown');
    this.$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseup');

    mainHolder.scrollTop = 120;

    waits(100);

    runs(function () {
      expect(errCount).toEqual(0); // expect no errors to be thrown

      $(window).off("error.selectionTest");
    });

  });

  it("should scroll to the end of the selection, when selecting cells using the keyboard", function () {
    var hot = handsontable({
      height: 300,
      width: 300,
      startRows: 50,
      startCols: 50,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsLeft: 2
    });

    var mainHolder = hot.view.wt.wtTable.holder;

    mainHolder.scrollTop = 100;
    selectCell(1, 3);
    keyDownUp('arrow_down');
    expect(mainHolder.scrollTop).toEqual(0);
    mainHolder.scrollTop = 100;
    selectCell(1, 3);
    keyDownUp('shift+arrow_down');
    expect(mainHolder.scrollTop).toEqual(0);

    mainHolder.scrollLeft = 100;
    selectCell(3, 1);
    keyDownUp('arrow_right');
    expect(mainHolder.scrollLeft).toEqual(0);
    mainHolder.scrollLeft = 100;
    selectCell(3, 1);
    keyDownUp('shift+arrow_right');
    expect(mainHolder.scrollLeft).toEqual(0);

    var lastVisibleColumn = hot.view.wt.wtTable.getLastVisibleColumn();
    selectCell(3, lastVisibleColumn);
    keyDownUp('arrow_right');
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 1);
    keyDownUp('arrow_right');
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 2);
    keyDownUp('shift+arrow_right');
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 3);

    var lastVisibleRow = hot.view.wt.wtTable.getLastVisibleRow();
    selectCell(lastVisibleRow, 3);
    keyDownUp('arrow_down');
    expect(hot.view.wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 1);
    keyDownUp('arrow_down');
    expect(hot.view.wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 2);
    keyDownUp('shift+arrow_down');
    expect(hot.view.wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 3);

  });

  it("should select the entire row after row header is clicked", function(){
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true
    });

    this.$container.find('tr:eq(2) th:eq(0)').simulate('mousedown');
    expect(getSelected()).toEqual([1, 0, 1, 4]);

  });

  it("should select the entire row of a partially fixed table after row header is clicked", function(){
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsLeft: 2
    });

    this.$container.find('tr:eq(2) th:eq(0)').simulate('mousedown');
    expect(getSelected()).toEqual([1, 0, 1, 4]);
    this.$container.find('tr:eq(3) th:eq(0)').simulate('mousedown');
    expect(getSelected()).toEqual([2, 0, 2, 4]);

  });

  it("should select a cell in a newly added row after automatic row adding, triggered by editing a cell in the last row with minSpareRows > 0, " +
    "unless editing happened within the fixed bottom rows", function () {
    var hot = handsontable({
      startRows: 5,
      startCols: 2,
      minSpareRows: 1
    });

    selectCell(4,0);

    keyDownUp('enter');
    waits(100);
    runs(function() {
      keyDownUp('enter');
    });
    waits(100);
    runs(function () {
      expect(countRows()).toEqual(6);
      expect(getSelected()).toEqual([5,0,5,0]);
    });
  });

  it("should not add new rows after editing a last table cell, if it's whiting the fixed bottom rows", function () {
    var hot = handsontable({
      startRows: 5,
      startCols: 2,
      fixedRowsBottom: 2,
      minSpareRows: 1
    });

    if(!hot.view.wt.wtOverlays.bottomOverlay.clone) {
      return;
    }

    selectCell(4,0);

    keyDownUp('enter');
    waits(100);
    runs(function() {
      keyDownUp('enter');
    });
    waits(100);
    runs(function () {
      expect(countRows()).toEqual(5);
      expect(getSelected()).toEqual([4,0,4,0]);
    });
  });

  it("should change selected coords by modifying coords object via `modifyTransformStart` hook", function(){
    var hot = handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 0);

    hot.addHook('modifyTransformStart', function(coords) {
      coords.col += 1;
      coords.row += 1;
    });
    keyDown('arrow_down');

    expect(getSelected()).toEqual([2, 1, 2, 1]);
  });

  it("should change selected coords by modifying coords object via `modifyTransformEnd` hook", function(){
    var hot = handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 0);

    hot.addHook('modifyTransformEnd', function(coords) {
      coords.col += 2;
      coords.row += 1;
    });
    keyDown('shift+arrow_down');

    expect(getSelected()).toEqual([0, 0, 2, 2]);
  });

  it('should indicate is coords is out of bounds via `afterModifyTransformStart` hook', function () {
    var spy = jasmine.createSpy();

    var hot = handsontable({
      startRows: 5,
      startCols: 5
    });
    hot.addHook('afterModifyTransformStart', spy);

    selectCell(2, 0);
    keyDownUp('arrow_left');

    expect(spy.mostRecentCall.args[1]).toBe(0);
    expect(spy.mostRecentCall.args[2]).toBe(-1);

    spy.reset();
    selectCell(2, 4);
    keyDownUp('arrow_right');

    expect(spy.mostRecentCall.args[1]).toBe(0);
    expect(spy.mostRecentCall.args[2]).toBe(1);

    spy.reset();
    selectCell(4, 2);
    keyDownUp('arrow_down');

    expect(spy.mostRecentCall.args[1]).toBe(1);
    expect(spy.mostRecentCall.args[2]).toBe(0);

    spy.reset();
    selectCell(0, 2);
    keyDownUp('arrow_up');

    expect(spy.mostRecentCall.args[1]).toBe(-1);
    expect(spy.mostRecentCall.args[2]).toBe(0);
  });

  it('should indicate is coords is out of bounds via `afterModifyTransformEnd` hook', function () {
    var spy = jasmine.createSpy();

    var hot = handsontable({
      startRows: 5,
      startCols: 5
    });
    hot.addHook('afterModifyTransformEnd', spy);

    selectCell(2, 0);
    keyDownUp('shift+arrow_left');

    expect(spy.mostRecentCall.args[1]).toBe(0);
    expect(spy.mostRecentCall.args[2]).toBe(-1);

    spy.reset();
    selectCell(2, 4);
    keyDownUp('shift+arrow_right');

    expect(spy.mostRecentCall.args[1]).toBe(0);
    expect(spy.mostRecentCall.args[2]).toBe(1);

    spy.reset();
    selectCell(4, 2);
    keyDownUp('shift+arrow_down');

    expect(spy.mostRecentCall.args[1]).toBe(1);
    expect(spy.mostRecentCall.args[2]).toBe(0);

    spy.reset();
    selectCell(0, 2);
    keyDownUp('shift+arrow_up');

    expect(spy.mostRecentCall.args[1]).toBe(-1);
    expect(spy.mostRecentCall.args[2]).toBe(0);
  });
});
