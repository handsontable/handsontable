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

    const topOverlay = tableView()._wt.wtOverlays.topOverlay;

    spyOn(topOverlay, 'getScrollPosition').and.returnValue(200);

    tableView()._wt.wtSettings.getSetting('onScrollVertically');
    expect(onAfterScrollVertically).toHaveBeenCalledTimes(1);

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

    const inlineStartOverlay = tableView()._wt.wtOverlays.inlineStartOverlay;

    spyOn(inlineStartOverlay, 'getScrollPosition').and.returnValue(200);

    tableView()._wt.wtSettings.getSetting('onScrollHorizontally');
    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(1);

    onAfterScrollHorizontally.calls.reset();
    tableView()._wt.wtSettings.getSetting('onScrollHorizontally');

    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(0);
  });
});
