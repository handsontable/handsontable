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

  it('should load cells below the viewport on scroll down', async () => {
    const hot = handsontable({
      width: 400,
      height: 400,
      data: Handsontable.helper.createSpreadsheetObjectData(100, 15)
    });

    const mainHolder = hot.view.wt.wtTable.holder;
    const $htCore = $(getHtCore());

    let TRs = $htCore.find('tr');
    let lastTR = [...TRs].pop();
    let firstBottomPosition = lastTR.getBoundingClientRect().bottom;

    $(mainHolder).scrollTop(400);
    $(mainHolder).scroll();

    await sleep(300);

    TRs = $htCore.find('tr');
    lastTR = [...TRs].pop();
    const nextBottomPosition = lastTR.getBoundingClientRect().bottom;

    expect(nextBottomPosition).toBeGreaterThan(firstBottomPosition);
  });
});
