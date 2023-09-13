describe('Core.scrollViewportTo', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the bottom-right edge when ' +
     ' the previous viewport position was on the top-left (auto-snapping)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 100),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    const result = scrollViewportTo({
      row: 150,
      col: 50,
    });

    await sleep(10);

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(2315);
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).toBe(3215);
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the bottom-left edge when ' +
     'the previous viewport position was on the top-right (auto-snapping)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 100),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    // move the table to the top-right viewport position
    scrollViewportTo({
      row: 0,
      col: 99,
    });

    await sleep(10);

    const result = scrollViewportTo({
      row: 150,
      col: 50,
    });

    await sleep(10);

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(2502);
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).toBe(3215);
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the top-left edge when ' +
     'the previous viewport position was on the bottom-right (auto-snapping)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 100),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    // move the table to the bottom-right viewport position
    scrollViewportTo({
      row: 199,
      col: 99,
    });

    await sleep(10);

    const result = scrollViewportTo({
      row: 150,
      col: 50,
    });

    await sleep(10);

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(2502);
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).toBe(3450);
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the top-right edge when ' +
     'the previous viewport position was on the bottom-left (auto-snapping)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 100),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    // move the table to the bottom-left viewport position
    scrollViewportTo({
      row: 199,
      col: 0,
    });

    await sleep(10);

    const result = scrollViewportTo({
      row: 150,
      col: 50,
    });

    await sleep(10);

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(2317);
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).toBe(3450);
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the bottom edge (manual snapping)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 100),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    const result = scrollViewportTo({
      row: 150,
      verticalSnap: 'bottom',
    });

    await sleep(10);

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(0);
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).toBe(3215);
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the top edge (manual snapping)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 100),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    const result = scrollViewportTo({
      row: 150,
      verticalSnap: 'top',
    });

    await sleep(10);

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(0);
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).toBe(3450);
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the right edge (manual snapping)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 100),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    const result = scrollViewportTo({
      col: 50,
      horizontalSnap: 'right',
    });

    await sleep(10);

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(2315);
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).toBe(0);
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the left edge (manual snapping)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 100),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    const result = scrollViewportTo({
      col: 50,
      horizontalSnap: 'left',
    });

    await sleep(10);

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(2500);
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).toBe(0);
  });
});
