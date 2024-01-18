describe('Horizontal scroll', () => {
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
    inlineStartOverlay().setScrollPosition(415);

    await sleep(10);

    // select the `I` column
    selectCell(0, 8);

    // expect that the viewport is scrolled to the beginning of the `I` column
    expect(inlineStartOverlay().getScrollPosition()).toBe(400);
  });
});
