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
      onSelection: function (r, c) {
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
    Handsontable.PluginHooks.add('onSelection', function (r, c) {
      output = [r, c];
    });
    selectCell(1, 2);

    expect(output[0]).toEqual(1);
    expect(output[1]).toEqual(2);
  });

  it('this.rootElement should point to handsontable rootElement (onSelection)', function () {
    var output = null;

    handsontable({
      onSelection: function () {
        output = this.rootElement[0];
      }
    });
    selectCell(0, 0);

    expect(output).toEqual(this.$container[0]);
  });

  it('this.rootElement should point to handsontable rootElement (onSelectionByProp)', function () {
    var output = null;

    handsontable({
      onSelectionByProp: function () {
        output = this.rootElement[0];
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
    $("html").triggerHandler('mouseup');
    textarea.focus();

    expect(document.activeElement).toBe(textarea[0]);
    textarea.remove();
  });

  it('should deselect currently selected cell', function () {
    handsontable();
    selectCell(0, 0);

    $("html").triggerHandler('mousedown');

    expect(getSelected()).toBeUndefined();
  });

  it('should not deselect currently selected cell', function () {
    handsontable({
      outsideClickDeselects: false
    });
    selectCell(0, 0);

    $("html").triggerHandler('mousedown');

    expect(getSelected()).toEqual([0, 0, 0, 0]);
  });

  it('should allow to focus on external input and hold current selection informations', function () {
    var textarea = $('<input id="test_textarea" type="text">').prependTo($('body'));

    handsontable({
      outsideClickDeselects: false
    });
    selectCell(0, 0);

    textarea.trigger('mousedown');
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
    textarea.trigger('mousedown');
    textarea.trigger('mouseup');

    textarea.on('keydown', function (event) {
      keyPressed = event.keyCode;
    });

    var LETTER_a_KEY = 97;
    var event = $.Event('keydown');
    event.keyCode = LETTER_a_KEY;

    $(document.activeElement).trigger(event);

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
    textarea.trigger('mousedown');
    textarea.trigger('mouseup');

    textarea.on('keydown', function (event) {
      keyPressed = event.keyCode;
    });

    var LETTER_a_KEY = 97;
    var event = $.Event('keydown');
    event.keyCode = LETTER_a_KEY;

    $(document.activeElement).trigger(event);

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
      onSelection: function () {
        tick++;
      },
      onSelectionEnd: function () {
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
      onSelectionEnd: function () {
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
      onSelectionEnd: function () {
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
      onSelection: function () {
        tick++;
      },
      onSelectionEnd: function () {
        tickEnd++;
      }
    });

    this.$container.find('tr:eq(0) td:eq(0)').trigger('mousedown');
    this.$container.find('tr:eq(0) td:eq(1)').trigger('mouseenter');
    this.$container.find('tr:eq(1) td:eq(3)').trigger('mouseenter');

    var mouseup = $.Event('mouseup');
    mouseup.which = 1; //LMB
    this.$container.find('tr:eq(1) td:eq(3)').trigger(mouseup);

    expect(getSelected()).toEqual([0, 0, 1, 3]);
    expect(tick).toEqual(3);
    expect(tickEnd).toEqual(1);
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

    expect(document.activeElement.nodeName).toBeInArray('BODY', 'HTML');

    $input.focus();

    expect(document.activeElement.nodeName).toBe('INPUT');

    var keyDownEvent = $.Event('keydown', {ctrlKey: true, metaKey: true});
    $input.trigger(keyDownEvent);

    expect(document.activeElement.nodeName).toBe('INPUT');

    $input.remove();


  });
});