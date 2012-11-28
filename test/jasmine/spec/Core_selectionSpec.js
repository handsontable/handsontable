describe('Core_selection', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
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

  it('this should focus external textarea when clicked during editing', function () {
    var output = null;
    var textarea = $('<input>').appendTo($('body'));

    runs(function () {
      handsontable({
        onSelectionByProp: function () {
          output = this;
        }
      });
      selectCell(0, 0);
    });

    waits(10);

    runs(function () {
      keyDown('enter');
      $("html").triggerHandler('click');
      textarea.focus();
    });

    waits(10);

    runs(function () {
      expect(textarea.is(":focus")).toEqual(true);
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
    expect(getSelected()).toEqual([0, 0, 0, 1]);
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
    expect(getSelected()).toEqual([0, 0, 1, 0]);
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
    }
    catch (e) {
      err = e;
    }

    expect(err).toBeUndefined();
    expect(getSelected()).toEqual([3, 0, 4, 0]);
  });
});