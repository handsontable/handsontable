describe('Corner selection scroll', () => {
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

  it('should not scroll the viewport after mouse click', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    inlineStartOverlay().setScrollPosition(25);
    topOverlay().setScrollPosition(50);

    await sleep(10);

    simulateClick(getCell(-1, -1));

    expect(inlineStartOverlay().getScrollPosition()).toBe(25);
    expect(topOverlay().getScrollPosition()).toBe(50);
  });
});
