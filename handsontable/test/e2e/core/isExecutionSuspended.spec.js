describe('Core.isExecutionSuspended', () => {
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

    hot.executionSuspendedCounter = 1;

    expect(hot.isExecutionSuspended()).toBe(true);

    hot.executionSuspendedCounter = 3;

    expect(hot.isExecutionSuspended()).toBe(true);
  });

  it('should return `false` when the counter is less or equal to 0', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    hot.executionSuspendedCounter = 0;

    expect(hot.isExecutionSuspended()).toBe(false);

    hot.executionSuspendedCounter = -1;

    expect(hot.isExecutionSuspended()).toBe(false);

    hot.executionSuspendedCounter = -2;

    expect(hot.isExecutionSuspended()).toBe(false);
  });
});
