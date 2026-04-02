describe('Core hooks (`afterScroll*`)', () => {
  const gridSettings = {
    data: createSpreadsheetData(100, 100),
    width: 300,
    height: 200,
    rowHeaders: true,
    colHeaders: true,
  };

  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not emit `afterScrollVertically` or `afterScroll` when vertical callback is fired without vertical position change', async() => {
    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');
    const onAfterScroll = jasmine.createSpy('onAfterScroll');

    handsontable({
      ...gridSettings,
      afterScrollVertically: onAfterScrollVertically,
      afterScroll: onAfterScroll,
    });

    const topOverlay = tableView()._wt.wtOverlays.topOverlay;

    spyOn(topOverlay, 'getScrollPosition').and.returnValue(200);

    tableView()._wt.wtSettings.getSetting('onScrollVertically');
    expect(onAfterScrollVertically).toHaveBeenCalledTimes(1);
    expect(onAfterScroll).toHaveBeenCalledTimes(1);

    onAfterScrollVertically.calls.reset();
    onAfterScroll.calls.reset();
    tableView()._wt.wtSettings.getSetting('onScrollVertically');

    expect(onAfterScrollVertically).toHaveBeenCalledTimes(0);
    expect(onAfterScroll).toHaveBeenCalledTimes(0);
  });

  it('should not emit `afterScrollHorizontally` or `afterScroll` when horizontal callback is fired without horizontal position change', async() => {
    const onAfterScrollHorizontally = jasmine.createSpy('onAfterScrollHorizontally');
    const onAfterScroll = jasmine.createSpy('onAfterScroll');

    handsontable({
      ...gridSettings,
      afterScrollHorizontally: onAfterScrollHorizontally,
      afterScroll: onAfterScroll,
    });

    const inlineStartOverlay = tableView()._wt.wtOverlays.inlineStartOverlay;

    spyOn(inlineStartOverlay, 'getScrollPosition').and.returnValue(200);

    tableView()._wt.wtSettings.getSetting('onScrollHorizontally');
    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(1);
    expect(onAfterScroll).toHaveBeenCalledTimes(1);

    onAfterScrollHorizontally.calls.reset();
    onAfterScroll.calls.reset();
    tableView()._wt.wtSettings.getSetting('onScrollHorizontally');

    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(0);
    expect(onAfterScroll).toHaveBeenCalledTimes(0);
  });

  it('should still emit axis-specific hooks once after duplicate callbacks on the other axis', async() => {
    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');
    const onAfterScrollHorizontally = jasmine.createSpy('onAfterScrollHorizontally');

    handsontable({
      ...gridSettings,
      afterScrollVertically: onAfterScrollVertically,
      afterScrollHorizontally: onAfterScrollHorizontally,
    });

    const topOverlay = tableView()._wt.wtOverlays.topOverlay;
    const inlineStartOverlay = tableView()._wt.wtOverlays.inlineStartOverlay;

    spyOn(topOverlay, 'getScrollPosition').and.returnValue(150);
    spyOn(inlineStartOverlay, 'getScrollPosition').and.returnValue(250);

    tableView()._wt.wtSettings.getSetting('onScrollVertically');
    tableView()._wt.wtSettings.getSetting('onScrollVertically');
    expect(onAfterScrollVertically).toHaveBeenCalledTimes(1);

    tableView()._wt.wtSettings.getSetting('onScrollHorizontally');
    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(1);
  });
});
