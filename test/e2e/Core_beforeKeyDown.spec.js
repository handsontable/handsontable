describe('Core_beforeKeyDown', () => {
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

  it('should run beforeKeyDown hook', () => {
    var called = false;

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown(event) {
        called = true;
      }
    });
    selectCell(0, 0);

    keyDown('arrow_right');

    expect(called).toEqual(true);
  });

  it('should run afterDocumentKeyDown and beforeKeyDown hook', () => {
    var called = [];

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      afterDocumentKeyDown() {
        called.push('afterDocumentKeyDown');
      },
      beforeKeyDown() {
        called.push('beforeKeyDown');
      }
    });
    selectCell(0, 0);

    keyDown('arrow_right');

    expect(called).toEqual(['afterDocumentKeyDown', 'beforeKeyDown']);
  });

  it('should prevent hook from running default action', () => {
    var called = false;

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown(event) {

        event = serveImmediatePropagation(event);

        event.stopImmediatePropagation();
        called = true;
      }
    });
    selectCell(0, 0);

    keyDown('arrow_right');

    expect(getSelected()).toEqual([0, 0, 0, 0]);
    expect(getSelected()).not.toEqual([0, 1, 0, 1]);
  });

  it('should overwrite default behavior of delete key, but not this of right arrow', () => {
    var called = 0;

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown(event) {
        if (event.keyCode === 8) {
          event.stopImmediatePropagation();
          getInstance().alter('insert_row', 1, 1);
        }

        called++;
      }
    });

    selectCell(0, 0);

    keyDown('backspace');
    keyDown('arrow_right');

    expect(getData().length).toEqual(3);
    expect(getSelected()).toEqual([0, 1, 0, 1]);
  });

  it('should run beforeKeyDown hook in cell editor handler', () => {
    var called = 0;

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown(event) {
        called++;
      }
    });
    selectCell(0, 0);

    keyDown('enter');
    keyDown('enter');

    expect(called).toEqual(2);
  });
});
