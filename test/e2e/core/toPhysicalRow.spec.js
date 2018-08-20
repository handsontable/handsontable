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

  it('should return valid physical row index', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      modifyRow(row) {
        return row + 3;
      }
    });

    expect(hot.toPhysicalRow(0)).toBe(3);
    expect(hot.toPhysicalRow(1)).toBe(4);
    expect(hot.toPhysicalRow(2)).toBe(5);
  });
});
