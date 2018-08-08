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

  it('should return valid visual row index', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      unmodifyRow(row) {
        return row + 3;
      }
    });

    expect(hot.toVisualRow(0)).toBe(3);
    expect(hot.toVisualRow(1)).toBe(4);
    expect(hot.toVisualRow(2)).toBe(5);
  });
});
