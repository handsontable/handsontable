describe('Core.propToCol', () => {
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

  it('should return valid index for newly added column when manualColumnMove is enabled', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      manualColumnMove: true,
    });

    hot.alter('insert_col', 5);

    expect(propToCol(0)).toBe(0);
    expect(propToCol(10)).toBe(10);
  });
});
