describe('Vertical scroll', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should correctly scroll the viewport when the partially visible row is clicked and there is no fully visible column (#dev-1705)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
      rowHeights: (index) => {
        return index === 9 ? 500 : undefined;
      }
    });

    // make sure that the `9` row is partially visible
    topOverlay().setScrollPosition(195);

    await sleep(10);

    // select the `9` row
    selectCell(8, 0);

    // expect that the viewport is scrolled to the beginning of the `9` row
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(184);
      main.toBe(195);
    });
  });
});
