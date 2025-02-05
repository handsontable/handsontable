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

  it('should scroll viewport vertically to the beginning of the merged cell when it\'s clicked', () => {
    handsontable({
      data: createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 5, col: 0, rowspan: 2, colspan: 2 }
      ],
      height: 100,
      width: 400
    });

    setScrollTop(130);
    render();
    simulateClick(getCell(5, 0));

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(115);
      main.toBe(130);
    });

    setScrollTop(0);
    render();
    setScrollTop(130);
    render();
    simulateClick(getCell(5, 2));

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(115);
      main.toBe(130);
    });
  });

  it('should scroll viewport horizontally to the beginning of the merged cell when it\'s clicked', () => {
    handsontable({
      data: createSpreadsheetObjectData(5, 10),
      mergeCells: [
        { row: 0, col: 5, rowspan: 2, colspan: 2 }
      ],
      height: 100,
      width: 265
    });

    setScrollLeft(300);
    render();
    simulateClick(getCell(0, 5));

    expect(inlineStartOverlay().getScrollPosition()).toBe(250);

    setScrollLeft(0);
    render();
    setScrollLeft(300);
    render();
    simulateClick(getCell(2, 5));

    expect(inlineStartOverlay().getScrollPosition()).toBe(250);
  });

  it('should scroll viewport vertically to the beginning of the merged cell when it\'s clicked (virtualized is on)', () => {
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

    setScrollTop(2000);
    render();

    simulateClick(getCell(5, 0));

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(115);
      main.toBe(145);
    });
  });

  it('should scroll viewport horizontally to the beginning of the merged cell when it\'s clicked (virtualized is on)', () => {
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

    setScrollLeft(2000);
    render();

    simulateClick(getCell(0, 5));

    expect(inlineStartOverlay().getScrollPosition()).toBe(250);
  });

  it('should render whole merged cell even when most rows are not in the viewport - scrolled to top', () => {
    const hot = handsontable({
      data: createSpreadsheetObjectData(40, 5),
      mergeCells: [
        { row: 1, col: 0, rowspan: 21, colspan: 2 },
        { row: 21, col: 2, rowspan: 18, colspan: 2 }
      ],
      height: 100,
      width: 400
    });

    expect(hot.countRenderedRows()).toBe(39);
  });

  it('should render whole merged cell even when most rows are not in the viewport - scrolled to bottom', () => {
    const hot = handsontable({
      data: createSpreadsheetObjectData(40, 5),
      mergeCells: [
        { row: 1, col: 0, rowspan: 21, colspan: 2 },
        { row: 21, col: 2, rowspan: 18, colspan: 2 }
      ],
      height: 100,
      width: 400
    });

    const mainHolder = hot.view._wt.wtTable.holder;

    $(mainHolder).scrollTop(99999);
    hot.render();

    expect(hot.countRenderedRows()).toBe(39);
  });

  it('should render whole merged cell even when most columns are not in the viewport - scrolled to the left', () => {
    const hot = handsontable({
      data: createSpreadsheetObjectData(5, 40),
      mergeCells: [
        { row: 0, col: 1, rowspan: 2, colspan: 21 },
        { row: 2, col: 21, rowspan: 2, colspan: 18 }
      ],
      height: 100,
      width: 400
    });

    expect(hot.countRenderedCols()).toBe(39);
  });

  it('should render whole merged cell even when most columns are not in the viewport - scrolled to the right', () => {
    const hot = handsontable({
      data: createSpreadsheetObjectData(5, 40),
      mergeCells: [
        { row: 0, col: 1, rowspan: 2, colspan: 21 },
        { row: 2, col: 21, rowspan: 2, colspan: 18 }
      ],
      height: 100,
      width: 400
    });

    spec().$container.scrollLeft(99999);
    hot.render();

    expect(hot.countRenderedCols()).toBe(39);
  });
});
