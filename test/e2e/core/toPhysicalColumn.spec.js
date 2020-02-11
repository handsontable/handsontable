describe('Core.toPhysicalColumn', () => {
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

  it('should return valid physical column index', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    hot.columnIndexMapper.setIndexesSequence([3, 4, 5, 6, 7]);

    expect(hot.toPhysicalColumn(0)).toBe(3);
    expect(hot.toPhysicalColumn(1)).toBe(4);
    expect(hot.toPhysicalColumn(2)).toBe(5);
  });
});
