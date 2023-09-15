describe('Core.scrollToFocusedCell', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not scroll the viewport when cell is visible', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    scrollViewportTo({
      row: 250,
      col: 25,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    selectCell(255, 27, 255, 27, false);

    expect(inlineStartOverlay().getScrollPosition()).toBe(1250);
    expect(topOverlay().getScrollPosition()).toBe(5750);

    scrollToFocusedCell();

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).toBe(1250);
    expect(topOverlay().getScrollPosition()).toBe(5750);
  });

  it('should not call a callback when there is no selection', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    const callback = jasmine.createSpy('callback');

    scrollToFocusedCell(callback);

    await sleep(10);

    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('should call a callback even then when there was no scroll', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    const callback = jasmine.createSpy('callback');

    selectCell(1, 1, 1, 1, false);
    scrollToFocusedCell(callback);

    await sleep(10);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should call a callback when there was a scroll', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    const callback = jasmine.createSpy('callback');

    selectCell(255, 49, 255, 49, false);
    scrollToFocusedCell(callback);

    await sleep(10);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should scroll the viewport to cell which is rendered outside the table on the left', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    scrollViewportTo({
      row: 250,
      col: 49,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    selectCell(255, 0, 255, 0, false);

    expect(inlineStartOverlay().getScrollPosition()).toBe(2265);
    expect(topOverlay().getScrollPosition()).toBe(5750);

    scrollToFocusedCell();

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(topOverlay().getScrollPosition()).toBe(5750);
  });

  it('should scroll the viewport to cell which is rendered outside the table on the right', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    scrollViewportTo({
      row: 250,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    selectCell(255, 49, 255, 49, false);

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(topOverlay().getScrollPosition()).toBe(5750);

    scrollToFocusedCell();

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).toBe(2265);
    expect(topOverlay().getScrollPosition()).toBe(5750);
  });

  it('should scroll the viewport to cell which is rendered outside the table at the very top', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    scrollViewportTo({
      row: 255,
      col: 25,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    selectCell(0, 27, 0, 27, false);

    expect(inlineStartOverlay().getScrollPosition()).toBe(1250);
    expect(topOverlay().getScrollPosition()).toBe(5865);

    scrollToFocusedCell();

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).toBe(1250);
    expect(topOverlay().getScrollPosition()).toBe(0);
  });

  it('should scroll the viewport to cell which is rendered outside the table at the very bottom', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    scrollViewportTo({
      row: 255,
      col: 25,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    selectCell(499, 27, 499, 27, false);

    expect(inlineStartOverlay().getScrollPosition()).toBe(1250);
    expect(topOverlay().getScrollPosition()).toBe(5865);

    scrollToFocusedCell();

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).toBe(1250);
    expect(topOverlay().getScrollPosition()).toBe(11243);
  });
});
