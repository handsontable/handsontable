describe('Corner selection scroll', () => {
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

  it('should not scroll the viewport after mouse click', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    await scrollViewportHorizontally(25);
    await scrollViewportVertically(50);

    await simulateClick(getCell(-1, -1));

    expect(inlineStartOverlay().getScrollPosition()).toBe(25);
    expect(topOverlay().getScrollPosition()).toBe(50);
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });
});
