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

  using('configuration object', [
    { htmlDir: 'rtl' },
    { htmlDir: 'ltr' },
  ], ({ htmlDir }) => {
    beforeEach(() => {
      $('html').attr('dir', htmlDir);
    });

    afterEach(() => {
      $('html').attr('dir', 'ltr');
    });

    it('should scroll the viewport in such a way that the coordinates are glued to the bottom-end edge when ' +
        'the previous viewport position was on the top-start (auto-snapping)', () => {
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

      render();

      expect(result).toBe(true);
      expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(2318);
        main.toBe(2620);
      });
      expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(3216);
        main.toBe(4125);
      });
    });

    it('should scroll the viewport in such a way that the coordinates are glued to the bottom-start edge when ' +
       'the previous viewport position was on the top-end (auto-snapping)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(200, 100),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // move the table to the top-end viewport position
      scrollViewportTo({
        row: 0,
        col: 99,
      });

      render();

      const result = scrollViewportTo({
        row: 150,
        col: 50,
      });

      render();

      expect(result).toBe(true);
      expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(2502);
        main.toBe(2795);
      });
      expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(3216);
        main.toBe(4125);
      });
    });

    it('should scroll the viewport in such a way that the coordinates are glued to the top-start edge when ' +
       'the previous viewport position was on the bottom-end (auto-snapping)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(200, 100),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // move the table to the bottom-end viewport position
      scrollViewportTo({
        row: 199,
        col: 99,
      });

      render();

      const result = scrollViewportTo({
        row: 150,
        col: 50,
      });

      render();

      expect(result).toBe(true);
      expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(2502);
        main.toBe(2795);
      });
      expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(3450);
        main.toBe(4350);
      });
    });

    it('should scroll the viewport in such a way that the coordinates are glued to the top-end edge when ' +
       'the previous viewport position was on the bottom-start (auto-snapping)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(200, 100),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // move the table to the bottom-start viewport position
      scrollViewportTo({
        row: 199,
        col: 0,
      });

      render();

      const result = scrollViewportTo({
        row: 150,
        col: 50,
      });

      render();

      expect(result).toBe(true);
      expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(2318);
        main.toBe(2620);
      });
      expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(3450);
        main.toBe(4350);
      });
    });
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the bottom edge (manual snapping)', () => {
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

    render();

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(0);
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(3216);
      main.toBe(4125);
    });
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the top edge (manual snapping)', () => {
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

    render();

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(0);
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(3450);
      main.toBe(4350);
    });
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the right edge (manual snapping)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 100),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    const result = scrollViewportTo({
      col: 50,
      horizontalSnap: 'end',
    });

    render();

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(2318);
      main.toBe(2620);
    });
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).toBe(0);
  });

  it('should scroll the viewport in such a way that the coordinates are glued to the left edge (manual snapping)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(100, 100),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    const result = scrollViewportTo({
      col: 50,
      horizontalSnap: 'start',
    });

    render();

    expect(result).toBe(true);
    expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(2502);
      main.toBe(2795);
    });
    expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).toBe(0);
  });

  it('should scroll the viewport to the last cell in the last row', () => {
    const hot = handsontable({
      data: createSpreadsheetData(100, 100),
      height: 300,
      width: 300,
      rowHeaders: true,
      colHeaders: true
    });

    scrollViewportTo({
      row: 99,
      col: 99,
    });

    render();

    expect(hot.view._wt.wtScroll.getLastVisibleColumn()).toBe(99);
    expect(hot.view._wt.wtScroll.getLastVisibleRow()).toBe(99);
  });

  it('should scroll the viewport to the first cell in the first row', () => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      height: 300,
      width: 300,
      rowHeaders: true,
      colHeaders: true
    });

    // move the table to the bottom-left viewport position
    scrollViewportTo({
      row: countRows() - 1,
      col: countCols() - 1,
    });

    render();

    scrollViewportTo({
      row: 0,
      col: 0,
    });

    render();

    expect(hot.view._wt.wtScroll.getFirstVisibleColumn()).toBe(0);
    expect(hot.view._wt.wtScroll.getFirstVisibleRow()).toBe(0);
  });

  it.forTheme('classic')('should scroll the viewport only horizontally', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(100, 100),
      height: 300,
      width: 300,
      rowHeaders: true,
      colHeaders: true
    });

    scrollViewportTo({
      row: 50,
      col: 50,
    });

    render();

    scrollViewportTo({
      row: 80,
    });

    render();

    await sleep(50);

    expect(hot.view._wt.wtScroll.getFirstVisibleColumn()).toBe(47);
    expect(hot.view._wt.wtScroll.getFirstVisibleRow()).toBe(70);
  });

  it.forTheme('main')('should scroll the viewport only horizontally', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(100, 100),
      height: 375,
      width: 360,
      rowHeaders: true,
      colHeaders: true
    });

    scrollViewportTo({
      row: 50,
      col: 50,
    });

    render();

    scrollViewportTo({
      row: 80,
    });

    render();

    await sleep(50);

    expect(hot.view._wt.wtScroll.getFirstVisibleColumn()).toBe(47);
    expect(hot.view._wt.wtScroll.getFirstVisibleRow()).toBe(70);
  });

  it.forTheme('classic')('should scroll the viewport only vertically', () => {
    const hot = handsontable({
      data: createSpreadsheetData(100, 100),
      height: 300,
      width: 300,
      rowHeaders: true,
      colHeaders: true
    });

    scrollViewportTo({
      row: 50,
      col: 50,
    });

    render();

    scrollViewportTo({
      col: 80,
    });

    render();

    expect(hot.view._wt.wtScroll.getFirstVisibleColumn()).toBe(77);
    expect(hot.view._wt.wtScroll.getFirstVisibleRow()).toBe(40);
  });

  it.forTheme('main')('should scroll the viewport only vertically', () => {
    const hot = handsontable({
      data: createSpreadsheetData(100, 100),
      height: 375,
      width: 360,
      rowHeaders: true,
      colHeaders: true
    });

    scrollViewportTo({
      row: 50,
      col: 50,
    });

    render();

    scrollViewportTo({
      col: 80,
    });

    render();

    expect(hot.view._wt.wtScroll.getFirstVisibleColumn()).toBe(77);
    expect(hot.view._wt.wtScroll.getFirstVisibleRow()).toBe(40);
  });

  it('should scroll the viewport properly when there are hidden columns', () => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      width: 200,
      height: 200,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);

    render();

    scrollViewportTo({
      row: 0,
      col: 15,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(hot.view._wt.wtTable.getFirstVisibleColumn()).toBe(15 - 3); // 3 hidden, not rendered elements.
  });

  it('should scroll the viewport properly when there are hidden rows', () => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      width: 200,
      height: 200,
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);

    render();

    scrollViewportTo({
      row: 15,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(hot.view._wt.wtTable.getFirstVisibleRow()).toBe(15 - 3); // 3 hidden, not rendered elements.
  });

  it('should scroll viewport properly when there are hidden columns (row is not defined)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      width: 200,
      height: 200,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);

    render();

    scrollViewportTo({
      col: 15,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(hot.view._wt.wtTable.getFirstVisibleColumn()).toBe(15 - 3); // 3 hidden, not rendered elements before.
  });

  it('should scroll viewport properly when there are hidden rows (col is not defined)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      width: 200,
      height: 200,
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);

    render();

    scrollViewportTo({
      row: 15,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(hot.view._wt.wtTable.getFirstVisibleRow()).toBe(15 - 3); // 3 hidden, not rendered elements before.
  });

  it('should scroll the viewport to the right side of the destination index when the column is hidden (based on visual indexes)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      width: 200,
      height: 200,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(7, true);
    hidingMap.setValueAtIndex(15, true);

    render();

    const scrollResult1 = scrollViewportTo({
      row: 0,
      col: 7,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult1).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleColumn()).toBe(8 - 4); // 4 hidden, not rendered elements before.

    const scrollResult2 = scrollViewportTo({
      row: 0,
      col: 15,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult2).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleColumn()).toBe(16 - 5); // 5 hidden, not rendered elements before.

    const scrollResult3 = scrollViewportTo({
      row: 0,
      col: 7,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult3).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleColumn()).toBe(8 - 4); // 4 hidden, not rendered elements before.

    const scrollResult4 = scrollViewportTo({
      row: 0,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult4).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleColumn()).toBe(3 - 3); // 3 hidden, not rendered elements before.
  });

  it('should scroll the viewport to the bottom side of the destination index when the row is hidden (based on visual indexes)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      width: 200,
      height: 200,
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(7, true);
    hidingMap.setValueAtIndex(15, true);

    render();

    const scrollResult1 = scrollViewportTo({
      row: 7,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult1).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleRow()).toBe(8 - 4); // 4 hidden, not rendered elements before.

    const scrollResult2 = scrollViewportTo({
      row: 15,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult2).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleRow()).toBe(16 - 5); // 5 hidden, not rendered elements before.

    const scrollResult3 = scrollViewportTo({
      row: 7,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult3).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleRow()).toBe(8 - 4); // 4 hidden, not rendered elements before.

    const scrollResult4 = scrollViewportTo({
      row: 0,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult4).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleRow()).toBe(3 - 3); // 3 hidden, not rendered elements before.
  });

  it('should scroll the viewport to the left side of the destination index when the column is hidden and there are ' +
    'no visible indexes on the right (based on visual indexes)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 20),
      width: 200,
      height: 200,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(7, true);
    hidingMap.setValueAtIndex(15, true);
    hidingMap.setValueAtIndex(16, true);
    hidingMap.setValueAtIndex(17, true);
    hidingMap.setValueAtIndex(18, true);
    hidingMap.setValueAtIndex(19, true);

    render();
    hot.view._wt.wtOverlays.adjustElementsSize();

    const scrollResult1 = scrollViewportTo({
      row: 0,
      col: 15,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult1).toBe(true);
    expect(hot.view._wt.wtTable.getLastVisibleColumn()).toBe(14 - 4); // 5 hidden, not rendered elements before.

    const scrollResult2 = scrollViewportTo({
      row: 0,
      col: 17,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult2).toBe(true);
    expect(hot.view._wt.wtTable.getLastVisibleColumn()).toBe(14 - 4); // 4 hidden, not rendered elements before.

    const scrollResult3 = scrollViewportTo({
      row: 0,
      col: 19,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult3).toBe(true);
    expect(hot.view._wt.wtTable.getLastVisibleColumn()).toBe(14 - 4); // 4 hidden, not rendered elements before.
  });

  it('should scroll the viewport to the bottom side of the destination index when the row is hidden and there are ' +
    'no visible indexes on the top (based on visual indexes)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(25, 20),
      width: 200,
      height: 200,
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(7, true);
    hidingMap.setValueAtIndex(15, true);
    hidingMap.setValueAtIndex(16, true);
    hidingMap.setValueAtIndex(17, true);
    hidingMap.setValueAtIndex(18, true);
    hidingMap.setValueAtIndex(19, true);
    hidingMap.setValueAtIndex(20, true);
    hidingMap.setValueAtIndex(21, true);
    hidingMap.setValueAtIndex(22, true);
    hidingMap.setValueAtIndex(23, true);
    hidingMap.setValueAtIndex(24, true);
    hidingMap.setValueAtIndex(25, true);

    render();
    hot.view._wt.wtOverlays.adjustElementsSize();

    const scrollResult1 = scrollViewportTo({
      row: 15,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult1).toBe(true);
    expect(hot.view._wt.wtTable.getLastVisibleRow()).toBe(14 - 4); // 5 hidden, not rendered elements before.

    const scrollResult2 = scrollViewportTo({
      row: 17,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult2).toBe(true);
    expect(hot.view._wt.wtTable.getLastVisibleRow()).toBe(14 - 4); // 4 hidden, not rendered elements before.

    const scrollResult3 = scrollViewportTo({
      row: 19,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult3).toBe(true);
    expect(hot.view._wt.wtTable.getLastVisibleRow()).toBe(14 - 4); // 4 hidden, not rendered elements before.
  });

  it('should scroll the viewport to the the visual index destination when there are some hidden columns', () => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 20),
      width: 200,
      height: 200,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(7, true);
    hidingMap.setValueAtIndex(15, true);

    render();

    const scrollResult1 = scrollViewportTo({
      row: 0,
      col: 2,
      verticalSnap: 'top',
      horizontalSnap: 'start',
      considerHiddenIndexes: false,
    });

    render();

    expect(scrollResult1).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleColumn()).toBe(2);

    const scrollResult2 = scrollViewportTo({
      row: 0,
      col: 14,
      verticalSnap: 'top',
      horizontalSnap: 'start',
      considerHiddenIndexes: false,
    });

    render();

    expect(scrollResult2).toBe(true);
    expect(hot.view._wt.wtTable.getLastVisibleColumn()).toBe(14);

    const scrollResult3 = scrollViewportTo({
      row: 0,
      col: 2,
      verticalSnap: 'top',
      horizontalSnap: 'start',
      considerHiddenIndexes: false,
    });

    render();

    expect(scrollResult3).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleColumn()).toBe(2);

    const scrollResult4 = scrollViewportTo({
      row: 0,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
      considerHiddenIndexes: false,
    });

    render();

    expect(scrollResult4).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleColumn()).toBe(0);
  });

  it('should scroll the viewport to the the visual index destination when there are some hidden rows', () => {
    const hot = handsontable({
      data: createSpreadsheetData(25, 20),
      width: 200,
      height: 200,
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(7, true);
    hidingMap.setValueAtIndex(15, true);

    render();

    const scrollResult1 = scrollViewportTo({
      row: 2,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
      considerHiddenIndexes: false,
    });

    render();

    expect(scrollResult1).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleRow()).toBe(2);

    const scrollResult2 = scrollViewportTo({
      row: 14,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
      considerHiddenIndexes: false,
    });

    render();

    expect(scrollResult2).toBe(true);
    expect(hot.view._wt.wtTable.getLastVisibleRow()).toBe(19);

    const scrollResult3 = scrollViewportTo({
      row: 2,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
      considerHiddenIndexes: false,
    });

    render();

    expect(scrollResult3).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleRow()).toBe(2);

    const scrollResult4 = scrollViewportTo({
      row: 0,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
      considerHiddenIndexes: false,
    });

    render();

    expect(scrollResult4).toBe(true);
    expect(hot.view._wt.wtTable.getFirstVisibleRow()).toBe(0);
  });

  it('should not scroll viewport when all columns are hidden (based on visual indexes)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(10, 10),
      width: 200,
      height: 200,
    });

    columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
    render();

    const scrollResult1 = scrollViewportTo({
      row: 0,
      col: 0,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult1).toBe(false);
    expect(hot.view._wt.wtTable.getFirstVisibleColumn()).toBe(-1);

    const scrollResult2 = scrollViewportTo({
      row: 0,
      col: 5,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    expect(scrollResult2).toBe(false);
    expect(hot.view._wt.wtTable.getFirstVisibleColumn()).toBe(-1);
  });

  it('should not scroll viewport when all rows are hidden (based on visual indexes)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(10, 10),
      width: 200,
      height: 200,
    });

    rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
    render();

    const scrollResult1 = scrollViewportTo({
      row: 0,
      col: 0,
    });

    render();

    expect(scrollResult1).toBe(false);
    expect(hot.view._wt.wtTable.getFirstVisibleRow()).toBe(-1);

    const scrollResult2 = scrollViewportTo({
      row: 5,
      col: 0,
    });

    render();

    expect(scrollResult2).toBe(false);
    expect(hot.view._wt.wtTable.getFirstVisibleRow()).toBe(-1);
  });

  it('should scroll the viewport to the desired cell from the top-left position, ' +
  '(the snapping set to "end") with the bottom/right border being visible', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(30, 30),
      colWidths: 50,
      rowHeights: 30,
      rowHeaders: true,
      colHeaders: true,
      width: 200,
      height: 200,
    });

    hot.scrollViewportTo({
      row: 15,
      col: 15,
      horizontalSnap: 'end',
      verticalSnap: 'bottom',
    });
    await sleep(100);

    expect(document.elementsFromPoint(
      hot.rootElement.offsetWidth - Handsontable.dom.getScrollbarWidth() - 50,
      hot.rootElement.offsetHeight - Handsontable.dom.getScrollbarWidth() - 30
    )[0]).toEqual(hot.getCell(15, 15));

    hot.scrollViewportTo({
      row: 0,
      col: 0,
      horizontalSnap: 'start',
      verticalSnap: 'top',
    });
    await sleep(100);

    hot.scrollViewportTo({
      row: 29,
      col: 29,
      horizontalSnap: 'end',
      verticalSnap: 'bottom',
    });
    await sleep(100);

    expect(document.elementsFromPoint(
      hot.rootElement.offsetWidth - Handsontable.dom.getScrollbarWidth() - 50,
      hot.rootElement.offsetHeight - Handsontable.dom.getScrollbarWidth() - 30
    )[0]).toEqual(hot.getCell(29, 29));
  });

  describe('using backward-compatible arguments', () => {
    it('should scroll the viewport using default snapping (top, start)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(50, 50),
        width: 200,
        height: 200,
      });

      spyOn(hot.view, 'scrollViewport');

      scrollViewportTo(40, 45);

      expect(hot.view.scrollViewport).toHaveBeenCalledWith(cellCoords(40, 45), 'start', 'top');
    });

    it('should scroll the viewport using bottom snapping', () => {
      const hot = handsontable({
        data: createSpreadsheetData(50, 50),
        width: 200,
        height: 200,
      });

      spyOn(hot.view, 'scrollViewport');

      scrollViewportTo(40, 45, true, false);

      expect(hot.view.scrollViewport).toHaveBeenCalledWith(cellCoords(40, 45), 'start', 'bottom');
    });

    it('should scroll the viewport using end (right) snapping', () => {
      const hot = handsontable({
        data: createSpreadsheetData(50, 50),
        width: 200,
        height: 200,
      });

      spyOn(hot.view, 'scrollViewport');

      scrollViewportTo(40, 45, true, true);

      expect(hot.view.scrollViewport).toHaveBeenCalledWith(cellCoords(40, 45), 'end', 'bottom');
    });
  });
});
