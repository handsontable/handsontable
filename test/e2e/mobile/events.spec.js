const id = 'testContainer';

describe('Events', () => {
  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should translate tap (`touchstart`) to `mousedown`', async() => {
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

  it('should translate double tap to `dblclick`', async() => {
    const onCellDblClick = jasmine.createSpy('onCellDblClick');

    const hot = handsontable({
      width: 400,
      height: 400,
    });
    hot.view.wt.update('onCellDblClick', onCellDblClick);

    const cell = hot.getCell(1, 1);

    expect(getSelected()).toBeUndefined();

    triggerTouchEvent('touchstart', cell);
    triggerTouchEvent('touchend', cell);
    triggerTouchEvent('touchstart', cell);
    triggerTouchEvent('touchend', cell);

    await sleep(100);

    expect(getSelected()).toBeDefined();
    expect(onCellDblClick).toHaveBeenCalled();
  });

  // Currently, this test is skipped. There is a problem for test canceling events from simulated events.
  xit('should block default action related to link touch and translate from the touch to click on a cell', async() => {
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

    const linkElement = hot.getCell(0, 0).firstChild;

    hot.selectCell(0, 0);
    location.hash = '';

    await sleep(100);

    triggerTouchEvent('touchstart', linkElement);
    triggerTouchEvent('touchend', linkElement);

    expect(location.hash).toBe('#justForTest');

    await sleep(400); // To prevents double-click detection (emulation)

    location.hash = '';
    // selecting cell other than the one with link
    hot.selectCell(1, 0);

    await sleep(100);

    triggerTouchEvent('touchstart', linkElement);
    triggerTouchEvent('touchend', linkElement);

    expect(location.hash).toBe('');
  });
});
