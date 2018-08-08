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

  it('should return valid physical row index', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      modifyCol(column) {
        return column + 3;
      }
    });

    expect(hot.toPhysicalColumn(0)).toBe(3);
    expect(hot.toPhysicalColumn(1)).toBe(4);
    expect(hot.toPhysicalColumn(2)).toBe(5);
  });
});
