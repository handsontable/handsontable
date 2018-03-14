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

  it('should block default action related to link touch and translate from the touch to click on a cell', async () => {
    const hot = handsontable({
      data: [['<a href="#justForTest">click me!</a>'], []],
      rowHeaders: true,
      colHeaders: true,
      width: 600,
      height: 400,
      columns: [
        {
          renderer: 'html'
        }
      ]
    });
    const onCellMouseUp = spyOn(hot.view.wt.wtSettings.settings, 'onCellMouseUp');

    const cell = hot.getCell(0, 0);

    triggerTouchEvent('touchstart', cell.firstChild);

    await sleep(100);

    triggerTouchEvent('touchend', cell.firstChild);

    await sleep(100);

    expect(onCellMouseUp).toHaveBeenCalled();
  });

  it('should trigger default action related link touch and do not translate from the touch to click on a cell', async () => {
    const hot = handsontable({
      data: [['<a href="#justForTest">click me!</a>'], []],
      rowHeaders: true,
      colHeaders: true,
      width: 600,
      height: 400,
      columns: [
        {
          renderer: 'html'
        }
      ]
    });
    const onCellMouseUp = spyOn(hot.view.wt.wtSettings.settings, 'onCellMouseUp');

    const cell = hot.getCell(0, 0);

    hot.selectCell(0, 0);

    await sleep(100);

    triggerTouchEvent('touchstart', cell.firstChild);

    await sleep(100);

    triggerTouchEvent('touchend', cell.firstChild);

    await sleep(100);

    expect(onCellMouseUp).not.toHaveBeenCalled();
  });
});
