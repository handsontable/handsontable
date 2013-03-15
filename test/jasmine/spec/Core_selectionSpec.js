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

    runs(function () {
      handsontable({
        onSelection: function (r, c) {
          output = [r, c];
        }
      });
      selectCell(1, 2);
    });

    waitsFor(function () {
      return (output != null)
    }, "onSelection callback called", 100);

    runs(function () {
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
    });
  });

  it('should trigger selection event', function () {
    var output = null;

    runs(function () {
      handsontable();
      this.$container.on("selection.handsontable", function (event, r, c) {
        output = [r, c];
      });
      selectCell(1, 2);
    });

    waitsFor(function () {
      return (output != null)
    }, "selection event triggered", 100);

    runs(function () {
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
    });
  });

  it('this should point to handsontable rootElement (onSelection)', function () {
    var output = null;

    runs(function () {
      handsontable({
        onSelection: function () {
          output = this;
        }
      });
      selectCell(0, 0);
    });

    waitsFor(function () {
      return (output != null)
    }, "onSelection callback called", 100);

    runs(function () {
      expect(output).toEqual(this.$container.get(0));
    });
  });

  it('this should point to handsontable rootElement (onSelectionByProp)', function () {
    var output = null;

    runs(function () {
      handsontable({
        onSelectionByProp: function () {
          output = this;
        }
      });
      selectCell(0, 0);
    });

    waitsFor(function () {
      return (output != null)
    }, "onSelectionByProp callback called", 100);

    runs(function () {
      expect(output).toEqual(this.$container.get(0));
    });
  });

  it('should focus external textarea when clicked during editing', function () {
    var textarea = $('<input type="text">').prependTo($('body'));

    runs(function () {
      handsontable();
      selectCell(0, 0);
    });

    waits(10);

    runs(function () {
      keyDown('enter');
      $("html").triggerHandler('mouseup');
      textarea.focus();
    });

    waits(10);

    runs(function () {
      expect(document.activeElement).toBe(textarea[0]);
      textarea.remove();
    });
  });

  it('should deselect currently selected cell', function () {

    runs(function () {
      handsontable();
      selectCell(0, 0);
    });

    waits(10);

    runs(function () {
      $("html").triggerHandler('mousedown');
    });

    waits(10);

    runs(function () {
      expect(getSelected()).toBeUndefined();
    });

  });

  it('should not deselect currently selected cell', function () {

    runs(function () {
      handsontable({
        outsideClickDeselects : false
      });
      selectCell(0, 0);
    });

    waits(10);

    runs(function () {
      $("html").triggerHandler('mousedown');
    });

    waits(10);

    runs(function () {
      expect(getSelected()).toEqual([0, 0, 0, 0]);
    });

  });

  it('should deselect currently selected cell when focused on other input', function () {
    var textarea = $('<input type="text">').prependTo($('body'));

    runs(function () {
      handsontable({
        outsideClickDeselects : false
      });
      selectCell(0, 0);
    });

    waits(10);

    runs(function () {
      textarea.trigger('mousedown');
    });

    waits(10);

    runs(function () {
      expect(getSelected()).toBeUndefined();
      textarea.remove();
    });

  });

  it('should fix start range if provided is out of bounds (to the left)', function () {
    var err;
    try {
      handsontable({
        startRows: 5,
        startCols: 5
      });
      selectCell(0, 0);
      keyDownUp('arrow_left');
    }
    catch (e) {
      err = e;
    }

    expect(err).toBeUndefined();
    expect(getSelected()).toEqual([0, 0, 0, 0]);
  });

  it('should fix start range if provided is out of bounds (to the top)', function () {
    var err;
    try {
      handsontable({
        startRows: 5,
        startCols: 5
      });
      selectCell(0, 0);
      keyDownUp('arrow_up');
    }
    catch (e) {
      err = e;
    }

    expect(err).toBeUndefined();
    expect(getSelected()).toEqual([0, 0, 0, 0]);
  });

  it('should fix start range if provided is out of bounds (to the right)', function () {
    var err;
    try {
      handsontable({
        startRows: 5,
        startCols: 5
      });
      selectCell(0, 4);
      keyDownUp('arrow_right');
    }
    catch (e) {
      err = e;
    }

    expect(err).toBeUndefined();
    expect(getSelected()).toEqual([0, 4, 0, 4]);
  });

  it('should fix start range if provided is out of bounds (to the bottom)', function () {
    var err;
    try {
      handsontable({
        startRows: 5,
        startCols: 5
      });
      selectCell(4, 0);
      keyDownUp('arrow_down');
    }
    catch (e) {
      err = e;
    }

    expect(err).toBeUndefined();
    expect(getSelected()).toEqual([4, 0, 4, 0]);
  });

  it('should fix end range if provided is out of bounds (to the left)', function () {
    var err;
    try {
      handsontable({
        startRows: 5,
        startCols: 5
      });
      selectCell(0, 1);
      keyDownUp('shift+arrow_left');
      keyDownUp('shift+arrow_left');
    }
    catch (e) {
      err = e;
    }

    expect(err).toBeUndefined();
    expect(getSelected()).toEqual([0, 1, 0, 0]);
  });

  it('should fix end range if provided is out of bounds (to the top)', function () {
    var err;
    try {
      handsontable({
        startRows: 5,
        startCols: 5
      });
      selectCell(1, 0);
      keyDownUp('shift+arrow_up');
      keyDownUp('shift+arrow_up');
    }
    catch (e) {
      err = e;
    }

    expect(err).toBeUndefined();
    expect(getSelected()).toEqual([1, 0, 0, 0]);
  });

  it('should fix end range if provided is out of bounds (to the right)', function () {
    var err;
    try {
      handsontable({
        startRows: 5,
        startCols: 5
      });
      selectCell(0, 3);
      keyDownUp('shift+arrow_right');
      keyDownUp('shift+arrow_right');
    }
    catch (e) {
      err = e;
    }

    expect(err).toBeUndefined();
    expect(getSelected()).toEqual([0, 3, 0, 4]);
  });

  it('should fix end range if provided is out of bounds (to the bottom)', function () {
    var err;
    try {
      handsontable({
        startRows: 5,
        startCols: 5
      });
      selectCell(3, 0);
      keyDownUp('shift+arrow_down');
      keyDownUp('shift+arrow_down');
      keyDownUp('shift+arrow_down');
    }
    catch (e) {
      err = e;
    }

    expect(err).toBeUndefined();
    expect(getSelected()).toEqual([3, 0, 4, 0]);
  });

  it('should select multiple cells', function () {
    var err;
    try {
      handsontable({
        startRows: 5,
        startCols: 5
      });
      selectCell(3, 0, 4, 1);
    }
    catch (e) {
      err = e;
    }

    expect(err).toBeUndefined();
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

    waitsFor(nextFrame, 'next frame', 60);

    var that = this;
    runs(function () {
      that.$container.find('tr:eq(0) td:eq(0)').trigger('mousedown');
      that.$container.find('tr:eq(0) td:eq(1)').trigger('mouseenter');
      that.$container.find('tr:eq(1) td:eq(3)').trigger('mouseenter');

      var mouseup = $.Event('mouseup');
      mouseup.which = 1; //LMB
      that.$container.find('tr:eq(1) td:eq(3)').trigger(mouseup);

      expect(getSelected()).toEqual([0, 0, 1, 3]);
      expect(tick).toEqual(3);
      expect(tickEnd).toEqual(1);
    });
  });
});