describe('Core_onKeyDown', function () {
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

  it('should advance to next cell when TAB is pressed', function () {
    //https://github.com/handsontable/handsontable/issues/151
    handsontable();
    selectCell(0, 0);
    keyDownUp('tab');
    expect(getSelected()).toEqual([0, 1, 0, 1]);
  });

  it('while editing, should finish editing and advance to next cell when TAB is pressed', function () {
    //https://github.com/handsontable/handsontable/issues/215
    handsontable();
    selectCell(1, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');
    keyDownUp('tab');
    expect(getData()[1][1]).toEqual('Ted');
    expect(getSelected()).toEqual([1, 2, 1, 2]);
  });

  it('while editing, should finish editing and advance to lower cell when enter is pressed', function () {
    //https://github.com/handsontable/handsontable/issues/215
    handsontable();
    selectCell(1, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');
    keyDownUp('enter');
    expect(getData()[1][1]).toEqual('Ted');
    expect(getSelected()).toEqual([2, 1, 2, 1]);
  });

  it('while editing, should finish editing and advance to higher cell when shift+enter is pressed', function () {
    //https://github.com/handsontable/handsontable/issues/215
    handsontable();
    selectCell(1, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');
    keyDownUp('shift+enter');
    expect(getData()[1][1]).toEqual('Ted');
    expect(getSelected()).toEqual([0, 1, 0, 1]);
  });

  it('while editing, shouldn\'t finish editing and advance to lower cell when down arrow is pressed', function () {
    handsontable();
    selectCell(1, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');
    keyDownUp('arrow_down');
    expect(getData()[1][1]).toEqual(null);
    expect(getSelected()).toEqual([1, 1, 1, 1]);
  });

  it('while editing, shouldn\'t finish editing and advance to higher cell when up arrow is pressed', function () {
    handsontable();
    selectCell(1, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');
    keyDownUp('arrow_up');
    expect(getData()[1][1]).toEqual(null);
    expect(getSelected()).toEqual([1, 1, 1, 1]);
  });

  it('while editing, shouldn\'t finish editing and advance to right cell when right arrow is pressed', function () {
    handsontable();
    selectCell(1, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');
    keyDownUp('arrow_right');
    keyDownUp('arrow_right');
    keyDownUp('arrow_right');
    keyDownUp('arrow_right');
    expect(getData()[1][1]).toEqual(null);
    expect(getSelected()).toEqual([1, 1, 1, 1]);
  });

  it('while editing, shouldn\'t finish editing and advance to left cell when left arrow is pressed', function () {
    handsontable();
    selectCell(1, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');
    keyDownUp('arrow_left');
    keyDownUp('arrow_left');
    keyDownUp('arrow_left');
    keyDownUp('arrow_left');
    expect(getData()[1][1]).toEqual(null);
    expect(getSelected()).toEqual([1, 1, 1, 1]);
  });

  it('while editing, should finish editing and advance to lower cell when enter is pressed (with sync validator)', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      validator: function(val, cb){
        cb(true);
      },
      afterValidate: onAfterValidate
    });

    selectCell(1, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');

    onAfterValidate.reset();
    keyDownUp('enter');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalled();
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([2, 1, 2, 1]);
    });
  });

  it('while editing, should finish editing and advance to lower cell when enter is pressed (with async validator)', function () {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      validator: function(val, cb){
        setTimeout(function(){
          cb(true);
        }, 10);
      },
      afterValidate: onAfterValidate
    });
    selectCell(1, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');

    onAfterValidate.reset();
    keyDownUp('enter');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      expect(onAfterValidate).toHaveBeenCalled();
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([2, 1, 2, 1]);
    });
  });
});
