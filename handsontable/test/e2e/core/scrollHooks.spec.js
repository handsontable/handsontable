describe('Core hooks (`afterScroll*`)', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not emit `afterScrollVertically` when only horizontal scroll changes and vertical scroll is already set', async() => {
    const onAfterScrollHorizontally = jasmine.createSpy('onAfterScrollHorizontally');
    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');

    handsontable({
      data: createSpreadsheetData(100, 100),
      width: 300,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      afterScrollHorizontally: onAfterScrollHorizontally,
      afterScrollVertically: onAfterScrollVertically,
    });

    const holder = tableView()._wt.wtTable.holder;

    holder.scrollTop = 200;
    await sleep(50);

    onAfterScrollHorizontally.calls.reset();
    onAfterScrollVertically.calls.reset();

    holder.scrollLeft = 200;
    await sleep(50);

    expect(onAfterScrollVertically).toHaveBeenCalledTimes(0);
    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(1);
  });

  it('should not emit `afterScrollHorizontally` when only vertical scroll changes and horizontal scroll is already set', async() => {
    const onAfterScrollHorizontally = jasmine.createSpy('onAfterScrollHorizontally');
    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');

    handsontable({
      data: createSpreadsheetData(100, 100),
      width: 300,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      afterScrollHorizontally: onAfterScrollHorizontally,
      afterScrollVertically: onAfterScrollVertically,
    });

    const holder = tableView()._wt.wtTable.holder;

    holder.scrollLeft = 200;
    await sleep(50);

    onAfterScrollHorizontally.calls.reset();
    onAfterScrollVertically.calls.reset();

    holder.scrollTop = 200;
    await sleep(50);

    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(0);
    expect(onAfterScrollVertically).toHaveBeenCalledTimes(1);
  });

  it('should not emit `afterScrollVertically` when vertical callback is fired without vertical position change', async() => {
    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');

    handsontable({
      data: createSpreadsheetData(100, 100),
      width: 300,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      afterScrollVertically: onAfterScrollVertically,
    });

    const holder = tableView()._wt.wtTable.holder;

    holder.scrollTop = 200;
    await sleep(50);

    onAfterScrollVertically.calls.reset();
    tableView()._wt.wtSettings.getSetting('onScrollVertically');

    expect(onAfterScrollVertically).toHaveBeenCalledTimes(0);
  });

  it('should not emit `afterScrollHorizontally` when horizontal callback is fired without horizontal position change', async() => {
    const onAfterScrollHorizontally = jasmine.createSpy('onAfterScrollHorizontally');

    handsontable({
      data: createSpreadsheetData(100, 100),
      width: 300,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      afterScrollHorizontally: onAfterScrollHorizontally,
    });

    const holder = tableView()._wt.wtTable.holder;

    holder.scrollLeft = 200;
    await sleep(50);

    onAfterScrollHorizontally.calls.reset();
    tableView()._wt.wtSettings.getSetting('onScrollHorizontally');

    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(0);
  });
});
