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

    await scrollViewportTo({
      row: 250,
      col: 25,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    await selectCell(255, 27, 255, 27, false);

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(1250);
      main.toBe(1289);
      horizon.toBe(1484);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(5750);
      main.toBe(7250);
      horizon.toBe(9250);
    });

    await scrollToFocusedCell();

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(1250);
      main.toBe(1289);
      horizon.toBe(1484);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(5750);
      main.toBe(7250);
      horizon.toBe(9250);
    });
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

    await scrollToFocusedCell(callback);

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

    await selectCell(1, 1, 1, 1, false);
    await scrollToFocusedCell(callback);

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

    await selectCell(255, 49, 255, 49, false);
    await scrollToFocusedCell(callback);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should scroll the viewport to cell which is rendered outside the table on the left', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      colWidths: 60,
      rowHeaders: true,
      colHeaders: true,
    });

    await scrollViewportTo({
      row: 250,
      col: 49,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    await selectCell(255, 0, 255, 0, false);

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(2765);
      main.toBe(2765);
      horizon.toBe(2765);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(5750);
      main.toBe(7250);
      horizon.toBe(9250);
    });

    await scrollToFocusedCell();

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(5750);
      main.toBe(7250);
      horizon.toBe(9250);
    });
  });

  it('should scroll the viewport to cell which is rendered outside the table on the right', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      colWidths: 60,
      rowHeaders: true,
      colHeaders: true,
    });

    await scrollViewportTo({
      row: 250,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    await selectCell(255, 49, 255, 49, false);

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(5750);
      main.toBe(7250);
      horizon.toBe(9250);
    });

    await scrollToFocusedCell();

    // 2500 column width - 250 viewport width + 15 scrollbar compensation + 1 header border compensation
    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(2766);
      main.toBe(2766);
      horizon.toBe(2766);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(5750);
      main.toBe(7250);
      horizon.toBe(9250);
    });
  });

  it('should scroll the viewport to cell which is rendered outside the table at the very top', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    await scrollViewportTo({
      row: 255,
      col: 25,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    await selectCell(0, 27, 0, 27, false);

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(1250);
      main.toBe(1289);
      horizon.toBe(1484);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(5865);
      main.toBe(7395);
      horizon.toBe(9435);
    });

    await scrollToFocusedCell();

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(1250);
      main.toBe(1289);
      horizon.toBe(1484);
    });
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

    await scrollViewportTo({
      row: 255,
      col: 25,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    await selectCell(499, 27, 499, 27, false);

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(1250);
      main.toBe(1289);
      horizon.toBe(1484);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(5865);
      main.toBe(7395);
      horizon.toBe(9435);
    });

    await scrollToFocusedCell();

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(1250);
      main.toBe(1289);
      horizon.toBe(1484);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(11243);
      main.toBe(14246);
      horizon.toBe(18254);
    });
  });

  it('should scroll the viewport to the cell of the active selection layer', async() => {
    handsontable({
      data: createSpreadsheetData(500, 50),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    await selectCells([[84, 29, 85, 30], [118, 29, 119, 30], [184, 29, 185, 30]]);
    await keyDownUp(['shift', 'tab']); // move to the focus to the previous layer
    await scrollToFocusedCell();

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(1316);
      main.toBe(1410);
      horizon.toBe(1653);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(2737);
      main.toBe(3451);
      horizon.toBe(4403);
    });
  });
});
