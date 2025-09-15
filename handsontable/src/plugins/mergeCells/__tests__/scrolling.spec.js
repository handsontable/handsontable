describe('MergeCells scrolling', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should scroll viewport vertically to the beginning of the merged cell when it\'s clicked', async() => {
    handsontable({
      data: createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 5, col: 0, rowspan: 2, colspan: 2 }
      ],
      height: 100,
      width: 400
    });

    await scrollViewportVertically(130);
    await render();
    await simulateClick(getCell(5, 0));

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(115);
      main.toBe(130);
      horizon.toBe(160);
    });

    await scrollViewportVertically(0);
    await render();
    await scrollViewportVertically(130);
    await render();
    await simulateClick(getCell(5, 2));

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(115);
      main.toBe(130);
      horizon.toBe(130);
    });
  });

  it('should scroll viewport horizontally to the beginning of the merged cell when it\'s clicked', async() => {
    handsontable({
      data: createSpreadsheetObjectData(5, 10),
      mergeCells: [
        { row: 0, col: 5, rowspan: 2, colspan: 2 }
      ],
      height: 100,
      width: 265
    });

    await scrollViewportHorizontally(300);
    await render();
    await simulateClick(getCell(0, 5));

    expect(inlineStartOverlay().getScrollPosition()).toBe(250);

    await scrollViewportHorizontally(0);
    await render();
    await scrollViewportHorizontally(300);
    await render();
    await simulateClick(getCell(2, 5));

    expect(inlineStartOverlay().getScrollPosition()).toBe(250);
  });

  it('should scroll viewport vertically to the beginning of the merged cell when it\'s clicked (virtualized is on)', async() => {
    handsontable({
      data: createSpreadsheetObjectData(100, 5),
      mergeCells: {
        virtualized: true,
        cells: [
          { row: 5, col: 0, rowspan: 80, colspan: 2 }
        ]
      },
      height: 100,
      width: 200
    });

    await scrollViewportVertically(2000);
    await render();
    await simulateClick(getCell(5, 0));

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(116);
      main.toBe(146);
      horizon.toBe(186);
    });
  });

  it('should scroll viewport horizontally to the beginning of the merged cell when it\'s clicked (virtualized is on)', async() => {
    handsontable({
      data: createSpreadsheetObjectData(5, 100),
      mergeCells: {
        virtualized: true,
        cells: [
          { row: 0, col: 5, rowspan: 2, colspan: 80 }
        ]
      },
      height: 200,
      width: 300
    });

    await scrollViewportHorizontally(2000);

    await render();
    await simulateClick(getCell(0, 5));

    expect(inlineStartOverlay().getScrollPosition()).toBe(250);
  });

  it('should render whole merged cell even when most rows are not in the viewport - scrolled to top', async() => {
    handsontable({
      data: createSpreadsheetObjectData(40, 5),
      mergeCells: [
        { row: 1, col: 0, rowspan: 21, colspan: 2 },
        { row: 21, col: 2, rowspan: 18, colspan: 2 }
      ],
      height: 100,
      width: 400
    });

    expect(countRenderedRows()).toBe(39);
  });

  it('should render whole merged cell even when most rows are not in the viewport - scrolled to bottom', async() => {
    handsontable({
      data: createSpreadsheetObjectData(40, 5),
      mergeCells: [
        { row: 1, col: 0, rowspan: 21, colspan: 2 },
        { row: 21, col: 2, rowspan: 18, colspan: 2 }
      ],
      height: 100,
      width: 400
    });

    await scrollViewportVertically(99999);
    await render();

    expect(countRenderedRows()).toBe(39);
  });

  it('should render whole merged cell even when most columns are not in the viewport - scrolled to the left', async() => {
    handsontable({
      data: createSpreadsheetObjectData(5, 40),
      mergeCells: [
        { row: 0, col: 1, rowspan: 2, colspan: 21 },
        { row: 2, col: 21, rowspan: 2, colspan: 18 }
      ],
      height: 100,
      width: 400
    });

    expect(countRenderedCols()).toBe(39);
  });

  it('should render whole merged cell even when most columns are not in the viewport - scrolled to the right', async() => {
    handsontable({
      data: createSpreadsheetObjectData(5, 40),
      mergeCells: [
        { row: 0, col: 1, rowspan: 2, colspan: 21 },
        { row: 2, col: 21, rowspan: 2, colspan: 18 }
      ],
      height: 100,
      width: 400
    });

    await scrollViewportHorizontally(99999);
    await render();

    expect(countRenderedCols()).toBe(39);
  });
});
