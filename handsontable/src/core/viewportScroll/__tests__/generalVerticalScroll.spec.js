describe('Vertical scroll', () => {
  const id = 'testContainer';
  let scrollIntoViewSpy;

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    scrollIntoViewSpy = spyOn(Element.prototype, 'scrollIntoView');
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
    await scrollViewportVertically(195);
    // select the `9` row
    await selectCell(8, 0);

    // expect that the viewport is scrolled to the beginning of the `9` row
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(184);
      main.toBe(195);
      horizon.toBe(195);
    });
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(8, 0, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });
});
