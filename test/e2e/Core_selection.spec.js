describe('Core_selection', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('public API', () => {
    it('should return valid coordinates when `.getSelected` and `.getSelectedLast` is called', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        selectionMode: 'multiple',
      });

      const snapshot = [
        [5, 4, 1, 1],
        [2, 2, 7, 2],
        [2, 4, 2, 4],
        [7, 6, 8, 7],
      ];

      $(getCell(5, 4)).simulate('mousedown');
      $(getCell(1, 1)).simulate('mouseover');
      $(getCell(1, 1)).simulate('mouseup');

      expect(getSelectedLast()).toEqual(snapshot[0]);
      expect(getSelected()).toEqual([snapshot[0]]);

      keyDown('ctrl');

      $(getCell(2, 2)).simulate('mousedown');
      $(getCell(7, 2)).simulate('mouseover');
      $(getCell(7, 2)).simulate('mouseup');

      expect(getSelectedLast()).toEqual(snapshot[1]);
      expect(getSelected()).toEqual([snapshot[0], snapshot[1]]);

      $(getCell(2, 4)).simulate('mousedown');
      $(getCell(2, 4)).simulate('mouseover');
      $(getCell(2, 4)).simulate('mouseup');

      expect(getSelectedLast()).toEqual(snapshot[2]);
      expect(getSelected()).toEqual([snapshot[0], snapshot[1], snapshot[2]]);

      $(getCell(7, 6)).simulate('mousedown');
      $(getCell(8, 7)).simulate('mouseover');
      $(getCell(8, 7)).simulate('mouseup');

      expect(getSelectedLast()).toEqual(snapshot[3]);
      expect(getSelected()).toEqual(snapshot);
    });

    it('should return valid coordinates when `.getSelectedRange` and `.getSelectedRangeLast` is called', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        selectionMode: 'multiple',
      });

      const snapshot = [
        {from: {row: 5, col: 4}, to: {row: 1, col: 1}},
        {from: {row: 2, col: 2}, to: {row: 7, col: 2}},
        {from: {row: 2, col: 4}, to: {row: 2, col: 4}},
        {from: {row: 7, col: 6}, to: {row: 8, col: 7}},
      ];

      $(getCell(5, 4)).simulate('mousedown');
      $(getCell(1, 1)).simulate('mouseover');
      $(getCell(1, 1)).simulate('mouseup');

      expect(getSelectedRangeLast().toObject()).toEqual(snapshot[0]);
      expect(getSelectedRange().map((cellRange) => cellRange.toObject())).toEqual([snapshot[0]]);

      keyDown('ctrl');

      $(getCell(2, 2)).simulate('mousedown');
      $(getCell(7, 2)).simulate('mouseover');
      $(getCell(7, 2)).simulate('mouseup');

      expect(getSelectedRangeLast().toObject()).toEqual(snapshot[1]);
      expect(getSelectedRange().map((cellRange) => cellRange.toObject())).toEqual([snapshot[0], snapshot[1]]);

      $(getCell(2, 4)).simulate('mousedown');
      $(getCell(2, 4)).simulate('mouseover');
      $(getCell(2, 4)).simulate('mouseup');

      expect(getSelectedRangeLast().toObject()).toEqual(snapshot[2]);
      expect(getSelectedRange().map((cellRange) => cellRange.toObject())).toEqual([snapshot[0], snapshot[1], snapshot[2]]);

      $(getCell(7, 6)).simulate('mousedown');
      $(getCell(8, 7)).simulate('mouseover');
      $(getCell(8, 7)).simulate('mouseup');

      const selectedRange = getSelectedRange().map((cellRange) => cellRange.toObject());

      expect(getSelectedRangeLast().toObject()).toEqual(snapshot[3]);
      expect(selectedRange).toEqual(snapshot);
    });

    it('should make all selected cells empty when `.emptySelectedCells` is called', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(9, 8),
        selectionMode: 'multiple',
      });

      $(getCell(5, 4)).simulate('mousedown');
      $(getCell(1, 1)).simulate('mouseover');
      $(getCell(1, 1)).simulate('mouseup');

      keyDown('ctrl');

      $(getCell(2, 2)).simulate('mousedown');
      $(getCell(7, 2)).simulate('mouseover');
      $(getCell(7, 2)).simulate('mouseup');

      $(getCell(2, 4)).simulate('mousedown');
      $(getCell(2, 4)).simulate('mouseover');
      $(getCell(2, 4)).simulate('mouseup');

      $(getCell(7, 6)).simulate('mousedown');
      $(getCell(8, 7)).simulate('mouseover');
      $(getCell(8, 7)).simulate('mouseup');

      emptySelectedCells();

      /* eslint-disable no-multi-spaces, comma-spacing */
      const snapshot = [
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'],
        ['A2',  '',   '',   '',   '',  'F2', 'G2', 'H2'],
        ['A3',  '',   '',   '',   '',  'F3', 'G3', 'H3'],
        ['A4',  '',   '',   '',   '',  'F4', 'G4', 'H4'],
        ['A5',  '',   '',   '',   '',  'F5', 'G5', 'H5'],
        ['A6',  '',   '',   '',   '',  'F6', 'G6', 'H6'],
        ['A7', 'B7',  '',  'D7', 'E7', 'F7', 'G7', 'H7'],
        ['A8', 'B8',  '',  'D8', 'E8', 'F8',  '',   '',],
        ['A9', 'B9', 'C9', 'D9', 'E9', 'F9',  '',   '',],
      ];
      /* eslint-enable no-multi-spaces, comma-spacing */

      expect(getData()).toEqual(snapshot);
    });
  });

  it('should call onSelection callback', () => {
    let output = null;

    handsontable({
      afterSelection(row, column, rowEnd, columnEnd, preventScrolling, selectionLayerLevel) {
        output = {row, column, rowEnd, columnEnd, preventScrolling, selectionLayerLevel};
      }
    });
    selectCell(1, 2);

    expect(output.row).toBe(1);
    expect(output.column).toBe(2);
    expect(output.rowEnd).toBe(1);
    expect(output.columnEnd).toBe(2);
    expect(output.preventScrolling.value).toBe(false);
    expect(output.selectionLayerLevel).toBe(0);
  });

  it('should trigger selection event', () => {
    let output = null;

    handsontable();
    Handsontable.hooks.add('afterSelection', (row, column, rowEnd, columnEnd, preventScrolling, selectionLayerLevel) => {
      output = {row, column, rowEnd, columnEnd, preventScrolling, selectionLayerLevel};
    });
    selectCell(1, 2);

    expect(output.row).toBe(1);
    expect(output.column).toBe(2);
    expect(output.rowEnd).toBe(1);
    expect(output.columnEnd).toBe(2);
    expect(output.preventScrolling.value).toBe(false);
    expect(output.selectionLayerLevel).toBe(0);
  });

  it('this.rootElement should point to handsontable rootElement (onSelection)', function() {
    var output = null;

    handsontable({
      afterSelection() {
        output = this.rootElement;
      }
    });
    selectCell(0, 0);

    expect(output).toEqual(this.$container[0]);
  });

  it('this.rootElement should point to handsontable rootElement (onSelectionByProp)', function() {
    var output = null;

    handsontable({
      afterSelectionByProp() {
        output = this.rootElement;
      }
    });
    selectCell(0, 0);

    expect(output).toEqual(this.$container[0]);
  });

  it('should focus external textarea when clicked during editing', () => {
    var textarea = $('<input type="text">').prependTo($('body'));

    handsontable();
    selectCell(0, 0);

    keyDown('enter');
    // $("html").triggerHandler('mouseup');
    $('html').simulate('mouseup');
    textarea.focus();

    expect(document.activeElement).toBe(textarea[0]);
    textarea.remove();
  });

  it('should deselect currently selected cell', () => {
    handsontable();
    selectCell(0, 0);

    $('html').simulate('mousedown');

    expect(getSelected()).toBeUndefined();
  });

  it('should not deselect the currently selected cell after clicking on a scrollbar', () => {
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
        y: holderBoundingBox.top + (holderBoundingBox.height / 2)
      },
      horizontalScrollbarCoords = {
        x: holderBoundingBox.left + (holderBoundingBox.width / 2),
        y: holderBoundingBox.top + holderBoundingBox.height - 3
      };

    $(hot.view.wt.wtTable.holder).simulate('mousedown', {
      clientX: verticalScrollbarCoords.x,
      clientY: verticalScrollbarCoords.y
    });

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);

    $(hot.view.wt.wtTable.holder).simulate('mousedown', {
      clientX: horizontalScrollbarCoords.x,
      clientY: horizontalScrollbarCoords.y
    });

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
  });

  it('should not deselect currently selected cell', () => {
    handsontable({
      outsideClickDeselects: false
    });
    selectCell(0, 0);

    $('html').simulate('mousedown');

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
  });

  it('should allow to focus on external input and hold current selection informations', () => {
    var textarea = $('<input id="test_textarea" type="text">').prependTo($('body'));

    handsontable({
      outsideClickDeselects: false
    });
    selectCell(0, 0);

    textarea.simulate('mousedown');
    textarea.focus();

    expect(document.activeElement.id).toEqual('test_textarea');
    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    textarea.remove();
  });

  it('should allow to type in external input while holding current selection information', () => {
    var textarea = $('<textarea id="test_textarea"></textarea>').prependTo($('body'));
    var keyPressed;
    handsontable({
      outsideClickDeselects: false
    });
    selectCell(0, 0);

    textarea.focus();
    textarea.simulate('mousedown');
    textarea.simulate('mouseup');

    textarea.on('keydown', (event) => {
      keyPressed = event.keyCode;
    });

    var LETTER_A_KEY = 97;

    $(document.activeElement).simulate('keydown', {
      keyCode: LETTER_A_KEY
    });

    // textarea should receive the event and be an active element
    expect(keyPressed).toEqual(LETTER_A_KEY);
    expect(document.activeElement).toBe(document.getElementById('test_textarea'));

    // should preserve selection, close editor and save changes
    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    expect(getDataAtCell(0, 0)).toBeNull();

    textarea.remove();
  });

  it('should allow to type in external input after opening cell editor', () => {
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

    textarea.on('keydown', (event) => {
      keyPressed = event.keyCode;
    });

    var LETTER_A_KEY = 97;

    $(document.activeElement).simulate('keydown', {
      keyCode: LETTER_A_KEY
    });

    // textarea should receive the event and be an active element
    expect(keyPressed).toEqual(LETTER_A_KEY);
    expect(document.activeElement).toBe(document.getElementById('test_textarea'));

    // should preserve selection, close editor and save changes
    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    expect(getDataAtCell(0, 0)).toEqual('Foo');

    textarea.remove();
  });

  it('should deselect on outside click if outsideClickDeselects is a function that returns true', () => {
    var textarea = $('<textarea id="test_textarea"></textarea>').prependTo($('body'));
    var keyPressed;
    handsontable({
      outsideClickDeselects: () => true,
    });
    selectCell(0, 0);
    keyDown('enter');
    document.activeElement.value = 'Foo';

    textarea.focus();
    textarea.simulate('mousedown');
    textarea.simulate('mouseup');

    textarea.on('keydown', (event) => {
      keyPressed = event.keyCode;
    });

    var LETTER_A_KEY = 97;

    $(document.activeElement).simulate('keydown', {
      keyCode: LETTER_A_KEY
    });

    // textarea should receive the event and be an active element
    expect(keyPressed).toEqual(LETTER_A_KEY);
    expect(document.activeElement).toBe(document.getElementById('test_textarea'));

    // should NOT preserve selection
    expect(getSelected()).toBeUndefined();
    expect(getDataAtCell(0, 0)).toEqual('Foo');

    textarea.remove();
  });

  it('should not deselect on outside click if outsideClickDeselects is a function that returns false', () => {
    var textarea = $('<textarea id="test_textarea"></textarea>').prependTo($('body'));
    var keyPressed;
    handsontable({
      outsideClickDeselects: () => false,
    });
    selectCell(0, 0);
    keyDown('enter');
    document.activeElement.value = 'Foo';

    textarea.focus();
    textarea.simulate('mousedown');
    textarea.simulate('mouseup');

    textarea.on('keydown', (event) => {
      keyPressed = event.keyCode;
    });

    var LETTER_A_KEY = 97;

    $(document.activeElement).simulate('keydown', {
      keyCode: LETTER_A_KEY
    });

    // textarea should receive the event and be an active element
    expect(keyPressed).toEqual(LETTER_A_KEY);
    expect(document.activeElement).toBe(document.getElementById('test_textarea'));

    // should preserve selection, close editor and save changes
    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    expect(getDataAtCell(0, 0)).toEqual('Foo');

    textarea.remove();
  });

  it('should fix start range if provided is out of bounds (to the left)', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 0);
    keyDownUp('arrow_left');

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
  });

  it('should fix start range if provided is out of bounds (to the top)', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 0);
    keyDownUp('arrow_up');

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
  });

  it('should fix start range if provided is out of bounds (to the right)', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 4);
    keyDownUp('arrow_right');

    expect(getSelected()).toEqual([[0, 4, 0, 4]]);
  });

  it('should fix start range if provided is out of bounds (to the bottom)', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(4, 0);
    keyDownUp('arrow_down');

    expect(getSelected()).toEqual([[4, 0, 4, 0]]);
  });

  it('should fix end range if provided is out of bounds (to the left)', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 1);
    keyDownUp('shift+arrow_left');
    keyDownUp('shift+arrow_left');

    expect(getSelected()).toEqual([[0, 1, 0, 0]]);
  });

  it('should fix end range if provided is out of bounds (to the top)', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(1, 0);
    keyDownUp('shift+arrow_up');
    keyDownUp('shift+arrow_up');

    expect(getSelected()).toEqual([[1, 0, 0, 0]]);
  });

  it('should fix end range if provided is out of bounds (to the right)', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 3);
    keyDownUp('shift+arrow_right');
    keyDownUp('shift+arrow_right');

    expect(getSelected()).toEqual([[0, 3, 0, 4]]);
  });

  it('should fix end range if provided is out of bounds (to the bottom)', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(3, 0);
    keyDownUp('shift+arrow_down');
    keyDownUp('shift+arrow_down');
    keyDownUp('shift+arrow_down');

    expect(getSelected()).toEqual([[3, 0, 4, 0]]);
  });

  it('should select multiple cells', () => {
    handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(3, 0, 4, 1);

    expect(getSelected()).toEqual([[3, 0, 4, 1]]);
  });

  it('should call onSelectionEnd as many times as onSelection when `selectCell` is called', () => {
    var tick = 0,
      tickEnd = 0;

    handsontable({
      startRows: 5,
      startCols: 5,
      afterSelection() {
        tick++;
      },
      afterSelectionEnd() {
        tickEnd++;
      }
    });
    selectCell(3, 0);
    selectCell(1, 1);

    expect(tick).toEqual(2);
    expect(tickEnd).toEqual(2);
  });

  it('should call onSelectionEnd when user finishes selection by releasing SHIFT key (3 times)', () => {
    var tick = 0;
    handsontable({
      startRows: 5,
      startCols: 5,
      afterSelectionEnd() {
        tick++;
      }
    });
    selectCell(3, 0); // makes tick++
    keyDownUp('shift+arrow_down'); // makes tick++
    keyDownUp('shift+arrow_down'); // makes tick++
    keyDownUp('shift+arrow_down'); // makes tick++

    expect(getSelected()).toEqual([[3, 0, 4, 0]]);
    expect(tick).toEqual(4);
  });

  it('should call onSelectionEnd when user finishes selection by releasing SHIFT key (1 time)', () => {
    var tick = 0;
    handsontable({
      startRows: 5,
      startCols: 5,
      afterSelectionEnd() {
        tick++;
      }
    });
    selectCell(3, 0); // makes tick++
    keyDown('shift+arrow_down');
    keyDown('shift+arrow_down');
    keyDownUp('shift+arrow_down'); // makes tick++

    expect(getSelected()).toEqual([[3, 0, 4, 0]]);
    expect(tick).toEqual(2);
  });

  it('should select columns by click on header with SHIFT key', function() {
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true
    });

    this.$container.find('.ht_clone_top tr:eq(0) th:eq(1)').simulate('mousedown');
    this.$container.find('.ht_clone_top tr:eq(0) th:eq(1)').simulate('mouseup');

    this.$container.find('.ht_clone_top tr:eq(0) th:eq(4)').simulate('mousedown', {shiftKey: true});
    this.$container.find('.ht_clone_top tr:eq(0) th:eq(4)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 1, 4, 4]]);

  });

  it('should select rows by click on header with SHIFT key', function() {
    handsontable({
      startRows: 5,
      startCols: 5,
      rowHeaders: true
    });

    this.$container.find('.ht_clone_left tr:eq(1) th:eq(0)').simulate('mousedown');
    this.$container.find('.ht_clone_left tr:eq(1) th:eq(0)').simulate('mouseup');

    this.$container.find('.ht_clone_left tr:eq(4) th:eq(0)').simulate('mousedown', {shiftKey: true});
    this.$container.find('.ht_clone_left tr:eq(4) th:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([[1, 0, 4, 4]]);

  });

  it('should select columns by click on header with SHIFT key', function() {
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true
    });

    this.$container.find('.ht_clone_top tr:eq(0) th:eq(1)').simulate('mousedown');
    this.$container.find('.ht_clone_top tr:eq(0) th:eq(1)').simulate('mouseup');

    this.$container.find('.ht_clone_top tr:eq(0) th:eq(4)').simulate('mousedown', {shiftKey: true});
    this.$container.find('.ht_clone_top tr:eq(0) th:eq(4)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 1, 4, 4]]);

  });

  it('should change selection after click on row header with SHIFT key', function() {
    handsontable({
      startRows: 5,
      startCols: 5,
      rowHeaders: true
    });

    selectCell(1, 1, 3, 3);

    this.$container.find('.ht_clone_left tr:eq(4) th:eq(0)').simulate('mousedown', {shiftKey: true});
    this.$container.find('.ht_clone_left tr:eq(4) th:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([[1, 0, 4, 4]]);

  });

  it('should change selection after click on column header with SHIFT key', function() {
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true
    });

    selectCell(1, 1, 3, 3);

    this.$container.find('.ht_clone_top tr:eq(0) th:eq(4)').simulate('mousedown', {shiftKey: true});
    this.$container.find('.ht_clone_top tr:eq(0) th:eq(4)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 1, 4, 4]]);
  });

  it('should call onSelection while user selects cells with mouse; onSelectionEnd when user finishes selection', function() {
    var tick = 0,
      tickEnd = 0;
    handsontable({
      startRows: 5,
      startCols: 5,
      afterSelection() {
        tick++;
      },
      afterSelectionEnd() {
        tickEnd++;
      }
    });

    this.$container.find('tr:eq(0) td:eq(0)').simulate('mousedown');
    this.$container.find('tr:eq(0) td:eq(1)').simulate('mouseover');
    this.$container.find('tr:eq(1) td:eq(3)').simulate('mouseover');

    this.$container.find('tr:eq(1) td:eq(3)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 0, 1, 3]]);
    expect(tick).toEqual(3);
    expect(tickEnd).toEqual(1);
  });

  it('should properly select columns, when the user moves the cursor over column headers across two overlays', function() {
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

    expect(getSelected()).toEqual([[0, 1, 4, 1]]);
  });

  it('should move focus to selected cell', () => {
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

  // This test should cover the #893 case, but it always passes. It seems like the keydown event (with CTRL key pressed) isn't delivered.
  it('should not move focus from outside elements on CTRL keydown event, when no cell is selected', () => {
    var $input = $('<input type="text"/>');
    $('body').append($input);

    handsontable();

    selectCell(0, 0);

    expect(document.activeElement.nodeName).toBeInArray(['TEXTAREA', 'BODY', 'HTML']);

    $input.focus();

    expect(document.activeElement.nodeName).toBe('INPUT');

    // var keyDownEvent = $.Event('keydown', {ctrlKey: true, metaKey: true});
    // $input.trigger(keyDownEvent);

    $input.simulate('keydown', {ctrlKey: true, metaKey: true});

    expect(document.activeElement.nodeName).toBe('INPUT');

    $input.remove();
  });

  it('should select the entire column after column header is clicked', function() {
    var hot = handsontable({
      width: 200,
      height: 100,
      startRows: 50,
      startCols: 5,
      colHeaders: true
    });

    this.$container.find('thead th:eq(0)').simulate('mousedown');

    expect(getSelected()).toEqual([[0, 0, 49, 0]]);
    expect(hot.selection.selectedHeader.rows).toBe(false);
    expect(hot.selection.selectedHeader.cols).toBe(true);
    expect(hot.selection.selectedHeader.corner).toBe(false);
  });

  it('should add classname after select column', function() {
    var hot = handsontable({
      width: 200,
      height: 100,
      startRows: 50,
      startCols: 5,
      colHeaders: true
    });

    this.$container.find('thead th:eq(0)').simulate('mousedown');

    expect(this.$container.hasClass('ht__selection--columns')).toBeTruthy();
  });

  it('should select the entire column after column header is clicked (in fixed rows/cols corner)', function() {
    var hot = handsontable({
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

    expect(getSelected()).toEqual([[0, 0, 49, 0]]);
    expect(hot.selection.selectedHeader.rows).toBe(false);
    expect(hot.selection.selectedHeader.cols).toBe(true);
    expect(hot.selection.selectedHeader.corner).toBe(false);
  });

  it('should select the entire fixed column after column header is clicked, after scroll horizontally', function() {
    var hot = handsontable({
      width: 200,
      height: 100,
      startRows: 50,
      startCols: 50,
      colHeaders: true,
      rowHeaders: true,
      fixedColumnsLeft: 2
    });

    hot.render();
    hot.view.wt.scrollHorizontal(20);

    this.$container.find('.ht_master thead th:eq(2)').simulate('mousedown');
    this.$container.find('.ht_master thead th:eq(2)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 1, 49, 1]]);
    expect(hot.selection.selectedHeader.rows).toBe(false);
    expect(hot.selection.selectedHeader.cols).toBe(true);
    expect(hot.selection.selectedHeader.corner).toBe(false);
  });

  it('should set the selection end to the first visible row, when dragging the selection from a cell to a column header', (done) => {
    var hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    hot.view.wt.scrollVertical(10);
    hot.view.wt.scrollHorizontal(10);

    hot.render();

    setTimeout(() => {
      $(getCell(12, 11)).simulate('mousedown');
      spec().$container.find('.ht_clone_top thead th:eq(2)').simulate('mouseover');
    }, 30);

    setTimeout(() => {
      expect(getSelected()).toEqual([[12, 11, 10, 11]]);
      done();
    }, 60);
  });

  it('should set the selection end to the first visible column, when dragging the selection from a cell to a row header', (done) => {
    var hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    hot.view.wt.scrollVertical(10);
    hot.view.wt.scrollHorizontal(10);

    hot.render();

    setTimeout(() => {
      $(getCell(12, 11)).simulate('mousedown');
      spec().$container.find('.ht_clone_left tbody th:eq(12)').simulate('mouseover');
    }, 30);

    setTimeout(() => {
      expect(getSelected()).toEqual([[12, 11, 12, 10]]);
      done();
    }, 60);
  });

  it('should allow to scroll the table when a whole column is selected and table is longer than it\'s container', function(done) {
    var errCount = 0;
    $(window).on('error.selectionTest', () => {
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

    setTimeout(() => {
      expect(errCount).toEqual(0); // expect no errors to be thrown

      $(window).off('error.selectionTest');
      done();
    }, 100);
  });

  it('should scroll to the end of the selection, when selecting cells using the keyboard', () => {
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

  it('should select the entire row after row header is clicked', function() {
    var hot = handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true
    });

    this.$container.find('tr:eq(2) th:eq(0)').simulate('mousedown');

    expect(getSelected()).toEqual([[1, 0, 1, 4]]);
    expect(hot.selection.selectedHeader.rows).toBe(true);
    expect(hot.selection.selectedHeader.cols).toBe(false);
    expect(hot.selection.selectedHeader.corner).toBe(false);
  });

  it('should add classname after select row', function() {
    var hot = handsontable({
      width: 200,
      height: 100,
      startRows: 50,
      startCols: 5,
      rowHeaders: true
    });

    this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

    expect(this.$container.hasClass('ht__selection--rows')).toBeTruthy();
  });

  it('should select the entire row of a partially fixed table after row header is clicked', function() {
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsLeft: 2
    });

    this.$container.find('tr:eq(2) th:eq(0)').simulate('mousedown');
    expect(getSelected()).toEqual([[1, 0, 1, 4]]);
    this.$container.find('tr:eq(3) th:eq(0)').simulate('mousedown');
    expect(getSelected()).toEqual([[2, 0, 2, 4]]);
  });

  it('should select a cell in a newly added row after automatic row adding, triggered by editing a cell in the last row with minSpareRows > 0, ' +
    'unless editing happened within the fixed bottom rows', (done) => {
    var hot = handsontable({
      startRows: 5,
      startCols: 2,
      minSpareRows: 1
    });

    setTimeout(() => {
      selectCell(4, 0);
      keyDownUp('enter');
    }, 10);

    setTimeout(() => {
      keyDownUp('enter');
    }, 100);

    setTimeout(() => {
      expect(countRows()).toEqual(6);
      expect(getSelected()).toEqual([[5, 0, 5, 0]]);
    }, 200);

    setTimeout(() => {
      done();
    }, 250);
  });

  it('should change selected coords by modifying coords object via `modifyTransformStart` hook', () => {
    var hot = handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 0);

    hot.addHook('modifyTransformStart', (coords) => {
      coords.col += 1;
      coords.row += 1;
    });
    keyDown('arrow_down');

    expect(getSelected()).toEqual([[2, 1, 2, 1]]);
  });

  it('should change selected coords by modifying coords object via `modifyTransformEnd` hook', () => {
    var hot = handsontable({
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 0);

    hot.addHook('modifyTransformEnd', (coords) => {
      coords.col += 2;
      coords.row += 1;
    });
    keyDown('shift+arrow_down');

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
  });

  it('should indicate is coords is out of bounds via `afterModifyTransformStart` hook', () => {
    var spy = jasmine.createSpy();

    var hot = handsontable({
      startRows: 5,
      startCols: 5
    });
    hot.addHook('afterModifyTransformStart', spy);

    selectCell(2, 0);
    keyDownUp('arrow_left');

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(-1);

    spy.calls.reset();
    selectCell(2, 4);
    keyDownUp('arrow_right');

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(1);

    spy.calls.reset();
    selectCell(4, 2);
    keyDownUp('arrow_down');

    expect(spy.calls.mostRecent().args[1]).toBe(1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);

    spy.calls.reset();
    selectCell(0, 2);
    keyDownUp('arrow_up');

    expect(spy.calls.mostRecent().args[1]).toBe(-1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);
  });

  it('should indicate is coords is out of bounds via `afterModifyTransformEnd` hook', () => {
    var spy = jasmine.createSpy();

    var hot = handsontable({
      startRows: 5,
      startCols: 5
    });
    hot.addHook('afterModifyTransformEnd', spy);

    selectCell(2, 0);
    keyDownUp('shift+arrow_left');

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(-1);

    spy.calls.reset();
    selectCell(2, 4);
    keyDownUp('shift+arrow_right');

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(1);

    spy.calls.reset();
    selectCell(4, 2);
    keyDownUp('shift+arrow_down');

    expect(spy.calls.mostRecent().args[1]).toBe(1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);

    spy.calls.reset();
    selectCell(0, 2);
    keyDownUp('shift+arrow_up');

    expect(spy.calls.mostRecent().args[1]).toBe(-1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);
  });

  it('should change selection after left mouse button on one of selected cell', () => {
    var hot = handsontable({
      startRows: 5,
      startCols: 5
    });

    var cells = $('.ht_master.handsontable td');

    cells.eq(6).simulate('mousedown');
    cells.eq(18).simulate('mouseover');
    cells.eq(18).simulate('mouseup');

    expect(hot.getSelected()).toEqual([[1, 1, 3, 3]]);

    cells.eq(16).simulate('mousedown');
    cells.eq(16).simulate('mouseup');

    expect(hot.getSelected()).toEqual([[3, 1, 3, 1]]);
  });

  it('should select the first row after corner header is clicked', function() {
    var hot = handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true
    });

    this.$container.find('thead').find('th').eq(0).simulate('mousedown');

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    expect(hot.selection.selectedHeader.rows).toBe(false);
    expect(hot.selection.selectedHeader.cols).toBe(false);
    expect(hot.selection.selectedHeader.corner).toBe(true);
  });

  it('should redraw selection when option `colHeaders` is set and user scrolled', function (done) {
    var hot = handsontable({
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true,
      width: 400,
      height: 200
    });
    var cellVerticalPosition;
    var borderOffsetInPixels = 1;
    var topBorder;

    selectCell(5, 5);
    hot.view.wt.wtOverlays.topOverlay.scrollTo(2);

    setTimeout(function () {
      cellVerticalPosition = hot.getCell(5, 5).offsetTop;
      topBorder = $('.wtBorder.current')[0];
      expect(topBorder.offsetTop).toEqual(cellVerticalPosition - borderOffsetInPixels);
      hot.view.wt.wtOverlays.topOverlay.scrollTo(0);
    }, 100);

    setTimeout(function () {
      cellVerticalPosition = hot.getCell(5, 5).offsetTop;
      topBorder = $('.wtBorder.current')[0];
      expect(topBorder.offsetTop).toEqual(cellVerticalPosition - borderOffsetInPixels);
      done();
    }, 200);
  });

  it('should redraw selection on `leftOverlay` when options `colHeaders` and `fixedColumnsLeft` are set, and user scrolled', function (done) {
    var hot = handsontable({
      fixedColumnsLeft: 2,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true,
      width: 400,
      height: 200
    });
    var cellVerticalPosition;
    var borderOffsetInPixels = 1;
    var topBorder;

    selectCell(1, 0);
    hot.view.wt.wtOverlays.topOverlay.scrollTo(5);

    setTimeout(function () {
      cellVerticalPosition = hot.getCell(1, 0).offsetTop;
      topBorder = $('.wtBorder.current')[0];
      expect(topBorder.offsetTop).toEqual(cellVerticalPosition - borderOffsetInPixels);
      hot.view.wt.wtOverlays.topOverlay.scrollTo(0);
    }, 100);

    setTimeout(function () {
      cellVerticalPosition = hot.getCell(1, 0).offsetTop;
      topBorder = $('.wtBorder.current')[0];
      expect(topBorder.offsetTop).toEqual(cellVerticalPosition - borderOffsetInPixels);
      done();
    }, 200);
  });

  describe('multiple selection mode', () => {
    it('should select cells by using two layers when CTRL key is pressed (default mode of the selectionMode option)', () => {
      handsontable({
        startRows: 8,
        startCols: 10
      });

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(4, 4)).simulate('mouseover');
      $(getCell(4, 4)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 1, 4, 4]]);

      keyDown('ctrl');

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(5, 6)).simulate('mouseover');
      $(getCell(5, 6)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 1, 4, 4], [3, 3, 5, 6]]);
    });

    it('should be disallowed to select non-consecutive cells when selectionMode is set as `single`', () => {
      handsontable({
        startRows: 8,
        startCols: 10,
        selectionMode: 'single',
      });

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(4, 4)).simulate('mouseover');
      $(getCell(4, 4)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 1, 1, 1]]);

      keyDown('ctrl');

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(5, 6)).simulate('mouseover');
      $(getCell(5, 6)).simulate('mouseup');

      expect(getSelected()).toEqual([[3, 3, 3, 3]]);
    });

    it('should be allowed to select consecutive cells when selectionMode is set as `range`', () => {
      handsontable({
        startRows: 8,
        startCols: 10,
        selectionMode: 'range',
      });

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(4, 4)).simulate('mouseover');
      $(getCell(4, 4)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 1, 4, 4]]);

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(5, 6)).simulate('mouseover');
      $(getCell(5, 6)).simulate('mouseup');

      expect(getSelected()).toEqual([[3, 3, 5, 6]]);
    });

    it('should be disallowed to select non-consecutive cells when selectionMode is set as `range`', () => {
      handsontable({
        startRows: 8,
        startCols: 10,
        selectionMode: 'range',
      });

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(4, 4)).simulate('mouseover');
      $(getCell(4, 4)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 1, 4, 4]]);

      keyDown('ctrl');

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(5, 6)).simulate('mouseover');
      $(getCell(5, 6)).simulate('mouseup');

      expect(getSelected()).toEqual([[3, 3, 5, 6]]);
    });

    it('should properly colorize selection layers including layer intersections', () => {
      handsontable({
        startRows: 21,
        startCols: 30,
        selectionMode: 'multiple',
      });

      $(getCell(0, 0)).simulate('mousedown');
      $(getCell(20, 15)).simulate('mouseover');
      $(getCell(20, 15)).simulate('mouseup');

      keyDown('ctrl');

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(19, 16)).simulate('mouseover');
      $(getCell(19, 16)).simulate('mouseup');

      $(getCell(2, 2)).simulate('mousedown');
      $(getCell(18, 17)).simulate('mouseover');
      $(getCell(18, 17)).simulate('mouseup');

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(17, 18)).simulate('mouseover');
      $(getCell(17, 18)).simulate('mouseup');

      $(getCell(4, 4)).simulate('mousedown');
      $(getCell(16, 19)).simulate('mouseover');
      $(getCell(16, 19)).simulate('mouseup');

      $(getCell(5, 5)).simulate('mousedown');
      $(getCell(15, 20)).simulate('mouseover');
      $(getCell(15, 20)).simulate('mouseup');

      $(getCell(6, 6)).simulate('mousedown');
      $(getCell(14, 21)).simulate('mouseover');
      $(getCell(14, 21)).simulate('mouseup');

      $(getCell(7, 7)).simulate('mousedown');
      $(getCell(13, 22)).simulate('mouseover');
      $(getCell(13, 22)).simulate('mouseup');

      $(getCell(8, 8)).simulate('mousedown');
      $(getCell(12, 23)).simulate('mouseover');
      $(getCell(12, 23)).simulate('mouseup');

      $(getCell(9, 9)).simulate('mousedown');
      $(getCell(11, 24)).simulate('mouseover');
      $(getCell(11, 24)).simulate('mouseup');

      $(getCell(10, 10)).simulate('mousedown');
      $(getCell(10, 25)).simulate('mouseover');
      $(getCell(10, 25)).simulate('mouseup');

      // This snapshot describes what the CSS classes the cells should contain. The letters indicate the layer level such as:
      // ' ' - An empty string means that there is no selection;
      // A - First layer, 'area' class name;
      // B - Second layer, 'area-1' class name;
      // C - Third layer, 'area-2' class name.
      // ...and so on
      //
      // Multiple selection generates CSS class names until it reaches 8-th layer ('area-7').
      const snapshot = [
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['0', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '0', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['0', '1', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '1', '0', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['0', '1', '2', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '2', '1', '0', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['0', '1', '2', '3', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '3', '2', '1', '0', ' ', ' ', ' ', ' ', ' ', ' '],
        ['0', '1', '2', '3', '4', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '4', '3', '2', '1', '0', ' ', ' ', ' ', ' ', ' '],
        ['0', '1', '2', '3', '4', '5', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '5', '4', '3', '2', '1', '0', ' ', ' ', ' ', ' '],
        ['0', '1', '2', '3', '4', '5', '6', '7', '7', '7', '7', '7', '7', '7', '7', '7', '6', '5', '4', '3', '2', '1', '0', ' ', ' ', ' '],
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '8', '8', '8', '8', '8', '8', '8', '7', '6', '5', '4', '3', '2', '1', '0', ' ', ' '],
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '8', '8', '8', '8', '8', '8', '8', '8', '7', '6', '5', '4', '3', '2', '1', '0', ' '],
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '9', '9', '9', '9', '9', '9', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0'],
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '8', '8', '8', '8', '8', '8', '8', '8', '7', '6', '5', '4', '3', '2', '1', '0', ' '],
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '8', '8', '8', '8', '8', '8', '8', '7', '6', '5', '4', '3', '2', '1', '0', ' ', ' '],
        ['0', '1', '2', '3', '4', '5', '6', '7', '7', '7', '7', '7', '7', '7', '7', '7', '6', '5', '4', '3', '2', '1', '0', ' ', ' ', ' '],
        ['0', '1', '2', '3', '4', '5', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '5', '4', '3', '2', '1', '0', ' ', ' ', ' ', ' '],
        ['0', '1', '2', '3', '4', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '4', '3', '2', '1', '0', ' ', ' ', ' ', ' ', ' '],
        ['0', '1', '2', '3', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '3', '2', '1', '0', ' ', ' ', ' ', ' ', ' ', ' '],
        ['0', '1', '2', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '2', '1', '0', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['0', '1', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '1', '0', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['0', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '0', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      ];

      const currentState = [];

      snapshot.forEach((rowData, rowIndex) => {
        const currentRowState = [];

        rowData.forEach((layer, columnIndex) => {
          if (layer === ' ') {
            currentRowState.push(' ');
          } else {
            const numericLayer = parseInt(layer, 10);
            const className = numericLayer === 0 ? 'area' : `area-${numericLayer <= 7 ? numericLayer : 7}`;

            currentRowState.push(getCell(rowIndex, columnIndex).classList.contains(className) ? layer : 'x');
          }
        });

        currentState.push(currentRowState);
      });

      expect(currentState).toEqual(snapshot);
    });

    it('should call afterSelection and afterSelectionEnd hooks with proper arguments', () => {
      const hooks = jasmine.createSpyObj('hooks', ['afterSelection', 'afterSelectionEnd']);
      handsontable({
        startRows: 21,
        startCols: 30,
        selectionMode: 'multiple',
        afterSelection: hooks.afterSelection,
        afterSelectionEnd: hooks.afterSelectionEnd,
      });

      $(getCell(0, 0)).simulate('mousedown');
      $(getCell(20, 15)).simulate('mouseover');
      $(getCell(20, 15)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([0, 0, 0, 0, jasmine.any(Object), 0]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([0, 0, 20, 15, jasmine.any(Object), 0]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([0, 0, 20, 15, 0, void 0]);

      keyDown('ctrl');
      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(19, 16)).simulate('mouseover');
      $(getCell(19, 16)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([1, 1, 1, 1, jasmine.any(Object), 1]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([1, 1, 19, 16, jasmine.any(Object), 1]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([1, 1, 19, 16, 1, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(2, 2)).simulate('mousedown');
      $(getCell(18, 17)).simulate('mouseover');
      $(getCell(18, 17)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([2, 2, 2, 2, jasmine.any(Object), 2]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([2, 2, 18, 17, jasmine.any(Object), 2]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([2, 2, 18, 17, 2, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(17, 18)).simulate('mouseover');
      $(getCell(17, 18)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([3, 3, 3, 3, jasmine.any(Object), 3]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([3, 3, 17, 18, jasmine.any(Object), 3]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([3, 3, 17, 18, 3, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(4, 4)).simulate('mousedown');
      $(getCell(16, 19)).simulate('mouseover');
      $(getCell(16, 19)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([4, 4, 4, 4, jasmine.any(Object), 4]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([4, 4, 16, 19, jasmine.any(Object), 4]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([4, 4, 16, 19, 4, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(5, 5)).simulate('mousedown');
      $(getCell(15, 20)).simulate('mouseover');
      $(getCell(15, 20)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([5, 5, 5, 5, jasmine.any(Object), 5]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([5, 5, 15, 20, jasmine.any(Object), 5]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([5, 5, 15, 20, 5, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(6, 6)).simulate('mousedown');
      $(getCell(14, 21)).simulate('mouseover');
      $(getCell(14, 21)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([6, 6, 6, 6, jasmine.any(Object), 6]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([6, 6, 14, 21, jasmine.any(Object), 6]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([6, 6, 14, 21, 6, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(7, 7)).simulate('mousedown');
      $(getCell(13, 22)).simulate('mouseover');
      $(getCell(13, 22)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([7, 7, 7, 7, jasmine.any(Object), 7]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([7, 7, 13, 22, jasmine.any(Object), 7]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([7, 7, 13, 22, 7, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(8, 8)).simulate('mousedown');
      $(getCell(12, 23)).simulate('mouseover');
      $(getCell(12, 23)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([8, 8, 8, 8, jasmine.any(Object), 8]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([8, 8, 12, 23, jasmine.any(Object), 8]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([8, 8, 12, 23, 8, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(9, 9)).simulate('mousedown');
      $(getCell(11, 24)).simulate('mouseover');
      $(getCell(11, 24)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([9, 9, 9, 9, jasmine.any(Object), 9]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([9, 9, 11, 24, jasmine.any(Object), 9]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([9, 9, 11, 24, 9, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(10, 10)).simulate('mousedown');
      $(getCell(10, 25)).simulate('mouseover');
      $(getCell(10, 25)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([10, 10, 10, 10, jasmine.any(Object), 10]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([10, 10, 10, 25, jasmine.any(Object), 10]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([10, 10, 10, 25, 10, void 0]);
    });

    it('should call afterSelectionByProp and afterSelectionEndByProp hooks with proper arguments', () => {
      const hooks = jasmine.createSpyObj('hooks', ['afterSelection', 'afterSelectionEnd']);
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(21, 30),
        selectionMode: 'multiple',
        afterSelectionByProp: hooks.afterSelection,
        afterSelectionEndByProp: hooks.afterSelectionEnd,
      });

      $(getCell(0, 0)).simulate('mousedown');
      $(getCell(20, 15)).simulate('mouseover');
      $(getCell(20, 15)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([0, 'prop0', 0, 'prop0', jasmine.any(Object), 0]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([0, 'prop0', 20, 'prop15', jasmine.any(Object), 0]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([0, 'prop0', 20, 'prop15', 0, void 0]);

      keyDown('ctrl');
      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(19, 16)).simulate('mouseover');
      $(getCell(19, 16)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([1, 'prop1', 1, 'prop1', jasmine.any(Object), 1]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([1, 'prop1', 19, 'prop16', jasmine.any(Object), 1]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([1, 'prop1', 19, 'prop16', 1, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(2, 2)).simulate('mousedown');
      $(getCell(18, 17)).simulate('mouseover');
      $(getCell(18, 17)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([2, 'prop2', 2, 'prop2', jasmine.any(Object), 2]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([2, 'prop2', 18, 'prop17', jasmine.any(Object), 2]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([2, 'prop2', 18, 'prop17', 2, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(17, 18)).simulate('mouseover');
      $(getCell(17, 18)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([3, 'prop3', 3, 'prop3', jasmine.any(Object), 3]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([3, 'prop3', 17, 'prop18', jasmine.any(Object), 3]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([3, 'prop3', 17, 'prop18', 3, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(4, 4)).simulate('mousedown');
      $(getCell(16, 19)).simulate('mouseover');
      $(getCell(16, 19)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([4, 'prop4', 4, 'prop4', jasmine.any(Object), 4]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([4, 'prop4', 16, 'prop19', jasmine.any(Object), 4]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([4, 'prop4', 16, 'prop19', 4, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(5, 5)).simulate('mousedown');
      $(getCell(15, 20)).simulate('mouseover');
      $(getCell(15, 20)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([5, 'prop5', 5, 'prop5', jasmine.any(Object), 5]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([5, 'prop5', 15, 'prop20', jasmine.any(Object), 5]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([5, 'prop5', 15, 'prop20', 5, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(6, 6)).simulate('mousedown');
      $(getCell(14, 21)).simulate('mouseover');
      $(getCell(14, 21)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([6, 'prop6', 6, 'prop6', jasmine.any(Object), 6]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([6, 'prop6', 14, 'prop21', jasmine.any(Object), 6]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([6, 'prop6', 14, 'prop21', 6, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(7, 7)).simulate('mousedown');
      $(getCell(13, 22)).simulate('mouseover');
      $(getCell(13, 22)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([7, 'prop7', 7, 'prop7', jasmine.any(Object), 7]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([7, 'prop7', 13, 'prop22', jasmine.any(Object), 7]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([7, 'prop7', 13, 'prop22', 7, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(8, 8)).simulate('mousedown');
      $(getCell(12, 23)).simulate('mouseover');
      $(getCell(12, 23)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([8, 'prop8', 8, 'prop8', jasmine.any(Object), 8]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([8, 'prop8', 12, 'prop23', jasmine.any(Object), 8]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([8, 'prop8', 12, 'prop23', 8, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(9, 9)).simulate('mousedown');
      $(getCell(11, 24)).simulate('mouseover');
      $(getCell(11, 24)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([9, 'prop9', 9, 'prop9', jasmine.any(Object), 9]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([9, 'prop9', 11, 'prop24', jasmine.any(Object), 9]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([9, 'prop9', 11, 'prop24', 9, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(10, 10)).simulate('mousedown');
      $(getCell(10, 25)).simulate('mouseover');
      $(getCell(10, 25)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([10, 'prop10', 10, 'prop10', jasmine.any(Object), 10]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([10, 'prop10', 10, 'prop25', jasmine.any(Object), 10]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([10, 'prop10', 10, 'prop25', 10, void 0]);
    });
  });
});
