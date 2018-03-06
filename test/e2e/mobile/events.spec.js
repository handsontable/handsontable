const id = 'testContainer';

beforeEach(function () {
  this.$container = $(`<div id="${id}"></div>`).appendTo('body');
});

afterEach(function () {
  if (this.$container) {
    destroy();
    this.$container.remove();
  }
});

describe('Events', () => {
  it('should translate tap (`touchstart`) to `mousedown`', async () => {
    const afterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');

    const hot = handsontable({
      width: 400,
      height: 400,
      afterOnCellMouseDown
    });

    const cell = hot.getCell(1, 1);

    expect(getSelected()).toBeUndefined();

    triggerTouchEvent('touchstart', cell);

    await sleep(100);

    expect(getSelected()).toBeDefined();
    expect(afterOnCellMouseDown).toHaveBeenCalled();
  });
});
