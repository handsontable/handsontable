describe('Core.toVisualRow', () => {
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

  it('should return valid visual row index', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5)
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    expect(toVisualRow(0)).toBe(4);
    expect(toVisualRow(1)).toBe(3);
    expect(toVisualRow(2)).toBe(2);
  });
});
