describe('Core.toPhysicalRow', () => {
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

  it('should return valid physical row index', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5)
    });

    rowIndexMapper().setIndexesSequence([3, 4, 5, 6, 7]);

    expect(toPhysicalRow(0)).toBe(3);
    expect(toPhysicalRow(1)).toBe(4);
    expect(toPhysicalRow(2)).toBe(5);
  });
});
