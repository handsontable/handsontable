describe('Horizontal scroll', () => {
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

  it('should correctly scroll the viewport when the partially visible column is clicked and there is no fully visible row (#dev-1705)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 10),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
      colWidths: (index) => {
        return index === 9 ? 500 : undefined;
      },
    });

    // make sure that the `I` column is partially visible
    await scrollViewportHorizontally(415);
    // select the `I` column
    await selectCell(0, 8);

    // expect that the viewport is scrolled to the beginning of the `I` column
    expect(inlineStartOverlay().getScrollPosition()).toBe(400);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 8, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });
});
