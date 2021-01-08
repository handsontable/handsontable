describe('Core.isRenderSuspended', () => {
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

  it('should return `true` when the counter is greater than 0', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    hot.renderSuspendedCounter = 1;

    expect(hot.isRenderSuspended()).toBe(true);

    hot.renderSuspendedCounter = 3;

    expect(hot.isRenderSuspended()).toBe(true);
  });

  it('should return `false` when the counter is less or equal to 0', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    hot.renderSuspendedCounter = 0;

    expect(hot.isRenderSuspended()).toBe(false);

    hot.renderSuspendedCounter = -1;

    expect(hot.isRenderSuspended()).toBe(false);

    hot.renderSuspendedCounter = -2;

    expect(hot.isRenderSuspended()).toBe(false);
  });
});
