describe('Core_beforeKeyDown', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should run beforeKeyDown hook', async() => {
    let called = false;

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown() {
        called = true;
      }
    });

    await selectCell(0, 0);
    await keyDownUp('arrowright');

    expect(called).toEqual(true);
  });

  it('should run afterDocumentKeyDown and beforeKeyDown hook', async() => {
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

    await selectCell(0, 0);
    await keyDownUp('arrowright');

    expect(called).toEqual(['beforeKeyDown', 'afterDocumentKeyDown']);
  });

  it('should prevent hook from running default action', async() => {
    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown(event) {
        serveImmediatePropagation(event).stopImmediatePropagation();
      }
    });

    await selectCell(0, 0);
    await keyDownUp('arrowright');

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    expect(getSelected()).not.toEqual([[0, 1, 0, 1]]);
  });

  it('should overwrite default behavior of delete key, but not this of right arrow', async() => {
    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown(event) {
        if (event.keyCode === 8) {
          event.stopImmediatePropagation();
          getInstance().alter('insert_row_above', 1, 1);
        }
      }
    });

    await selectCell(0, 0);
    await keyDownUp('backspace');
    await keyDownUp('arrowright');

    expect(getData().length).toEqual(3);
    expect(getSelected()).toEqual([[0, 1, 0, 1]]);
  });

  it('should run beforeKeyDown hook in cell editor handler', async() => {
    let called = 0;

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeKeyDown() {
        called += 1;
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(called).toEqual(2);
  });
});
