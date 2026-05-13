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

  it('should not emit `afterScrollVertically` or `afterScroll` when vertical scroll fires without vertical position change', async() => {
    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');
    const onAfterScroll = jasmine.createSpy('onAfterScroll');

    handsontable({
      ...gridSettings,
      afterScrollVertically: onAfterScrollVertically,
      afterScroll: onAfterScroll,
    });

    const overlays = tableView()._wt.wtOverlays;
    const topOverlay = overlays.topOverlay;

    spyOn(topOverlay, 'getScrollPosition').and.returnValue(200);

    overlays.verticalScrolling = true;
    overlays.refreshAll();
    expect(onAfterScrollVertically).toHaveBeenCalledTimes(1);
    expect(onAfterScroll).toHaveBeenCalledTimes(1);

    onAfterScrollVertically.calls.reset();
    onAfterScroll.calls.reset();
    overlays.verticalScrolling = true;
    overlays.refreshAll();

    expect(onAfterScrollVertically).toHaveBeenCalledTimes(0);
    expect(onAfterScroll).toHaveBeenCalledTimes(0);
  });

  it('should not emit `afterScrollHorizontally` or `afterScroll` when horizontal scroll fires without horizontal position change', async() => {
    const onAfterScrollHorizontally = jasmine.createSpy('onAfterScrollHorizontally');
    const onAfterScroll = jasmine.createSpy('onAfterScroll');

    handsontable({
      ...gridSettings,
      afterScrollHorizontally: onAfterScrollHorizontally,
      afterScroll: onAfterScroll,
    });

    const overlays = tableView()._wt.wtOverlays;
    const inlineStartOverlay = overlays.inlineStartOverlay;

    spyOn(inlineStartOverlay, 'getScrollPosition').and.returnValue(200);

    overlays.horizontalScrolling = true;
    overlays.refreshAll();
    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(1);
    expect(onAfterScroll).toHaveBeenCalledTimes(1);

    onAfterScrollHorizontally.calls.reset();
    onAfterScroll.calls.reset();
    overlays.horizontalScrolling = true;
    overlays.refreshAll();

    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(0);
    expect(onAfterScroll).toHaveBeenCalledTimes(0);
  });

  it('should still emit axis-specific hooks once after duplicate scroll on the other axis', async() => {
    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');
    const onAfterScrollHorizontally = jasmine.createSpy('onAfterScrollHorizontally');

    handsontable({
      ...gridSettings,
      afterScrollVertically: onAfterScrollVertically,
      afterScrollHorizontally: onAfterScrollHorizontally,
    });

    const overlays = tableView()._wt.wtOverlays;
    const topOverlay = overlays.topOverlay;
    const inlineStartOverlay = overlays.inlineStartOverlay;

    spyOn(topOverlay, 'getScrollPosition').and.returnValue(150);
    spyOn(inlineStartOverlay, 'getScrollPosition').and.returnValue(250);

    overlays.verticalScrolling = true;
    overlays.refreshAll();
    overlays.verticalScrolling = true;
    overlays.refreshAll();
    expect(onAfterScrollVertically).toHaveBeenCalledTimes(1);

    overlays.horizontalScrolling = true;
    overlays.refreshAll();
    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(1);
  });
});
