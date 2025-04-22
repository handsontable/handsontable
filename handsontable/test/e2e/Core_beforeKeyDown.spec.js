describe('Core_beforeKeyDown', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  it('should run beforeKeyDown hook', () => {
    let called = false;

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown() {
        called = true;
      }
    });
    selectCell(0, 0);

    keyDownUp('arrowright');

    expect(called).toEqual(true);
  });

  it('should run afterDocumentKeyDown and beforeKeyDown hook', () => {
    const called = [];

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

    keyDownUp('arrowright');

    expect(called).toEqual(['beforeKeyDown', 'afterDocumentKeyDown']);
  });

  it('should prevent hook from running default action', () => {
    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown(event) {
        serveImmediatePropagation(event).stopImmediatePropagation();
      }
    });
    selectCell(0, 0);

    keyDownUp('arrowright');

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    expect(getSelected()).not.toEqual([[0, 1, 0, 1]]);
  });

  it('should overwrite default behavior of delete key, but not this of right arrow', () => {
    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown(event) {
        if (event.keyCode === 8) {
          event.stopImmediatePropagation();
          getInstance().alter('insert_row_above', 1, 1);
        }
      }
    });

    selectCell(0, 0);

    keyDownUp('backspace');
    keyDownUp('arrowright');

    expect(getData().length).toEqual(3);
    expect(getSelected()).toEqual([[0, 1, 0, 1]]);
  });

  it('should run beforeKeyDown hook in cell editor handler', () => {
    let called = 0;

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown() {
        called += 1;
      }
    });
    selectCell(0, 0);

    keyDownUp('enter');
    keyDownUp('enter');

    expect(called).toEqual(2);
  });
});
