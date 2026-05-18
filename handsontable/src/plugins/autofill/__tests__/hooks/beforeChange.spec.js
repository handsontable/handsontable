describe('AutoFill beforeChange hook', () => {
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

  it('should use a custom value when introducing changes', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
      ],
      beforeChange(changes) {
        changes[0][3] = 'test2';
        changes[1][3] = 'test3';
        changes[2][3] = 'test4';
      }
    });
    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(3, 0));

    expect(getSelected()).toEqual([[0, 0, 3, 0]]);
    expect(getData()).toEqual([
      [1, 2, 3, 4, 5, 6],
      ['test2', 2, 3, 4, 5, 6],
      ['test3', 2, 3, 4, 5, 6],
      ['test4', 2, 3, 4, 5, 6]
    ]);
  });
});
