describe('Core.scrollToFocusedCell', () => {
  /**
   * Sum of column widths for physical columns `[0 .. colExclusive - 1]` (matches horizontal
   * scroll offset when columns use default / auto sizing).
   *
   * @param {number} colExclusive First column index not included in the sum.
   * @returns {number} Total width in pixels.
   */
  function sumColWidthsBefore(colExclusive) {
    let sum = 0;

    for (let c = 0; c < colExclusive; c++) {
      sum += getColWidth(c);
    }

    return sum;
  }

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
      const expected = sumColWidthsBefore(25);

      classic.toBe(expected);
      main.toBe(expected);
      horizon.toBe(expected);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(calcRowHeight('classic') * 250);
      main.toBe(calcRowHeight('main') * 250);
      horizon.toBe(calcRowHeight('horizon') * 250);
    });

    await scrollToFocusedCell();

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      const expected = sumColWidthsBefore(25);

      classic.toBe(expected);
      main.toBe(expected);
      horizon.toBe(expected);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(calcRowHeight('classic') * 250);
      main.toBe(calcRowHeight('main') * 250);
      horizon.toBe(calcRowHeight('horizon') * 250);
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
      const maxScroll = calcHorizontalScrollEndSnap(49, 60, 300);

      classic.toBe(maxScroll - 1);
      main.toBe(maxScroll - 1);
      horizon.toBe(maxScroll - 1);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(calcRowHeight('classic') * 250);
      main.toBe(calcRowHeight('main') * 250);
      horizon.toBe(calcRowHeight('horizon') * 250);
    });

    await scrollToFocusedCell();

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(calcRowHeight('classic') * 250);
      main.toBe(calcRowHeight('main') * 250);
      horizon.toBe(calcRowHeight('horizon') * 250);
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
      classic.toBe(calcRowHeight('classic') * 250);
      main.toBe(calcRowHeight('main') * 250);
      horizon.toBe(calcRowHeight('horizon') * 250);
    });

    await scrollToFocusedCell();

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      const maxScroll = calcHorizontalScrollEndSnap(49, 60, 300);

      classic.toBe(maxScroll);
      main.toBe(maxScroll);
      horizon.toBe(maxScroll);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(calcRowHeight('classic') * 250);
      main.toBe(calcRowHeight('main') * 250);
      horizon.toBe(calcRowHeight('horizon') * 250);
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
      const expected = sumColWidthsBefore(25);

      classic.toBe(expected);
      main.toBe(expected);
      horizon.toBe(expected);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(calcRowHeight('classic') * 255);
      main.toBe(calcRowHeight('main') * 255);
      horizon.toBe(calcRowHeight('horizon') * 255);
    });

    await scrollToFocusedCell();

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      const expected = sumColWidthsBefore(25);

      classic.toBe(expected);
      main.toBe(expected);
      horizon.toBe(expected);
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
      const expected = sumColWidthsBefore(25);

      classic.toBe(expected);
      main.toBe(expected);
      horizon.toBe(expected);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(calcRowHeight('classic') * 255);
      main.toBe(calcRowHeight('main') * 255);
      horizon.toBe(calcRowHeight('horizon') * 255);
    });

    await scrollToFocusedCell();

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      const expected = sumColWidthsBefore(25);

      classic.toBe(expected);
      main.toBe(expected);
      horizon.toBe(expected);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(calcTopOverlayBottomSnapScroll(499, 300, 'classic'));
      main.toBe(calcTopOverlayBottomSnapScroll(499, 300, 'main'));
      horizon.toBe(calcTopOverlayBottomSnapScroll(499, 300, 'horizon'));
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

    // Focus lands on column 28 (previous layer), so horizontal scroll is the sum of widths for cols 0..27.
    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      const expected = sumColWidthsBefore(28);

      classic.toBe(expected);
      main.toBe(expected);
      horizon.toBe(expected);
    });
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(calcRowHeight('classic') * 119);
      main.toBe(calcRowHeight('main') * 119);
      horizon.toBe(calcRowHeight('horizon') * 119);
    });
  });
});
