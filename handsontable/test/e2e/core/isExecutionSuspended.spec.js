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

  it('should return `true` when the counter is greater than 0', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    hot.executionSuspendedCounter = 1;

    expect(isExecutionSuspended()).toBe(true);

    hot.executionSuspendedCounter = 3;

    expect(isExecutionSuspended()).toBe(true);
  });

  it('should return `false` when the counter is less or equal to 0', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    hot.executionSuspendedCounter = 0;

    expect(isExecutionSuspended()).toBe(false);

    hot.executionSuspendedCounter = -1;

    expect(isExecutionSuspended()).toBe(false);

    hot.executionSuspendedCounter = -2;

    expect(isExecutionSuspended()).toBe(false);
  });
});
