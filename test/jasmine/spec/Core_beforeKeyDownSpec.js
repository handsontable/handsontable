describe('Core_beforeKeyDown', function () {
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

  it('should run beforeKeyDown hook', function () {
    var called = false;

    handsontable({
      data : [[1,2,3,4,5],[1,2,3,4,5]],
      beforeKeyDown: function (event) {
        called = true;
      }
    });
    selectCell(0,0);

    keyDown('arrow_right');

    expect(called).toEqual(true);
  });

  it('should prevent hook fron running default action', function () {
    var called = false;

    handsontable({
      data : [[1,2,3,4,5],[1,2,3,4,5]],
      beforeKeyDown: function (event) {
        event.stopImmediatePropagation();
        called = true;
      }
    });
    selectCell(0,0);

    keyDown('arrow_right');

    expect(getSelected()).toEqual([0,0,0,0]);
    expect(getSelected()).not.toEqual([0,1,0,1]);
  });

  it('should overwrite default behavior of delete key, but not this of right arrow', function () {
    var called = 0;

    handsontable({
      data : [[1,2,3,4,5],[1,2,3,4,5]],
      beforeKeyDown: function (event) {
        if (event.keyCode === 8) {
          event.stopImmediatePropagation();
          getInstance().alter('insert_row', 1, 1);
        }

        called++;
      }
    });

    selectCell(0,0);

    keyDown('backspace');
    keyDown('arrow_right');

    expect(getData().length).toEqual(3);
    expect(getSelected()).toEqual([0,1,0,1]);
  });

  it('should run beforeKeyDown hook in cell editor handler', function () {
    var called = 0;

    handsontable({
      data : [[1,2,3,4,5],[1,2,3,4,5]],
      beforeKeyDown: function (event) {
        called++;
      }
    });
    selectCell(0,0);

    keyDown('enter');
    keyDown('enter');

    expect(called).toEqual(2);
  });

});